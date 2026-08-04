import { useEffect, useState } from "react";
import { API_URL } from "../../config/api";
import { DS } from "../../styles/ds";

const STATUS_META = {
  pending:   { label: "Pending",   badge: "badge-amber", emoji: "⏳" },
  confirmed: { label: "Confirmed", badge: "badge-blue",  emoji: "✅" },
  shipped:   { label: "Shipped",   badge: "badge-purple",emoji: "🚚" },
  delivered: { label: "Delivered", badge: "badge-green", emoji: "📦" },
  cancelled: { label: "Cancelled", badge: "badge-red",   emoji: "❌" },
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [filter, setFilter] = useState("all");

  const fetchOrders = async () => {
    try {
      setError("");
      const token = localStorage.getItem("agroconnect_token");
      const r = await fetch(`${API_URL}/api/orders/farmer`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Unable to load orders");
      setOrders(d.orders || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const token = localStorage.getItem("agroconnect_token");
      const r = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Failed to update");
      setOrders((prev) => prev.map((o) => o._id === orderId ? { ...o, status: newStatus } : o));
    } catch (e) { setError(e.message); }
    finally { setUpdatingId(null); }
  };

  const TABS = ["all", "pending", "confirmed", "shipped", "delivered", "cancelled"];
  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const counts = TABS.reduce((acc, t) => {
    acc[t] = t === "all" ? orders.length : orders.filter((o) => o.status === t).length;
    return acc;
  }, {});

  return (
    <>
      <style>{DS + `
        .tab-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:24px;}
        .tab-btn{padding:7px 16px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;border:1px solid var(--border);background:var(--surface);color:var(--text2);transition:all 0.2s;font-family:'Inter',sans-serif;}
        .tab-btn:hover{background:var(--surface2);color:var(--text);}
        .tab-btn.active{background:var(--green-dim);border-color:rgba(34,197,94,0.25);color:#4ade80;}
        .tab-count{display:inline-block;margin-left:6px;background:rgba(255,255,255,0.1);padding:1px 7px;border-radius:10px;font-size:11px;}
      `}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Farm Sales</div>
          <h1 className="pg-title">📦 Orders</h1>
          <p className="pg-sub">Manage incoming orders for your crops.</p>
        </div>
      </div>

      {error && <div className="alert-error">⚠️ {error}</div>}

      {/* Summary row */}
      {!loading && (
        <div className="stat-grid" style={{ marginBottom: 24 }}>
          {[
            { emoji: "📋", label: "Total Orders",    value: orders.length,                                      color: "#38bdf8" },
            { emoji: "⏳", label: "Pending",         value: counts.pending,                                     color: "#fbbf24" },
            { emoji: "✅", label: "Fulfilled",       value: (counts.confirmed||0)+(counts.shipped||0)+(counts.delivered||0), color: "#4ade80" },
            { emoji: "❌", label: "Cancelled",       value: counts.cancelled,                                   color: "#f87171" },
          ].map(({ emoji, label, value, color }) => (
            <div key={label} className="stat-card">
              <div className="stat-glow" style={{ background: color }} />
              <div className="stat-emoji">{emoji}</div>
              <div className="stat-val">{value}</div>
              <div className="stat-lbl">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="tab-row">
        {TABS.map((t) => (
          <button key={t} className={`tab-btn ${filter === t ? "active" : ""}`} onClick={() => setFilter(t)}>
            {STATUS_META[t]?.emoji || "📋"} {t.charAt(0).toUpperCase() + t.slice(1)}
            <span className="tab-count">{counts[t]}</span>
          </button>
        ))}
      </div>

      {loading && <div className="loading-wrap"><div className="spinner" /><span>Loading orders…</span></div>}

      {!loading && filtered.length === 0 && (
        <div className="card empty-state">
          <div className="empty-emoji">📭</div>
          <div className="empty-title">No {filter === "all" ? "" : filter} orders yet</div>
          <div className="empty-sub">Orders placed for your crops will appear here.</div>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map((order) => {
            const meta = STATUS_META[order.status] || STATUS_META.pending;
            const total = (order.totalAmount || order.pricePerUnit * order.quantity || 0);
            return (
              <div key={order._id} className="card" style={{ padding: "20px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                  <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div style={{ fontSize: 32, lineHeight: 1, padding: "10px", background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)" }}>
                      {meta.emoji}
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{order.cropName || order.crop?.name || "Crop Order"}</div>
                      <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 3 }}>
                        👤 {order.buyerName || order.buyer?.name || "Buyer"} &nbsp;·&nbsp;
                        📅 {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                      {order.deliveryAddress && (
                        <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 3 }}>📍 {order.deliveryAddress}</div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                    <span className={`badge ${meta.badge}`}>{meta.emoji} {meta.label}</span>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#4ade80" }}>
                      ₹{Number(total).toLocaleString("en-IN")}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text2)" }}>{order.quantity} {order.unit || "kg"}</div>
                  </div>
                </div>

                {order.status === "pending" && (
                  <div style={{ display: "flex", gap: 10, marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                    <button onClick={() => updateStatus(order._id, "confirmed")} disabled={updatingId === order._id} className="btn-green" style={{ flex: 1, justifyContent: "center" }}>
                      ✅ Confirm Order
                    </button>
                    <button onClick={() => updateStatus(order._id, "cancelled")} disabled={updatingId === order._id} className="btn-danger" style={{ flex: 1, justifyContent: "center" }}>
                      ❌ Cancel
                    </button>
                  </div>
                )}
                {order.status === "confirmed" && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                    <button onClick={() => updateStatus(order._id, "shipped")} disabled={updatingId === order._id} className="btn-ghost" style={{ color: "#c4b5fd", borderColor: "rgba(167,139,250,0.2)" }}>
                      🚚 Mark as Shipped
                    </button>
                  </div>
                )}
                {order.status === "shipped" && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                    <button onClick={() => updateStatus(order._id, "delivered")} disabled={updatingId === order._id} className="btn-green">
                      📦 Mark as Delivered
                    </button>
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