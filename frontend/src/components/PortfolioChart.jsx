import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts"; 
import { getStockHistory } from "../services/api";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
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
        <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
          ${payload[0].value?.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

const PERIOD_MAP = {
  "1D": "1d", "7D": "5d", "1M": "1mo",
  "3M": "3mo", "1Y": "1y"
};

export default function PortfolioChart({ data, period, onPeriodChange }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const periods = ["1D", "7D", "1M", "3M", "1Y"];

  // Fetch real historical chart data based on portfolio holdings
  useEffect(() => {
    if (!data?.stocks?.length) return;
    const symbol = data.stocks[0]?.symbol || "SPY";
    setLoading(true);
    getStockHistory(symbol, PERIOD_MAP[period] || "1mo")
      .then(hist => {
        const mapped = hist.dates.map((date, i) => ({
          date: date.slice(5), // MM-DD
          value: hist.closes[i],
        }));
        setChartData(mapped);
      })
      .catch(() => setChartData([]))
      .finally(() => setLoading(false));
  }, [period, data?.stocks?.length]);

  const isProfit = (data?.total_profit_loss || 0) >= 0;
  const lineColor = isProfit ? "var(--green)" : "var(--red)";
  const gradientId = isProfit ? "chartGreen" : "chartRed";

  return (
    <div className="card" style={{ padding: "24px" }}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="section-label mb-1">Portfolio Value</p>
          <p className="font-display font-bold text-3xl"
             style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            ${data?.current_value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
          </p>
          <p className="mt-1 text-sm font-mono" style={{ color: isProfit ? "var(--green)" : "var(--red)" }}>
            {isProfit ? "+" : ""}${data?.total_profit_loss?.toFixed(2) || "0.00"}
            <span className="ml-2 opacity-70">
              ({isProfit ? "+" : ""}{data?.total_profit_loss_percent?.toFixed(2) || "0.00"}%)
            </span>
          </p>
        </div>

        {/* Period selector */}
        <div className="flex gap-1 p-1 rounded-xl"
             style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
          {periods.map(p => (
            <button
              key={p}
              onClick={() => onPeriodChange?.(p)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                fontFamily: "var(--font-mono)",
                background: period === p ? "var(--bg-overlay)" : "transparent",
                color: period === p ? "var(--text-primary)" : "var(--text-muted)",
                border: period === p ? "1px solid var(--border-default)" : "1px solid transparent",
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="h-48 shimmer rounded-xl" />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="chartGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#34d399" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="chartRed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#f87171" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#f87171" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="date"
              stroke="transparent"
              tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "var(--font-mono)" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="transparent"
              tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "var(--font-mono)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(1)+"k" : v}`}
              width={48}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={lineColor}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 4, fill: lineColor, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}  