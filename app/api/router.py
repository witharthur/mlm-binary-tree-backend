from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.wallet import router as wallet_router
from app.api.v1.packages import router as packages_router
from app.api.v1.orders import router as orders_router
from app.api.v1.bonuses import router as bonuses_router
from app.api.v1.withdrawals import router as withdrawals_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(wallet_router)
api_router.include_router(packages_router)
api_router.include_router(orders_router)
api_router.include_router(bonuses_router)
api_router.include_router(withdrawals_router)
