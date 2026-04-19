import { useEffect, useState } from "react";
import { Search, Loader } from "lucide-react";
import RiskMetrics from "../components/RiskMetrics";
import SentimentCard from "../components/SentimentCard";
import AnomalyCard from "../components/AnomalyCard";
import BacktestChart from "../components/BacktestChart";
import { getRiskMetrics, getSentiment, getAnomalies } from "../services/api";
import toast from "react-hot-toast";

const QUICK_PICKS = ["AAPL", "MSFT", "NVDA", "TSLA", "JPM", "GOOGL"];

export default function Analysis({ initialSymbol }) {
  const [input, setInput]         = useState(initialSymbol || "");
  const [symbol, setSymbol]       = useState("");
  const [risk, setRisk]           = useState(null);
  const [sentiment, setSentiment] = useState(null);
  const [anomalies, setAnomalies] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Auto-run if initialSymbol provided
  useEffect(() => {
    if (initialSymbol) analyze(initialSymbol);
  }, [initialSymbol]);

  const analyze = async (sym) => {
    const s = (sym || input).trim().toUpperCase();
    if (!s) return;
    setInput(s);
    setSymbol(s);
    setLoading(true);
    setRisk(null); setSentiment(null); setAnomalies(null);

    try {
      const [riskData, sentimentData, anomalyData] = await Promise.all([
        getRiskMetrics(s),
        getSentiment(s),
        getAnomalies(s),
      ]);
      setRisk(riskData);
      setSentiment(sentimentData);
      setAnomalies(anomalyData);
      toast.success(`Analysis complete for ${s}`);
    } catch {
      toast.error("Analysis failed. Check the symbol.");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "overview",   label: "Overview" },
    { id: "anomalies",  label: "Anomalies" },
    { id: "backtest",   label: "Backtest" },
  ];

  const hasResults = risk || sentiment || anomalies;

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div>
        <p className="section-label mb-1">ML Analysis</p>
        <h1 className="font-display font-bold text-2xl"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
          Stock Analysis
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
          Risk metrics · Sentiment analysis · Anomaly detection
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="flex-1 flex gap-2 p-1.5 rounded-xl"
             style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && analyze()}
            placeholder="Enter symbol — AAPL, MSFT, JPM..."
            className="input-field"
            style={{ background: "transparent", border: "none", fontSize: "14px", padding: "6px 10px" }}
          />
          <button
            onClick={() => analyze()}
            disabled={loading}
            className="btn btn-primary"
            style={{ flexShrink: 0 }}
          >
            {loading
              ? <Loader size={14} className="animate-spin" />
              : <Search size={14} />}
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>
      </div>

      {/* Quick picks */}
      <div className="flex items-center gap-2">
        <span className="section-label">Quick:</span>
        <div className="flex gap-1.5">
          {QUICK_PICKS.map(s => (
            <button key={s} onClick={() => analyze(s)} className="badge badge-muted cursor-pointer transition-all"
                    style={{ cursor: "pointer" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--blue-dim)"; e.currentTarget.style.color = "var(--blue)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = ""; e.currentTarget.style.color = ""; }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs (only when results exist) */}
      {hasResults && (
        <div className="flex gap-1 p-1 rounded-xl w-fit"
             style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                    style={{
                      fontFamily: "var(--font-body)",
                      background: activeTab === tab.id ? "var(--bg-overlay)" : "transparent",
                      color: activeTab === tab.id ? "var(--text-primary)" : "var(--text-muted)",
                      border: activeTab === tab.id ? "1px solid var(--border-default)" : "1px solid transparent",
                    }}>
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-2 gap-5">
          <RiskMetrics data={risk} loading={loading} />
          <SentimentCard data={sentiment} loading={loading} />
        </div>
      )}

      {activeTab === "anomalies" && (
        <div className="grid grid-cols-2 gap-5">
          <AnomalyCard data={anomalies} loading={loading} />
        </div>
      )}

      {activeTab === "backtest" && (
        <BacktestChart defaultSymbol={symbol} />
      )}
    </div>
  );
}  