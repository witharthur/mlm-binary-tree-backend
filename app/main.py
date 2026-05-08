from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware

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

# Add CORS middleware to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
