from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime


# ── STOCK ─────────────────────────────────────────────────────
class StockInfo(BaseModel):
    symbol: str
    name: str
    current_price: float
    change: float
    change_percent: float
    volume: int
    market_cap: Optional[float]
    sector: Optional[str]
    industry: Optional[str]


class StockHistory(BaseModel):
    symbol: str
    dates: List[str]
    opens: List[float]
    highs: List[float]
    lows: List[float]
    closes: List[float]
    volumes: List[int]


class PricePrediction(BaseModel):
    symbol: str
    predicted_dates: List[str]
    predicted_prices: List[float]
    confidence_upper: List[float]
    confidence_lower: List[float]
    model_accuracy: float


# ── PORTFOLIO ─────────────────────────────────────────────────
class AddStockRequest(BaseModel):
    symbol: str
    shares: float
    buy_price: float
    buy_date: str


class PortfolioStock(BaseModel):
    symbol: str
    name: str
    shares: float
    buy_price: float
    current_price: float
    total_invested: float
    current_value: float
    profit_loss: float
    profit_loss_percent: float
    buy_date: str


class PortfolioSummary(BaseModel):
    total_invested: float
    current_value: float
    total_profit_loss: float
    total_profit_loss_percent: float
    stocks: List[PortfolioStock]
    last_updated: datetime


# ── RISK ──────────────────────────────────────────────────────
class RiskMetrics(BaseModel):
    symbol: str
    sharpe_ratio: float
    sortino_ratio: float
    max_drawdown: float
    volatility: float
    beta: float
    var_95: float
    var_99: float
    risk_rating: str


class PortfolioRisk(BaseModel):
    portfolio_volatility: float
    portfolio_sharpe: float
    portfolio_var_95: float
    portfolio_beta: float
    max_drawdown: float
    correlation_matrix: Dict
    individual_risks: List[RiskMetrics]


# ── ANALYSIS ──────────────────────────────────────────────────
class SentimentResult(BaseModel):
    symbol: str
    overall_sentiment: str
    sentiment_score: float
    news_count: int
    headlines: List[Dict]


class AnomalyResult(BaseModel):
    symbol: str
    anomalies_detected: int
    anomaly_dates: List[str]
    anomaly_scores: List[float]
    risk_level: str


class BacktestRequest(BaseModel):
    symbol: str
    strategy: str
    initial_investment: float
    start_date: str
    end_date: str
    parameters: Optional[Dict] = None


class BacktestResult(BaseModel):
    symbol: str
    strategy: str
    initial_investment: float
    final_value: float
    total_return: float
    total_return_percent: float
    sharpe_ratio: float
    max_drawdown: float
    num_trades: int
    benchmark_return: float
    dates: List[str]
    portfolio_values: List[float]


# ── HEALTH ────────────────────────────────────────────────────
class HealthResponse(BaseModel):
    status: str
    app_name: str
    version: str
    timestamp: datetime  