import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Optional
from loguru import logger


class StockService:
    """
    Handles all stock data fetching using yFinance.
    No API key needed — pulls directly from Yahoo Finance.
    """

    def get_stock_info(self, symbol: str) -> dict:
        """Get current stock info and price"""
        logger.info(f"Fetching stock info: {symbol}")
        try:
            ticker = yf.Ticker(symbol.upper())
            info = ticker.info

            # Get current price
            hist = ticker.history(period="2d")
            if hist.empty:
                raise ValueError(f"No data found for {symbol}")

            current_price = float(hist["Close"].iloc[-1])
            prev_price = float(hist["Close"].iloc[-2]) if len(hist) > 1 else current_price
            change = current_price - prev_price
            change_percent = (change / prev_price) * 100

            return {
                "symbol": symbol.upper(),
                "name": info.get("longName", symbol),
                "current_price": round(current_price, 2),
                "change": round(change, 2),
                "change_percent": round(change_percent, 2),
                "volume": int(hist["Volume"].iloc[-1]),
                "market_cap": info.get("marketCap"),
                "sector": info.get("sector"),
                "industry": info.get("industry"),
            }
        except Exception as e:
            logger.error(f"Failed to fetch stock info for {symbol}: {e}")
            raise

    def get_stock_history(
        self,
        symbol: str,
        period: str = "1y"
    ) -> dict:
        """
        Get historical OHLCV data for a stock.
        Period options: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
        """
        logger.info(f"Fetching history: {symbol} | Period: {period}")
        try:
            ticker = yf.Ticker(symbol.upper())
            hist = ticker.history(period=period)

            if hist.empty:
                raise ValueError(f"No historical data for {symbol}")

            return {
                "symbol": symbol.upper(),
                "dates": [d.strftime("%Y-%m-%d") for d in hist.index],
                "opens": [round(float(x), 2) for x in hist["Open"]],
                "highs": [round(float(x), 2) for x in hist["High"]],
                "lows": [round(float(x), 2) for x in hist["Low"]],
                "closes": [round(float(x), 2) for x in hist["Close"]],
                "volumes": [int(x) for x in hist["Volume"]],
            }
        except Exception as e:
            logger.error(f"Failed to fetch history for {symbol}: {e}")
            raise

    def get_multiple_stocks(self, symbols: list) -> list:
        """Fetch info for multiple stocks at once"""
        results = []
        for symbol in symbols:
            try:
                info = self.get_stock_info(symbol)
                results.append(info)
            except Exception as e:
                logger.warning(f"Skipping {symbol}: {e}")
        return results

    def search_stock(self, query: str) -> list:
        """Search for stocks by name or symbol"""
        # Common stocks database for quick search
        common_stocks = {
            "AAPL": "Apple Inc",
            "GOOGL": "Alphabet Inc",
            "MSFT": "Microsoft Corporation",
            "AMZN": "Amazon.com Inc",
            "META": "Meta Platforms Inc",
            "TSLA": "Tesla Inc",
            "NVDA": "NVIDIA Corporation",
            "JPM": "JPMorgan Chase & Co",
            "BAC": "Bank of America Corp",
            "GS": "Goldman Sachs Group Inc",
            "MS": "Morgan Stanley",
            "V": "Visa Inc",
            "MA": "Mastercard Inc",
            "NFLX": "Netflix Inc",
            "AMD": "Advanced Micro Devices",
            "INTC": "Intel Corporation",
            "CRM": "Salesforce Inc",
            "ORCL": "Oracle Corporation",
            "IBM": "IBM Corporation",
            "UBER": "Uber Technologies",
        }

        query_upper = query.upper()
        results = []

        for symbol, name in common_stocks.items():
            if (query_upper in symbol or
                    query.lower() in name.lower()):
                results.append({
                    "symbol": symbol,
                    "name": name
                })

        return results[:10]      