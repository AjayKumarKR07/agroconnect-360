import { useEffect, useState, useCallback, useRef } from "react";
import { API_URL } from "../../config/api";
import { DS } from "../../styles/ds";
import { 
  RefreshCw, 
  Package, 
  Clock, 
  CheckCircle2, 
  Truck, 
  XCircle, 
  Ban, 
  AlertTriangle, 
  Wheat, 
  IndianRupee, 
  Calendar, 
  MapPin, 
  ChevronDown, 
  ChevronUp,
  Loader2
} from "lucide-react";

const STATUS_FILTERS = ["all", "pending", "accepted", "processing", "shipped", "delivered", "rejected", "cancelled"];

const STATUS_BADGE = {
  pending:    { bg: "rgba(251,191,36,0.1)",  color: "#b45309", label: "Pending",   icon: Clock },
  accepted:   { bg: "rgba(56,189,248,0.1)",  color: "#0369a1", label: "Accepted",  icon: CheckCircle2 },
  processing: { bg: "rgba(167,139,250,0.1)", color: "#7c3aed", label: "Packed",    icon: Package },
  shipped:    { bg: "rgba(251,146,60,0.1)",  color: "#fb923c", label: "Shipped",   icon: Truck },
  delivered:  { bg: "rgba(34,197,94,0.1)",   color: "#15803d", label: "Delivered", icon: CheckCircle2 },
  rejected:   { bg: "rgba(239,68,68,0.1)",   color: "#dc2626", label: "Rejected",  icon: XCircle },
  cancelled:  { bg: "rgba(239,68,68,0.1)",   color: "#dc2626", label: "Cancelled", icon: Ban },
};

const PIPELINE = ["pending", "accepted", "processing", "shipped", "delivered"];

// Auto-refresh interval for when the page is open (farmer may have acted)
const AUTO_REFRESH_MS = 30_000;

const fmtAddr = (addr) => {
  if (!addr) return "";
  if (typeof addr === "string") return addr;
  return [addr.address, addr.city, addr.state, addr.pincode].filter(Boolean).join(", ");
};

const relTime = (iso) => {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export default function SellerOrders() {
  const [orders,      setOrders]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [error,       setError]       = useState(null);
  const [filter,      setFilter]      = useState("all");
  const [expanded,    setExpanded]    = useState(null);
  const [cancelling,  setCancelling]  = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const timerRef                      = useRef(null);

  const fetchOrders = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    setError(null);
    try {
      const r = await fetch(`${API_URL}/api/seller/orders`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("agroconnect_token")}` },
      });
      const d = await r.json();
      if (d.success) {
        setOrders(d.orders || []);
        setLastFetched(new Date().toISOString());
      } else {
        setError(d.message || "Failed to load orders");
      }
    } catch {
      setError("Network error — could not reach server");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load + interval auto-refresh
  useEffect(() => {
    fetchOrders();
    timerRef.current = setInterval(() => fetchOrders(), AUTO_REFRESH_MS);
    return () => clearInterval(timerRef.current);
  }, [fetchOrders]);

  const handleCancel = async (orderId, e) => {
    e.stopPropagation();
    if (!window.confirm("Cancel this order? This action cannot be undone.")) return;
    setCancelling(orderId);
    try {
      const r = await fetch(`${API_URL}/api/seller/orders/${orderId}/cancel`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${localStorage.getItem("agroconnect_token")}` },
      });
      const d = await r.json();
      if (d.success) {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: "cancelled" } : o));
      } else {
        alert(d.message || "Could not cancel order");
      }
    } catch {
      alert("Network error — try again");
    } finally {
      setCancelling(null);
    }
  };

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);

  const pipelineStep = (s) => PIPELINE.indexOf(s);

  return (
    <>
      <style>{DS + `
        .sf-tabs    { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:22px; }
        .sf-tab     { padding:7px 16px; border-radius:10px; font-size:12px; font-weight:700; cursor:pointer; border:1px solid var(--border); background:var(--surface); color:var(--text2); transition:all 0.2s; font-family:'Inter',sans-serif; }
        .sf-tab.active { background:rgba(167,139,250,0.1); color:#7c3aed; border-color:rgba(167,139,250,0.2); }
        .order-card { background:var(--surface); border:1px solid var(--border); border-radius:16px; margin-bottom:12px; transition:border-color 0.2s; overflow:hidden; }
        .order-card:hover { border-color:rgba(167,139,250,0.25); }
        .pipeline   { display:flex; align-items:center; margin:16px 0; gap:0; }
        .pl-step    { display:flex; flex-direction:column; align-items:center; gap:4px; }
        .pl-dot     { width:22px; height:22px; border-radius:50%; border:2px solid var(--border); background:var(--surface); display:flex; align-items:center; justify-content:center; font-size:10px; color:var(--text2); }
        .pl-dot.done{ background:#7c3aed; border-color:#7c3aed; color:#0f172a; }
        .pl-dot.cur { border-color:#a78bfa; color:#a78bfa; }
        .pl-line    { flex:1; height:2px; background:var(--border); margin-top:-14px; }
        .pl-line.done{ background:#7c3aed; }
        .pl-label   { font-size:9px; color:var(--text2); }
        .pl-label.active { color:#7c3aed; font-weight:700; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>

      {/* Header */}
      <div className="pg-head">
        <div>
          <div className="eyebrow">Procurement</div>
          <h1 className="pg-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Package size={24} color="#7c3aed" /> My Orders
          </h1>
          <p className="pg-sub" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            Track bulk orders you placed with farmers.
            {lastFetched && (
              <span style={{ fontSize: 11, color: "var(--text2)", background: "var(--surface)", padding: "2px 8px", borderRadius: 20, border: "1px solid var(--border)" }}>
                Updated {relTime(lastFetched)}
              </span>
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            onClick={() => fetchOrders(true)}
            disabled={refreshing || loading}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "9px 16px", borderRadius: 11, border: "1px solid rgba(167,139,250,0.2)",
              background: "#faf5ff", color: refreshing ? "var(--text2)" : "#a78bfa",
              fontWeight: 700, fontSize: 13, cursor: refreshing ? "not-allowed" : "pointer",
              fontFamily: "'Inter',sans-serif", transition: "all 0.2s",
            }}
          >
            <RefreshCw size={14} className={refreshing ? "spin" : ""} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: "#7c3aed" }}>
            {loading ? "—" : orders.length} total
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="sf-tabs">
        {STATUS_FILTERS.map(f => {
          const count = f === "all" ? orders.length : orders.filter(o => o.status === f).length;
          return (
            <button key={f} className={`sf-tab ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)} ({count})
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {loading && <div className="loading-wrap"><div className="spinner" /><span>Loading orders…</span></div>}

      {/* Error */}
      {error && !loading && (
        <div className="card" style={{ marginBottom: 24, border: "1px solid rgba(239,68,68,0.2)", background: "#fef2f2" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <AlertTriangle size={20} color="#dc2626" />
              <span style={{ color: "#dc2626", fontWeight: 600, fontSize: 14 }}>Unable to load orders — {error}</span>
            </div>
            <button onClick={() => fetchOrders(true)} className="btn-ghost" style={{ fontSize: 13, padding: "8px 16px", display: "inline-flex", alignItems: "center", gap: 5 }}><RefreshCw size={13} strokeWidth={2} />Retry</button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <div className="card empty-state">
          <div className="empty-emoji"><Package size={40} strokeWidth={1.5} color="#ddd6fe" /></div>
          <div className="empty-title">
            {orders.length === 0 ? "No orders yet" : `No ${filter !== "all" ? filter : ""} orders`}
          </div>
          <div className="empty-sub">
            {orders.length === 0
              ? "Place a bulk order from the Procurement page. Orders you place will appear here."
              : `No orders with status "${filter}".`}
          </div>
        </div>
      )}

      {/* Order cards */}
      {!loading && filtered.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map((o, i) => {
            const curStep = pipelineStep(o.status);
            const isExp = expanded === (o._id + i);
            const badge = STATUS_BADGE[o.status] || { bg: "rgba(255,255,255,0.05)", color: "var(--text2)", label: o.status };
            return (
              <div key={(o._id || i) + i} className="card" style={{ padding: 0, overflow: "hidden" }}>
                {/* Card header — click to expand */}
                <div
                  style={{ padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, cursor: "pointer" }}
                  onClick={() => setExpanded(isExp ? null : (o._id + i))}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {o.cropName || "Product"}
                      </div>
                      <span style={{ padding: "4px 10px", borderRadius: 8, background: badge.bg, color: badge.color, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        {badge.icon && <badge.icon size={12} />}
                        <span>{badge.label}</span>
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                      <div style={{ fontSize: 13, color: "var(--text2)", display: "flex", alignItems: "center", gap: 5 }}>
                        <Wheat size={14} /> <span style={{ color: "var(--text)" }}>{o.farmerName || "Farmer"}</span>
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text2)", display: "flex", alignItems: "center", gap: 5 }}>
                        <Package size={14} /> <span style={{ color: "var(--text)" }}>{o.quantity} {o.unit || "kg"}</span>
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text2)", display: "flex", alignItems: "center", gap: 5 }}>
                        <IndianRupee size={14} color="#15803d" /> <span style={{ color: "#15803d", fontWeight: 700 }}>₹{Number(o.totalPrice || o.subtotal || 0).toLocaleString("en-IN")}</span>
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text2)", display: "flex", alignItems: "center", gap: 5 }}>
                        <Calendar size={14} /> <span style={{ color: "var(--text)" }}>{relTime(o.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text2)", alignSelf: "center", flexShrink: 0 }}>
                    {isExp ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><ChevronUp size={14} /> Hide</span>
                    ) : (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><ChevronDown size={14} /> Details</span>
                    )}
                  </div>
                </div>

                {/* Expanded details */}
                {isExp && (
                  <div style={{ padding: "0 22px 20px", borderTop: "1px solid rgba(167,139,250,0.08)" }}>
                    {/* Pipeline — only for positive flow */}
                    {!["rejected", "cancelled"].includes(o.status) && (
                      <div className="pipeline" style={{ marginTop: 16 }}>
                        {["Pending", "Accepted", "Packed", "Shipped", "Delivered"].map((label, idx) => (
                          <div key={label} style={{ display: "flex", alignItems: "center", flex: idx < 4 ? 1 : 0 }}>
                            <div className="pl-step">
                              <div className={`pl-dot ${idx < curStep ? "done" : idx === curStep ? "cur" : ""}`}>
                                {idx < curStep ? "✓" : ""}
                              </div>
                              <div className={`pl-label ${idx <= curStep ? "active" : ""}`}>{label}</div>
                            </div>
                            {idx < 4 && <div className={`pl-line ${idx < curStep ? "done" : ""}`} />}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Order details */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16, marginBottom: 10 }}>
                      {[
                        { label: "Crop",    value: o.cropName },
                        { label: "Farmer",  value: o.farmerName },
                        { label: "Quantity",value: `${o.quantity} ${o.unit || "kg"}` },
                        { label: "Price",   value: o.price ? `₹${Number(o.price).toLocaleString("en-IN")}/${o.unit || "kg"}` : "—" },
                        { label: "Total",   value: `₹${Number(o.totalPrice || o.subtotal || 0).toLocaleString("en-IN")}` },
                        { label: "Payment", value: o.paymentMethod?.toUpperCase() || "COD" },
                      ].map(r => (
                        <div key={r.label} style={{ background: "var(--surface)", borderRadius: 10, padding: "8px 12px", border: "1px solid var(--border)" }}>
                          <div style={{ fontSize: 10, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{r.label}</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginTop: 3, wordBreak: "break-word" }}>{r.value || "—"}</div>
                        </div>
                      ))}
                    </div>

                    {/* Delivery address */}
                    {o.deliveryAddress && (
                      <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6, marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                        <MapPin size={13} color="#7c3aed" /> {fmtAddr(o.deliveryAddress)}
                      </div>
                    )}

                    {/* Order ID */}
                    <div style={{ fontSize: 11, color: "var(--text2)", fontFamily: "monospace", marginTop: 6 }}>
                      Order ID: {String(o._id)}
                    </div>

                    {/* Seller cannot change order status (farmer does that).
                        Seller can only cancel a pending order they placed. */}
                    {o.status === "pending" && (
                      <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 12, background: "#fffbeb", border: "1px solid rgba(251,191,36,0.12)", fontSize: 13, color: "#b45309", display: "flex", alignItems: "center", gap: 8 }}>
                        <Clock size={16} color="#b45309" /> Waiting for the farmer to accept your order. You can cancel below.
                      </div>
                    )}
                    {["accepted", "processing", "shipped"].includes(o.status) && (
                      <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 12, background: "#f0f9ff", border: "1px solid rgba(56,189,248,0.1)", fontSize: 13, color: "#0369a1", display: "flex", alignItems: "center", gap: 8 }}>
                        <CheckCircle2 size={16} color="#0369a1" /> Order is being processed by the farmer. Status updates automatically.
                      </div>
                    )}
                    {o.status === "delivered" && (
                      <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 12, background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.15)", fontSize: 13, color: "#15803d", display: "flex", alignItems: "center", gap: 8 }}>
                        <CheckCircle2 size={16} color="#15803d" /> Order delivered successfully!
                      </div>
                    )}
                    {["rejected", "cancelled"].includes(o.status) && (
                      <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 12, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)", fontSize: 13, color: "#dc2626", display: "flex", alignItems: "center", gap: 8 }}>
                        <XCircle size={16} color="#dc2626" /> This order was {o.status}. No further action needed.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Auto-refresh notice */}
      {!loading && orders.length > 0 && (
        <div style={{ marginTop: 20, textAlign: "center", fontSize: 11, color: "var(--text2)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <RefreshCw size={12} /> Status auto-refreshes every 30 seconds · Use Refresh button for immediate update
        </div>
      )}
    </>
  );
}
