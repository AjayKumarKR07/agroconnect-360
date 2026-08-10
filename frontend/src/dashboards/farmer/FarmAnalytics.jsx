import { useEffect, useState, useCallback } from "react";
import { API_URL } from "../../config/api";
import { DS } from "../../styles/ds";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("agroconnect_token")}`,
  "Content-Type": "application/json",
});

const fmt = n => `₹${Number(n || 0).toLocaleString("en-IN")}`;

// Simple SVG bar chart — pure CSS, no library needed
function BarChart({ data, maxVal, colorFn, label }) {
  const max = maxVal || Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 100 }}>
      {data.map((d, i) => {
        const h = Math.max((d.value / max) * 100, d.value > 0 ? 8 : 2);
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: "100%", height: `${h}%`, borderRadius: "4px 4px 0 0", background: colorFn(i, d), transition: "height 0.6s ease" }} title={`${d.label}: ${label(d)}`} />
            <div style={{ fontSize: 9, color: "var(--text2)", textAlign: "center", lineHeight: 1.2 }}>{d.label}</div>
          </div>
        );
      })}
    </div>
  );
}

// Donut-style status ring (pure CSS)
function StatusRing({ items }) {
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map(({ label, value, color }) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
          <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: `${(value / total) * 100}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.6s ease" }} />
          </div>
          <span style={{ fontSize: 11, color: "var(--text2)", minWidth: 60, textAlign: "right" }}>{label}: <strong style={{ color: "#fff" }}>{value}</strong></span>
        </div>
      ))}
    </div>
  );
}

export default function FarmAnalytics() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${API_URL}/api/farmer/analytics`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => { if (d.success) setData(d); else setError(d.message || "Unable to load analytics"); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <>
      <style>{DS + `
        .fa-section { margin-bottom:28px; }
        .fa-section-title { font-family:'Space Grotesk',sans-serif; font-size:16px; font-weight:700; color:#fff; margin-bottom:16px; display:flex; align-items:center; gap:8px; }
        .fa-grid { display:grid; gap:16px; }
        .fa-grid-2 { grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); }
        .fa-grid-3 { grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); }
        .fa-chart-wrap { background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:20px; }
        .fa-chart-title { font-size:13px; font-weight:700; color:var(--text2); margin-bottom:14px; text-transform:uppercase; letter-spacing:.05em; }
        .fa-note { padding:14px 16px; background:rgba(251,191,36,0.06); border:1px solid rgba(251,191,36,0.15); border-radius:12px; font-size:13px; color:#fde68a; line-height:1.7; margin-top:16px; }
      `}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Farm Intelligence</div>
          <h1 className="pg-title">📊 Farm Analytics</h1>
          <p className="pg-sub">Real data from your crops, orders, and income records.</p>
        </div>
        <button className="btn-ghost" onClick={load}>🔄 Refresh</button>
      </div>

      {error && <div className="alert-error">⚠️ {error}</div>}

      {loading ? (
        <div className="loading-wrap"><div className="spinner" /><span>Loading analytics…</span></div>
      ) : !data ? null : (
        <>
          {/* ── Top Stats ── */}
          <div className="stat-grid" style={{ marginBottom: 28 }}>
            {[
              { emoji: "🌿", label: "Total Crops",    value: data.crops.total,     color: "#22c55e", glow: "#22c55e" },
              { emoji: "🟢", label: "Active Crops",   value: data.crops.active,    color: "#4ade80", glow: "#22c55e" },
              { emoji: "📦", label: "Total Orders",   value: data.orders.total,    color: "#38bdf8", glow: "#38bdf8" },
              { emoji: "✅", label: "Delivered",      value: data.orders.delivered, color: "#a78bfa", glow: "#a78bfa" },
              { emoji: "💰", label: "Total Income",   value: fmt(data.income.total), color: "#fbbf24", glow: "#fbbf24" },
              { emoji: "🩺", label: "Health Scans",  value: data.diagnoses.total,  color: "#fb923c", glow: "#fb923c" },
            ].map(({ emoji, label, value, color, glow }) => (
              <div key={label} className="stat-card">
                <div className="stat-glow" style={{ background: glow }} />
                <div className="stat-emoji">{emoji}</div>
                <div className="stat-val" style={{ fontSize: 22, color }}>{value}</div>
                <div className="stat-lbl">{label}</div>
              </div>
            ))}
          </div>

          {/* ── Monthly Income Chart ── */}
          <div className="fa-section">
            <div className="fa-section-title">💰 Monthly Income This Year</div>
            <div className="fa-chart-wrap">
              <div className="fa-chart-title">Income by month (₹)</div>
              {data.income.total === 0 ? (
                <p style={{ color: "var(--text2)", fontSize: 13 }}>No income recorded yet. Delivered orders will appear here.</p>
              ) : (
                <BarChart
                  data={data.income.monthly.map((v, i) => ({ label: MONTHS[i], value: v }))}
                  colorFn={(i) => i === new Date().getMonth()
                    ? "linear-gradient(to top,#22c55e,rgba(34,197,94,0.4))"
                    : "rgba(255,255,255,0.08)"}
                  label={d => fmt(d.value)}
                />
              )}
            </div>
          </div>

          {/* ── Row 2 Charts ── */}
          <div className="fa-grid fa-grid-2 fa-section">
            {/* Crop Status */}
            <div className="fa-chart-wrap">
              <div className="fa-chart-title">🌿 Crop Status Breakdown</div>
              {data.crops.total === 0 ? (
                <p style={{ color: "var(--text2)", fontSize: 13 }}>No crops added yet.</p>
              ) : (
                <StatusRing items={[
                  { label: "Growing",  value: data.crops.growing, color: "#22c55e" },
                  { label: "Ready",    value: data.crops.ready,   color: "#fbbf24" },
                  { label: "Listed",   value: data.crops.listed,  color: "#38bdf8" },
                  { label: "Sold",     value: data.crops.sold,    color: "#a78bfa" },
                ]} />
              )}
            </div>

            {/* Order Status */}
            <div className="fa-chart-wrap">
              <div className="fa-chart-title">📦 Orders by Status</div>
              {data.orders.total === 0 ? (
                <p style={{ color: "var(--text2)", fontSize: 13 }}>No orders received yet.</p>
              ) : (
                <StatusRing items={[
                  { label: "Pending",   value: data.orders.pending,   color: "#fbbf24" },
                  { label: "Accepted",  value: data.orders.accepted,  color: "#22c55e" },
                  { label: "Delivered", value: data.orders.delivered, color: "#38bdf8" },
                  { label: "Cancelled", value: data.orders.cancelled, color: "#f87171" },
                ]} />
              )}
            </div>
          </div>

          {/* ── Crop-wise Sales ── */}
          {data.cropSales?.length > 0 && (
            <div className="fa-section">
              <div className="fa-section-title">🏆 Crop-wise Revenue</div>
              <div className="fa-chart-wrap">
                <div className="fa-chart-title">Revenue per crop (₹ from delivered orders)</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                  {data.cropSales.map(({ crop, revenue }, i) => {
                    const max = data.cropSales[0].revenue;
                    const pct = Math.round((revenue / max) * 100);
                    const colors = ["#22c55e", "#38bdf8", "#a78bfa", "#fbbf24", "#fb923c"];
                    const col = colors[i % colors.length];
                    return (
                      <div key={crop} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ minWidth: 100, fontSize: 12, color: "var(--text)", fontWeight: 600 }}>{crop}</div>
                        <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: col, borderRadius: 4, transition: "width 0.6s ease" }} />
                        </div>
                        <div style={{ minWidth: 80, fontSize: 12, color: col, fontWeight: 700, textAlign: "right" }}>{fmt(revenue)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Revenue Trend ── */}
          <div className="fa-section">
            <div className="fa-section-title">📈 Revenue Trend (Last 6 Months)</div>
            <div className="fa-chart-wrap">
              {data.income.total === 0 ? (
                <p style={{ color: "var(--text2)", fontSize: 13 }}>No revenue data yet.</p>
              ) : (
                <BarChart
                  data={(data.revenueTrend || []).map(r => ({ label: r.label, value: r.income }))}
                  colorFn={(i, d) => d.value > 0 ? "linear-gradient(to top,#38bdf8,rgba(56,189,248,0.3))" : "rgba(255,255,255,0.05)"}
                  label={d => fmt(d.value)}
                />
              )}
            </div>
          </div>

          {/* ── Crop Inventory ── */}
          {data.cropInventory?.length > 0 && (
            <div className="fa-section">
              <div className="fa-section-title">📦 Crop Inventory</div>
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead><tr><th>Crop</th><th>Quantity</th><th>Unit</th><th>Status</th></tr></thead>
                  <tbody>
                    {data.cropInventory.map((c, i) => (
                      <tr key={i}>
                        <td>{c.name}</td>
                        <td style={{ fontWeight: 700, color: "#fff" }}>{c.quantity}</td>
                        <td style={{ color: "var(--text2)" }}>{c.unit}</td>
                        <td>
                          <span className={`badge ${c.status === "sold" ? "badge-red" : c.status === "ready" ? "badge-amber" : "badge-green"}`}>
                            ● {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Profit note ── */}
          <div className="fa-note">
            ⚠️ <strong>Expense Data Unavailable:</strong> {data.note}
          </div>
        </>
      )}
    </>
  );
}
