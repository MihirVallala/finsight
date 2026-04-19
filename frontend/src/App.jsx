import { useState } from "react";
import { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./components/Sidebar";
import Ticker from "./components/Ticker";
import Dashboard from "./pages/Dashboard";
import Portfolio from "./pages/Portfolio";
import Analysis from "./pages/Analysis";
import Predictions from "./pages/Predictions";

const pageVariants = {
  initial: { opacity: 0, y: 12, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0,  filter: "blur(0px)" },
  exit:    { opacity: 0, y: -8, filter: "blur(4px)" },
};

const pageTransition = {
  type: "spring",
  stiffness: 380,
  damping: 32,
};

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [analysisSymbol, setAnalysisSymbol] = useState("");

  const handleNavigate = (page, symbol = "") => {
    setActivePage(page);
    if (symbol) setAnalysisSymbol(symbol);
  };

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":   return <Dashboard onNavigate={handleNavigate} />;
      case "portfolio":   return <Portfolio onNavigate={handleNavigate} />;
      case "analysis":    return <Analysis initialSymbol={analysisSymbol} />;
      case "predictions": return <Predictions />;
      default:            return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden grid-bg"
         style={{ background: "var(--bg-void)" }}>

      <Toaster
        position="top-right"
        gutter={8}
        toastOptions={{
          duration: 3500,
          style: {
            background: "var(--bg-elevated)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-default)",
            borderRadius: "12px",
            backdropFilter: "blur(20px)",
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            padding: "10px 14px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          },
          success: {
            iconTheme: { primary: "var(--green)", secondary: "transparent" },
          },
          error: {
            iconTheme: { primary: "var(--red)", secondary: "transparent" },
          },
        }}
      />

      {/* Sidebar */}
      <Sidebar activePage={activePage} onNavigate={handleNavigate} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Live Ticker */}
        <Ticker />

        {/* Page */}
        <main className="flex-1 overflow-y-auto relative">
          {/* Ambient glows */}
          <div className="fixed top-0 right-0 w-[600px] h-[600px] pointer-events-none"
            style={{
              background: "radial-gradient(circle at 70% 20%, rgba(79,172,254,0.05) 0%, transparent 65%)"
            }}
          />
          <div className="fixed bottom-0 left-72 w-[500px] h-[500px] pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(167,139,250,0.04) 0%, transparent 65%)"
            }}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="min-h-full"
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}  