from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://mlm:mlm_secret@localhost:5432/mlm_platform"
    DATABASE_URL_SYNC: str = "postgresql+psycopg2://mlm:mlm_secret@localhost:5432/mlm_platform"
    REDIS_URL: str = "redis://localhost:6379/0"

    SECRET_KEY: str = "change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # Business constants
    REFERRAL_BONUS_PERCENT: float = 10.0
    BINARY_BONUS_PERCENT: float = 10.0
    BINARY_MAIN_SPLIT: float = 0.9
    BINARY_DEPOSIT_SPLIT: float = 0.1

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
