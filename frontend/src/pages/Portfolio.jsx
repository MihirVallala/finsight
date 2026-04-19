import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Trash2, RefreshCw, FileText, TrendingUp, TrendingDown } from "lucide-react";
import AddStockModal from "../components/AddStockModal";
import AuditLog from "../components/AuditLog";
import { getPortfolio, removeStock, getAuditLog } from "../services/api";
import toast from "react-hot-toast";

export default function Portfolio({ onNavigate }) {
  const [portfolio, setPortfolio] = useState(null);
  const [auditLog, setAuditLog]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [removing, setRemoving]   = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [portfolioData, auditData] = await Promise.all([
        getPortfolio(),
        getAuditLog(),
      ]);
      setPortfolio(portfolioData);
      setAuditLog(auditData);
    } catch {
      toast.error("Failed to load portfolio");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (stockId, symbol) => {
    setRemoving(stockId);
    try {
      await removeStock(stockId);
      toast.success(`${symbol} removed`);
      loadData();
    } catch {
      toast.error("Failed to remove stock");
    } finally {
      setRemoving(null);
    }
  };

  const isProfit = (portfolio?.total_profit_loss || 0) >= 0;

  const summaryStats = portfolio ? [
    { label: "Invested",      value: `$${portfolio.total_invested?.toLocaleString()}`,      color: "var(--blue)" },
    { label: "Current Value", value: `$${portfolio.current_value?.toLocaleString()}`,       color: "var(--purple)" },
    { label: "P&L",           value: `${isProfit ? "+" : ""}$${portfolio.total_profit_loss?.toFixed(2)}`,
      color: isProfit ? "var(--green)" : "var(--red)" },
    { label: "Return",        value: `${isProfit ? "+" : ""}${portfolio.total_profit_loss_percent?.toFixed(2)}%`,
      color: isProfit ? "var(--green)" : "var(--red)" },
  ] : [];

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <p className="section-label mb-1">Investments</p>
          <h1 className="font-display font-bold text-2xl"
              style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            Portfolio
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
            {portfolio?.stocks?.length || 0} holdings · last updated just now
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAudit(!showAudit)}
            className="btn btn-secondary"
            style={{ color: showAudit ? "var(--blue)" : undefined }}
          >
            <FileText size={14} />
            Audit Log
          </button>
          <button onClick={loadData} className="btn btn-secondary btn-icon">
            <RefreshCw size={14} />
          </button>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus size={14} />
            Add Stock
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {portfolio && (
        <div className="grid grid-cols-4 gap-4">
          {summaryStats.map((s, i) => (
            <div key={i} className="card-stat text-center" style={{ padding: "16px" }}>
              <p className="section-label mb-2">{s.label}</p>
              <p className="font-display font-bold text-xl" style={{ color: s.color, fontFamily: "var(--font-mono)" }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Holdings table */}
      <div className="card" style={{ padding: "0", overflow: "hidden" }}>
        <div className="flex justify-between items-center p-5"
             style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <p className="font-display font-semibold" style={{ color: "var(--text-primary)", fontSize: "14px" }}>
            Holdings
          </p>
          {portfolio?.stocks?.length > 0 && (
            <span className="badge badge-muted">{portfolio.stocks.length} stocks</span>
          )}
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="shimmer h-12 rounded-xl" />
            ))}
          </div>
        ) : portfolio?.stocks?.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                 style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
              <TrendingUp size={20} style={{ color: "var(--text-dim)" }} />
            </div>
            <div className="text-center">
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                No stocks in portfolio yet
              </p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Add your first stock to start tracking
              </p>
            </div>
            <button onClick={() => setShowModal(true)} className="btn btn-primary">
              <Plus size={14} />
              Add Stock
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  {["Symbol", "Name", "Shares", "Avg Cost", "Current", "Invested", "Value", "P&L", "Return", ""].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {portfolio?.stocks?.map((stock, i) => {
                  const isPos = stock.profit_loss >= 0;
                  return (
                    <motion.tr
                      key={stock.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <td>
                        <button
                          onClick={() => onNavigate?.("analysis", stock.symbol)}
                          className="font-display font-bold text-sm hover:underline"
                          style={{ color: "var(--blue)", background: "none", border: "none", cursor: "pointer" }}
                        >
                          {stock.symbol}
                        </button>
                      </td>
                      <td style={{ color: "var(--text-muted)", maxWidth: "120px" }}>
                        <span className="block truncate text-xs">{stock.name}</span>
                      </td>
                      <td style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)", fontSize: "13px" }}>
                        {stock.shares}
                      </td>
                      <td style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)", fontSize: "13px" }}>
                        ${stock.buy_price}
                      </td>
                      <td style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 500 }}>
                        ${stock.current_price}
                      </td>
                      <td style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)", fontSize: "13px" }}>
                        ${stock.total_invested?.toLocaleString()}
                      </td>
                      <td style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 500 }}>
                        ${stock.current_value?.toLocaleString()}
                      </td>
                      <td>
                        <span className="font-mono font-semibold text-sm"
                              style={{ color: isPos ? "var(--green)" : "var(--red)" }}>
                          {isPos ? "+" : ""}${stock.profit_loss?.toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <span className="badge" style={{
                          background: isPos ? "var(--green-dim)" : "var(--red-dim)",
                          color: isPos ? "var(--green)" : "var(--red)",
                          border: `1px solid ${isPos ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)"}`,
                          display: "inline-flex", alignItems: "center", gap: "4px"
                        }}>
                          {isPos ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                          {isPos ? "+" : ""}{stock.profit_loss_percent?.toFixed(2)}%
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleRemove(stock.id, stock.symbol)}
                          disabled={removing === stock.id}
                          className="btn btn-ghost btn-icon"
                          style={{ color: "var(--text-dim)" }}
                          onMouseEnter={e => e.currentTarget.style.color = "var(--red)"}
                          onMouseLeave={e => e.currentTarget.style.color = "var(--text-dim)"}
                        >
                          {removing === stock.id
                            ? <div className="spinner" style={{ width: "12px", height: "12px" }} />
                            : <Trash2 size={13} />}
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit log */}
      <AnimatePresence>
        {showAudit && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <AuditLog logs={auditLog} loading={loading} />
          </motion.div>
        )}
      </AnimatePresence>

      {showModal && (
        <AnimatePresence>
          <AddStockModal onClose={() => setShowModal(false)} onAdded={loadData} />
        </AnimatePresence>
      )}
    </div>
  );
}  