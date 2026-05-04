from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.dependencies import get_current_user
from app.models import User
from app.schemas import UserOut
from app.services.tree import get_subtree

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
async def get_me(user: User = Depends(get_current_user)):
    return user


@router.get("/me/tree")
async def get_my_tree(
    depth: int = 5,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
):
    """Visualize binary tree from current user down to `depth` levels."""
    return await get_subtree(session, user.id, depth=min(depth, 10))
