import sys
from pathlib import Path
from loguru import logger
from app.core.config import settings


def setup_logging() -> None:
    logger.remove()

    logger.add(
        sys.stdout,
        level=settings.LOG_LEVEL.strip(),
        format=(
            "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
            "<level>{level: <8}</level> | "
            "<cyan>{name}</cyan>:<cyan>{line}</cyan> | "
            "<level>{message}</level>"
        ),
        colorize=True,
    )

    log_path = Path("logs/app.log")
    log_path.parent.mkdir(parents=True, exist_ok=True)

    logger.add(
        "logs/app.log",
        level=settings.LOG_LEVEL.strip(),
        rotation="10 MB",
        retention="7 days",
        compression="zip",
        encoding="utf-8",
    )

    logger.info(f"Logging initialized | {settings.APP_NAME} v{settings.APP_VERSION}")  