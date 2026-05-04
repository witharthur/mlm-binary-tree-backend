from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


# ── Auth ───────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8)


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ── User ───────────────────────────────────────────────────
class UserOut(BaseModel):
    id: UUID
    username: str
    email: str
    sponsor_id: Optional[UUID] = None
    parent_id: Optional[UUID] = None
    placement_side: Optional[str] = None
    left_child_id: Optional[UUID] = None
    right_child_id: Optional[UUID] = None
    left_pv: Decimal
    right_pv: Decimal
    package_id: Optional[int] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TreeNodeOut(BaseModel):
    id: UUID
    username: str
    placement_side: Optional[str]
    left_child: Optional["TreeNodeOut"] = None
    right_child: Optional["TreeNodeOut"] = None

    class Config:
        from_attributes = True


# ── Wallet ─────────────────────────────────────────────────
class WalletOut(BaseModel):
    id: UUID
    user_id: UUID
    main_balance: Decimal
    deposit_balance: Decimal

    class Config:
        from_attributes = True


class DepositRequest(BaseModel):
    amount: Decimal = Field(gt=0)
    idempotency_key: str


class TransactionOut(BaseModel):
    id: UUID
    wallet_id: UUID
    type: str
    amount: Decimal
    balance_type: str
    description: Optional[str]
    idempotency_key: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Package ────────────────────────────────────────────────
class PackageOut(BaseModel):
    id: int
    name: str
    price: Decimal
    pv_value: int
    is_active: bool

    class Config:
        from_attributes = True


class PurchasePackageRequest(BaseModel):
    package_id: int
    idempotency_key: str


# ── Order ──────────────────────────────────────────────────
class OrderOut(BaseModel):
    id: UUID
    user_id: UUID
    package_id: int
    amount: Decimal
    status: str
    idempotency_key: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Bonus ──────────────────────────────────────────────────
class BonusLogOut(BaseModel):
    id: UUID
    user_id: UUID
    type: str
    amount: Decimal
    source_user_id: Optional[UUID]
    idempotency_key: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Withdrawal ─────────────────────────────────────────────
class WithdrawalRequest(BaseModel):
    amount: Decimal = Field(gt=0)
    payment_details: Optional[dict] = None


class WithdrawalOut(BaseModel):
    id: UUID
    user_id: UUID
    amount: Decimal
    status: str
    payment_details: Optional[dict]
    admin_note: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
