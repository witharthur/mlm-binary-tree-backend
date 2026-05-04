from uuid import UUID

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.exceptions import AppError
from app.models import User
from app.security import decode_access_token

bearer_scheme = HTTPBearer()


async def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    session: AsyncSession = Depends(get_async_session),
) -> User:
    payload = decode_access_token(creds.credentials)
    if payload is None:
        raise AppError("Invalid or expired token", 401)

    user_id = payload.get("sub")
    if user_id is None:
        raise AppError("Invalid token payload", 401)

    result = await session.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()
    if user is None:
        raise AppError("User not found", 401)
    return user
