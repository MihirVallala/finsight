
# FinSight 📈

> AI-Powered Stock Portfolio Analyzer — built with FastAPI, React, LSTM, FinBERT & SHAP

![Python](https://img.shields.io/badge/Python-3.11+-blue?style=flat-square&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green?style=flat-square&logo=fastapi)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![TensorFlow](https://img.shields.io/badge/TensorFlow-2.x-orange?style=flat-square&logo=tensorflow)

---

## Features

- 📊 **Real-time stock data** via yFinance (no API key needed)
- 🧠 **LSTM price forecasting** — 30-day predictions trained on 2 years of data
- 📰 **News sentiment analysis** — FinBERT model fine-tuned on financial text
- 🔍 **Anomaly detection** — Isolation Forest flags unusual price movements
- 💡 **SHAP explainability** — understand exactly why the model predicts what it does
- ⚡ **Risk metrics** — Sharpe, Sortino, VaR (95/99%), Beta, Max Drawdown
- 🔄 **Backtesting engine** — SMA Crossover, RSI, Buy & Hold strategies
- 📋 **Compliance audit log** — tamper-proof trail of all portfolio actions

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, Framer Motion, Recharts |
| Backend | FastAPI, Python 3.11+ |
| ML | TensorFlow/Keras (LSTM), HuggingFace Transformers (FinBERT), scikit-learn, SHAP |
| Data | yFinance, Yahoo Finance News |
| Storage | JSON flat-file (portfolio), Loguru (logs) |

---

## Project Structure

```
FinSight/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── app/
│       ├── api/v1/routes/     # stocks, portfolio, analysis, health
│       ├── core/              # config, logging
│       ├── ml/                # LSTM, FinBERT, IsolationForest, SHAP
│       ├── models/            # Pydantic schemas
│       └── services/          # StockService, PortfolioService, RiskService
└── frontend/
    ├── src/
    │   ├── components/        # Reusable UI components
    │   ├── pages/             # Dashboard, Portfolio, Analysis, Predictions
    │   └── services/          # API client (axios)
    ├── package.json
    └── tailwind.config.js
```

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/finsight.git
cd finsight
```

### 2. Backend setup
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Open the app
- Frontend: http://localhost:5173
- API docs: http://localhost:8000/docs

---

## Environment Variables

Create a `.env` file inside `backend/` (already in `.gitignore`):

```env
APP_NAME=FinSight
APP_VERSION=1.0.0
DEBUG=True
LOG_LEVEL=INFO
DATABASE_URL=sqlite:///./finsight.db
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/stocks/info/{symbol}` | Live stock price & info |
| GET | `/api/v1/stocks/history/{symbol}` | Historical OHLCV data |
| GET | `/api/v1/portfolio/` | Portfolio summary with P&L |
| POST | `/api/v1/portfolio/add` | Add stock to portfolio |
| DELETE | `/api/v1/portfolio/remove/{id}` | Remove stock |
| GET | `/api/v1/analysis/risk/{symbol}` | Risk metrics |
| GET | `/api/v1/analysis/predict/{symbol}` | LSTM price forecast |
| GET | `/api/v1/analysis/sentiment/{symbol}` | FinBERT news sentiment |
| GET | `/api/v1/analysis/anomalies/{symbol}` | Anomaly detection |
| GET | `/api/v1/analysis/explain/{symbol}` | SHAP explainability |
| POST | `/api/v1/analysis/backtest` | Strategy backtesting |

---

## Notes

- LSTM training takes **30–60 seconds** — the model trains fresh on each request
- First run will download FinBERT model (~500MB) from HuggingFace
- `portfolio.json` is excluded from git — it's local to your machine

---

## License

MIT
