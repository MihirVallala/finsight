import { useState } from "react";
import { Brain, Zap, Loader, AlertTriangle } from "lucide-react";
import PredictionChart from "../components/PredictionChart";
import { predictPrice, explainPrediction } from "../services/api";
import toast from "react-hot-toast";

const QUICK_SYMBOLS = ["AAPL", "MSFT", "TSLA", "NVDA", "GOOGL"];

export default function Predictions() {
  const [symbol, setSymbol]           = useState("");
  const [prediction, setPrediction]   = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [loadingPredict, setLoadingPredict] = useState(false);
  const [loadingExplain, setLoadingExplain] = useState(false);

  const handlePredict = async (sym) => {
    const s = (sym || symbol).trim().toUpperCase();
    if (!s) return;
    setSymbol(s);
    setLoadingPredict(true);
    setPrediction(null);
    try {
      // predictPrice already handles train+predict on backend
      const data = await predictPrice(s, 30);
      setPrediction(data);
      toast.success("LSTM prediction complete!");
    } catch {
      toast.error("Prediction failed — try again");
    } finally {
      setLoadingPredict(false);
    }
  };

  const handleExplain = async () => {
    const s = symbol.trim().toUpperCase();
    if (!s) { toast.error("Enter a symbol first"); return; }
    setLoadingExplain(true);
    setExplanation(null);
    try {
      const data = await explainPrediction(s);
      setExplanation(data);
      toast.success("SHAP explanation ready!");
    } catch {
      toast.error("Explanation failed");
    } finally {
      setLoadingExplain(false);
    }
  };

  const isUp = explanation?.predicted_direction?.includes("UP");

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div>
        <p className="section-label mb-1">Machine Learning</p>
        <h1 className="font-display font-bold text-2xl"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
          AI Predictions
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
          LSTM neural network forecasting + SHAP explainability
        </p>
      </div>

      {/* Input row */}
      <div className="flex gap-2">
        <div className="flex-1 flex gap-2 p-1.5 rounded-xl"
             style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
          <input
            value={symbol}
            onChange={e => setSymbol(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && handlePredict()}
            placeholder="Enter symbol — AAPL, TSLA, NVDA..."
            className="input-field"
            style={{ background: "transparent", border: "none", fontSize: "14px", padding: "6px 10px" }}
          />
          <button
            onClick={() => handlePredict()}
            disabled={loadingPredict}
            className="btn btn-primary"
            style={{ flexShrink: 0, background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}
          >
            {loadingPredict ? <Loader size={14} className="animate-spin" /> : <Brain size={14} />}
            {loadingPredict ? "Training LSTM..." : "Predict"}
          </button>
          <button
            onClick={handleExplain}
            disabled={loadingExplain}
            className="btn btn-secondary"
            style={{ flexShrink: 0 }}
          >
            {loadingExplain ? <Loader size={14} className="animate-spin" /> : <Zap size={14} />}
            {loadingExplain ? "Explaining..." : "Explain (SHAP)"}
          </button>
        </div>
      </div>

      {/* Quick picks */}
      <div className="flex items-center gap-2">
        <span className="section-label">Quick:</span>
        <div className="flex gap-1.5">
          {QUICK_SYMBOLS.map(s => (
            <button key={s} onClick={() => handlePredict(s)}
                    className="badge badge-muted"
                    style={{ cursor: "pointer" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--purple-dim)"; e.currentTarget.style.color = "var(--purple)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = ""; e.currentTarget.style.color = ""; }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 p-4 rounded-xl"
           style={{ background: "var(--amber-dim)", border: "1px solid rgba(251,191,36,0.2)" }}>
        <AlertTriangle size={15} style={{ color: "var(--amber)", flexShrink: 0, marginTop: "1px" }} />
        <p style={{ fontSize: "12px", color: "var(--amber)", lineHeight: 1.5 }}>
          LSTM training takes 30–60 seconds · SHAP explanation takes 20–30 seconds ·
          Model trains on 2 years of historical price data
        </p>
      </div>

      {/* Prediction chart */}
      {(prediction || loadingPredict) && (
        <PredictionChart data={prediction} loading={loadingPredict} />
      )}

      {/* SHAP explanation */}
      {explanation && (
        <div className="card" style={{ padding: "24px" }}>
          <div className="flex justify-between items-start mb-5">
            <div>
              <p className="section-label mb-1">SHAP Explainability</p>
              <p className="font-display font-bold text-base" style={{ color: "var(--text-primary)" }}>
                {explanation.symbol} — Feature Importance
              </p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: "3px" }}>
                Predicted return: <span style={{ color: isUp ? "var(--green)" : "var(--red)", fontWeight: 600 }}>
                  {explanation.predicted_return > 0 ? "+" : ""}{explanation.predicted_return}%
                </span>
              </p>
            </div>
            <span className={`badge ${isUp ? "badge-green" : "badge-red"}`} style={{ fontSize: "13px" }}>
              {explanation.predicted_direction}
            </span>
          </div>

          {/* Factor bars */}
          <div className="space-y-3 mb-5">
            {explanation.top_factors?.map((factor, i) => {
              const isPos = factor.impact > 0;
              const width = Math.min(Math.abs(factor.impact) * 10, 100);
              return (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                      {factor.feature}
                    </span>
                    <span style={{
                      fontSize: "12px", fontWeight: 600,
                      color: isPos ? "var(--green)" : "var(--red)",
                      fontFamily: "var(--font-mono)"
                    }}>
                      {isPos ? "+" : ""}{factor.impact?.toFixed(3)}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill"
                         style={{
                           width: `${width}%`,
                           background: isPos
                             ? "linear-gradient(90deg, var(--green), #6ee7b7)"
                             : "linear-gradient(90deg, var(--red), #fca5a5)",
                           marginLeft: isPos ? "0" : "auto",
                         }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Human explanation */}
          <div className="p-4 rounded-xl"
               style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
            <p className="section-label mb-2">Model Reasoning</p>
            <p style={{
              fontSize: "12px", color: "var(--text-secondary)",
              lineHeight: 1.7, whiteSpace: "pre-line", fontFamily: "var(--font-mono)"
            }}>
              {explanation.explanation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}   