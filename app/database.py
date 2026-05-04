from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import create_engine

from app.config import get_settings

settings = get_settings()

# ── Async engine (FastAPI) ──────────────────────────────────
async_engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
)
AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# ── Sync engine (Celery workers) ───────────────────────────
sync_engine = create_engine(
    settings.DATABASE_URL_SYNC,
    pool_size=10,
    max_overflow=5,
    pool_pre_ping=True,
)
SyncSessionLocal = sessionmaker(bind=sync_engine)

Base = declarative_base()


async def get_async_session() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
