from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.dependencies import get_current_user
from app.models import User
from app.schemas import WalletOut, DepositRequest, TransactionOut
from app.services.wallet import get_wallet, credit, get_transactions, TxType, BalanceType

router = APIRouter(prefix="/wallet", tags=["wallet"])


@router.get("", response_model=WalletOut)
async def my_wallet(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
):
    return await get_wallet(session, user.id)


@router.post("/deposit", response_model=TransactionOut)
async def deposit(
    data: DepositRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
):
    tx = await credit(
        session,
        user_id=user.id,
        amount=data.amount,
        tx_type=TxType.DEPOSIT,
        balance_type=BalanceType.DEPOSIT,
        idempotency_key=data.idempotency_key,
        description="Manual deposit",
    )
    await session.commit()
    return tx


@router.get("/transactions", response_model=list[TransactionOut])
async def transactions(
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
):
    return await get_transactions(session, user.id, limit=limit, offset=offset)
