from pydantic_settings import BaseSettings
from functools import lru_cache
from dotenv import load_dotenv
load_dotenv()


class Settings(BaseSettings):
    APP_NAME: str = "FinSight"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"

    DATABASE_URL: str = "sqlite:///./finsight.db"
    REDIS_URL: str = "redis://localhost:6379"

    LSTM_EPOCHS: int = 50
    LSTM_SEQUENCE_LENGTH: int = 60

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    load_dotenv()
    return Settings()


settings = get_settings()  