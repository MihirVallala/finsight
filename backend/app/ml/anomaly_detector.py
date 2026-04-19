import numpy as np
import pandas as pd
import yfinance as yf
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from loguru import logger


class AnomalyDetector:
    """
    Detects unusual price movements using Isolation Forest.

    What is Isolation Forest?
    It works by randomly isolating data points.
    Anomalies are easier to isolate (fewer splits needed)
    than normal points (require many splits).

    In stock markets, anomalies indicate:
    - Earnings surprises
    - News events (merger, scandal, FDA approval)
    - Market manipulation
    - Sudden institutional buying/selling

    JPMorgan's risk teams use anomaly detection to flag
    unusual trading patterns that might indicate risk.
    """

    def __init__(self, contamination: float = 0.05):
        self.contamination = contamination
        # contamination = expected % of anomalies in data
        # 0.05 = expect 5% of days to be anomalous
        # Tune this based on how sensitive you want detection

        self.model = IsolationForest(
            contamination=contamination,
            random_state=42,
            n_estimators=100
            # 100 isolation trees — more = better but slower
        )
        self.scaler = StandardScaler()

    def _extract_features(self, hist: pd.DataFrame) -> pd.DataFrame:
        """
        Extract features that help identify anomalies.
        We look at multiple signals, not just price.
        """
        features = pd.DataFrame()

        # Daily return — how much price changed
        features["return"] = hist["Close"].pct_change()

        # Volume change — unusual volume often precedes price moves
        features["volume_change"] = hist["Volume"].pct_change()

        # Price range — high minus low relative to close
        features["price_range"] = (
            (hist["High"] - hist["Low"]) / hist["Close"]
        )

        # Gap — difference between today's open and yesterday's close
        features["gap"] = (
            (hist["Open"] - hist["Close"].shift(1)) / hist["Close"].shift(1)
        )

        # Rolling volatility — 5-day standard deviation of returns
        features["volatility_5d"] = (
            features["return"].rolling(5).std()
        )

        # Volume vs 20-day average
        features["volume_ratio"] = (
            hist["Volume"] / hist["Volume"].rolling(20).mean()
        )

        return features.dropna()

    def detect(self, symbol: str, period: str = "1y") -> dict:
        """
        Detect anomalies in a stock's price history.
        Returns dates and severity of each anomaly.
        """
        logger.info(f"Detecting anomalies for {symbol}")

        try:
            # Fetch historical data
            ticker = yf.Ticker(symbol.upper())
            hist = ticker.history(period=period)

            if len(hist) < 30:
                raise ValueError(f"Not enough data for {symbol}")

            # Extract features
            features = self._extract_features(hist)

            # Scale features — Isolation Forest works better with scaled data
            scaled = self.scaler.fit_transform(features)

            # Fit and predict
            predictions = self.model.fit_predict(scaled)
            scores = self.model.score_samples(scaled)
            # Lower score = more anomalous

            # Find anomaly indices (-1 = anomaly, 1 = normal)
            anomaly_mask = predictions == -1
            anomaly_dates = features.index[anomaly_mask]
            anomaly_scores = scores[anomaly_mask]

            # Get price context for each anomaly
            anomaly_details = []
            for date, score in zip(anomaly_dates, anomaly_scores):
                date_str = date.strftime("%Y-%m-%d")
                try:
                    price = float(hist.loc[date, "Close"])
                    volume = int(hist.loc[date, "Volume"])
                    ret = float(
                        features.loc[date, "return"] * 100
                    )
                    anomaly_details.append({
                        "date": date_str,
                        "price": round(price, 2),
                        "return_percent": round(ret, 2),
                        "volume": volume,
                        "anomaly_score": round(float(score), 4),
                        "severity": "HIGH" if score < -0.1 else "MEDIUM"
                    })
                except Exception:
                    pass

            # Sort by most recent first
            anomaly_details.sort(key=lambda x: x["date"], reverse=True)

            # Overall risk assessment
            num_anomalies = len(anomaly_details)
            total_days = len(features)
            anomaly_rate = num_anomalies / total_days

            if anomaly_rate > 0.08:
                risk_level = "HIGH 🔴"
            elif anomaly_rate > 0.05:
                risk_level = "MEDIUM 🟡"
            else:
                risk_level = "LOW 🟢"

            logger.info(
                f"Anomalies detected for {symbol}: "
                f"{num_anomalies}/{total_days} days"
            )

            return {
                "symbol": symbol.upper(),
                "anomalies_detected": num_anomalies,
                "total_days_analyzed": total_days,
                "anomaly_rate": round(anomaly_rate * 100, 2),
                "risk_level": risk_level,
                "anomaly_dates": [a["date"] for a in anomaly_details[:10]],
                "anomaly_scores": [a["anomaly_score"] for a in anomaly_details[:10]],
                "anomaly_details": anomaly_details[:10],
                # Return top 10 most recent anomalies
            }

        except Exception as e:
            logger.error(f"Anomaly detection failed for {symbol}: {e}")
            raise    