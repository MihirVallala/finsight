import json
import uuid
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional
import yfinance as yf
from loguru import logger


class PortfolioService:
    """
    Manages user portfolio — adding stocks, tracking value,
    calculating profit/loss.
    Data stored in JSON file locally — no database needed.
    """

    def __init__(self):
        self.data_file = Path("portfolio.json")
        self.portfolio = self._load_portfolio()
        logger.info("PortfolioService initialized")

    def _load_portfolio(self) -> Dict:
        """Load portfolio from disk"""
        if self.data_file.exists():
            with open(self.data_file, "r") as f:
                return json.load(f)
        return {"stocks": [], "audit_log": []}

    def _save_portfolio(self) -> None:
        """Save portfolio to disk"""
        with open(self.data_file, "w") as f:
            json.dump(self.portfolio, f, indent=2, default=str)

    def _log_action(self, action: str, details: str) -> None:
        """
        Audit log — records every action with timestamp.
        This is what JPMorgan's compliance teams require.
        Every financial action must be traceable.
        """
        self.portfolio["audit_log"].append({
            "id": str(uuid.uuid4()),
            "timestamp": datetime.utcnow().isoformat(),
            "action": action,
            "details": details
        })
        self._save_portfolio()

    def add_stock(
        self,
        symbol: str,
        shares: float,
        buy_price: float,
        buy_date: str
    ) -> dict:
        """Add a stock to portfolio"""
        logger.info(f"Adding stock: {symbol} | Shares: {shares}")

        # Verify stock exists
        try:
            ticker = yf.Ticker(symbol.upper())
            info = ticker.info
            name = info.get("longName", symbol)
        except Exception:
            name = symbol

        stock_entry = {
            "id": str(uuid.uuid4()),
            "symbol": symbol.upper(),
            "name": name,
            "shares": shares,
            "buy_price": buy_price,
            "buy_date": buy_date,
            "added_at": datetime.utcnow().isoformat()
        }

        self.portfolio["stocks"].append(stock_entry)
        self._save_portfolio()
        self._log_action(
            "ADD_STOCK",
            f"Added {shares} shares of {symbol} at ${buy_price}"
        )

        return stock_entry

    def remove_stock(self, stock_id: str) -> bool:
        """Remove a stock from portfolio"""
        original_len = len(self.portfolio["stocks"])
        self.portfolio["stocks"] = [
            s for s in self.portfolio["stocks"]
            if s["id"] != stock_id
        ]

        if len(self.portfolio["stocks"]) < original_len:
            self._save_portfolio()
            self._log_action("REMOVE_STOCK", f"Removed stock ID: {stock_id}")
            return True
        return False

    def get_portfolio_summary(self) -> dict:
        """Get complete portfolio with current values and P&L"""
        logger.info("Getting portfolio summary")

        stocks_data = []
        total_invested = 0
        current_value = 0

        for stock in self.portfolio["stocks"]:
            try:
                ticker = yf.Ticker(stock["symbol"])
                hist = ticker.history(period="2d")

                if hist.empty:
                    continue

                current_price = float(hist["Close"].iloc[-1])
                total_cost = stock["shares"] * stock["buy_price"]
                current_total = stock["shares"] * current_price
                profit_loss = current_total - total_cost
                profit_loss_pct = (profit_loss / total_cost) * 100

                stocks_data.append({
                    "id": stock["id"],
                    "symbol": stock["symbol"],
                    "name": stock["name"],
                    "shares": stock["shares"],
                    "buy_price": stock["buy_price"],
                    "current_price": round(current_price, 2),
                    "total_invested": round(total_cost, 2),
                    "current_value": round(current_total, 2),
                    "profit_loss": round(profit_loss, 2),
                    "profit_loss_percent": round(profit_loss_pct, 2),
                    "buy_date": stock["buy_date"],
                })

                total_invested += total_cost
                current_value += current_total

            except Exception as e:
                logger.warning(f"Could not fetch price for {stock['symbol']}: {e}")

        total_pl = current_value - total_invested
        total_pl_pct = (total_pl / total_invested * 100) if total_invested > 0 else 0

        return {
            "total_invested": round(total_invested, 2),
            "current_value": round(current_value, 2),
            "total_profit_loss": round(total_pl, 2),
            "total_profit_loss_percent": round(total_pl_pct, 2),
            "stocks": stocks_data,
            "last_updated": datetime.utcnow(),
        }

    def get_audit_log(self) -> List[Dict]:
        """Returns complete audit trail"""
        return self.portfolio.get("audit_log", [])   