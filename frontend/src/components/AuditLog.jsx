import { motion } from "framer-motion";
import { Shield, Plus, Trash2, RefreshCw, Clock } from "lucide-react";

const ACTION_CONFIG = {
  ADD_STOCK:    { icon: Plus,      color: "var(--green)",  bg: "var(--green-dim)",  label: "Added" },
  REMOVE_STOCK: { icon: Trash2,    color: "var(--red)",    bg: "var(--red-dim)",    label: "Removed" },
  UPDATE:       { icon: RefreshCw, color: "var(--blue)",   bg: "var(--blue-dim)",   label: "Updated" },
};

const getActionConfig = (action = "") => {
  const key = Object.keys(ACTION_CONFIG).find(k => action.toUpperCase().includes(k));
  return ACTION_CONFIG[key] || {
    icon: Shield, color: "var(--text-muted)", bg: "rgba(255,255,255,0.04)", label: action
  };
};

const formatTime = (ts) => {
  try {
    const date = new Date(ts);
    const now = new Date();
    const diff = now - date;
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins < 1)   return "just now";
    if (mins < 60)  return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7)   return `${days}d ago`;
    return date.toLocaleDateString();
  } catch {
    return ts;
  }
};

export default function AuditLog({ logs = [], loading }) {
  if (loading) {
    return (
      <div className="card">
        <div className="shimmer h-4 rounded w-1/3 mb-5" />
        {[...Array(5)].map((_, i) => <div key={i} className="shimmer h-12 rounded-xl mb-2" />)}
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-5">
        <div>
          <p className="section-label mb-1">Compliance</p>
          <p className="font-display font-bold text-base" style={{ color: "var(--text-primary)" }}>
            Audit Log
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Shield size={12} style={{ color: "var(--text-muted)" }} />
          <span className="section-label">Tamper-proof trail</span>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center py-10 gap-3">
          <Clock size={28} style={{ color: "var(--text-dim)" }} />
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>No actions logged yet</p>
        </div>
      ) : (
        <div className="space-y-2 scroll-area" style={{ maxHeight: "280px" }}>
          {[...logs].reverse().map((log, i) => {
            const config = getActionConfig(log.action);
            const Icon = config.icon;
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-start gap-3 p-3 rounded-xl group transition-all"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                     style={{ background: config.bg }}>
                  <Icon size={12} style={{ color: config.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-medium" style={{ color: config.color }}>
                      {log.action}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-secondary)" }}>
                    {log.details}
                  </p>
                </div>
                <span className="font-mono text-xs flex-shrink-0 mt-0.5"
                      style={{ color: "var(--text-dim)" }}>
                  {formatTime(log.timestamp)}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}  