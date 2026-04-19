from fastapi import APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool
from loguru import logger
from app.services.risk_service import RiskService
from app.services.news_service import NewsService
from app.ml.anomaly_detector import AnomalyDetector
from app.ml.sentiment_model import SentimentAnalyzer
from app.ml.shap_explainer import SHAPExplainer
from app.ml.lstm_model import LSTMPricePredictor
from app.models.schemas import BacktestRequest
import yfinance as yf
import numpy as np
import pandas as pd

router = APIRouter()
risk_service      = RiskService()
news_service      = NewsService()
anomaly_detector  = AnomalyDetector()
sentiment_analyzer = SentimentAnalyzer()
shap_explainer    = SHAPExplainer()
lstm_predictor    = LSTMPricePredictor()


@router.get("/risk/{symbol}")
async def get_risk_metrics(symbol: str):
    try:
        # run in thread pool — yfinance & numpy are blocking
        return await run_in_threadpool(risk_service.get_full_risk_metrics, symbol)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/portfolio-risk")
async def get_portfolio_risk(symbols: str):
    try:
        symbol_list = [s.strip() for s in symbols.split(",")]
        return await run_in_threadpool(risk_service.get_portfolio_risk, symbol_list)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/predict/{symbol}")
async def predict_price(symbol: str, days: int = 30):
    """
    Train LSTM and predict — both are CPU-bound so we run in thread pool
    to avoid blocking the FastAPI event loop.
    """
    try:
        logger.info(f"Training LSTM and predicting for {symbol}")

        def train_and_predict():
            lstm_predictor.train(symbol)
            return lstm_predictor.predict(symbol, days)

        prediction = await run_in_threadpool(train_and_predict)
        return prediction
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sentiment/{symbol}")
async def get_sentiment(symbol: str):
    try:
        return await run_in_threadpool(sentiment_analyzer.analyze_stock_news, symbol)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/anomalies/{symbol}")
async def get_anomalies(symbol: str, period: str = "1y"):
    try:
        return await run_in_threadpool(anomaly_detector.detect, symbol, period)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/explain/{symbol}")
async def explain_prediction(symbol: str):
    try:
        return await run_in_threadpool(shap_explainer.explain_prediction, symbol)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/news/{symbol}")
async def get_news(symbol: str):
    try:
        return await run_in_threadpool(news_service.get_stock_news, symbol)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/backtest")
async def run_backtest(request: BacktestRequest):
    try:
        def _backtest():
            ticker = yf.Ticker(request.symbol.upper())
            hist = ticker.history(
                start=request.start_date,
                end=request.end_date
            )

            if hist.empty:
                raise ValueError(f"No data for {request.symbol}")

            closes = hist["Close"].values
            dates  = [d.strftime("%Y-%m-%d") for d in hist.index]

            # ── Strategies ──────────────────────────────────────────
            if request.strategy == "sma_crossover":
                short_window = request.parameters.get("short_window", 20) if request.parameters else 20
                long_window  = request.parameters.get("long_window",  50) if request.parameters else 50
                short_ma = pd.Series(closes).rolling(short_window).mean()
                long_ma  = pd.Series(closes).rolling(long_window).mean()
                signals  = np.where(short_ma > long_ma, 1, -1)

            elif request.strategy == "buy_and_hold":
                signals = np.ones(len(closes))

            elif request.strategy == "rsi":
                delta = pd.Series(closes).diff()
                gain  = delta.clip(lower=0).rolling(14).mean()
                loss  = (-delta.clip(upper=0)).rolling(14).mean()
                rs    = gain / loss
                rsi   = 100 - (100 / (1 + rs))
                signals = np.where(rsi < 30, 1, np.where(rsi > 70, -1, 0))

            else:
                signals = np.ones(len(closes))

            # ── Portfolio simulation ─────────────────────────────────
            returns = pd.Series(closes).pct_change().fillna(0).values
            strategy_returns = signals[:-1] * returns[1:]

            portfolio_values = [request.initial_investment]
            for ret in strategy_returns:
                portfolio_values.append(portfolio_values[-1] * (1 + ret))

            final_value      = portfolio_values[-1]
            total_return     = final_value - request.initial_investment
            total_return_pct = (total_return / request.initial_investment) * 100

            # Benchmark — S&P 500 buy and hold
            sp500 = yf.Ticker("^GSPC").history(
                start=request.start_date,
                end=request.end_date
            )
            benchmark_return = float(
                (sp500["Close"].iloc[-1] - sp500["Close"].iloc[0]) /
                sp500["Close"].iloc[0] * 100
            ) if not sp500.empty else 0.0

            # Sharpe
            sr = pd.Series(strategy_returns)
            sharpe = float(
                sr.mean() / sr.std() * np.sqrt(252)
                if sr.std() != 0 else 0
            )

            # Max drawdown
            pv     = pd.Series(portfolio_values)
            rm     = pv.expanding().max()
            max_dd = float((((pv - rm) / rm)).min() * 100)

            num_trades = int(np.sum(np.diff(signals) != 0))

            return {
                "symbol": request.symbol.upper(),
                "strategy": request.strategy,
                "initial_investment": request.initial_investment,
                "final_value": round(final_value, 2),
                "total_return": round(total_return, 2),
                "total_return_percent": round(total_return_pct, 2),
                "sharpe_ratio": round(sharpe, 4),
                "max_drawdown": round(max_dd, 4),
                "num_trades": num_trades,
                "benchmark_return": round(benchmark_return, 2),
                "dates": dates[:len(portfolio_values)],
                "portfolio_values": [round(v, 2) for v in portfolio_values],
            }

        return await run_in_threadpool(_backtest)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))  