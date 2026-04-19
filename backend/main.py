from dotenv import load_dotenv
import os
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from loguru import logger

from app.core.config import settings
from app.core.logging import setup_logging
from app.api.v1 import router as v1_router

setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("="*50)
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info("="*50)
    yield
    logger.info("Shutting down FinSight")

app = FastAPI(
    title="FinSight API",
    version=settings.APP_VERSION,
    description="""
    ## FinSight — AI-Powered Stock Portfolio Analyzer
    
    ### Features
    - 📈 Real-time stock data via yFinance
    - 🧠 LSTM price forecasting
    - 📰 News sentiment analysis (FinBERT)
    - 🔍 Anomaly detection (Isolation Forest)
    - 💡 SHAP explainability
    - ⚡ Risk metrics (Sharpe, VaR, Beta, Drawdown)
    - 🔄 Backtesting engine
    """,
    lifespan=lifespan,
    docs_url="/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(v1_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/api/v1/health"
    }   