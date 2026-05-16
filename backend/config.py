import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    _base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    model_config = SettingsConfigDict(
        env_file=os.path.join(_base_dir, ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    kafka_bootstrap_servers: str
    postgres_host: str
    postgres_port: int
    postgres_db: str
    postgres_user: str
    postgres_password: str
    clickhouse_host: str
    clickhouse_port: int
    clickhouse_db: str
    redis_url: str
    gemini_api_key: str = ""
    groq_api_key: str = ""
    telegram_bot_token: str = ""
    newsapi_key: str = ""
    reddit_client_id: str = ""
    reddit_client_secret: str = ""
    reddit_user_agent: str = "newron:v1.0"
    backend_port: int = 8000
    environment: str = "development"


settings = Settings()
