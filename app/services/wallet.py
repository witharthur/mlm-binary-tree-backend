"""
Wallet service — all financial mutations are transactional with row-level locks.

Every credit / debit:
    1. SELECT … FOR UPDATE on the wallet row  (prevents concurrent modification)
    2. Check idempotency key                  (prevents double accrual)
    3. Mutate balance + insert Transaction    (atomic)
"""
from __future__ import annotations

import uuid
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Wallet, Transaction, TxType, BalanceType
from app.exceptions import InsufficientFundsError, IdempotencyConflict, NotFoundError


async def get_or_create_wallet(session: AsyncSession, user_id: uuid.UUID) -> Wallet:
    result = await session.execute(
        select(Wallet).where(Wallet.user_id == user_id).with_for_update()
    )
    wallet = result.scalar_one_or_none()
    if wallet is None:
        wallet = Wallet(user_id=user_id)
        session.add(wallet)
        await session.flush()
    return wallet


async def credit(
    session: AsyncSession,
    user_id: uuid.UUID,
    amount: Decimal,
    tx_type: TxType,
    balance_type: BalanceType,
    idempotency_key: str,
    description: str = "",
) -> Transaction:
    """Add funds to a wallet. Idempotent — duplicate key returns existing tx."""
    if amount <= 0:
        raise ValueError("Credit amount must be positive")

    # Idempotency check
    existing = await _check_idempotency(session, idempotency_key)
    if existing is not None:
        return existing

    wallet = await get_or_create_wallet(session, user_id)

    if balance_type == BalanceType.MAIN:
        wallet.main_balance += amount
    else:
        wallet.deposit_balance += amount

    tx = Transaction(
        wallet_id=wallet.id,
        type=tx_type,
        amount=amount,
        balance_type=balance_type,
        description=description,
        idempotency_key=idempotency_key,
    )
    session.add(tx)
    await session.flush()
    return tx


async def debit(
    session: AsyncSession,
    user_id: uuid.UUID,
    amount: Decimal,
    tx_type: TxType,
    balance_type: BalanceType,
    idempotency_key: str,
    description: str = "",
) -> Transaction:
    """Remove funds from a wallet. Raises InsufficientFundsError if balance too low."""
    if amount <= 0:
        raise ValueError("Debit amount must be positive")

    existing = await _check_idempotency(session, idempotency_key)
    if existing is not None:
        return existing

    wallet = await get_or_create_wallet(session, user_id)

    if balance_type == BalanceType.MAIN:
        if wallet.main_balance < amount:
            raise InsufficientFundsError()
        wallet.main_balance -= amount
    else:
        if wallet.deposit_balance < amount:
            raise InsufficientFundsError()
        wallet.deposit_balance -= amount

    tx = Transaction(
        wallet_id=wallet.id,
        type=tx_type,
        amount=-amount,
        balance_type=balance_type,
        description=description,
        idempotency_key=idempotency_key,
    )
    session.add(tx)
    await session.flush()
    return tx


async def get_wallet(session: AsyncSession, user_id: uuid.UUID) -> Wallet:
    result = await session.execute(
        select(Wallet).where(Wallet.user_id == user_id)
    )
    wallet = result.scalar_one_or_none()
    if wallet is None:
        raise NotFoundError("Wallet")
    return wallet


async def get_transactions(
    session: AsyncSession,
    user_id: uuid.UUID,
    limit: int = 50,
    offset: int = 0,
) -> list[Transaction]:
    wallet = await get_wallet(session, user_id)
    result = await session.execute(
        select(Transaction)
        .where(Transaction.wallet_id == wallet.id)
        .order_by(Transaction.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(result.scalars().all())


async def _check_idempotency(session: AsyncSession, key: str) -> Transaction | None:
    result = await session.execute(
        select(Transaction).where(Transaction.idempotency_key == key)
    )
    return result.scalar_one_or_none()
