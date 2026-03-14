from __future__ import annotations

import secrets

from redis.asyncio import Redis

from src.core.config import Settings

_redis_client: Redis | None = None
SESSION_PREFIX = "session:"


async def init_redis(settings: Settings) -> None:
    global _redis_client
    _redis_client = Redis.from_url(settings.redis_url, decode_responses=True)
    await _redis_client.ping()


async def close_redis() -> None:
    global _redis_client
    if _redis_client is not None:
        await _redis_client.aclose()
        _redis_client = None


def get_redis() -> Redis:
    if _redis_client is None:
        raise RuntimeError("Redis is not initialized")
    return _redis_client


def session_key(session_id: str) -> str:
    return f"{SESSION_PREFIX}{session_id}"


async def create_session(user_id: int, ttl_seconds: int) -> str:
    session_id = secrets.token_urlsafe(32)
    await get_redis().setex(session_key(session_id), ttl_seconds, str(user_id))
    return session_id


async def get_session_user_id(session_id: str) -> int | None:
    value = await get_redis().get(session_key(session_id))
    if value is None:
        return None
    return int(value)


async def delete_session(session_id: str) -> None:
    await get_redis().delete(session_key(session_id))
