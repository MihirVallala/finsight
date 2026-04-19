import { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend
} from "recharts";
import { motion } from "framer-motion";
import { Play, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { runBacktest } from "../services/api";
import toast from "react-hot-toast";

const STRATEGIES = [
  { id: "sma_crossover", label: "SMA Crossover", description: "Golden/death cross" },
  { id: "buy_and_hold",  label: "Buy & Hold",    description: "Passive benchmark" },
  { id: "rsi",           label: "RSI Strategy",  description: "Overbought/oversold" },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--bg-elevated)",
      border: "1px solid var(--border-default)",
      borderRadius: "10px",
      padding: "10px 14px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
    }}>
      <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px", fontFamily: "var(--font-mono)" }}>
        {label}
      </p>
      {payload.map((p, i) => (
        <div key={i} className="flex justify-between gap-4">
          <span style={{ fontSize: "11px", color: p.color, fontFamily: "var(--font-mono)" }}>{p.name}</span>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
            ${p.value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function BacktestChart({ defaultSymbol = "" }) {
  const [symbol, setSymbol]       = useState(defaultSymbol);
  const [strategy, setStrategy]   = useState("sma_crossover");
  const [startDate, setStartDate] = useState("2022-01-01");
  const [endDate, setEndDate]     = useState(new Date().toISOString().split("T")[0]);
  const [capital, setCapital]     = useState("10000");
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);

  const handleRun = async () => {
    if (!symbol.trim()) { toast.error("Enter a symbol"); return; }
    setLoading(true);
    try {
      const data = await runBacktest({
        symbol: symbol.toUpperCase(),
        strategy,
        initial_investment: parseFloat(capital) || 10000,
        start_date: startDate,
        end_date: endDate,
      });
      setResult(data);
      toast.success("Backtest complete!");
    } catch {
      toast.error("Backtest failed");
    } finally {
      setLoading(false);
    }
  };

  const isWin = result && result.total_return >= 0;
  const beatsBenchmark = result && result.total_return_percent > result.benchmark_return;

  const chartData = result?.dates?.map((date, i) => ({
    date: date.slice(0, 7), // YYYY-MM
    value: result.portfolio_values[i],
  })) || [];

  return (
    <div className="card" style={{ padding: "24px" }}>
      <div className="mb-5">
        <p className="section-label mb-1">Backtesting Engine</p>
        <p className="font-display font-bold text-base" style={{ color: "var(--text-primary)" }}>
          Historical Strategy Simulation
        </p>
      </div>

      {/* Config */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="section-label block mb-1.5">Symbol</label>
          <input className="input-field" placeholder="AAPL" value={symbol}
                 onChange={e => setSymbol(e.target.value.toUpperCase())} />
        </div>
        <div>
          <label className="section-label block mb-1.5">Initial Capital ($)</label>
          <input className="input-field" type="number" value={capital}
                 onChange={e => setCapital(e.target.value)} />
        </div>
        <div>
          <label className="section-label block mb-1.5">Start Date</label>
          <input className="input-field" type="date" value={startDate}
                 onChange={e => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="section-label block mb-1.5">End Date</label>
          <input className="input-field" type="date" value={endDate}
                 onChange={e => setEndDate(e.target.value)} />
        </div>
      </div>

      {/* Strategy picker */}
      <div className="mb-4">
        <label className="section-label block mb-2">Strategy</label>
        <div className="grid grid-cols-3 gap-2">
          {STRATEGIES.map(s => (
            <button key={s.id} onClick={() => setStrategy(s.id)}
                    className="p-3 rounded-xl text-left transition-all"
                    style={{
                      background: strategy === s.id ? "var(--blue-dim)" : "var(--bg-elevated)",
                      border: strategy === s.id ? "1px solid rgba(79,172,254,0.3)" : "1px solid var(--border-subtle)",
                    }}>
              <p style={{ fontSize: "12px", fontWeight: 600, color: strategy === s.id ? "var(--blue)" : "var(--text-secondary)" }}>
                {s.label}
              </p>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                {s.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      <button onClick={handleRun} disabled={loading} className="btn btn-primary w-full mb-5"
              style={{ width: "100%", padding: "11px" }}>
        {loading ? <div className="spinner" /> : <Play size={14} />}
        {loading ? "Running simulation..." : "Run Backtest"}
      </button>

      {/* Results */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            {[
              { label: "Final Value",   value: `$${result.final_value?.toLocaleString()}`,           color: "var(--text-primary)" },
              { label: "Total Return",  value: `${isWin ? "+" : ""}${result.total_return_percent?.toFixed(2)}%`,
                color: isWin ? "var(--green)" : "var(--red)" },
              { label: "vs S&P 500",    value: `${beatsBenchmark ? "+" : ""}${(result.total_return_percent - result.benchmark_return)?.toFixed(2)}%`,
                color: beatsBenchmark ? "var(--green)" : "var(--red)" },
              { label: "Sharpe Ratio",  value: result.sharpe_ratio?.toFixed(3),
                color: result.sharpe_ratio >= 1 ? "var(--green)" : result.sharpe_ratio >= 0 ? "var(--amber)" : "var(--red)" },
              { label: "Max Drawdown",  value: `${result.max_drawdown?.toFixed(2)}%`,                color: "var(--red)" },
              { label: "Trades",        value: result.num_trades,                                    color: "var(--text-primary)" },
              { label: "Benchmark",     value: `${result.benchmark_return?.toFixed(2)}% (S&P)`,      color: "var(--text-muted)" },
              { label: "Strategy",      value: result.strategy?.replace("_", " ").toUpperCase(),     color: "var(--blue)" },
            ].map((s, i) => (
              <div key={i} className="p-3 rounded-xl text-center"
                   style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                <p className="font-mono font-bold text-sm" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="btGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#34d399" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="btRed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#f87171" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#f87171" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" stroke="transparent"
                     tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "var(--font-mono)" }}
                     tickLine={false} axisLine={false} />
              <YAxis stroke="transparent"
                     tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "var(--font-mono)" }}
                     tickLine={false} axisLine={false}
                     tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(1)+"k" : v}`}
                     width={52} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={result.initial_investment} stroke="rgba(255,255,255,0.12)"
                             strokeDasharray="4 3" label={{ value: "Initial", fill: "var(--text-muted)", fontSize: 10 }} />
              <Area type="monotone" dataKey="value" name="Portfolio"
                    stroke={isWin ? "var(--green)" : "var(--red)"}
                    strokeWidth={2}
                    fill={isWin ? "url(#btGreen)" : "url(#btRed)"}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
}  