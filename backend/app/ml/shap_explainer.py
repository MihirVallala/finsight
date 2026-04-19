import numpy as np
import pandas as pd
import yfinance as yf
import shap
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from loguru import logger


class SHAPExplainer:
    """
    Explains ML predictions using SHAP values.

    Why SHAP in finance?
    Financial regulators require banks to explain
    every algorithmic decision. A model that says
    "sell this stock" must explain WHY.

    SHAP (SHapley Additive exPlanations) assigns each
    feature a contribution score to the prediction.

    Example output:
    "Predicted price DROP because:
     - RSI overbought: -$2.34 impact
     - Volume below average: -$1.12 impact
     - Negative news sentiment: -$0.89 impact
     - Moving average crossover: +$0.45 impact (partially offsetting)"
    """

    def __init__(self):
        self.model = GradientBoostingRegressor(
            n_estimators=100,
            random_state=42
        )
        self.scaler = StandardScaler()
        self.feature_names = [
            "RSI",
            "MACD",
            "Volume_Ratio",
            "Price_MA_Ratio",
            "Volatility_5d",
            "Return_1d",
            "Return_5d",
            "Return_20d",
            "BB_Position",
            "OBV_Change"
        ]

    def _calculate_features(self, hist: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate technical indicators as features.
        These are the signals traders use to make decisions.
        """
        df = hist.copy()

        # RSI (Relative Strength Index)
        # Measures if stock is overbought (>70) or oversold (<30)
        delta = df["Close"].diff()
        gain = delta.clip(lower=0)
        loss = -delta.clip(upper=0)
        avg_gain = gain.rolling(14).mean()
        avg_loss = loss.rolling(14).mean()
        rs = avg_gain / avg_loss
        df["RSI"] = 100 - (100 / (1 + rs))

        # MACD (Moving Average Convergence Divergence)
        # Shows momentum and trend direction
        ema12 = df["Close"].ewm(span=12).mean()
        ema26 = df["Close"].ewm(span=26).mean()
        df["MACD"] = ema12 - ema26

        # Volume ratio vs 20-day average
        df["Volume_Ratio"] = df["Volume"] / df["Volume"].rolling(20).mean()

        # Price relative to 50-day moving average
        df["Price_MA_Ratio"] = df["Close"] / df["Close"].rolling(50).mean()

        # 5-day volatility
        df["Volatility_5d"] = df["Close"].pct_change().rolling(5).std()

        # Returns over different periods
        df["Return_1d"] = df["Close"].pct_change(1)
        df["Return_5d"] = df["Close"].pct_change(5)
        df["Return_20d"] = df["Close"].pct_change(20)

        # Bollinger Band position
        # Where is price within its normal range?
        ma20 = df["Close"].rolling(20).mean()
        std20 = df["Close"].rolling(20).std()
        df["BB_Position"] = (df["Close"] - ma20) / (2 * std20)

        # On-Balance Volume change
        # Tracks buying and selling pressure
        obv = (np.sign(df["Close"].diff()) * df["Volume"]).fillna(0).cumsum()
        df["OBV_Change"] = obv.pct_change()

        return df[self.feature_names].dropna()

    def explain_prediction(self, symbol: str) -> dict:
        """
        Train model and generate SHAP explanations for price prediction.
        """
        logger.info(f"Generating SHAP explanations for {symbol}")

        try:
            # Fetch 2 years of data
            ticker = yf.Ticker(symbol.upper())
            hist = ticker.history(period="2y")

            if len(hist) < 100:
                raise ValueError(f"Not enough data for {symbol}")

            # Calculate features
            features = self._calculate_features(hist)

            # Target = next day return
            target = hist["Close"].pct_change().shift(-1)
            target = target.loc[features.index].dropna()
            features = features.loc[target.index]

            if len(features) < 50:
                raise ValueError("Not enough clean data")

            # Scale features
            X = self.scaler.fit_transform(features)
            y = target.values

            # Train model
            self.model.fit(X[:-20], y[:-20])
            # Train on all but last 20 days
            # Last 20 days used for explanation

            # Generate SHAP values
            explainer = shap.TreeExplainer(self.model)
            # TreeExplainer is fast and exact for tree-based models

            shap_values = explainer.shap_values(X[-20:])
            # SHAP values for last 20 days

            # Get most recent prediction explanation
            latest_shap = shap_values[-1]
            latest_features = features.iloc[-1]

            # Create explanation dict
            feature_impacts = []
            for fname, sval, fval in zip(
                self.feature_names,
                latest_shap,
                latest_features.values
            ):
                feature_impacts.append({
                    "feature": fname,
                    "value": round(float(fval), 4),
                    "impact": round(float(sval) * 100, 4),
                    # Convert to percentage impact
                    "direction": "POSITIVE 📈" if sval > 0 else "NEGATIVE 📉"
                })

            # Sort by absolute impact
            feature_impacts.sort(
                key=lambda x: abs(x["impact"]),
                reverse=True
            )

            # Overall prediction
            prediction = self.model.predict(X[-1:])[0]
            direction = "UP 📈" if prediction > 0 else "DOWN 📉"

            # Mean absolute SHAP value as confidence
            confidence = round(
                float(np.mean(np.abs(shap_values[-1]))) * 100,
                2
            )

            logger.info(
                f"SHAP explanation generated for {symbol} | "
                f"Direction: {direction}"
            )

            return {
                "symbol": symbol.upper(),
                "predicted_direction": direction,
                "predicted_return": round(float(prediction) * 100, 4),
                "confidence": confidence,
                "top_factors": feature_impacts[:5],
                # Top 5 most impactful features
                "all_factors": feature_impacts,
                "explanation": self._generate_explanation(
                    feature_impacts[:3], direction
                )
            }

        except Exception as e:
            logger.error(f"SHAP explanation failed for {symbol}: {e}")
            raise

    def _generate_explanation(
        self,
        top_factors: list,
        direction: str
    ) -> str:
        """Generate human-readable explanation of prediction"""
        lines = [f"Model predicts price movement: {direction}"]
        lines.append("\nKey driving factors:")

        for factor in top_factors:
            impact_str = (
                f"+{factor['impact']:.2f}%"
                if factor["impact"] > 0
                else f"{factor['impact']:.2f}%"
            )
            lines.append(
                f"• {factor['feature']}: {impact_str} impact "
                f"(current value: {factor['value']:.3f})"
            )

        return "\n".join(lines)   