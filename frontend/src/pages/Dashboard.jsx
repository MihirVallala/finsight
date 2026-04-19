import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { RefreshCw, Plus, Search, DollarSign, TrendingUp, Activity, BarChart2, X } from "lucide-react";
import StockCard from "../components/StockCard";
import PortfolioChart from "../components/PortfolioChart";
import StatCard from "../components/StatCard";
import AddStockModal from "../components/AddStockModal";
import { getPortfolio, getMultipleStocks, getStockInfo } from "../services/api";
import toast from "react-hot-toast";

const DEFAULT_STOCKS = ["AAPL", "MSFT", "GOOGL", "NVDA", "JPM", "TSLA"];

const container = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { ease: [0.22, 1, 0.36, 1] } },
};

export default function Dashboard({ onNavigate }) {
  const [portfolio, setPortfolio]     = useState(null);
  const [marketStocks, setMarketStocks] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [period, setPeriod]           = useState("1M");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [refreshing, setRefreshing]   = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [portfolioData, stocksData] = await Promise.all([
        getPortfolio(),
        getMultipleStocks(DEFAULT_STOCKS),
      ]);
      setPortfolio(portfolioData);
      setMarketStocks(stocksData);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const data = await getStockInfo(searchQuery.toUpperCase());
      setSearchResult(data);
    } catch {
      toast.error("Stock not found");
    }
  };

  const isProfit = (portfolio?.total_profit_loss || 0) >= 0;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="p-6 space-y-5 max-w-[1400px] mx-auto"
    >
      {/* Header */}
      <motion.div variants={item} className="flex justify-between items-start">
        <div>
          <p className="section-label mb-1">Overview</p>
          <h1 className="font-display font-bold text-2xl" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            Dashboard
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="flex gap-1 p-1 rounded-xl"
               style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Search symbol..."
              className="input-field"
              style={{ width: "140px", background: "transparent", border: "none", padding: "5px 10px", fontSize: "13px" }}
            />
            <button onClick={handleSearch} className="btn btn-ghost btn-icon">
              <Search size={14} />
            </button>
          </div>

          <button onClick={handleRefresh} className="btn btn-secondary btn-icon"
                  style={{ position: "relative" }}>
            <motion.div animate={{ rotate: refreshing ? 360 : 0 }}
                        transition={{ duration: 0.8, repeat: refreshing ? Infinity : 0, ease: "linear" }}>
              <RefreshCw size={14} />
            </motion.div>
          </button>

          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus size={14} />
            Add Stock
          </button>
        </div>
      </motion.div>

      {/* Search result */}
      <AnimatePresence>
        {searchResult && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="card overflow-hidden"
            style={{ padding: "16px 20px" }}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-display font-bold" style={{ color: "var(--text-primary)" }}>
                    {searchResult.symbol}
                  </p>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{searchResult.name}</p>
                </div>
                {searchResult.sector && (
                  <span className="badge badge-muted">{searchResult.sector}</span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-mono font-bold text-xl" style={{ color: "var(--text-primary)" }}>
                    ${searchResult.current_price?.toLocaleString()}
                  </p>
                  <p className="font-mono text-sm"
                     style={{ color: searchResult.change_percent >= 0 ? "var(--green)" : "var(--red)" }}>
                    {searchResult.change_percent >= 0 ? "+" : ""}{searchResult.change_percent?.toFixed(2)}%
                  </p>
                </div>
                <button onClick={() => setSearchResult(null)} className="btn btn-ghost btn-icon">
                  <X size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Portfolio chart */}
      <motion.div variants={item}>
        <PortfolioChart data={portfolio} period={period} onPeriodChange={setPeriod} />
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={item} className="grid grid-cols-4 gap-4">
        <StatCard label="Total Invested"  value={portfolio?.total_invested || 0}
          prefix="$" color="var(--blue)" accentColor="var(--blue)" delay={0}
          icon={DollarSign} subtext="Cost basis" />
        <StatCard label="Current Value"   value={portfolio?.current_value || 0}
          prefix="$" color="var(--purple)" accentColor="var(--purple)" delay={0.08}
          icon={Activity} subtext="Market value" />
        <StatCard label="Total P&L"
          value={Math.abs(portfolio?.total_profit_loss || 0)}
          prefix={isProfit ? "+$" : "-$"}
          color={isProfit ? "var(--green)" : "var(--red)"}
          accentColor={isProfit ? "var(--green)" : "var(--red)"}
          delay={0.16} isPositive={isProfit} icon={TrendingUp}
          subtext="Unrealized gain/loss" />
        <StatCard label="Return"
          value={Math.abs(portfolio?.total_profit_loss_percent || 0)}
          prefix={isProfit ? "+" : "-"} suffix="%"
          color={isProfit ? "var(--green)" : "var(--red)"}
          accentColor={isProfit ? "var(--green)" : "var(--red)"}
          delay={0.24} isPositive={isProfit} icon={BarChart2}
          subtext="All-time return" />
      </motion.div>

      {/* Market overview */}
      <motion.div variants={item}>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="font-display font-semibold" style={{ color: "var(--text-primary)", fontSize: "15px" }}>
            Market Overview
          </h2>
          <div className="pulse-dot" />
          <span style={{ fontSize: "11px", color: "var(--green)", fontFamily: "var(--font-mono)" }}>LIVE</span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {loading
            ? [...Array(6)].map((_, i) => (
                <div key={i} className="shimmer rounded-2xl" style={{ height: "108px" }} />
              ))
            : marketStocks.map((stock, i) => (
                <motion.div
                  key={stock.symbol}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                >
                  <StockCard stock={stock} onClick={s => onNavigate("analysis", s)} />
                </motion.div>
              ))
          }
        </div>
      </motion.div>

      {showModal && (
        <AnimatePresence>
          <AddStockModal onClose={() => setShowModal(false)} onAdded={loadData} />
        </AnimatePresence>
      )}
    </motion.div>
  );
}  