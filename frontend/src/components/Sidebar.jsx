import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Briefcase, BarChart3,
  Brain, ChevronLeft, ChevronRight, TrendingUp
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard",    id: "dashboard",   color: "var(--blue)" },
  { icon: Briefcase,       label: "Portfolio",    id: "portfolio",   color: "var(--purple)" },
  { icon: BarChart3,       label: "Analysis",     id: "analysis",    color: "var(--cyan)" },
  { icon: Brain,           label: "AI Predict",   id: "predictions", color: "var(--green)" },
];

export default function Sidebar({ activePage, onNavigate }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.div
      animate={{ width: collapsed ? 60 : 216 }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className="h-screen flex flex-col flex-shrink-0 relative"
      style={{
        background: "var(--bg-deep)",
        borderRight: "1px solid var(--border-subtle)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center min-h-[56px] px-3"
           style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
             style={{
               background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
               boxShadow: "0 4px 16px rgba(99,102,241,0.35)"
             }}>
          <TrendingUp size={14} className="text-white" />
        </div>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -6, width: 0 }}
              animate={{ opacity: 1, x: 0, width: "auto" }}
              exit={{ opacity: 0, x: -6, width: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden ml-3"
            >
              <span className="font-display font-bold text-base whitespace-nowrap"
                    style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                Fin<span style={{ color: "var(--blue)" }}>Sight</span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 mt-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <motion.button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              whileTap={{ scale: 0.97 }}
              title={collapsed ? item.label : undefined}
              className="w-full flex items-center gap-3 rounded-xl text-sm relative group"
              style={{
                padding: collapsed ? "9px 0" : "9px 10px",
                justifyContent: collapsed ? "center" : "flex-start",
                color: isActive ? item.color : "var(--text-muted)",
                transition: "color 200ms ease",
              }}
            >
              {/* Active pill */}
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: `${item.color}14`,
                    border: `1px solid ${item.color}28`,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}

              {/* Hover bg */}
              {!isActive && (
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                     style={{ background: "var(--bg-elevated)" }} />
              )}

              <Icon size={16} className="relative z-10 flex-shrink-0" />

              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.14 }}
                    className="relative z-10 whitespace-nowrap font-medium"
                    style={{ fontSize: "13px" }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Active indicator dot */}
              {isActive && (
                <motion.div
                  layoutId="activeDot"
                  className="absolute right-2.5 w-1.5 h-1.5 rounded-full relative z-10"
                  style={{ background: item.color, display: collapsed ? "none" : "block" }}
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Collapse button */}
      <div className="p-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 p-2 rounded-xl transition-all"
          style={{ color: "var(--text-dim)" }}
          onMouseEnter={e => {
            e.currentTarget.style.color = "var(--text-secondary)";
            e.currentTarget.style.background = "var(--bg-elevated)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = "var(--text-dim)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          {collapsed
            ? <ChevronRight size={14} />
            : <><ChevronLeft size={14} /><span style={{ fontSize: "11px" }}>Collapse</span></>
          }
        </button>
      </div>
    </motion.div>
  );
}  