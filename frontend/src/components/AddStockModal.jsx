import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Search } from "lucide-react";
import { addStock, getStockInfo } from "../services/api";
import toast from "react-hot-toast";

export default function AddStockModal({ onClose, onAdded }) {
  const [form, setForm] = useState({
    symbol: "",
    shares: "",
    buy_price: "",
    buy_date: new Date().toISOString().split("T")[0],
  });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const handleLookup = async () => {
    if (!form.symbol.trim()) return;
    setPreviewing(true);
    try {
      const data = await getStockInfo(form.symbol.toUpperCase());
      setPreview(data);
      if (!form.buy_price) {
        setForm(f => ({ ...f, buy_price: String(data.current_price) }));
      }
    } catch {
      toast.error("Symbol not found");
    } finally {
      setPreviewing(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.symbol || !form.shares || !form.buy_price) {
      toast.error("Please fill all fields");
      return;
    }
    setLoading(true);
    try {
      await addStock({
        symbol: form.symbol.toUpperCase(),
        shares: parseFloat(form.shares),
        buy_price: parseFloat(form.buy_price),
        buy_date: form.buy_date,
      });
      toast.success(`${form.symbol.toUpperCase()} added to portfolio!`);
      onAdded?.();
      onClose();
    } catch {
      toast.error("Failed to add stock");
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { label: "Shares", key: "shares", placeholder: "e.g. 10", type: "number" },
    { label: "Buy Price ($)", key: "buy_price", placeholder: "e.g. 150.00", type: "number" },
    { label: "Buy Date", key: "buy_date", type: "date" },
  ];

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ type: "spring", stiffness: 400, damping: 32 }}
        className="modal-box"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="section-label mb-0.5">Portfolio</p>
            <h2 className="font-display font-bold text-lg" style={{ color: "var(--text-primary)" }}>
              Add Stock
            </h2>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon">
            <X size={16} />
          </button>
        </div>

        {/* Symbol search row */}
        <div className="flex gap-2 mb-4">
          <input
            className="input-field"
            placeholder="Stock symbol (e.g. AAPL)"
            value={form.symbol}
            onChange={e => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
            onKeyDown={e => e.key === "Enter" && handleLookup()}
            style={{ textTransform: "uppercase" }}
          />
          <button onClick={handleLookup} disabled={previewing} className="btn btn-secondary"
                  style={{ flexShrink: 0, paddingLeft: 12, paddingRight: 12 }}>
            {previewing ? <div className="spinner" /> : <Search size={14} />}
          </button>
        </div>

        {/* Stock preview */}
        <AnimatePresence>
          {preview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="p-3 rounded-xl flex justify-between items-center"
                   style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
                <div>
                  <p className="font-display font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                    {preview.symbol}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{preview.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold" style={{ color: "var(--text-primary)" }}>
                    ${preview.current_price}
                  </p>
                  <p className="font-mono text-xs"
                     style={{ color: preview.change_percent >= 0 ? "var(--green)" : "var(--red)" }}>
                    {preview.change_percent >= 0 ? "+" : ""}{preview.change_percent?.toFixed(2)}%
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Other fields */}
        <div className="space-y-3">
          {fields.map(field => (
            <div key={field.key}>
              <label className="section-label block mb-1.5">{field.label}</label>
              <input
                type={field.type || "text"}
                placeholder={field.placeholder}
                value={form[field.key]}
                onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                className="input-field"
              />
            </div>
          ))}
        </div>

        {/* Total preview */}
        {form.shares && form.buy_price && (
          <div className="mt-4 p-3 rounded-xl flex justify-between items-center"
               style={{ background: "var(--blue-dim)", border: "1px solid rgba(79,172,254,0.2)" }}>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Total investment</span>
            <span className="font-mono font-bold text-sm" style={{ color: "var(--blue)" }}>
              ${(parseFloat(form.shares) * parseFloat(form.buy_price)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn btn-primary w-full mt-5"
          style={{ width: "100%", padding: "11px" }}
        >
          {loading ? <div className="spinner" /> : <Plus size={15} />}
          {loading ? "Adding..." : "Add to Portfolio"}
        </button>
      </motion.div>
    </div>
  );
}  