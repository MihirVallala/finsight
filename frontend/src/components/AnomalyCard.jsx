import { motion } from "framer-motion";
import { AlertTriangle, Shield, Activity } from "lucide-react";

const RISK_CONFIG = {
  LOW:    { color: "var(--green)", bg: "var(--green-dim)", border: "rgba(52,211,153,0.2)",  icon: Shield },
  MEDIUM: { color: "var(--amber)", bg: "var(--amber-dim)", border: "rgba(251,191,36,0.2)",  icon: Activity },
  HIGH:   { color: "var(--red)",   bg: "var(--red-dim)",   border: "rgba(248,113,113,0.2)", icon: AlertTriangle },
};

const getRiskConfig = (level = "") => {
  const key = Object.keys(RISK_CONFIG).find(k => level.toUpperCase().includes(k));
  return RISK_CONFIG[key] || RISK_CONFIG.MEDIUM;
};

export default function AnomalyCard({ data, loading }) {
  if (loading) {
    return (
      <div className="card col-span-2">
        <div className="shimmer h-4 rounded w-1/3 mb-5" />
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[...Array(3)].map((_, i) => <div key={i} className="shimmer h-20 rounded-xl" />)}
        </div>
        {[...Array(4)].map((_, i) => <div key={i} className="shimmer h-10 rounded-lg mb-2" />)}
      </div>
    );
  }

  if (!data) return null;

  const config = getRiskConfig(data.risk_level);
  const RiskIcon = config.icon;

  return (
    <div className="card col-span-2">
      {/* Header */}
      <div className="flex justify-between items-start mb-5">
        <div>
          <p className="section-label mb-1">Anomaly Detection</p>
          <p className="font-display font-bold text-base" style={{ color: "var(--text-primary)" }}>
            {data.symbol} — Isolation Forest Analysis
          </p>
        </div>
        <span className="badge" style={{
          background: config.bg, color: config.color, border: `1px solid ${config.border}`
        }}>
          <RiskIcon size={10} />
          {data.risk_level}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Anomalies Found", value: data.anomalies_detected, color: config.color },
          { label: "Days Analyzed",   value: data.total_days_analyzed, color: "var(--text-primary)" },
          { label: "Anomaly Rate",    value: `${data.anomaly_rate}%`, color: data.anomaly_rate > 8 ? "var(--red)" : "var(--text-primary)" },
        ].map((s, i) => (
          <div key={i} className="text-center p-4 rounded-xl"
               style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
            <p className="font-display font-bold text-2xl" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Anomaly rate bar */}
      <div className="mb-5">
        <div className="flex justify-between mb-2">
          <span className="section-label">Anomaly Rate</span>
          <span className="font-mono text-xs" style={{ color: config.color }}>{data.anomaly_rate}%</span>
        </div>
        <div className="progress-bar">
          <motion.div
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(data.anomaly_rate, 100)}%` }}
            transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
            style={{ background: `linear-gradient(90deg, ${config.color}, ${config.color}88)` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="section-label" style={{ color: "var(--green)" }}>Normal (&lt;5%)</span>
          <span className="section-label" style={{ color: "var(--amber)" }}>Elevated (5-8%)</span>
          <span className="section-label" style={{ color: "var(--red)" }}>High (&gt;8%)</span>
        </div>
      </div>

      {/* Anomaly list */}
      {data.anomaly_details?.length > 0 && (
        <div>
          <p className="section-label mb-3">Recent Anomalies</p>
          <div className="space-y-2 scroll-area" style={{ maxHeight: "220px" }}>
            {data.anomaly_details.map((a, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex justify-between items-center p-3 rounded-xl"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 rounded-full flex-shrink-0"
                       style={{ background: a.severity === "HIGH" ? "var(--red)" : "var(--amber)" }} />
                  <div>
                    <p className="font-mono text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {a.date}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                      ${a.price} · Return: <span style={{ color: a.return_percent < 0 ? "var(--red)" : "var(--green)" }}>
                        {a.return_percent > 0 ? "+" : ""}{a.return_percent}%
                      </span>
                    </p>
                  </div>
                </div>
                <span className={`badge ${a.severity === "HIGH" ? "badge-red" : "badge-amber"}`}>
                  {a.severity}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}  