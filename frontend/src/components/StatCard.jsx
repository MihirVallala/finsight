import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";

function AnimatedNumber({ value, decimals = 2, duration = 1.6, delay = 0 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = Date.now();
      const end = start + duration * 1000;
      const tick = () => {
        const now = Date.now();
        const progress = Math.min((now - start) / (duration * 1000), 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(value * eased);
        if (progress < 1) requestAnimationFrame(tick);
        else setDisplay(value);
      };
      requestAnimationFrame(tick);
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [value, duration, delay]);

  return <>{display.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}</>;
}

export default function StatCard({
  label,
  value,
  prefix = "",
  suffix = "",
  color = "var(--text-primary)",
  subtext = null,
  isPositive = null,
  delay = 0,
  icon: Icon = null,
  accentColor = null,
}) {
  const numValue = parseFloat(String(value).replace(/[^0-9.-]/g, "")) || 0;
  const accent = accentColor || color;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="card-stat"
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-4 right-4 h-px rounded-full"
           style={{ background: `linear-gradient(90deg, transparent, ${accent}40, transparent)` }} />

      {/* Icon + label row */}
      <div className="flex items-center justify-between mb-3">
        <span className="section-label">{label}</span>
        {Icon && (
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
               style={{ background: `${accent}14`, color: accent }}>
            <Icon size={13} />
          </div>
        )}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1">
        <span className="font-display font-bold text-2xl leading-none" style={{ color }}>
          {prefix}
          <AnimatedNumber
            value={numValue}
            decimals={numValue % 1 !== 0 ? 2 : 0}
            duration={1.6}
            delay={delay}
          />
          {suffix}
        </span>
      </div>

      {/* Subtext */}
      {subtext && (
        <p className="mt-1.5 text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          {subtext}
        </p>
      )}

      {/* Status dot */}
      {isPositive !== null && (
        <div
          className="absolute top-3.5 right-3.5 w-1.5 h-1.5 rounded-full"
          style={{
            background: isPositive ? "var(--green)" : "var(--red)",
            boxShadow: isPositive ? "0 0 6px var(--green)" : "0 0 6px var(--red)"
          }}
        />
      )}
    </motion.div>
  );
}  