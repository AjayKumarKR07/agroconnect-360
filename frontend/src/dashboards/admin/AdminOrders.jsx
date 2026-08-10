import { useState, useEffect } from "react";
import { API_URL } from "../../config/api";

const DS_ADMIN = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
  .pg-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:16px;flex-wrap:wrap;}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#818cf8;margin-bottom:6px;}
  .pg-title{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:800;color:#fff;line-height:1.2;}
  .pg-sub{font-size:14px;color:#a5b4fc;margin-top:6px;}
  .card{background:rgba(99,102,241,0.04);border:1px solid rgba(99,102,241,0.12);border-radius:18px;padding:20px 22px;}
  .tab-btn{padding:7px 16px;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;border:1px solid rgba(99,102,241,0.15);background:rgba(99,102,241,0.04);color:#a5b4fc;transition:all 0.2s;font-family:'Inter',sans-serif;}
  .tab-btn.active{background:rgba(99,102,241,0.2);color:#fff;border-color:#6366f1;}
  .spinner{width:22px;height:22px;border:3px solid rgba(99,102,241,0.15);border-top-color:#818cf8;border-radius:50%;animation:spin 0.8s linear infinite;}
  @keyframes spin{to{transform:rotate(360deg)}}
  .loading-wrap{display:flex;align-items:center;justify-content:center;gap:12px;padding:60px 0;color:#a5b4fc;}
`;

const STATUS_FILTERS = ["all", "pending", "accepted", "processing", "shipped", "delivered", "rejected", "cancelled"];

const STATUS_BADGE = {
  pending:    { bg: "rgba(251,191,36,0.1)",  color: "#fbbf24", label: "⏳ Pending" },
  accepted:   { bg: "rgba(34,197,94,0.1)",   color: "#4ade80", label: "✅ Accepted" },
  processing: { bg: "rgba(167,139,250,0.1)", color: "#a78bfa", label: "📦 Packed" },
  shipped:    { bg: "rgba(56,189,248,0.1)",  color: "#38bdf8", label: "🚚 Shipped" },
  delivered:  { bg: "rgba(34,197,94,0.1)",   color: "#4ade80", label: "🎉 Delivered" },
  rejected:   { bg: "rgba(239,68,68,0.1)",   color: "#f87171", label: "❌ Rejected" },
  cancelled:  { bg: "rgba(239,68,68,0.1)",   color: "#f87171", label: "🚫 Cancelled" },
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [updating, setUpdating] = useState(null);
  const token = localStorage.getItem("agroconnect_token");

  const loadOrders = async (status) => {
    setLoading(true);
    try {
      const params = status && status !== "all" ? `?status=${status}` : "";
      const r = await fetch(`${API_URL}/api/admin/orders${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (d.success) setOrders(d.orders || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadOrders(filter); }, [filter]);

  const updateOrderStatus = async (id, status) => {
    setUpdating(id);
    try {
      const r = await fetch(`${API_URL}/api/admin/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const d = await r.json();
      if (d.success) {
        setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o));
      }
    } catch { alert("Failed to update order."); }
    finally { setUpdating(null); }
  };

  const sb = (s) => {
    const m = STATUS_BADGE[s] || { bg: "rgba(255,255,255,0.05)", color: "#a5b4fc", label: s };
    return <span style={{ padding: "3px 9px", borderRadius: 7, background: m.bg, color: m.color, fontSize: 11, fontWeight: 700 }}>{m.label}</span>;
  };

  const totalGmv = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);

  return (
    <>
      <style>{DS_ADMIN}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Order Management — Full Platform View</div>
          <h1 className="pg-title">📦 All Platform Orders</h1>
          <p className="pg-sub">Monitor and manage every order across all buyers, sellers, and farmers.</p>
        </div>
        <div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color: "#818cf8" }}>
            {orders.length} Orders
          </div>
          <div style={{ fontSize: 12, color: "#a5b4fc", marginTop: 4 }}>
            GMV: ₹{totalGmv.toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
        {STATUS_FILTERS.map(f => (
          <button key={f} className={`tab-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading && <div className="loading-wrap"><div className="spinner" /><span>Loading orders…</span></div>}

      {!loading && orders.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
          <div style={{ color: "#fff", fontWeight: 700 }}>No orders found</div>
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {orders.map((o, i) => {
            const isExp = expanded === o._id;
            return (
              <div key={o._id} className="card" style={{ padding: 0, overflow: "hidden" }}>
                {/* Summary row */}
                <div
                  style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, cursor: "pointer" }}
                  onClick={() => setExpanded(isExp ? null : o._id)}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{ fontWeight: 800, color: "#fff", fontSize: 15 }}>
                        {o.items?.map(it => it.cropName).join(", ") || "Order"}
                      </span>
                      {sb(o.status)}
                    </div>
                    <div style={{ display: "flex", gap: 18, flexWrap: "wrap", fontSize: 12, color: "#a5b4fc" }}>
                      <span>👤 Buyer: <strong style={{ color: "#fff" }}>{o.buyer?.name || "—"}</strong></span>
                      <span>📦 {o.items?.length || 0} item(s)</span>
                      <span>💳 {(o.paymentMethod || "cod").toUpperCase()}</span>
                      <span>🗓️ {new Date(o.createdAt).toLocaleDateString("en-IN")}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 800, color: "#818cf8" }}>
                      ₹{Number(o.totalAmount || 0).toLocaleString("en-IN")}
                    </div>
                    <div style={{ fontSize: 11, color: "#a5b4fc", marginTop: 3 }}>{isExp ? "▲ Hide" : "▼ Details"}</div>
                  </div>
                </div>

                {/* Expanded */}
                {isExp && (
                  <div style={{ padding: "0 20px 18px", borderTop: "1px solid rgba(99,102,241,0.08)" }}>
                    {/* Items */}
                    <div style={{ margin: "14px 0 10px" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#a5b4fc", textTransform: "uppercase", marginBottom: 8 }}>Items</div>
                      {(o.items || []).map((it, j) => (
                        <div key={j} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(99,102,241,0.06)", fontSize: 13 }}>
                          <span style={{ color: "#fff", fontWeight: 600 }}>{it.cropName}</span>
                          <span style={{ color: "#a5b4fc" }}>
                            {it.quantity} {it.unit} × ₹{it.price}
                            &nbsp;· Farmer: <span style={{ color: "#fff" }}>{it.farmer?.name || "—"}</span>
                            &nbsp;= <span style={{ color: "#818cf8", fontWeight: 700 }}>₹{it.subtotal}</span>
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Delivery address */}
                    {o.deliveryAddress && (
                      <div style={{ fontSize: 12, color: "#a5b4fc", marginBottom: 14 }}>
                        📍 {o.deliveryAddress.address}, {o.deliveryAddress.city}, {o.deliveryAddress.state} — {o.deliveryAddress.pincode}
                      </div>
                    )}

                    {/* Status update select */}
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, color: "#a5b4fc", fontWeight: 700 }}>Update Status:</span>
                      <select
                        disabled={updating === o._id}
                        value={o.status}
                        onChange={e => updateOrderStatus(o._id, e.target.value)}
                        style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(99,102,241,0.2)", background: "rgba(99,102,241,0.06)", color: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}
                      >
                        {["pending","accepted","processing","shipped","delivered","rejected","cancelled"].map(s => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                      {updating === o._id && <div className="spinner" />}
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
