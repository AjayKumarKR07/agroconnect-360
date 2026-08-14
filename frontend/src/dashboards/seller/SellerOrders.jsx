import { useEffect, useState } from "react";
import { API_URL } from "../../config/api";
import { DS } from "../../styles/ds";

const STATUS_FILTERS = ["all", "pending", "accepted", "processing", "shipped", "delivered", "rejected"];

const STATUS_BADGE = {
  pending:    { bg: "rgba(251,191,36,0.1)",  color: "#fbbf24", label: "⏳ Pending" },
  accepted:   { bg: "rgba(34,197,94,0.1)",   color: "#4ade80", label: "✅ Accepted" },
  processing: { bg: "rgba(167,139,250,0.1)", color: "#a78bfa", label: "📦 Packed" },
  shipped:    { bg: "rgba(56,189,248,0.1)",  color: "#38bdf8", label: "🚚 Shipped" },
  delivered:  { bg: "rgba(34,197,94,0.1)",   color: "#4ade80", label: "🎉 Delivered" },
  rejected:   { bg: "rgba(239,68,68,0.1)",   color: "#f87171", label: "❌ Rejected" },
  cancelled:  { bg: "rgba(239,68,68,0.1)",   color: "#f87171", label: "🚫 Cancelled" },
};

// Order of steps in the pipeline
const PIPELINE = ["pending", "accepted", "processing", "shipped", "delivered"];

export default function SellerOrders() {
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [filter,   setFilter]   = useState("all");
  const [updating, setUpdating] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const token = localStorage.getItem("agroconnect_token");

  const fetchOrders = async () => {
    setLoading(true); setError(null);
    try {
      const r = await fetch(`${API_URL}/api/orders/seller`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (d.success) setOrders(d.orders || []);
      else setError(d.message || "Unable to load orders");
    } catch { setError("Network error — could not reach the server"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (id, status) => {
    setUpdating(id + status);
    try {
      const r = await fetch(`${API_URL}/api/orders/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const d = await r.json();
      if (r.ok) setOrders(prev => prev.map(o => o._id === id ? { ...o, status: d.order?.status || status } : o));
      else alert(d.message || "Update failed");
    } catch { alert("Update failed. Try again."); }
    finally { setUpdating(null); }
  };

  const filtered = orders.filter(o => filter === "all" || o.status === filter);

  const statusBadge = (s) => {
    const m = STATUS_BADGE[s] || { bg: "rgba(255,255,255,0.05)", color: "var(--text2)", label: s };
    return (
      <span style={{ padding: "4px 10px", borderRadius: 8, background: m.bg, color: m.color, fontSize: 12, fontWeight: 700 }}>
        {m.label}
      </span>
    );
  };

  const pipelineStep = (s) => PIPELINE.indexOf(s);

  return (
    <>
      <style>{DS + `
        .sf-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 24px; }
        .sf-tab { padding: 7px 16px; border-radius: 9px; font-size: 12px; font-weight: 700; cursor: pointer; border: 1px solid var(--border); background: var(--surface); color: var(--text2); transition: all 0.2s; }
        .sf-tab.active { background: rgba(167,139,250,0.1); color: #a78bfa; border-color: rgba(167,139,250,0.2); }
        .pipeline { display: flex; align-items: center; gap: 0; margin: 14px 0; }
        .pl-step { display: flex; flex-direction: column; align-items: center; }
        .pl-dot { width: 24px; height: 24px; border-radius: 50%; border: 2px solid rgba(167,139,250,0.2); background: var(--surface); display: flex; align-items: center; justify-content: center; font-size: 10px; flex-shrink: 0; }
        .pl-dot.done { background: linear-gradient(135deg,#7c3aed,#a78bfa); border-color: #a78bfa; box-shadow: 0 0 10px rgba(167,139,250,0.5); }
        .pl-dot.cur { border-color: #a78bfa; animation: plPulse 1.5s ease infinite; }
        @keyframes plPulse { 0%,100% { box-shadow: 0 0 6px rgba(167,139,250,0.3) } 50% { box-shadow: 0 0 14px rgba(167,139,250,0.7) } }
        .pl-line { flex: 1; height: 2px; background: rgba(167,139,250,0.12); min-width: 20px; }
        .pl-line.done { background: linear-gradient(90deg,#7c3aed,#a78bfa); }
        .pl-label { font-size: 9px; color: var(--text2); text-align: center; margin-top: 4px; white-space: nowrap; }
        .pl-label.done,.pl-label.cur { color: #a78bfa; font-weight: 700; }
        .action-btn { padding: 8px 16px; border-radius: 10px; font-weight: 700; font-size: 12px; cursor: pointer; font-family: 'Inter',sans-serif; transition: opacity 0.2s; }
        .action-btn:hover { opacity: 0.8; }
        .action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Sales</div>
          <h1 className="pg-title">📦 Manage Orders</h1>
          <p className="pg-sub">Review, accept, pack, ship, and deliver buyer orders.</p>
        </div>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color: "#a78bfa" }}>{orders.length} total</div>
      </div>

      {/* Filter tabs */}
      <div className="sf-tabs">
        {STATUS_FILTERS.map(f => (
          <button key={f} className={`sf-tab ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)} ({f === "all" ? orders.length : orders.filter(o => o.status === f).length})
          </button>
        ))}
      </div>

      {loading && <div className="loading-wrap"><div className="spinner" /><span>Loading orders…</span></div>}

      {error && !loading && (
        <div className="card" style={{ marginBottom: 24, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <span style={{ color: "#f87171", fontWeight: 600, fontSize: 14 }}>Unable to load orders — {error}</span>
            </div>
            <button onClick={fetchOrders} className="btn-ghost" style={{ fontSize: 13, padding: "8px 16px" }}>🔄 Retry</button>
          </div>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="card empty-state">
          <div className="empty-emoji">📦</div>
          <div className="empty-title">No {filter !== "all" ? filter : ""} orders</div>
          <div className="empty-sub">Orders will appear here when buyers purchase your products.</div>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map((o, i) => {
            const curStep = pipelineStep(o.status);
            const isExp = expanded === o._id;
            return (
              <div key={o._id || i} className="card" style={{ padding: 0, overflow: "hidden" }}>
                {/* Header — always visible */}
                <div
                  style={{ padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14, cursor: "pointer" }}
                  onClick={() => setExpanded(isExp ? null : o._id)}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div style={{ fontWeight: 800, color: "#fff", fontSize: 16 }}>{o.cropName || "Product"}</div>
                      {statusBadge(o.status)}
                    </div>
                    <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                      <div style={{ fontSize: 13, color: "var(--text2)" }}>👤 <span style={{ color: "var(--text)" }}>{o.buyerName || "Buyer"}</span></div>
                      <div style={{ fontSize: 13, color: "var(--text2)" }}>📦 <span style={{ color: "var(--text)" }}>{o.quantity} {o.unit || "kg"}</span></div>
                      <div style={{ fontSize: 13, color: "var(--text2)" }}>💰 <span style={{ color: "#a78bfa", fontWeight: 700 }}>₹{Number(o.totalPrice || 0).toLocaleString("en-IN")}</span></div>
                      <div style={{ fontSize: 13, color: "var(--text2)" }}>📅 <span style={{ color: "var(--text)" }}>{new Date(o.createdAt).toLocaleDateString("en-IN")}</span></div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text2)", alignSelf: "center" }}>{isExp ? "▲ Hide" : "▼ Details"}</div>
                </div>

                {/* Expanded details */}
                {isExp && (
                  <div style={{ padding: "0 22px 20px", borderTop: "1px solid rgba(167,139,250,0.08)" }}>
                    {/* Pipeline tracker */}
                    {!["rejected","cancelled"].includes(o.status) && (
                      <div className="pipeline" style={{ marginTop: 16 }}>
                        {["Pending","Accepted","Packed","Shipped","Delivered"].map((label, idx) => (
                          <div key={label} style={{ display: "flex", alignItems: "center", flex: idx < 4 ? 1 : 0 }}>
                            <div className="pl-step">
                              <div className={`pl-dot ${idx < curStep ? "done" : idx === curStep ? "cur" : ""}`}>
                                {idx < curStep ? "✓" : ""}
                              </div>
                              <div className={`pl-label ${idx <= curStep ? "done" : ""}`}>{label}</div>
                            </div>
                            {idx < 4 && <div className={`pl-line ${idx < curStep ? "done" : ""}`} />}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Delivery address — API returns as formatted string */}
                    {o.deliveryAddress && (
                      <div style={{ fontSize: 12, color: "var(--text2)", margin: "12px 0", lineHeight: 1.5 }}>
                        📍 {typeof o.deliveryAddress === "string"
                          ? o.deliveryAddress
                          : [o.deliveryAddress.address, o.deliveryAddress.city, o.deliveryAddress.state, o.deliveryAddress.pincode].filter(Boolean).join(", ")}
                      </div>
                    )}
                    {o.buyerPhone && (
                      <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 14 }}>
                        📞 {o.buyerPhone}
                      </div>
                    )}

                    {/* Action buttons by current status */}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                      {o.status === "pending" && (
                        <>
                          <button
                            className="action-btn"
                            disabled={!!updating}
                            onClick={() => updateStatus(o._id, "accepted")}
                            style={{ border: "1px solid rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.07)", color: "#4ade80" }}
                          >
                            {updating === o._id + "accepted" ? "⏳" : "✅ Accept Order"}
                          </button>
                          <button
                            className="action-btn"
                            disabled={!!updating}
                            onClick={() => updateStatus(o._id, "rejected")}
                            style={{ border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.07)", color: "#f87171" }}
                          >
                            {updating === o._id + "rejected" ? "⏳" : "❌ Reject"}
                          </button>
                        </>
                      )}
                      {o.status === "accepted" && (
                        <button
                          className="action-btn"
                          disabled={!!updating}
                          onClick={() => updateStatus(o._id, "processing")}
                          style={{ border: "1px solid rgba(167,139,250,0.3)", background: "rgba(167,139,250,0.07)", color: "#a78bfa" }}
                        >
                          {updating === o._id + "processing" ? "⏳" : "📦 Mark Packed"}
                        </button>
                      )}
                      {o.status === "processing" && (
                        <button
                          className="action-btn"
                          disabled={!!updating}
                          onClick={() => updateStatus(o._id, "shipped")}
                          style={{ border: "1px solid rgba(56,189,248,0.3)", background: "rgba(56,189,248,0.07)", color: "#38bdf8" }}
                        >
                          {updating === o._id + "shipped" ? "⏳" : "🚚 Mark Shipped"}
                        </button>
                      )}
                      {o.status === "shipped" && (
                        <button
                          className="action-btn"
                          disabled={!!updating}
                          onClick={() => updateStatus(o._id, "delivered")}
                          style={{ border: "1px solid rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.07)", color: "#4ade80" }}
                        >
                          {updating === o._id + "delivered" ? "⏳" : "🎉 Mark Delivered"}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
