"""
Withdrawal service — request creation and admin approval flow.
"""
from __future__ import annotations

import uuid
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User, Withdrawal, WithdrawalStatus, TxType, BalanceType
from app.exceptions import InsufficientFundsError, NotFoundError, AppError
from app.services.wallet import debit, credit


async def create_withdrawal(
    session: AsyncSession,
    user: User,
    amount: Decimal,
    payment_details: dict | None = None,
) -> Withdrawal:
    """Create a pending withdrawal request. Immediately reserves funds."""
    # Reserve funds by debiting
    idemp = f"wd_reserve:{user.id}:{uuid.uuid4()}"
    await debit(
        session,
        user_id=user.id,
        amount=amount,
        tx_type=TxType.WITHDRAWAL,
        balance_type=BalanceType.MAIN,
        idempotency_key=idemp,
        description="Withdrawal request — funds reserved",
    )

    wd = Withdrawal(
        user_id=user.id,
        amount=amount,
        payment_details=payment_details,
    )
    session.add(wd)
    await session.commit()
    return wd


async def list_withdrawals(
    session: AsyncSession,
    user_id: uuid.UUID,
) -> list[Withdrawal]:
    result = await session.execute(
        select(Withdrawal)
        .where(Withdrawal.user_id == user_id)
        .order_by(Withdrawal.created_at.desc())
    )
    return list(result.scalars().all())


async def approve_withdrawal(
    session: AsyncSession,
    withdrawal_id: uuid.UUID,
) -> Withdrawal:
    result = await session.execute(
        select(Withdrawal).where(Withdrawal.id == withdrawal_id).with_for_update()
    )
    wd = result.scalar_one_or_none()
    if wd is None:
        raise NotFoundError("Withdrawal")
    if wd.status != WithdrawalStatus.PENDING:
        raise AppError(f"Cannot approve withdrawal in status {wd.status.value}")

    wd.status = WithdrawalStatus.APPROVED
    await session.commit()
    return wd


async def reject_withdrawal(
    session: AsyncSession,
    withdrawal_id: uuid.UUID,
    admin_note: str = "",
) -> Withdrawal:
    """Reject and refund the reserved amount."""
    result = await session.execute(
        select(Withdrawal).where(Withdrawal.id == withdrawal_id).with_for_update()
    )
    wd = result.scalar_one_or_none()
    if wd is None:
        raise NotFoundError("Withdrawal")
    if wd.status != WithdrawalStatus.PENDING:
        raise AppError(f"Cannot reject withdrawal in status {wd.status.value}")

    # Refund
    await credit(
        session,
        user_id=wd.user_id,
        amount=wd.amount,
        tx_type=TxType.DEPOSIT,
        balance_type=BalanceType.MAIN,
        idempotency_key=f"wd_refund:{wd.id}",
        description="Withdrawal rejected — refund",
    )

    wd.status = WithdrawalStatus.REJECTED
    wd.admin_note = admin_note
    await session.commit()
    return wd
