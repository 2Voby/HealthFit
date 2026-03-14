from tortoise import Tortoise

from src.core.config import Settings


def build_tortoise_config(settings: Settings) -> dict:
    return {
        "connections": {"default": settings.database_url},
        "apps": {
            "models": {
                "models": ["src.models"],
                "default_connection": "default",
            }
        },
    }


async def init_db(settings: Settings) -> None:
    await Tortoise.init(config=build_tortoise_config(settings))
    if settings.db_generate_schemas:
        await Tortoise.generate_schemas()


async def close_db() -> None:
    await Tortoise.close_connections()
