import numpy as np
import pandas as pd
import yfinance as yf
from datetime import datetime, timedelta
from sklearn.preprocessing import MinMaxScaler
from loguru import logger

# Suppress TensorFlow warnings
import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

from keras.models import Sequential
from keras.layers import LSTM, Dense, Dropout
from keras.callbacks import EarlyStopping


class LSTMPricePredictor:
    """
    LSTM Neural Network for stock price forecasting.

    Why LSTM for stock prices?
    Regular neural networks treat each input independently.
    LSTM has "memory" — it remembers patterns from previous
    time steps. Stock prices depend heavily on recent history
    so LSTM is the natural choice.

    Architecture:
    Input (60 days of prices)
        ↓
    LSTM Layer 1 (100 units) + Dropout
        ↓
    LSTM Layer 2 (50 units) + Dropout
        ↓
    Dense Layer (25 units)
        ↓
    Output (next price)
    """

    def __init__(self, sequence_length: int = 60):
        self.sequence_length = sequence_length
        # Use last 60 days to predict next day
        # 60 days = ~3 months of trading data
        # Enough to capture short and medium term patterns

        self.scaler = MinMaxScaler(feature_range=(0, 1))
        # Scale prices to 0-1 range
        # Neural networks train much better on normalized data
        # Raw prices like $3000 would cause gradient issues

        self.model = None
        self.is_trained = False

    def _prepare_data(self, prices: np.array):
        """
        Convert price series into supervised learning format.

        Transforms:
        [100, 101, 102, 103, 104, ...]
        Into:
        X = [[100,101,...,159], [101,102,...,160], ...]  (sequences of 60)
        y = [160, 161, ...]  (next price after each sequence)
        """
        scaled = self.scaler.fit_transform(prices.reshape(-1, 1))

        X, y = [], []
        for i in range(self.sequence_length, len(scaled)):
            X.append(scaled[i - self.sequence_length:i, 0])
            # Last 60 prices as input
            y.append(scaled[i, 0])
            # Next price as target

        X = np.array(X)
        y = np.array(y)

        # Reshape for LSTM: (samples, timesteps, features)
        X = X.reshape(X.shape[0], X.shape[1], 1)

        return X, y, scaled

    def _build_model(self) -> Sequential:
        """Build the LSTM architecture"""
        model = Sequential([
            LSTM(
                100,
                return_sequences=True,
                input_shape=(self.sequence_length, 1)
            ),
            # 100 LSTM units, return sequences so next LSTM layer
            # receives full sequence not just last output

            Dropout(0.2),
            # Randomly drop 20% of neurons during training
            # Prevents overfitting — model can't memorize training data

            LSTM(50, return_sequences=False),
            # Second LSTM layer — 50 units
            # return_sequences=False means only output last timestep

            Dropout(0.2),

            Dense(25),
            # Regular neural network layer for final processing

            Dense(1)
            # Single output — the predicted price
        ])

        model.compile(
            optimizer="adam",
            # Adam optimizer — adapts learning rate automatically
            # Best general purpose optimizer for most problems

            loss="mean_squared_error"
            # MSE penalizes large errors heavily
            # Perfect for price prediction
        )

        return model

    def train(self, symbol: str, period: str = "2y") -> dict:
        """
        Train LSTM on historical price data.
        Uses last 2 years of data by default.
        """
        logger.info(f"Training LSTM for {symbol}")

        # Fetch data
        ticker = yf.Ticker(symbol.upper())
        hist = ticker.history(period=period)

        if len(hist) < self.sequence_length + 50:
            raise ValueError(f"Not enough data to train for {symbol}")

        prices = hist["Close"].values

        # Prepare sequences
        X, y, scaled = self._prepare_data(prices)

        # Train/test split — 80% train, 20% test
        split = int(len(X) * 0.8)
        X_train, X_test = X[:split], X[split:]
        y_train, y_test = y[:split], y[split:]

        # Build and train model
        self.model = self._build_model()

        early_stop = EarlyStopping(
            monitor="val_loss",
            patience=10,
            restore_best_weights=True
            # Stop training if validation loss doesn't improve
            # for 10 epochs — prevents overfitting
        )

        history = self.model.fit(
            X_train, y_train,
            epochs=50,
            batch_size=32,
            validation_data=(X_test, y_test),
            callbacks=[early_stop],
            verbose=0
            # verbose=0 = silent training
        )

        # Calculate accuracy on test set
        predictions = self.model.predict(X_test, verbose=0)
        predictions = self.scaler.inverse_transform(predictions)
        actual = self.scaler.inverse_transform(y_test.reshape(-1, 1))

        # MAPE = Mean Absolute Percentage Error
        mape = np.mean(np.abs((actual - predictions) / actual)) * 100
        accuracy = round(100 - mape, 2)

        self.is_trained = True
        self.last_scaled = scaled
        self.last_prices = prices

        logger.info(f"LSTM trained for {symbol} | Accuracy: {accuracy}%")

        return {
            "symbol": symbol,
            "accuracy": accuracy,
            "epochs_trained": len(history.history["loss"]),
            "training_loss": round(float(history.history["loss"][-1]), 6)
        }

    def predict(self, symbol: str, days_ahead: int = 30) -> dict:
        """
        Predict next N days of prices with confidence intervals.
        """
        if not self.is_trained:
            self.train(symbol)

        logger.info(f"Predicting {days_ahead} days for {symbol}")

        # Use last 60 prices as starting sequence
        last_sequence = self.last_scaled[-self.sequence_length:]
        predictions = []

        current_seq = last_sequence.copy()

        for _ in range(days_ahead):
            # Reshape for model input
            input_seq = current_seq.reshape(1, self.sequence_length, 1)

            # Predict next price
            next_pred = self.model.predict(input_seq, verbose=0)
            predictions.append(next_pred[0, 0])

            # Slide window — add prediction, remove oldest
            current_seq = np.append(current_seq[1:], next_pred)

        # Inverse transform back to real prices
        predictions = np.array(predictions).reshape(-1, 1)
        predictions = self.scaler.inverse_transform(predictions).flatten()

        # Generate confidence intervals (±5% for demonstration)
        # In production this would use Monte Carlo simulation
        confidence_upper = predictions * 1.05
        confidence_lower = predictions * 0.95

        # Generate future dates (skip weekends)
        future_dates = []
        current_date = datetime.now()
        while len(future_dates) < days_ahead:
            current_date += timedelta(days=1)
            if current_date.weekday() < 5:
                # 0-4 = Monday to Friday
                future_dates.append(current_date.strftime("%Y-%m-%d"))

        # Calculate model accuracy
        accuracy = self._calculate_accuracy(symbol)

        return {
            "symbol": symbol.upper(),
            "predicted_dates": future_dates,
            "predicted_prices": [round(float(p), 2) for p in predictions],
            "confidence_upper": [round(float(p), 2) for p in confidence_upper],
            "confidence_lower": [round(float(p), 2) for p in confidence_lower],
            "model_accuracy": accuracy,
        }

    def _calculate_accuracy(self, symbol: str) -> float:
        """Quick accuracy estimate on recent data"""
        try:
            ticker = yf.Ticker(symbol.upper())
            hist = ticker.history(period="3mo")
            prices = hist["Close"].values

            if len(prices) < self.sequence_length + 10:
                return 0.0

            X, y, _ = self._prepare_data(prices)
            predictions = self.model.predict(X[-20:], verbose=0)
            predictions = self.scaler.inverse_transform(predictions)
            actual = self.scaler.inverse_transform(y[-20:].reshape(-1, 1))

            mape = np.mean(np.abs((actual - predictions) / actual)) * 100
            return round(100 - mape, 2)
        except Exception:
            return 0.0  