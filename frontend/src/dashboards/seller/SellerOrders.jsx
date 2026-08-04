import { useEffect, useState } from "react";
import { API_URL } from "../../config/api";
import { DS } from "../../styles/ds";

const STATUS_FILTERS = ["all", "pending", "accepted", "rejected", "delivered"];

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [updating, setUpdating] = useState(null);
  const token = localStorage.getItem("agroconnect_token");

  const fetchOrders = async () => {
    try {
      const r = await fetch(`${API_URL}/api/orders/seller`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (d.success) setOrders(d.orders || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      const r = await fetch(`${API_URL}/api/orders/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const d = await r.json();
      if (r.ok) setOrders(prev => prev.map(o => o._id === id ? { ...o, status: d.order?.status || status } : o));
    } catch (e) { alert("Update failed"); }
    finally { setUpdating(null); }
  };

  const filtered = orders.filter(o => filter === "all" || o.status === filter);

  const statusBadge = (s) => {
    const map = {
      pending:   { bg: "rgba(251,191,36,0.1)",  color: "#fbbf24", label: "⏳ Pending" },
      accepted:  { bg: "rgba(34,197,94,0.1)",   color: "#4ade80", label: "✅ Accepted" },
      rejected:  { bg: "rgba(239,68,68,0.1)",   color: "#f87171", label: "❌ Rejected" },
      delivered: { bg: "rgba(56,189,248,0.1)",  color: "#38bdf8", label: "📦 Delivered" },
    };
    const m = map[s] || { bg: "rgba(255,255,255,0.05)", color: "var(--text2)", label: s };
    return <span style={{ padding: "4px 10px", borderRadius: 8, background: m.bg, color: m.color, fontSize: 12, fontWeight: 700 }}>{m.label}</span>;
  };

  return (
    <>
      <style>{DS + `
        .sf-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 24px; }
        .sf-tab { padding: 7px 16px; border-radius: 9px; font-size: 12px; font-weight: 700; cursor: pointer; border: 1px solid var(--border); background: var(--surface); color: var(--text2); transition: all 0.2s; }
        .sf-tab.active { background: rgba(167,139,250,0.1); color: #a78bfa; border-color: rgba(167,139,250,0.2); }
      `}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Sales</div>
          <h1 className="pg-title">📦 Manage Orders</h1>
          <p className="pg-sub">Review and update the status of buyer orders.</p>
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

      {!loading && filtered.length === 0 && (
        <div className="card empty-state">
          <div className="empty-emoji">📦</div>
          <div className="empty-title">No {filter !== "all" ? filter : ""} orders</div>
          <div className="empty-sub">Orders will appear here when buyers purchase your products.</div>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map((o, i) => (
            <div key={o._id || i} className="card" style={{ padding: "18px 22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{ fontWeight: 800, color: "#fff", fontSize: 16 }}>{o.cropName || o.productName || "Product"}</div>
                    {statusBadge(o.status)}
                  </div>
                  <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                    <div style={{ fontSize: 13, color: "var(--text2)" }}>👤 <span style={{ color: "var(--text)" }}>{o.buyerName || "Buyer"}</span></div>
                    <div style={{ fontSize: 13, color: "var(--text2)" }}>📦 <span style={{ color: "var(--text)" }}>{o.quantity} {o.unit || "kg"}</span></div>
                    <div style={{ fontSize: 13, color: "var(--text2)" }}>💰 <span style={{ color: "#a78bfa", fontWeight: 700 }}>₹{Number(o.totalPrice || 0).toLocaleString("en-IN")}</span></div>
                    <div style={{ fontSize: 13, color: "var(--text2)" }}>📅 <span style={{ color: "var(--text)" }}>{new Date(o.createdAt).toLocaleDateString("en-IN")}</span></div>
                  </div>
                  {o.deliveryAddress && <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 6 }}>📍 {o.deliveryAddress}</div>}
                </div>

                {/* Actions */}
                {o.status === "pending" && (
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button disabled={updating === o._id} onClick={() => updateStatus(o._id, "accepted")}
                      style={{ padding: "8px 18px", borderRadius: 10, border: "1px solid rgba(34,197,94,0.25)", background: "rgba(34,197,94,0.07)", color: "#4ade80", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
                      {updating === o._id ? "⏳" : "✅ Accept"}
                    </button>
                    <button disabled={updating === o._id} onClick={() => updateStatus(o._id, "rejected")}
                      style={{ padding: "8px 18px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.07)", color: "#f87171", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
                      {updating === o._id ? "⏳" : "❌ Reject"}
                    </button>
                  </div>
                )}
                {o.status === "accepted" && (
                  <button disabled={updating === o._id} onClick={() => updateStatus(o._id, "delivered")}
                    style={{ padding: "8px 18px", borderRadius: 10, border: "1px solid rgba(56,189,248,0.25)", background: "rgba(56,189,248,0.07)", color: "#38bdf8", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Inter',sans-serif", flexShrink: 0 }}>
                    {updating === o._id ? "⏳" : "📦 Mark Delivered"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
