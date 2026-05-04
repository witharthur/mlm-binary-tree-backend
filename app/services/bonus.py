"""
Bonus service — referral (instant, async) and binary (Celery background).

Referral bonus:  sponsor receives % of the package price immediately.
Binary bonus:    min(left_pv, right_pv) × rate, split 90/10 main/deposit.
                 Carry-forward: the weaker side is zeroed, the stronger side
                 keeps the remainder.
"""
from __future__ import annotations

import uuid
from decimal import Decimal

from sqlalchemy import select, update, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session  # sync for Celery

from app.config import get_settings
from app.models import (
    User, BonusLog, BonusTypeEnum, TxType, BalanceType, PVEvent,
)

settings = get_settings()


# ═══════════════════════════════════════════════════════════
#  REFERRAL BONUS  (called inline during package purchase)
# ═══════════════════════════════════════════════════════════

async def accrue_referral_bonus(
    session: AsyncSession,
    buyer: User,
    package_price: Decimal,
) -> BonusLog | None:
    """
    Give the buyer's sponsor a referral bonus.
    Returns None if the buyer has no sponsor or bonus already accrued.
    """
    if buyer.sponsor_id is None:
        return None

    idemp_key = f"ref_bonus:{buyer.id}:{buyer.sponsor_id}"

    # Idempotency
    existing = await session.execute(
        select(BonusLog).where(BonusLog.idempotency_key == idemp_key)
    )
    if existing.scalar_one_or_none() is not None:
        return None

    bonus_amount = (package_price * Decimal(str(settings.REFERRAL_BONUS_PERCENT))) / Decimal("100")

    # Credit sponsor wallet (import locally to avoid circular)
    from app.services.wallet import credit
    await credit(
        session,
        user_id=buyer.sponsor_id,
        amount=bonus_amount,
        tx_type=TxType.BONUS_REFERRAL,
        balance_type=BalanceType.MAIN,
        idempotency_key=f"tx_ref:{idemp_key}",
        description=f"Referral bonus from {buyer.username}",
    )

    log = BonusLog(
        user_id=buyer.sponsor_id,
        type=BonusTypeEnum.REFERRAL,
        amount=bonus_amount,
        source_user_id=buyer.id,
        idempotency_key=idemp_key,
        meta={"package_price": str(package_price)},
    )
    session.add(log)
    await session.flush()
    return log


# ═══════════════════════════════════════════════════════════
#  BINARY BONUS  (executed by Celery worker — sync session)
# ═══════════════════════════════════════════════════════════

def calculate_binary_bonuses_sync(db: Session, batch_size: int = 500) -> int:
    """
    Process binary bonuses for all qualifying users.
    Called periodically by Celery beat.

    Optimised for 100k users:
        - Single query finds all users with matchable PV.
        - Batch update with FOR UPDATE SKIP LOCKED avoids blocking
          concurrent API operations.

    Returns number of bonuses accrued.
    """
    from app.models import Wallet, Transaction
    import datetime

    # Period key for idempotency (one binary bonus per user per day)
    period = datetime.date.today().isoformat()
    processed = 0

    while True:
        # Fetch a batch of users with matchable PV
        rows = (
            db.query(User)
            .filter(User.left_pv > 0, User.right_pv > 0, User.is_active.is_(True))
            .with_for_update(skip_locked=True)
            .limit(batch_size)
            .all()
        )
        if not rows:
            break

        for user in rows:
            idemp_key = f"bin_bonus:{user.id}:{period}"

            # Idempotency: skip if already processed today
            exists = (
                db.query(BonusLog.id)
                .filter(BonusLog.idempotency_key == idemp_key)
                .first()
            )
            if exists:
                # Zero out matched PV even if bonus was already paid
                # (the PV was already consumed)
                continue

            left = user.left_pv
            right = user.right_pv
            base = min(left, right)
            bonus = base * Decimal(str(settings.BINARY_BONUS_PERCENT)) / Decimal("100")

            if bonus <= 0:
                continue

            main_amount = bonus * Decimal(str(settings.BINARY_MAIN_SPLIT))
            deposit_amount = bonus * Decimal(str(settings.BINARY_DEPOSIT_SPLIT))

            # Get or create wallet
            wallet = db.query(Wallet).filter(Wallet.user_id == user.id).with_for_update().first()
            if wallet is None:
                wallet = Wallet(user_id=user.id)
                db.add(wallet)
                db.flush()

            # Credit main
            wallet.main_balance += main_amount
            tx_main = Transaction(
                wallet_id=wallet.id,
                type=TxType.BONUS_BINARY,
                amount=main_amount,
                balance_type=BalanceType.MAIN,
                description=f"Binary bonus (main 90%) — matched {base} PV",
                idempotency_key=f"tx_bin_main:{idemp_key}",
            )
            db.add(tx_main)

            # Credit deposit
            wallet.deposit_balance += deposit_amount
            tx_dep = Transaction(
                wallet_id=wallet.id,
                type=TxType.BONUS_BINARY,
                amount=deposit_amount,
                balance_type=BalanceType.DEPOSIT,
                description=f"Binary bonus (deposit 10%) — matched {base} PV",
                idempotency_key=f"tx_bin_dep:{idemp_key}",
            )
            db.add(tx_dep)

            # Carry forward remainder
            user.left_pv = left - base   # weaker side becomes 0
            user.right_pv = right - base
            user.left_pv_carry = user.left_pv
            user.right_pv_carry = user.right_pv

            # Log
            log = BonusLog(
                user_id=user.id,
                type=BonusTypeEnum.BINARY,
                amount=bonus,
                idempotency_key=idemp_key,
                meta={
                    "left_pv": str(left),
                    "right_pv": str(right),
                    "matched": str(base),
                    "main_amount": str(main_amount),
                    "deposit_amount": str(deposit_amount),
                },
            )
            db.add(log)
            processed += 1

        db.commit()

    return processed


# ═══════════════════════════════════════════════════════════
#  PV PROPAGATION  (Celery background — batch optimised)
# ═══════════════════════════════════════════════════════════

def propagate_pv_events_sync(db: Session, batch_size: int = 200) -> int:
    """
    Process unprocessed PV events: walk each source user up to the root,
    crediting left_pv or right_pv on each ancestor based on placement_side.

    For 100k users the tree depth is ≤ 17, so each event touches ≤ 17 rows.
    Events are picked with SKIP LOCKED so multiple workers can run safely.
    """
    processed = 0

    while True:
        events = (
            db.query(PVEvent)
            .filter(PVEvent.processed.is_(False))
            .with_for_update(skip_locked=True)
            .limit(batch_size)
            .all()
        )
        if not events:
            break

        for evt in events:
            _propagate_single_event(db, evt)
            evt.processed = True
            processed += 1

        db.commit()

    return processed


def _propagate_single_event(db: Session, evt: PVEvent) -> None:
    """Walk from the PV source up to root, incrementing PV counters."""
    current = db.query(User).filter(User.id == evt.user_id).first()
    if current is None:
        return

    pv = Decimal(str(evt.pv_amount))

    while current.parent_id is not None:
        parent = (
            db.query(User)
            .filter(User.id == current.parent_id)
            .with_for_update()
            .first()
        )
        if parent is None:
            break

        if current.placement_side == "L":
            parent.left_pv += pv
        else:
            parent.right_pv += pv

        current = parent
