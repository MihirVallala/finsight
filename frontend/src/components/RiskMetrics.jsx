const RISK_STYLES = {
  LOW:      { bg: "var(--green-dim)",  color: "var(--green)",  border: "rgba(52,211,153,0.25)" },
  MEDIUM:   { bg: "var(--amber-dim)",  color: "var(--amber)",  border: "rgba(251,191,36,0.25)" },
  HIGH:     { bg: "rgba(251,146,60,0.1)", color: "#fb923c",    border: "rgba(251,146,60,0.25)" },
  CRITICAL: { bg: "var(--red-dim)",    color: "var(--red)",    border: "rgba(248,113,113,0.25)" },
};

const getRiskStyle = (rating = "") => {
  const key = Object.keys(RISK_STYLES).find(k => rating.toUpperCase().includes(k));
  return RISK_STYLES[key] || RISK_STYLES.MEDIUM;
};

function MetricRow({ label, value, description, highlight }) {
  return (
    <div className="flex justify-between items-center py-2.5"
         style={{ borderBottom: "1px solid var(--border-subtle)" }}>
      <div>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{label}</p>
        {description && (
          <p style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: "1px" }}>
            {description}
          </p>
        )}
      </div>
      <p className="font-mono font-medium text-sm"
         style={{ color: highlight || "var(--text-primary)" }}>
        {value}
      </p>
    </div>
  );
}

export default function RiskMetrics({ data, loading }) {
  if (loading) {
    return (
      <div className="card">
        <div className="shimmer h-4 rounded w-1/2 mb-5" />
        {[...Array(7)].map((_, i) => (
          <div key={i} className="shimmer h-9 rounded mb-2" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const riskStyle = getRiskStyle(data.risk_rating);
  const sharpeColor = data.sharpe_ratio >= 1 ? "var(--green)" : data.sharpe_ratio >= 0 ? "var(--amber)" : "var(--red)";

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-5">
        <div>
          <p className="section-label mb-1">Risk Analysis</p>
          <p className="font-display font-bold text-base" style={{ color: "var(--text-primary)" }}>
            {data.symbol}
          </p>
        </div>
        <span className="badge" style={{
          background: riskStyle.bg,
          color: riskStyle.color,
          border: `1px solid ${riskStyle.border}`
        }}>
          {data.risk_rating}
        </span>
      </div>

      <MetricRow label="Sharpe Ratio"  value={data.sharpe_ratio}  description="Return per unit of risk"        highlight={sharpeColor} />
      <MetricRow label="Sortino Ratio" value={data.sortino_ratio} description="Downside risk adjusted return" />
      <MetricRow label="Max Drawdown"  value={`${data.max_drawdown}%`} description="Largest peak-to-valley loss"
        highlight={Math.abs(data.max_drawdown) > 20 ? "var(--red)" : undefined}
      />
      <MetricRow label="Volatility"    value={`${data.volatility}%`}  description="Annualized price volatility" />
      <MetricRow label="Beta"          value={data.beta}              description="Market sensitivity (1.0 = market)" />
      <MetricRow label="VaR (95%)"     value={`${data.var_95}%`}      description="Daily value at risk"
        highlight={data.var_95 < -3 ? "var(--red)" : undefined}
      />
      <MetricRow label="VaR (99%)"     value={`${data.var_99}%`}      description="Extreme daily value at risk"
        highlight={data.var_99 < -5 ? "var(--red)" : undefined}
      />
    </div>
  );
}  