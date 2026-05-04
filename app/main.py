from fastapi import FastAPI
from contextlib import asynccontextmanager

from app.api.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: nothing special needed — engines are created on import
    yield
    # Shutdown: dispose engines
    from app.database import async_engine
    await async_engine.dispose()


app = FastAPI(
    title="MLM Platform API",
    version="1.0.0",
    description="Production-ready MLM backend with binary tree, wallet, and bonus system",
    lifespan=lifespan,
)

app.include_router(api_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
