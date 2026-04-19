import numpy as np
import pandas as pd
import yfinance as yf
from typing import List, Dict
from loguru import logger


class RiskService:
    """
    Calculates all financial risk metrics.
    These are the exact metrics JPMorgan's risk teams use daily.
    """

    RISK_FREE_RATE = 0.05
    # Current approximate risk-free rate (10-year treasury)
    # Used in Sharpe and Sortino ratio calculations

    def get_returns(self, symbol: str, period: str = "1y") -> pd.Series:
        """Calculate daily returns for a stock"""
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=period)
        returns = hist["Close"].pct_change().dropna()
        return returns

    def calculate_sharpe_ratio(self, returns: pd.Series) -> float:
        """
        Sharpe Ratio = (Portfolio Return - Risk Free Rate) / Portfolio Volatility

        Measures return per unit of risk.
        > 1.0 = Good
        > 2.0 = Very Good
        > 3.0 = Excellent
        < 0 = Losing money vs risk-free investment
        """
        if returns.std() == 0:
            return 0.0

        daily_rf = self.RISK_FREE_RATE / 252
        # 252 = trading days per year
        # Convert annual rate to daily

        excess_returns = returns - daily_rf
        sharpe = (excess_returns.mean() / returns.std()) * np.sqrt(252)
        # Annualize by multiplying by sqrt(252)

        return round(float(sharpe), 4)

    def calculate_sortino_ratio(self, returns: pd.Series) -> float:
        """
        Sortino Ratio = (Return - Risk Free Rate) / Downside Deviation

        Like Sharpe but only penalizes DOWNSIDE volatility.
        More sophisticated than Sharpe for financial analysis.
        Upside volatility is good — why penalize it?
        """
        daily_rf = self.RISK_FREE_RATE / 252
        excess_returns = returns - daily_rf

        # Only look at negative returns (downside)
        downside_returns = returns[returns < 0]

        if len(downside_returns) == 0 or downside_returns.std() == 0:
            return 0.0

        downside_std = downside_returns.std() * np.sqrt(252)
        sortino = (excess_returns.mean() * 252) / downside_std

        return round(float(sortino), 4)

    def calculate_max_drawdown(self, returns: pd.Series) -> float:
        """
        Maximum Drawdown = Largest peak to valley loss

        Example: Stock went from $100 → $150 → $90
        Max drawdown = (90-150)/150 = -40%

        Critical metric for risk management —
        tells you the worst historical loss from a peak.
        """
        cumulative = (1 + returns).cumprod()
        # Running total of compounded returns

        rolling_max = cumulative.expanding().max()
        # Track highest point seen so far

        drawdown = (cumulative - rolling_max) / rolling_max
        # How far below the peak are we at each point?

        max_dd = float(drawdown.min())
        return round(max_dd * 100, 4)
        # Return as percentage

    def calculate_var(
        self,
        returns: pd.Series,
        confidence: float = 0.95
    ) -> float:
        """
        Value at Risk (VaR) = Maximum expected loss at given confidence level

        Example: VaR(95%) = -2.3%
        Means: On 95% of days, you won't lose more than 2.3%
        Or: There's a 5% chance of losing more than 2.3% in a day

        This is a REGULATORY REQUIREMENT for banks —
        JPMorgan reports VaR to regulators daily.
        """
        var = np.percentile(returns, (1 - confidence) * 100)
        return round(float(var) * 100, 4)

    def calculate_beta(self, symbol: str, period: str = "1y") -> float:
        """
        Beta = How much the stock moves relative to the market (S&P 500)

        Beta = 1.0: Moves exactly with the market
        Beta > 1.0: More volatile than market (e.g. 1.5 = 50% more volatile)
        Beta < 1.0: Less volatile than market (defensive stock)
        Beta < 0: Moves opposite to market (rare — gold, some bonds)
        """
        try:
            stock_returns = self.get_returns(symbol, period)
            market_returns = self.get_returns("^GSPC", period)
            # ^GSPC = S&P 500 index

            # Align dates
            aligned = pd.concat(
                [stock_returns, market_returns],
                axis=1,
                join="inner"
            )
            aligned.columns = ["stock", "market"]

            # Beta = Covariance(stock, market) / Variance(market)
            covariance = aligned["stock"].cov(aligned["market"])
            market_variance = aligned["market"].var()

            if market_variance == 0:
                return 1.0

            beta = covariance / market_variance
            return round(float(beta), 4)

        except Exception as e:
            logger.error(f"Beta calculation failed: {e}")
            return 1.0

    def calculate_volatility(self, returns: pd.Series) -> float:
        """Annualized volatility (standard deviation of returns)"""
        volatility = returns.std() * np.sqrt(252)
        return round(float(volatility) * 100, 4)

    def get_full_risk_metrics(self, symbol: str) -> dict:
        """Calculate all risk metrics for a single stock"""
        logger.info(f"Calculating risk metrics: {symbol}")

        try:
            returns = self.get_returns(symbol)

            sharpe = self.calculate_sharpe_ratio(returns)
            sortino = self.calculate_sortino_ratio(returns)
            max_dd = self.calculate_max_drawdown(returns)
            var_95 = self.calculate_var(returns, 0.95)
            var_99 = self.calculate_var(returns, 0.99)
            volatility = self.calculate_volatility(returns)
            beta = self.calculate_beta(symbol)

            # Risk rating based on multiple factors
            risk_score = 0
            if sharpe < 0:
                risk_score += 3
            elif sharpe < 1:
                risk_score += 2
            else:
                risk_score += 0

            if abs(max_dd) > 30:
                risk_score += 3
            elif abs(max_dd) > 20:
                risk_score += 2
            elif abs(max_dd) > 10:
                risk_score += 1

            if volatility > 40:
                risk_score += 3
            elif volatility > 25:
                risk_score += 2
            elif volatility > 15:
                risk_score += 1

            if risk_score >= 6:
                risk_rating = "CRITICAL 🔴"
            elif risk_score >= 4:
                risk_rating = "HIGH 🟠"
            elif risk_score >= 2:
                risk_rating = "MEDIUM 🟡"
            else:
                risk_rating = "LOW 🟢"

            return {
                "symbol": symbol.upper(),
                "sharpe_ratio": sharpe,
                "sortino_ratio": sortino,
                "max_drawdown": max_dd,
                "volatility": volatility,
                "beta": beta,
                "var_95": var_95,
                "var_99": var_99,
                "risk_rating": risk_rating,
            }

        except Exception as e:
            logger.error(f"Risk calculation failed for {symbol}: {e}")
            raise

    def get_portfolio_risk(self, symbols: List[str]) -> dict:
        """Calculate risk metrics for entire portfolio"""
        logger.info(f"Calculating portfolio risk: {symbols}")

        try:
            # Get returns for all stocks
            all_returns = {}
            for symbol in symbols:
                try:
                    all_returns[symbol] = self.get_returns(symbol)
                except Exception:
                    logger.warning(f"Skipping {symbol} in portfolio risk")

            if not all_returns:
                raise ValueError("No valid stocks for risk calculation")

            returns_df = pd.DataFrame(all_returns).dropna()

            # Equal weight portfolio (can be enhanced with actual weights)
            weights = np.array([1/len(symbols)] * len(symbols))

            portfolio_returns = returns_df.dot(weights)

            # Portfolio metrics
            portfolio_volatility = self.calculate_volatility(portfolio_returns)
            portfolio_sharpe = self.calculate_sharpe_ratio(portfolio_returns)
            portfolio_var = self.calculate_var(portfolio_returns)
            portfolio_beta = float(np.dot(
                weights,
                [self.calculate_beta(s) for s in symbols]
            ))
            max_dd = self.calculate_max_drawdown(portfolio_returns)

            # Correlation matrix
            corr_matrix = returns_df.corr().round(3).to_dict()

            # Individual risks
            individual_risks = []
            for symbol in symbols:
                try:
                    risk = self.get_full_risk_metrics(symbol)
                    individual_risks.append(risk)
                except Exception:
                    pass

            return {
                "portfolio_volatility": portfolio_volatility,
                "portfolio_sharpe": portfolio_sharpe,
                "portfolio_var_95": portfolio_var,
                "portfolio_beta": round(portfolio_beta, 4),
                "max_drawdown": max_dd,
                "correlation_matrix": corr_matrix,
                "individual_risks": individual_risks,
            }

        except Exception as e:
            logger.error(f"Portfolio risk failed: {e}")
            raise 