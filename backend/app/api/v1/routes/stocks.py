from fastapi import APIRouter, HTTPException
from loguru import logger
from app.services.stock_service import StockService

router = APIRouter()
stock_service = StockService()

@router.get("/info/{symbol}")
async def get_stock_info(symbol: str):
    try:
        return stock_service.get_stock_info(symbol)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/history/{symbol}")
async def get_stock_history(symbol: str, period: str = "1y"):
    try:
        return stock_service.get_stock_history(symbol, period)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/search")
async def search_stocks(query: str):
    try:
        return stock_service.search_stock(query)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/multiple")
async def get_multiple_stocks(symbols: str):
    try:
        symbol_list = [s.strip() for s in symbols.split(",")]
        return stock_service.get_multiple_stocks(symbol_list)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))   