from fastapi import APIRouter
from app.api.v1.routes import stocks, portfolio, analysis, health

router = APIRouter()

router.include_router(health.router, tags=["Health"])
router.include_router(stocks.router, prefix="/stocks", tags=["Stocks"])
router.include_router(portfolio.router, prefix="/portfolio", tags=["Portfolio"])
router.include_router(analysis.router, prefix="/analysis", tags=["Analysis"])  