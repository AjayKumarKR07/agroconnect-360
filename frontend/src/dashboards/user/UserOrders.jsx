import { useEffect, useState } from "react";
import { API_URL } from "../../config/api";

const DS_USER = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
  .pg-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:16px;flex-wrap:wrap;}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#0ea5e9;margin-bottom:6px;}
  .pg-title{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:800;color:#fff;line-height:1.2;}
  .pg-sub{font-size:14px;color:var(--text2);margin-top:6px;}
  .loading-wrap{display:flex;align-items:center;justify-content:center;gap:12px;padding:60px 0;color:var(--text2);}
  .spinner{width:24px;height:24px;border:3px solid rgba(14,165,233,0.15);border-top-color:#0ea5e9;border-radius:50%;animation:spin 0.8s linear infinite;}
  @keyframes spin{to{transform:rotate(360deg)}}
  .empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 24px;text-align:center;gap:12px;background:rgba(14,165,233,0.03);border:1px solid rgba(14,165,233,0.08);border-radius:18px;}
  .empty-emoji{font-size:48px;} .empty-title{font-size:18px;font-weight:700;color:#fff;} .empty-sub{font-size:14px;color:var(--text2);}
  .btn-cyan{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:12px;background:linear-gradient(135deg,#0284c7,#0ea5e9);color:#fff;font-weight:700;font-size:14px;border:none;cursor:pointer;text-decoration:none;font-family:'Inter',sans-serif;}
  .tab-btn{padding:7px 16px;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;border:1px solid rgba(14,165,233,0.12);background:rgba(14,165,233,0.04);color:var(--text2);transition:all 0.2s;font-family:'Inter',sans-serif;}
  .tab-btn.active{background:rgba(14,165,233,0.12);color:#38bdf8;border-color:rgba(14,165,233,0.25);}
`;

const STATUS_CONFIG = {
  pending:    { label: "⏳ Pending",    bg: "rgba(251,191,36,0.12)", color: "#fbbf24" },
  accepted:   { label: "✅ Accepted",   bg: "rgba(14,165,233,0.12)", color: "#38bdf8" },
  processing: { label: "⚙️ Processing", bg: "rgba(167,139,250,0.12)",color: "#a78bfa" },
  shipped:    { label: "🚚 Shipped",    bg: "rgba(56,189,248,0.12)", color: "#38bdf8" },
  delivered:  { label: "📦 Delivered",  bg: "rgba(34,197,94,0.12)",  color: "#4ade80" },
  rejected:   { label: "❌ Rejected",   bg: "rgba(239,68,68,0.12)",  color: "#f87171" },
  cancelled:  { label: "🚫 Cancelled",  bg: "rgba(239,68,68,0.12)",  color: "#f87171" },
};

const FILTERS = ["all", "pending", "accepted", "shipped", "delivered", "rejected"];

export default function UserOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const token = localStorage.getItem("agroconnect_token");

  const load = async () => {
    try {
      const r = await fetch(`${API_URL}/api/orders/buyer`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (d.success) setOrders(d.orders || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    // Auto-refresh every 30s so farmer status changes appear promptly
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const filtered = orders.filter(o => filter === "all" || o.status === filter);

  const cancelOrder = async (id) => {
    if (!window.confirm("Cancel this order?")) return;
    try {
      await fetch(`${API_URL}/api/orders/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "cancelled" }),
      });
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status: "cancelled" } : o));
    } catch { alert("Failed to cancel. Try again."); }
  };

  const STEP_MAP = { pending: 0, accepted: 1, processing: 1, shipped: 2, delivered: 3 };
  const STEPS = ["Order Placed", "Confirmed", "Shipped", "Delivered"];

  return (
    <>
      <style>{DS_USER + `
        .order-card{background:rgba(14,165,233,0.04);border:1px solid rgba(14,165,233,0.1);border-radius:16px;overflow:hidden;transition:border-color 0.2s;margin-bottom:12px;}
        .order-card:hover{border-color:rgba(14,165,233,0.2);}
        .tracker{display:flex;align-items:center;margin:16px 0;}
        .tr-dot{width:26px;height:26px;border-radius:50%;border:2px solid rgba(14,165,233,0.2);background:rgba(14,165,233,0.05);display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;}
        .tr-dot.done{background:linear-gradient(135deg,#0284c7,#38bdf8);border-color:#38bdf8;box-shadow:0 0 12px rgba(14,165,233,0.5);}
        .tr-dot.cur{border-color:#0ea5e9;animation:trPulse 1.5s ease infinite;}
        @keyframes trPulse{0%,100%{box-shadow:0 0 6px rgba(14,165,233,0.3)}50%{box-shadow:0 0 14px rgba(14,165,233,0.7)}}
        .tr-line{flex:1;height:2px;background:rgba(14,165,233,0.12);}
        .tr-line.done{background:linear-gradient(90deg,#0284c7,#38bdf8);}
        .tr-label{font-size:10px;color:var(--text2);text-align:center;margin-top:6px;white-space:nowrap;}
        .tr-label.done,.tr-label.cur{color:#38bdf8;font-weight:700;}
      `}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Shopping</div>
          <h1 className="pg-title">📦 My Orders</h1>
          <p className="pg-sub">Track all your purchases and delivery status.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color: "#0ea5e9" }}>{orders.length} total</div>
          <button className="tab-btn" onClick={load} style={{ fontSize: 12 }}>🔄 Refresh</button>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 22 }}>
        {FILTERS.map(f => (
          <button key={f} className={`tab-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)} ({f === "all" ? orders.length : orders.filter(o => o.status === f).length})
          </button>
        ))}
      </div>

      {loading && <div className="loading-wrap"><div className="spinner" /><span>Loading orders…</span></div>}

      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-emoji">📦</div>
          <div className="empty-title">No {filter !== "all" ? filter : ""} orders</div>
          <div className="empty-sub">Your orders will appear here once you start shopping.</div>
        </div>
      )}

      {!loading && filtered.map((o, i) => {
        const st = STATUS_CONFIG[o.status] || STATUS_CONFIG.pending;
        const stepIdx = STEP_MAP[o.status] ?? 0;
        const isExp = expanded === o._id;
        return (
          <div key={o._id || i} className="order-card">
            {/* Header row */}
            <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, cursor: "pointer" }} onClick={() => setExpanded(isExp ? null : o._id)}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <div style={{ fontWeight: 800, color: "#fff", fontSize: 15 }}>
                    {o.items?.map(it => it.cropName).join(", ") || "Order"}
                  </div>
                  <span style={{ padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color }}>{st.label}</span>
                </div>
                <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 12, color: "var(--text2)" }}>🗓️ {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                  <div style={{ fontSize: 12, color: "var(--text2)" }}>📦 {o.items?.length || 1} item(s)</div>
                  <div style={{ fontSize: 12, color: "var(--text2)" }}>💳 {o.paymentMethod?.toUpperCase() || "COD"}</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: "#0ea5e9" }}>₹{Number(o.totalAmount || 0).toLocaleString("en-IN")}</div>
                <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>{isExp ? "▲ Hide" : "▼ Details"}</div>
              </div>
            </div>

            {/* Expanded details */}
            {isExp && (
              <div style={{ padding: "0 20px 20px", borderTop: "1px solid rgba(14,165,233,0.08)" }}>
                {/* Tracker */}
                {!["cancelled", "rejected"].includes(o.status) && (
                  <div style={{ margin: "16px 0" }}>
                    <div className="tracker">
                      {STEPS.map((step, idx) => (
                        <div key={step} style={{ display: "flex", alignItems: "center", flex: idx < STEPS.length - 1 ? 1 : 0 }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <div className={`tr-dot ${idx < stepIdx ? "done" : idx === stepIdx ? "cur" : ""}`}>
                              {idx < stepIdx ? "✓" : ""}
                            </div>
                            <div className={`tr-label ${idx <= stepIdx ? "done" : ""}`}>{step}</div>
                          </div>
                          {idx < STEPS.length - 1 && <div className={`tr-line ${idx < stepIdx ? "done" : ""}`} />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Items */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Items Ordered</div>
                  {(o.items || []).map((it, j) => (
                    <div key={j} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(14,165,233,0.06)", fontSize: 13 }}>
                      <span style={{ color: "#fff", fontWeight: 600 }}>{it.cropName}</span>
                      <span style={{ color: "var(--text2)" }}>{it.quantity} {it.unit} × ₹{it.price} = <span style={{ color: "#0ea5e9", fontWeight: 700 }}>₹{it.subtotal}</span></span>
                    </div>
                  ))}
                </div>

                {/* Delivery address */}
                {o.deliveryAddress && (
                  <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 14 }}>
                    📍 <span style={{ color: "var(--text)" }}>{o.deliveryAddress.address}, {o.deliveryAddress.city}, {o.deliveryAddress.state} - {o.deliveryAddress.pincode}</span>
                  </div>
                )}

                {/* Cancel button */}
                {o.status === "pending" && (
                  <button onClick={() => cancelOrder(o._id)} style={{ padding: "8px 18px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.07)", color: "#f87171", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
                    🚫 Cancel Order
                  </button>
                )}
                {/* Reorder button for delivered orders */}
                {o.status === "delivered" && (
                  <button
                    onClick={() => {
                      const cart = JSON.parse(localStorage.getItem("ac_cart") || "[]");
                      let updated = [...cart];
                      (o.items || []).forEach(it => {
                        const existing = updated.find(c => c._id === (it.crop?._id || it.crop));
                        if (existing) {
                          updated = updated.map(c => c._id === existing._id ? { ...c, qty: (c.qty || 1) + (it.quantity || 1) } : c);
                        } else {
                          updated.push({
                            _id: it.crop?._id || it.crop,
                            name: it.cropName || "Crop",
                            price: it.price || 0,
                            unit: it.unit || "kg",
                            qty: it.quantity || 1,
                            category: it.category || "other",
                            location: it.location || "",
                            image: it.image || { url: "" },
                          });
                        }
                      });
                      localStorage.setItem("ac_cart", JSON.stringify(updated));
                      window.dispatchEvent(new Event("ac_cart_update"));
                      alert("✅ Items added to cart! Head to your cart to checkout.");
                    }}
                    style={{ padding: "8px 18px", borderRadius: 10, border: "1px solid rgba(14,165,233,0.25)", background: "rgba(14,165,233,0.07)", color: "#38bdf8", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}
                  >
                    🔄 Reorder
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
