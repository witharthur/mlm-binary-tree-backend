from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.dependencies import get_current_user
from app.models import User
from app.schemas import PackageOut, PurchasePackageRequest, OrderOut
from app.services.package import list_packages, purchase_package

router = APIRouter(prefix="/packages", tags=["packages"])


@router.get("", response_model=list[PackageOut])
async def get_packages(session: AsyncSession = Depends(get_async_session)):
    return await list_packages(session)


@router.post("/purchase", response_model=OrderOut)
async def purchase(
    data: PurchasePackageRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
):
    return await purchase_package(
        session,
        user=user,
        package_id=data.package_id,
        idempotency_key=data.idempotency_key,
    )
