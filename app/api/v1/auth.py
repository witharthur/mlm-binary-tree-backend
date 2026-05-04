from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.schemas import RegisterRequest, LoginRequest, TokenResponse, UserOut
from app.services.auth import register, login

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=201)
async def register_user(
    data: RegisterRequest,
    session: AsyncSession = Depends(get_async_session),
):
    user = await register(session, data)
    return user


@router.post("/register/ref/{sponsor_id}/{side}", response_model=UserOut, status_code=201)
async def register_with_referral(
    sponsor_id: UUID,
    side: str,
    data: RegisterRequest,
    session: AsyncSession = Depends(get_async_session),
):
    """Register via referral link:  /ref/{user_id}/L  or  /ref/{user_id}/R"""
    user = await register(session, data, sponsor_id=sponsor_id, side=side)
    return user


@router.post("/login", response_model=TokenResponse)
async def login_user(
    data: LoginRequest,
    session: AsyncSession = Depends(get_async_session),
):
    return await login(session, data.username, data.password)
