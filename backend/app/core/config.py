"""Centralized configuration. Never hardcode secrets: everything comes from env."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- LLM ---
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    gemini_base_url: str = "https://generativelanguage.googleapis.com/v1beta"
    gemini_timeout_seconds: float = 120.0

    # --- Web research ---
    tavily_api_key: str = ""  # <-- Tavily API key added here
    web_search_results: int = 5
    web_fetch_timeout_seconds: float = 15.0
    web_max_chars_per_page: int = 6000

    # --- Documents ---
    max_upload_bytes: int = 10 * 1024 * 1024
    max_document_chars: int = 40000

    # --- Server ---
    cors_origins: str = "*"

    # --- Database ---
    mongodb_uri: str = "mongodb+srv://meghamanojramachandran19_db_user:tZXrHU0g2M9BLqcl@cluster0.zbnxvtt.mongodb.net/?retryWrites=true&w=majority"
    mongodb_db_name: str = "agentflow"

    @property
    def gemini_configured(self) -> bool:
        return bool(self.gemini_api_key.strip())

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()