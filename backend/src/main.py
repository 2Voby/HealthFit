from contextlib import asynccontextmanager

from fastapi import FastAPI

from src.api import api_router
from src.core.bootstrap import bootstrap_admin, bootstrap_authorities
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
    yield
    await close_redis()
    await close_db()


settings = get_settings()
app = FastAPI(
    title=settings.app_name,
    debug=settings.app_debug,
    lifespan=lifespan,
)
app.include_router(api_router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
