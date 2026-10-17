import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./segmentiq.db"
    SECRET_KEY: str = "segmentiq-super-secret-key-change-in-production-min-32-chars-long!"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ADMIN_EMAIL: str = "admin@segmentiq.com"
    FRONTEND_ORIGIN: str = "http://localhost:3000"
    STORAGE_DIR: str = "storage"
    COOKIE_SECURE: bool = False
    COOKIE_NAME: str = "segmentiq_token"

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def storage_path(self) -> Path:
        path = BASE_DIR / self.STORAGE_DIR
        path.mkdir(parents=True, exist_ok=True)
        return path

settings = Settings()
