import { TrendingUp, TrendingDown, Minus, ExternalLink } from "lucide-react";

const getSentimentConfig = (sentiment = "") => {
  if (sentiment.includes("BULLISH")) return {
    icon: TrendingUp, color: "var(--green)", bg: "var(--green-dim)",
    border: "rgba(52,211,153,0.2)", badge: "badge-green"
  };
  if (sentiment.includes("BEARISH")) return {
    icon: TrendingDown, color: "var(--red)", bg: "var(--red-dim)",
    border: "rgba(248,113,113,0.2)", badge: "badge-red"
  };
  return {
    icon: Minus, color: "var(--text-muted)", bg: "rgba(255,255,255,0.04)",
    border: "var(--border-subtle)", badge: "badge-muted"
  };
};

const getArticleBadge = (sentiment) => {
  if (sentiment === "POSITIVE") return { label: "+", color: "var(--green)",  bg: "var(--green-dim)" };
  if (sentiment === "NEGATIVE") return { label: "–", color: "var(--red)",    bg: "var(--red-dim)" };
  return { label: "·", color: "var(--text-muted)", bg: "rgba(255,255,255,0.05)" };
};

export default function SentimentCard({ data, loading }) {
  if (loading) {
    return (
      <div className="card">
        <div className="shimmer h-4 rounded w-1/2 mb-5" />
        <div className="shimmer h-20 rounded-xl mb-4" />
        <div className="shimmer h-10 rounded-xl mb-4" />
        {[...Array(4)].map((_, i) => <div key={i} className="shimmer h-10 rounded-lg mb-2" />)}
      </div>
    );
  }

  if (!data) return null;

  const config = getSentimentConfig(data.overall_sentiment);
  const Icon = config.icon;
  const total = (data.positive_count || 0) + (data.neutral_count || 0) + (data.negative_count || 0);
  const posWidth = total ? (data.positive_count / total) * 100 : 0;
  const negWidth = total ? (data.negative_count / total) * 100 : 0;

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-5">
        <div>
          <p className="section-label mb-1">News Sentiment</p>
          <p className="font-display font-bold text-base" style={{ color: "var(--text-primary)" }}>
            {data.symbol}
          </p>
        </div>
        <span style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          {data.news_count} articles
        </span>
      </div>

      {/* Overall sentiment pill */}
      <div className="flex items-center gap-3 p-4 rounded-xl mb-4"
           style={{ background: config.bg, border: `1px solid ${config.border}` }}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
             style={{ background: `${config.color}20` }}>
          <Icon size={18} style={{ color: config.color }} />
        </div>
        <div>
          <p className="font-display font-bold text-sm" style={{ color: config.color }}>
            {data.overall_sentiment}
          </p>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: "1px" }}>
            Confidence: {(data.sentiment_score * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Distribution bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1.5"
             style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          <span style={{ color: "var(--green)" }}>↑ {data.positive_count} bullish</span>
          <span>{data.neutral_count} neutral</span>
          <span style={{ color: "var(--red)" }}>{data.negative_count} bearish ↓</span>
        </div>
        <div className="progress-bar" style={{ height: "6px" }}>
          <div style={{
            display: "flex", height: "100%", borderRadius: "6px", overflow: "hidden"
          }}>
            <div style={{ width: `${posWidth}%`, background: "var(--green)", transition: "width 600ms ease" }} />
            <div style={{ width: `${100 - posWidth - negWidth}%`, background: "var(--bg-overlay)" }} />
            <div style={{ width: `${negWidth}%`, background: "var(--red)", transition: "width 600ms ease" }} />
          </div>
        </div>
      </div>

      {/* Headlines */}
      <div className="space-y-1 scroll-area" style={{ maxHeight: "200px" }}>
        {data.headlines?.slice(0, 6).map((h, i) => {
          const badge = getArticleBadge(h.sentiment);
          return (
            <a key={i} href={h.link} target="_blank" rel="noopener noreferrer"
               className="flex items-start gap-2.5 p-2.5 rounded-lg group transition-all"
               style={{ textDecoration: "none" }}
               onMouseEnter={e => e.currentTarget.style.background = "var(--bg-elevated)"}
               onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span className="flex-shrink-0 mt-0.5 w-5 h-5 rounded flex items-center justify-center text-xs font-bold"
                    style={{ background: badge.bg, color: badge.color, fontFamily: "var(--font-mono)" }}>
                {badge.label}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs leading-snug line-clamp-2"
                   style={{ color: "var(--text-secondary)" }}>
                  {h.title}
                </p>
                <p className="text-xs mt-0.5"
                   style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  {h.publisher}
                </p>
              </div>
              <ExternalLink size={10} className="flex-shrink-0 mt-1 opacity-0 group-hover:opacity-40 transition-opacity"
                            style={{ color: "var(--text-muted)" }} />
            </a>
          );
        })}
      </div>
    </div>
  );
}  