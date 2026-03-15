from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from src.api import api_router
from src.core.bootstrap import bootstrap_admin, bootstrap_authorities, bootstrap_mock_data
from src.core.config import get_settings
from src.core.db import close_db, init_db
from src.core.redis import close_redis, init_redis


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings = get_settings()
    await init_db(settings)
    await init_redis(settings)
    await bootstrap_authorities(settings)
    await bootstrap_admin(settings)
    await bootstrap_mock_data(settings)
    yield
    await close_redis()
    await close_db()


settings = get_settings()
app = FastAPI(
    title=settings.app_name,
    debug=settings.app_debug,
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:3001",
        "https://healthfit.artemka1806.dev",
        "https://admin.healthfit.artemka1806.dev"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router)

static_dir = Path(__file__).resolve().parent / "static"
app.mount("/static", StaticFiles(directory=static_dir, check_dir=False), name="static")
