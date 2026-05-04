from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.dependencies import get_current_user
from app.models import User, BonusLog
from app.schemas import BonusLogOut

router = APIRouter(prefix="/bonuses", tags=["bonuses"])


@router.get("", response_model=list[BonusLogOut])
async def my_bonuses(
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(
        select(BonusLog)
        .where(BonusLog.user_id == user.id)
        .order_by(BonusLog.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(result.scalars().all())
