import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8000/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
  // 2 minute timeout for ML operations like LSTM training
});

// ── STOCKS ────────────────────────────────────────────────────
export const getStockInfo = (symbol) =>
  api.get(`/stocks/info/${symbol}`).then(r => r.data);

export const getStockHistory = (symbol, period = '1y') =>
  api.get(`/stocks/history/${symbol}?period=${period}`).then(r => r.data);

export const searchStocks = (query) =>
  api.get(`/stocks/search?query=${query}`).then(r => r.data);

export const getMultipleStocks = (symbols) =>
  api.get(`/stocks/multiple?symbols=${symbols.join(',')}`).then(r => r.data);

// ── PORTFOLIO ─────────────────────────────────────────────────
export const getPortfolio = () =>
  api.get('/portfolio/').then(r => r.data);

export const addStock = (data) =>
  api.post('/portfolio/add', data).then(r => r.data);

export const removeStock = (stockId) =>
  api.delete(`/portfolio/remove/${stockId}`).then(r => r.data);

export const getAuditLog = () =>
  api.get('/portfolio/audit-log').then(r => r.data);

// ── ANALYSIS ──────────────────────────────────────────────────
export const getRiskMetrics = (symbol) =>
  api.get(`/analysis/risk/${symbol}`).then(r => r.data);

export const getPortfolioRisk = (symbols) =>
  api.get(`/analysis/portfolio-risk?symbols=${symbols.join(',')}`).then(r => r.data);

export const predictPrice = (symbol, days = 30) =>
  api.get(`/analysis/predict/${symbol}?days=${days}`).then(r => r.data);

export const getSentiment = (symbol) =>
  api.get(`/analysis/sentiment/${symbol}`).then(r => r.data);

export const getAnomalies = (symbol, period = '1y') =>
  api.get(`/analysis/anomalies/${symbol}?period=${period}`).then(r => r.data);

export const explainPrediction = (symbol) =>
  api.get(`/analysis/explain/${symbol}`).then(r => r.data);

export const getNews = (symbol) =>
  api.get(`/analysis/news/${symbol}`).then(r => r.data);

export const runBacktest = (data) =>
  api.post('/analysis/backtest', data).then(r => r.data);  