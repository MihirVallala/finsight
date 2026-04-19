from fastapi import APIRouter, HTTPException
from loguru import logger
from app.services.portfolio_service import PortfolioService
from app.models.schemas import AddStockRequest

router = APIRouter()
portfolio_service = PortfolioService()

@router.get("/")
async def get_portfolio():
    try:
        return portfolio_service.get_portfolio_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/add")
async def add_stock(request: AddStockRequest):
    try:
        return portfolio_service.add_stock(
            symbol=request.symbol,
            shares=request.shares,
            buy_price=request.buy_price,
            buy_date=request.buy_date
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/remove/{stock_id}")
async def remove_stock(stock_id: str):
    try:
        success = portfolio_service.remove_stock(stock_id)
        if not success:
            raise HTTPException(status_code=404, detail="Stock not found")
        return {"message": "Stock removed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/audit-log")
async def get_audit_log():
    try:
        return portfolio_service.get_audit_log()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))   