import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function StockCard({ stock, onClick }) {
  const isPositive = stock.change_percent >= 0;
  const accentColor = isPositive ? "var(--green)" : "var(--red)";

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -3 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick?.(stock.symbol)}
      className="card cursor-pointer"
      style={{ padding: "16px" }}
    >
      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-3xl opacity-20 pointer-events-none"
           style={{ background: `radial-gradient(circle at top right, ${accentColor}, transparent 70%)` }} />

      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-display font-bold text-sm" style={{ color: "var(--text-primary)" }}>
            {stock.symbol}
          </p>
          <p className="text-xs mt-0.5 truncate max-w-[110px]"
             style={{ color: "var(--text-muted)" }}>
            {stock.name}
          </p>
        </div>

        <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
             style={{
               background: isPositive ? "var(--green-dim)" : "var(--red-dim)",
               color: accentColor,
               border: `1px solid ${accentColor}28`,
               fontFamily: "var(--font-mono)",
             }}>
          {isPositive ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
          {isPositive ? "+" : ""}{stock.change_percent?.toFixed(2)}%
        </div>
      </div>

      <p className="font-display font-bold text-xl leading-none"
         style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
        ${stock.current_price?.toLocaleString()}
      </p>

      <p className="text-xs mt-1.5"
         style={{ color: accentColor, fontFamily: "var(--font-mono)" }}>
        {isPositive ? "+" : ""}{stock.change?.toFixed(2)} today
      </p>

      {stock.sector && (
        <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <span className="badge badge-muted text-xs">{stock.sector}</span>
        </div>
      )}
    </motion.div>
  );
}  