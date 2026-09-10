import { useEffect, useState } from "react";
import { API_URL } from "../../config/api";
import { DS } from "../../styles/ds";
import { CalendarDays, Tag, Trophy, ClipboardList } from "lucide-react";

/* ─── Styles ──────────────────────────────────────────────────────────── */
const STYLES = `
  .sa-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 18px;
    padding: 22px 24px;
  }
  .sa-bar-wrap {
    display: flex; align-items: flex-end; gap: 5px; height: 160px; overflow-x: auto;
  }
  .sa-bar-col {
    flex: 1; min-width: 20px;
    display: flex; flex-direction: column; align-items: center; gap: 4px;
  }
  .sa-bar-val { font-size: 8px; color: var(--text2); white-space: nowrap; }
  .sa-bar-fill {
    width: 100%; border-radius: 5px 5px 0 0;
    transition: height 0.5s ease;
    min-height: 4px;
  }
  .sa-bar-lbl { font-size: 8px; color: var(--text2); text-align: center; white-space: nowrap; }
  .sa-period-tabs { display: flex; gap: 6px; margin-bottom: 24px; flex-wrap: wrap; }
  .sa-period-tab {
    padding: 7px 18px; border-radius: 10px; font-size: 12px; font-weight: 700;
    cursor: pointer; border: 1px solid var(--border);
    background: var(--surface); color: var(--text2);
    transition: all 0.2s; font-family: 'Inter', sans-serif;
  }
  .sa-period-tab.active {
    background: rgba(167,139,250,0.1); color: #7c3aed;
    border-color: rgba(167,139,250,0.2);
  }
  .sa-insight {
    padding: 14px 16px; border-radius: 14px;
    border: 1px solid var(--border); background: var(--surface);
    display: flex; gap: 14px; align-items: flex-start;
  }
  .sa-grid-2 {
    display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;
  }
  @media(max-width: 768px) { .sa-grid-2 { grid-template-columns: 1fr; } }
  .sa-empty {
    text-align: center; padding: 48px 20px;
    color: var(--text2); font-size: 14px;
  }
`;

/* ─── Helpers ─────────────────────────────────────────────────────────── */
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("agroconnect_token")}` });

/* Format a daily date key from the API.
   API returns either ISO strings or formatted strings like "14 Aug".
   We just display them as-is in the bar label (already short). */
const shortDate = (d) => {
  if (!d) return "";
  // If it looks like "14 Aug" already, return as-is
  if (/^\d{1,2} \w+/.test(String(d))) return String(d).replace(/\s+/g, "\u00a0");
  // Try parsing as ISO
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

/* ─── Main component ──────────────────────────────────────────────────── */
export default function SellerAnalytics() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [period,  setPeriod]  = useState("30");

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError(null);
      try {
        const r = await fetch(`${API_URL}/api/seller/analytics?days=${period}`, { headers: authH() });
        const d = await r.json();
        if (d.success) {
          setData(normalise(d));
        } else {
          setError(d.message || "Could not load analytics");
          setData(null);
        }
      } catch (e) {
        setError("Network error — could not reach the server");
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [period]);

  /* ── Loading ── */
  if (loading) return (
    <>
      <style>{DS + STYLES}</style>
      <div className="loading-wrap"><div className="spinner" /><span>Loading analytics…</span></div>
    </>
  );

  return (
    <>
      <style>{DS + STYLES}</style>

      {/* Header */}
      <div className="pg-head">
        <div>
          <div className="eyebrow" style={{ color: "#7c3aed" }}>Seller Exclusive</div>
          <h1 className="pg-title">📈 Sales Analytics</h1>
          <p className="pg-sub">Detailed performance insights for your seller account.</p>
        </div>
      </div>

      {/* Period Selector */}
      <div className="sa-period-tabs">
        {[["7","7 Days"],["30","30 Days"],["90","3 Months"],["365","1 Year"]].map(([v, l]) => (
          <button
            key={v}
            className={`sa-period-tab${period === v ? " active" : ""}`}
            onClick={() => setPeriod(v)}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && !data && (
        <div className="alert-error" style={{ marginBottom: 24 }}>
          ⚠️ {error}
        </div>
      )}

      {/* No data state */}
      {!error && !data && (
        <div className="sa-card sa-empty">
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>No analytics data yet</div>
          <div>Make your first sales to see analytics here.</div>
        </div>
      )}

      {data && (
        <>
          {/* KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 14, marginBottom: 24 }}>
            {[
              { icon: "💰", label: "Total Revenue",   val: `₹${Number(data.totalRevenue).toLocaleString("en-IN")}`,   color: "#15803d"  },
              { icon: "📦", label: "Orders",           val: data.totalOrders,                                           color: "#0369a1"  },
              { icon: "📊", label: "Avg Order Value",  val: `₹${Number(data.avgOrderValue).toLocaleString("en-IN")}`,  color: "#7c3aed"  },
              { icon: "🏆", label: "Top Product",      val: data.topProduct || "—",                                     color: "#fb923c"  },
            ].map(k => (
              <div key={k.label} className="sa-card">
                <div style={{ fontSize: 22, marginBottom: 8 }}>{k.icon}</div>
                <div style={{ fontSize: 10, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{k.label}</div>
                <div style={{
                  fontFamily: "'Space Grotesk',sans-serif",
                  fontSize: String(k.val).length > 10 ? 14 : String(k.val).length > 6 ? 18 : 24,
                  fontWeight: 800, color: k.color,
                  wordBreak: "break-word",
                }}>
                  {k.val}
                </div>
              </div>
            ))}
          </div>

          <div className="sa-grid-2">
            {/* Daily Revenue Chart */}
            <div className="sa-card">
              <div className="card-title" style={{ marginBottom: 20 }}><CalendarDays size={15} strokeWidth={1.75} style={{ marginRight: 6, color: "#7c3aed", verticalAlign: "middle" }} />Daily Revenue</div>
              {data.daily.length === 0 ? (
                <div className="sa-empty" style={{ padding: "24px 0" }}>No daily data available yet.</div>
              ) : (
                <>
                  <div className="sa-bar-wrap">
                    {data.daily.slice(-Math.min(data.daily.length, 20)).map((d, i) => {
                      const maxRev = Math.max(...data.daily.map(x => x.revenue || 0), 1);
                      const h = Math.max(4, ((d.revenue || 0) / maxRev) * 130);
                      const isHigh = (d.revenue || 0) > maxRev * 0.7;
                      return (
                        <div key={i} className="sa-bar-col" title={`${d.date}: ₹${Number(d.revenue).toLocaleString("en-IN")}`}>
                          <div className="sa-bar-val">
                            {d.revenue > 0 ? `₹${Math.round(d.revenue / 1000)}k` : ""}
                          </div>
                          <div
                            className="sa-bar-fill"
                            style={{
                              height: `${h}px`,
                              background: isHigh
                                ? "linear-gradient(180deg,#a78bfa,#7c3aed)"
                                : "linear-gradient(180deg,rgba(167,139,250,0.55),rgba(124,58,237,0.35))",
                            }}
                          />
                          <div className="sa-bar-lbl">{shortDate(d.date)}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 10, fontStyle: "italic" }}>
                    Showing last {Math.min(data.daily.length, 20)} days · Revenue in ₹
                  </div>
                </>
              )}
            </div>

            {/* By Category */}
            <div className="sa-card">
              <div className="card-title" style={{ marginBottom: 20 }}><Tag size={15} strokeWidth={1.75} style={{ marginRight: 6, color: "#7c3aed", verticalAlign: "middle" }} />Revenue by Category</div>
              {data.byCategory.length === 0 ? (
                <div className="sa-empty" style={{ padding: "24px 0" }}>No category data yet.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {data.byCategory.map((c, i) => {
                    const maxCat = Math.max(...data.byCategory.map(x => x.revenue || 0), 1);
                    return (
                      <div key={i}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                          <span style={{ color: "var(--text)", fontWeight: 600 }}>{c.name}</span>
                          <span style={{ color: "#7c3aed", fontWeight: 800 }}>₹{Number(c.revenue).toLocaleString("en-IN")}</span>
                        </div>
                        <div style={{ height: 8, background: "#f8fafc", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{
                            height: "100%",
                            width: `${((c.revenue || 0) / maxCat) * 100}%`,
                            background: "linear-gradient(90deg,#7c3aed,#a78bfa)",
                            borderRadius: 4, transition: "width 0.6s ease",
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Top Products Table */}
          <div className="sa-card" style={{ marginBottom: 20, overflowX: "auto" }}>
            <div className="card-title" style={{ marginBottom: 18 }}><Trophy size={15} strokeWidth={1.75} style={{ marginRight: 6, color: "#b45309", verticalAlign: "middle" }} />Top Selling Products</div>
            {data.topProducts.length === 0 ? (
              <div className="sa-empty" style={{ padding: "24px 0" }}>No product sales data yet.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 340 }}>
                <thead>
                  <tr>
                    {["#", "Product", "Revenue"].map(h => (
                      <th key={h} style={{
                        textAlign: "left", fontSize: 10, fontWeight: 700,
                        color: "var(--text2)", textTransform: "uppercase",
                        letterSpacing: "0.05em", padding: "8px 14px",
                        borderBottom: "1px solid var(--border)",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.topProducts.map((p, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "12px 14px", color: "var(--text2)", fontSize: 13 }}>#{i + 1}</td>
                      <td style={{ padding: "12px 14px", fontWeight: 700, color: "#0f172a", fontSize: 13 }}>{p.name}</td>
                      <td style={{ padding: "12px 14px", fontWeight: 800, color: "#15803d", fontSize: 15 }}>
                        ₹{Number(p.revenue).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Summary insights (generated from real numbers, no hardcoded business data) */}
          <div className="sa-card">
            <div className="card-title" style={{ marginBottom: 16 }}><ClipboardList size={15} strokeWidth={1.75} style={{ marginRight: 6, color: "#64748b", verticalAlign: "middle" }} />Period Summary</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {buildInsights(data, period).map((ins, i) => (
                <div key={i} className="sa-insight">
                  <div style={{ fontSize: 26, flexShrink: 0 }}>{ins.icon}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{ins.title}</div>
                    <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>{ins.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}

/* ─── Normalise real API response to a consistent shape ─────────────────
   Real API returns:
     { success, totalRevenue, totalOrders, avgOrderValue,
       daily: [{date, revenue, orders}],
       byCategory: [{name, revenue}],
       topProducts: [{name, revenue}] }
──────────────────────────────────────────────────────────────────────── */
function normalise(d) {
  return {
    totalRevenue:  d.totalRevenue  ?? 0,
    totalOrders:   d.totalOrders   ?? 0,
    avgOrderValue: d.avgOrderValue ?? d.avgOrder ?? 0,
    topProduct:    d.topProducts?.[0]?.name ?? null,
    daily:         Array.isArray(d.daily)      ? d.daily      : [],
    byCategory:    Array.isArray(d.byCategory) ? d.byCategory : [],
    topProducts:   Array.isArray(d.topProducts)? d.topProducts: [],
  };
}

/* ─── Build summary insights purely from real computed numbers ───────────
   No hardcoded crop names, prices, or business data.
──────────────────────────────────────────────────────────────────────── */
function buildInsights(data, period) {
  const insights = [];
  const days = Number(period);

  // Revenue summary
  if (data.totalRevenue > 0) {
    insights.push({
      icon: "💰",
      title: "Revenue Summary",
      body: `Total revenue of ₹${Number(data.totalRevenue).toLocaleString("en-IN")} across ${data.totalOrders} order${data.totalOrders !== 1 ? "s" : ""} in the last ${days} day${days !== 1 ? "s" : ""}.`,
    });
  } else {
    insights.push({
      icon: "📊",
      title: "No Sales Yet",
      body: `No orders found in the last ${days} day${days !== 1 ? "s" : ""}. Try expanding the time range or adding more products.`,
    });
  }

  // Top product
  if (data.topProduct) {
    insights.push({
      icon: "🏆",
      title: "Best Performer",
      body: `"${data.topProduct}" is your top-revenue product in this period with ₹${Number(data.topProducts[0]?.revenue ?? 0).toLocaleString("en-IN")} in sales.`,
    });
  }

  // Avg order value
  if (data.avgOrderValue > 0) {
    insights.push({
      icon: "📦",
      title: "Order Size",
      body: `Average order value is ₹${Number(data.avgOrderValue).toLocaleString("en-IN")}. Higher average order values generally indicate bulk buyers.`,
    });
  }

  // Category spread
  if (data.byCategory.length > 1) {
    const top = [...data.byCategory].sort((a, b) => (b.revenue || 0) - (a.revenue || 0))[0];
    insights.push({
      icon: "🗂️",
      title: "Top Category",
      body: `"${top.name}" is your strongest category this period with ₹${Number(top.revenue).toLocaleString("en-IN")} in revenue.`,
    });
  }

  return insights;
}
