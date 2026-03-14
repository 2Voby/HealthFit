from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "Users Service"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    app_debug: bool = True

    postgres_host: str = "postgres"
    postgres_port: int = 5432
    postgres_db: str = "app"
    postgres_user: str = "app"
    postgres_password: str = "app"

    redis_host: str = "redis"
    redis_port: int = 6379
    redis_db: int = 0
    redis_password: str | None = None

    session_cookie_name: str = "session_id"
    session_ttl_seconds: int = 60 * 60 * 24 * 7
    session_cookie_secure: bool = False
    session_cookie_samesite: Literal["lax", "strict", "none"] = "lax"

    db_generate_schemas: bool = True
    bootstrap_mock_data: bool = True

    bootstrap_authorities_csv: str = "read_users,edit_users,edit_elements"
    bootstrap_admin_login: str | None = "admin"
    bootstrap_admin_password: str | None = "admin12345"
    bootstrap_admin_authorities_csv: str = "read_users,edit_users,edit_elements"

    @property
    def database_url(self) -> str:
        return (
            "postgres://"
            f"{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def redis_url(self) -> str:
        auth = ""
        if self.redis_password:
            auth = f":{self.redis_password}@"
        return f"redis://{auth}{self.redis_host}:{self.redis_port}/{self.redis_db}"

    @staticmethod
    def _csv_to_list(raw: str) -> list[str]:
        return [item.strip() for item in raw.split(",") if item.strip()]

    @property
    def bootstrap_authorities(self) -> list[str]:
        return self._csv_to_list(self.bootstrap_authorities_csv)

    @property
    def bootstrap_admin_authorities(self) -> list[str]:
        return self._csv_to_list(self.bootstrap_admin_authorities_csv)


@lru_cache
def get_settings() -> Settings:
    return Settings()
