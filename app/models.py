import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import (
    Boolean, Column, DateTime, Enum as SAEnum, ForeignKey, Integer,
    Numeric, String, Text, UniqueConstraint, CheckConstraint,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.database import Base


# ── Enums ──────────────────────────────────────────────────
import enum


class TxType(str, enum.Enum):
    DEPOSIT = "DEPOSIT"
    WITHDRAWAL = "WITHDRAWAL"
    BONUS_REFERRAL = "BONUS_REFERRAL"
    BONUS_BINARY = "BONUS_BINARY"
    PACKAGE_PURCHASE = "PACKAGE_PURCHASE"
    PACKAGE_UPGRADE = "PACKAGE_UPGRADE"
    TRANSFER = "TRANSFER"


class BalanceType(str, enum.Enum):
    MAIN = "MAIN"
    DEPOSIT = "DEPOSIT"


class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class BonusTypeEnum(str, enum.Enum):
    REFERRAL = "REFERRAL"
    BINARY = "BINARY"


class WithdrawalStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    COMPLETED = "COMPLETED"


# ── Package ────────────────────────────────────────────────
class Package(Base):
    __tablename__ = "packages"

    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)
    price = Column(Numeric(20, 4), nullable=False)
    pv_value = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


# ── User ───────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)

    # referral / tree
    sponsor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    parent_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    placement_side = Column(String(1))
    left_child_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    right_child_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    # PV
    left_pv = Column(Numeric(20, 4), nullable=False, default=Decimal("0"))
    right_pv = Column(Numeric(20, 4), nullable=False, default=Decimal("0"))
    left_pv_carry = Column(Numeric(20, 4), nullable=False, default=Decimal("0"))
    right_pv_carry = Column(Numeric(20, 4), nullable=False, default=Decimal("0"))

    package_id = Column(Integer, ForeignKey("packages.id"))
    is_active = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # relationships
    sponsor = relationship("User", foreign_keys=[sponsor_id], remote_side="User.id")
    parent = relationship("User", foreign_keys=[parent_id], remote_side="User.id")
    left_child = relationship("User", foreign_keys=[left_child_id], remote_side="User.id")
    right_child = relationship("User", foreign_keys=[right_child_id], remote_side="User.id")
    package = relationship("Package")
    wallet = relationship("Wallet", back_populates="user", uselist=False)


# ── Wallet ─────────────────────────────────────────────────
class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    main_balance = Column(Numeric(20, 4), nullable=False, default=Decimal("0"))
    deposit_balance = Column(Numeric(20, 4), nullable=False, default=Decimal("0"))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User", back_populates="wallet")
    transactions = relationship("Transaction", back_populates="wallet")


# ── Transaction ────────────────────────────────────────────
class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    wallet_id = Column(UUID(as_uuid=True), ForeignKey("wallets.id"), nullable=False, index=True)
    type = Column(SAEnum(TxType, name="tx_type", create_type=False), nullable=False)
    amount = Column(Numeric(20, 4), nullable=False)
    balance_type = Column(
        SAEnum(BalanceType, name="balance_type", create_type=False),
        nullable=False,
        default=BalanceType.MAIN,
    )
    description = Column(Text)
    idempotency_key = Column(String(255), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    wallet = relationship("Wallet", back_populates="transactions")


# ── Order ──────────────────────────────────────────────────
class Order(Base):
    __tablename__ = "orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    package_id = Column(Integer, ForeignKey("packages.id"), nullable=False)
    amount = Column(Numeric(20, 4), nullable=False)
    status = Column(
        SAEnum(OrderStatus, name="order_status", create_type=False),
        nullable=False,
        default=OrderStatus.PENDING,
    )
    idempotency_key = Column(String(255), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User")
    package = relationship("Package")


# ── Bonus Log ─────────────────────────────────────────────
class BonusLog(Base):
    __tablename__ = "bonus_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    type = Column(SAEnum(BonusTypeEnum, name="bonus_type", create_type=False), nullable=False)
    amount = Column(Numeric(20, 4), nullable=False)
    source_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    idempotency_key = Column(String(255), unique=True, nullable=False)
    meta = Column(JSONB)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", foreign_keys=[user_id])
    source_user = relationship("User", foreign_keys=[source_user_id])


# ── PV Event (batch-processable) ──────────────────────────
class PVEvent(Base):
    __tablename__ = "pv_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    pv_amount = Column(Integer, nullable=False)
    processed = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


# ── Withdrawal ─────────────────────────────────────────────
class Withdrawal(Base):
    __tablename__ = "withdrawals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    amount = Column(Numeric(20, 4), nullable=False)
    status = Column(
        SAEnum(WithdrawalStatus, name="withdrawal_status", create_type=False),
        nullable=False,
        default=WithdrawalStatus.PENDING,
    )
    payment_details = Column(JSONB)
    admin_note = Column(Text)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User")
