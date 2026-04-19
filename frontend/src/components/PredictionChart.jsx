import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--bg-elevated)",
      border: "1px solid var(--border-default)",
      borderRadius: "10px",
      padding: "10px 14px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      minWidth: "160px"
    }}>
      <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px", fontFamily: "var(--font-mono)" }}>
        {label}
      </p>
      {payload.map((p, i) => (
        <div key={i} className="flex justify-between gap-4 items-center">
          <span style={{ fontSize: "11px", color: p.color, fontFamily: "var(--font-mono)" }}>
            {p.name}
          </span>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
            ${p.value?.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function PredictionChart({ data, loading }) {
  if (loading) {
    return (
      <div className="card" style={{ padding: "24px" }}>
        <div className="shimmer h-4 rounded w-1/3 mb-4" />
        <div className="shimmer h-56 rounded-xl" />
      </div>
    );
  }

  if (!data) return null;

  const chartData = data.predicted_dates?.map((date, i) => ({
    date: date.slice(5),
    predicted: data.predicted_prices?.[i],
    upper:     data.confidence_upper?.[i],
    lower:     data.confidence_lower?.[i],
  })) || [];

  const startPrice = chartData[0]?.predicted || 0;
  const endPrice   = chartData[chartData.length - 1]?.predicted || 0;
  const isUp = endPrice >= startPrice;

  return (
    <div className="card" style={{ padding: "24px" }}>
      <div className="flex justify-between items-start mb-5">
        <div>
          <p className="section-label mb-1">LSTM Price Prediction</p>
          <p className="font-display font-bold text-lg" style={{ color: "var(--text-primary)" }}>
            {data.symbol} — 30 Day Forecast
          </p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: "4px" }}>
            Model accuracy: <span style={{ color: "var(--blue)" }}>{data.model_accuracy}%</span>
          </p>
        </div>
        <div className="flex gap-2">
          <span className="badge badge-purple">LSTM</span>
          <span className={`badge ${isUp ? "badge-green" : "badge-red"}`}>
            {isUp ? "▲ Bullish" : "▼ Bearish"}
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="predLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#4facfe" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="date"
            stroke="transparent"
            tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "var(--font-mono)" }}
            tickLine={false} axisLine={false}
          />
          <YAxis
            stroke="transparent"
            tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "var(--font-mono)" }}
            tickLine={false} axisLine={false}
            tickFormatter={v => `$${v}`}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone" dataKey="predicted" name="Predicted"
            stroke="url(#predLine)" strokeWidth={2.5}
            dot={false} activeDot={{ r: 4, strokeWidth: 0 }}
          />
          <Line
            type="monotone" dataKey="upper" name="Upper"
            stroke="var(--blue)" strokeWidth={1} strokeDasharray="5 4"
            dot={false} opacity={0.5}
          />
          <Line
            type="monotone" dataKey="lower" name="Lower"
            stroke="var(--purple)" strokeWidth={1} strokeDasharray="5 4"
            dot={false} opacity={0.5}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}  