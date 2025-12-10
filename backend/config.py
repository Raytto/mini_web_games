from functools import lru_cache
from typing import List, Optional

from pydantic import Field, validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_env: str = Field("dev", env="APP_ENV")
    host: str = Field("0.0.0.0", env="HOST")
    port: int = Field(8000, env="PORT")
    database_url: str = Field("sqlite:///./data/events.db", env="DATABASE_URL")
    api_key: Optional[str] = Field(None, env="API_KEY")
    allowed_origins: str = Field("", env="ALLOWED_ORIGINS")
    max_batch_events: int = Field(100, env="MAX_BATCH_EVENTS")
    metadata_max_bytes: int = Field(4096, env="METADATA_MAX_BYTES")
    session_idle_minutes: int = Field(30, env="SESSION_IDLE_MINUTES")
    retention_days: int = Field(90, env="RETENTION_DAYS")
    ip_retention_days: int = Field(30, env="IP_RETENTION_DAYS")
    log_level: str = Field("info", env="LOG_LEVEL")
    log_json: bool = Field(False, env="LOG_JSON")

    @validator("allowed_origins", pre=True)
    def strip_spaces(cls, v: str) -> str:
        return v.strip()

    def origins_list(self) -> List[str]:
        return [o for o in self.allowed_origins.split(",") if o.strip()] if self.allowed_origins else []

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
