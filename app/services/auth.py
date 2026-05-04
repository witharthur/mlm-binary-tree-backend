"""
Auth service — registration (with referral link support) and login.
"""
from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User, Wallet
from app.schemas import RegisterRequest, TokenResponse
from app.security import hash_password, verify_password, create_access_token
from app.exceptions import ConflictError, AppError
from app.services.tree import place_user_in_tree


async def register(
    session: AsyncSession,
    data: RegisterRequest,
    sponsor_id: uuid.UUID | None = None,
    side: str | None = None,
) -> User:
    """
    Create a new user. If sponsor_id / side are provided (from /ref/{id}/{side}),
    the user is placed in the binary tree under the sponsor.
    """
    # Check uniqueness
    existing = await session.execute(
        select(User).where(
            (User.username == data.username) | (User.email == data.email)
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise ConflictError("Username or email already taken")

    user = User(
        username=data.username,
        email=data.email,
        hashed_password=hash_password(data.password),
    )
    session.add(user)
    await session.flush()  # get user.id

    # Create wallet
    wallet = Wallet(user_id=user.id)
    session.add(wallet)

    # Place in tree
    if sponsor_id is not None and side is not None:
        await place_user_in_tree(session, user, sponsor_id, side)

    await session.commit()
    return user


async def login(session: AsyncSession, username: str, password: str) -> TokenResponse:
    result = await session.execute(
        select(User).where(User.username == username)
    )
    user = result.scalar_one_or_none()
    if user is None or not verify_password(password, user.hashed_password):
        raise AppError("Invalid credentials", 401)

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token)
