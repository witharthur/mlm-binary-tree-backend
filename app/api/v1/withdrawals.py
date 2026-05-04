from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.dependencies import get_current_user
from app.models import User
from app.schemas import WithdrawalRequest, WithdrawalOut
from app.services.withdrawal import (
    create_withdrawal,
    list_withdrawals,
    approve_withdrawal,
    reject_withdrawal,
)

router = APIRouter(prefix="/withdrawals", tags=["withdrawals"])


@router.post("", response_model=WithdrawalOut, status_code=201)
async def request_withdrawal(
    data: WithdrawalRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
):
    return await create_withdrawal(
        session, user, data.amount, data.payment_details,
    )


@router.get("", response_model=list[WithdrawalOut])
async def my_withdrawals(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
):
    return await list_withdrawals(session, user.id)


# ── Admin endpoints (add proper RBAC in production) ────────
@router.post("/{withdrawal_id}/approve", response_model=WithdrawalOut)
async def admin_approve(
    withdrawal_id: UUID,
    session: AsyncSession = Depends(get_async_session),
    _user: User = Depends(get_current_user),
):
    return await approve_withdrawal(session, withdrawal_id)


@router.post("/{withdrawal_id}/reject", response_model=WithdrawalOut)
async def admin_reject(
    withdrawal_id: UUID,
    admin_note: str = "",
    session: AsyncSession = Depends(get_async_session),
    _user: User = Depends(get_current_user),
):
    return await reject_withdrawal(session, withdrawal_id, admin_note)
