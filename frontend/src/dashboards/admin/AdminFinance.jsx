import { useState, useEffect, useCallback } from "react";
import { API_URL } from "../../config/api";
import { DS_ADMIN, fmtINR, relativeTime } from "./adminStyles";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function AdminFinance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const token = localStorage.getItem("agroconnect_token");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${API_URL}/api/admin/finance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (d.success) {
        setData(d.data);
        setLastUpdated(new Date());
      } else {
        throw new Error(d.message || "Failed to load finance data");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const statusTotal = (status) => data?.byStatus?.find((s) => s._id === status)?.total || 0;
  const statusCount = (status) => data?.byStatus?.find((s) => s._id === status)?.count || 0;

  const maxRevenue = data?.monthlyRevenue?.length
    ? Math.max(...data.monthlyRevenue.map((m) => m.revenue))
    : 0;

  return (
    <>
      <style>{DS_ADMIN}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Financial Analytics — Real Order Data</div>
          <h1 className="pg-title">💰 Platform Finance &amp; Revenue</h1>
          <p className="pg-sub">Order GMV, revenue breakdown, and transaction history derived from real database records.</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {lastUpdated && <span style={{ fontSize: 12, color: "#a5b4fc" }}>Updated {relativeTime(lastUpdated)}</span>}
          <button className="btn-indigo" onClick={load} disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : "🔄"} Refresh
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16, marginBottom: 26 }}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 18 }} />)}
        </div>
      )}

      {!loading && error && (
        <div className="card error-state">
          <div className="error-state-icon">⚠️</div>
          <div className="error-state-msg">Unable to load finance data</div>
          <div className="error-state-sub">{error}</div>
          <button className="btn-indigo" onClick={load}>Retry</button>
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16, marginBottom: 26 }}>
            {[
              ["💎", "Delivered GMV", fmtINR(statusTotal("delivered")), `${statusCount("delivered")} delivered orders`, "#4ade80"],
              ["⏳", "Pending GMV", fmtINR(statusTotal("pending")), `${statusCount("pending")} pending orders`, "#fbbf24"],
              ["🚫", "Cancelled Value", fmtINR(statusTotal("cancelled")), `${statusCount("cancelled")} cancelled`, "#f87171"],
              ["📊", "Avg Order Value", fmtINR(data.avgOrderValue), `Across ${data.totalOrders} total orders`, "#818cf8"],
            ].map(([emoji, label, val, sub, color]) => (
              <div key={label} className="card">
                <div style={{ fontSize: 24, marginBottom: 8 }}>{emoji}</div>
                <div style={{ fontSize: 11, color: "#a5b4fc", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color }}>{val}</div>
                <div style={{ fontSize: 12, color: "#a5b4fc", marginTop: 4 }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Commission Note */}
          <div style={{ marginBottom: 20, padding: "12px 18px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 14, fontSize: 13, color: "#a5b4fc" }}>
            💡 <strong style={{ color: "#c7d2fe" }}>Commission estimate:</strong> {fmtINR(data.commissionEstimated)} (2.5% of delivered GMV). {data.commissionNote}
          </div>

          {/* Monthly Revenue Chart (last 6 months) */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-title" style={{ marginBottom: 16 }}>📈 Monthly Revenue (Last 6 Months — Delivered Orders)</div>
            {data.monthlyRevenue.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📈</div>
                <div className="empty-state-msg">No delivered orders in the last 6 months</div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 150, padding: "0 8px" }}>
                {data.monthlyRevenue.map((m) => {
                  const pct = maxRevenue > 0 ? (m.revenue / maxRevenue) * 100 : 0;
                  return (
                    <div key={`${m._id.year}-${m._id.month}`} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                      <div style={{ fontSize: 11, color: "#4ade80", fontWeight: 700 }}>{fmtINR(m.revenue)}</div>
                      <div
                        title={`${m.count} orders`}
                        style={{ width: "100%", maxWidth: 60, background: "linear-gradient(180deg,#4f46e5,#6366f1)", borderRadius: "6px 6px 0 0", height: `${Math.max(pct, 4)}%`, minHeight: 4, transition: "height 0.5s" }}
                      />
                      <div style={{ fontSize: 11, color: "#a5b4fc", textAlign: "center" }}>{MONTH_NAMES[m._id.month - 1]}<br /><span style={{ fontSize: 10 }}>{m._id.year}</span></div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* GMV by Status */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-title" style={{ marginBottom: 16 }}>📦 Order Value by Status</div>
            <div className="table-scroll">
              <table className="admin-table">
                <thead><tr><th>Status</th><th>Orders</th><th>Total Value</th></tr></thead>
                <tbody>
                  {data.byStatus.map((s) => (
                    <tr key={s._id}>
                      <td><span style={{ padding: "3px 10px", borderRadius: 8, background: "rgba(99,102,241,0.1)", color: "#c7d2fe", fontWeight: 700, fontSize: 12 }}>{s._id}</span></td>
                      <td style={{ color: "#fff", fontWeight: 700 }}>{s.count}</td>
                      <td style={{ color: "#818cf8", fontWeight: 800, fontFamily: "'Space Grotesk',sans-serif" }}>{fmtINR(s.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Delivered Orders */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>🧾 Recent Delivered Orders</div>
            {data.recentDelivered.length === 0 ? (
              <div className="empty-state"><div className="empty-state-msg">No delivered orders yet</div></div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {data.recentDelivered.map((o) => (
                  <div key={o._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "rgba(99,102,241,0.03)", borderRadius: 12, border: "1px solid rgba(99,102,241,0.08)", flexWrap: "wrap", gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>
                        {o.items?.map((it) => it.cropName).join(", ") || "Order"}
                      </div>
                      <div style={{ fontSize: 12, color: "#a5b4fc", marginTop: 2 }}>
                        Buyer: {o.buyer?.name || "—"} · {(o.paymentMethod || "cod").toUpperCase()} · {relativeTime(o.updatedAt)}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 800, color: "#4ade80" }}>
                        {fmtINR(o.totalAmount)}
                      </div>
                      <div style={{ fontSize: 11, color: "#4ade80", marginTop: 2 }}>
                        Est. fee: {fmtINR(o.totalAmount * 0.025)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
