import { useEffect, useState } from "react";
import { API_URL } from "../../config/api";
import { DS } from "../../styles/ds";
import { TrendingUp, Receipt, RefreshCw, DollarSign, Package, BarChart2, Award, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function SellerRevenue() {
  const [data,    setData]    = useState({ totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, monthly: [] });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const token = localStorage.getItem("agroconnect_token");

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const r = await fetch(`${API_URL}/api/seller/revenue`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (d.success) setData(d);
      else setError(d.message || "Unable to load revenue data");
    } catch { setError("Network error — could not reach the server"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const maxMonthly = Math.max(...(data.monthly || []).map(m => m.revenue || 0), 1);

  return (
    <>
      <style>{DS}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Financial Summary</div>
          <h1 className="pg-title"><TrendingUp size={22} strokeWidth={2} style={{ marginRight: 8, color: "#7c3aed", verticalAlign: "middle" }} />Revenue Report</h1>
          <p className="pg-sub">Track your earnings and sales performance.</p>
        </div>
      </div>

      {loading && <div className="loading-wrap"><div className="spinner" /><span>Loading revenue data…</span></div>}

      {error && !loading && (
        <div className="card" style={{ marginBottom: 24, border: "1px solid rgba(239,68,68,0.2)", background: "#fef2f2" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <AlertTriangle size={18} style={{ color: "#dc2626" }} />
              <span style={{ color: "#dc2626", fontWeight: 600, fontSize: 14 }}>Unable to load revenue data — {error}</span>
            </div>
            <button onClick={load} className="btn-ghost" style={{ fontSize: 13, padding: "8px 16px", display: "inline-flex", alignItems: "center", gap: 5 }}><RefreshCw size={13} strokeWidth={2} />Retry</button>
          </div>
        </div>
      )}

      {!loading && (
        <>
          {/* Summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginBottom: 28 }}>
            {[
              [DollarSign, "Total Revenue",   `₹${Number(data.totalRevenue || 0).toLocaleString("en-IN")}`, "#15803d"],
              [Package, "Orders Completed", data.totalOrders || 0, "#0369a1"],
              [BarChart2, "Avg Order Value",  `₹${Math.round(data.avgOrderValue || 0).toLocaleString("en-IN")}`, "#7c3aed"],
              [Award, "Best Month",      data.monthly?.length > 0 ? data.monthly.reduce((a, b) => (a.revenue > b.revenue ? a : b)).month : "—", "#b45309"],
            ].map(([Icon, label, val, color]) => (
              <div key={label} className="card" style={{ padding: "22px 24px" }}>
                <div style={{ marginBottom: 10, color }}><Icon size={24} /></div>
                <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 800, color }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Monthly Bar Chart */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-title" style={{ marginBottom: 20 }}><TrendingUp size={15} strokeWidth={1.75} style={{ marginRight: 6, color: "#7c3aed", verticalAlign: "middle" }} />Monthly Revenue</div>
            {data.monthly && data.monthly.length > 0 ? (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 180, padding: "0 8px" }}>
                {data.monthly.map((m, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{ fontSize: 10, color: "#7c3aed", fontWeight: 700 }}>₹{Math.round((m.revenue || 0) / 1000)}k</div>
                    <div style={{
                      width: "100%", borderRadius: "6px 6px 0 0",
                      height: `${Math.max(8, ((m.revenue || 0) / maxMonthly) * 140)}px`,
                      background: "linear-gradient(180deg, #a78bfa, #7c3aed)",
                      transition: "height 0.5s ease",
                      boxShadow: "0 4px 14px rgba(167,139,250,0.2)",
                    }} />
                    <div style={{ fontSize: 10, color: "var(--text2)" }}>{m.month}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: "32px" }}>
                <div className="empty-emoji"><TrendingUp size={40} strokeWidth={1.5} color="#ddd6fe" /></div>
                <div className="empty-title">No revenue data yet</div>
                <div className="empty-sub">Revenue will appear here as orders are accepted.</div>
              </div>
            )}
          </div>

          {/* Transaction table */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 18 }}><Receipt size={15} strokeWidth={1.75} style={{ marginRight: 6, color: "#7c3aed", verticalAlign: "middle" }} />Recent Transactions</div>
            {data.transactions && data.transactions.length > 0 ? (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Product", "Buyer", "Qty", "Amount", "Date", "Status"].map(h => (
                      <th key={h} style={{ textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", padding: "10px 14px", borderBottom: "1px solid var(--border)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.map((t, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "12px 14px", fontWeight: 600, color: "#0f172a", fontSize: 14 }}>{t.product}</td>
                      <td style={{ padding: "12px 14px", color: "var(--text2)", fontSize: 13 }}>{t.buyer}</td>
                      <td style={{ padding: "12px 14px", color: "var(--text2)", fontSize: 13 }}>{t.qty} {t.unit}</td>
                      <td style={{ padding: "12px 14px", fontWeight: 800, color: "#15803d", fontSize: 14 }}>₹{Number(t.amount).toLocaleString("en-IN")}</td>
                      <td style={{ padding: "12px 14px", color: "var(--text2)", fontSize: 13 }}>{new Date(t.date).toLocaleDateString("en-IN")}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, background: "rgba(34,197,94,0.1)", color: "#15803d", display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <CheckCircle2 size={12} /> {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--text2)", fontSize: 14 }}>No transactions to show yet.</div>
            )}
          </div>
        </>
      )}
    </>
  );
}
