"""
Package service — purchase and upgrade with transactional safety.
"""
from __future__ import annotations

import uuid
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User, Package, Order, OrderStatus, TxType, BalanceType, PVEvent
from app.exceptions import NotFoundError, AppError, IdempotencyConflict
from app.services.wallet import debit
from app.services.bonus import accrue_referral_bonus


async def list_packages(session: AsyncSession) -> list[Package]:
    result = await session.execute(
        select(Package).where(Package.is_active.is_(True)).order_by(Package.price)
    )
    return list(result.scalars().all())


async def purchase_package(
    session: AsyncSession,
    user: User,
    package_id: int,
    idempotency_key: str,
) -> Order:
    """
    Buy a package (or upgrade).
    - Deducts price (or price difference on upgrade) from main_balance.
    - Creates PV event for background propagation.
    - Accrues instant referral bonus to sponsor.
    """
    # Idempotency
    existing = await session.execute(
        select(Order).where(Order.idempotency_key == idempotency_key)
    )
    if existing.scalar_one_or_none() is not None:
        raise IdempotencyConflict()

    # Load package
    result = await session.execute(
        select(Package).where(Package.id == package_id, Package.is_active.is_(True))
    )
    pkg = result.scalar_one_or_none()
    if pkg is None:
        raise NotFoundError("Package")

    # Lock user row
    result = await session.execute(
        select(User).where(User.id == user.id).with_for_update()
    )
    user = result.scalar_one()

    # Calculate price (upgrade = difference)
    price = pkg.price
    if user.package_id is not None:
        current_pkg_result = await session.execute(
            select(Package).where(Package.id == user.package_id)
        )
        current_pkg = current_pkg_result.scalar_one()
        if pkg.price <= current_pkg.price:
            raise AppError("Cannot downgrade package")
        price = pkg.price - current_pkg.price

    # Debit wallet
    await debit(
        session,
        user_id=user.id,
        amount=price,
        tx_type=TxType.PACKAGE_PURCHASE if user.package_id is None else TxType.PACKAGE_UPGRADE,
        balance_type=BalanceType.MAIN,
        idempotency_key=f"pkg_debit:{idempotency_key}",
        description=f"Package {'purchase' if user.package_id is None else 'upgrade'}: {pkg.name}",
    )

    # Update user package
    user.package_id = pkg.id
    user.is_active = True

    # Create order
    order = Order(
        user_id=user.id,
        package_id=pkg.id,
        amount=price,
        status=OrderStatus.COMPLETED,
        idempotency_key=idempotency_key,
    )
    session.add(order)

    # Emit PV event (processed by Celery worker in background)
    pv_event = PVEvent(user_id=user.id, pv_amount=pkg.pv_value)
    session.add(pv_event)

    # Instant referral bonus
    await accrue_referral_bonus(session, user, price)

    await session.commit()
    return order
