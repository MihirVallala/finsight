import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { getMultipleStocks } from "../services/api";

const TICKER_SYMBOLS = [
  "AAPL", "MSFT", "GOOGL", "NVDA", "JPM",
  "TSLA", "AMZN", "META", "V", "MA"
];

export default function Ticker() {
  const [stocks, setStocks] = useState([]);

  useEffect(() => {
    getMultipleStocks(TICKER_SYMBOLS).then(setStocks).catch(() => {});
  }, []);

  if (stocks.length === 0) return (
    <div className="h-10 flex items-center px-4"
         style={{ background: "var(--bg-deep)", borderBottom: "1px solid var(--border-subtle)" }}>
      <div className="pulse-dot mr-2" />
      <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
        Loading market data...
      </span>
    </div>
  );

  const doubled = [...stocks, ...stocks];

  return (
    <div className="h-10 overflow-hidden flex items-center"
         style={{ background: "var(--bg-deep)", borderBottom: "1px solid var(--border-subtle)" }}>

      {/* Live badge */}
      <div className="flex items-center gap-2 px-4 flex-shrink-0 h-full"
           style={{ borderRight: "1px solid var(--border-subtle)" }}>
        <div className="pulse-dot" />
        <span style={{
          fontSize: "10px",
          fontFamily: "var(--font-mono)",
          fontWeight: 500,
          color: "var(--green)",
          letterSpacing: "0.08em"
        }}>LIVE</span>
      </div>

      {/* Scrolling ticker */}
      <div className="overflow-hidden flex-1 relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
             style={{ background: "linear-gradient(90deg, var(--bg-deep), transparent)" }} />
        <div className="absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
             style={{ background: "linear-gradient(-90deg, var(--bg-deep), transparent)" }} />

        <div className="ticker-track">
          {doubled.map((stock, i) => {
            const isPos = stock.change_percent >= 0;
            return (
              <div key={i}
                   className="flex items-center gap-2.5 px-5 flex-shrink-0"
                   style={{ borderRight: "1px solid var(--border-subtle)" }}>
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "var(--text-primary)"
                }}>
                  {stock.symbol}
                </span>
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: "var(--text-secondary)"
                }}>
                  ${stock.current_price?.toLocaleString()}
                </span>
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: isPos ? "var(--green)" : "var(--red)",
                  display: "flex",
                  alignItems: "center",
                  gap: "3px"
                }}>
                  {isPos ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {isPos ? "+" : ""}{stock.change_percent?.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}  