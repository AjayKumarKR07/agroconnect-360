import { useEffect, useState } from "react";
import { API_URL } from "../../config/api";
import { DS } from "../../styles/ds";

export default function Income() {
  const [summary, setSummary] = useState({ totalIncome: 0, currentMonthIncome: 0, completedOrders: 0, totalQuantitySold: 0 });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("agroconnect_token");
    fetch(`${API_URL}/api/orders/farmer/income`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.summary) setSummary(d.summary);
        if (d.transactions) setTransactions(d.transactions);
        if (!d.summary) setError(d.message || "Unable to load income");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

  const statCards = [
    { emoji: "💰", label: "Total Earnings",    value: fmt(summary.totalIncome),       color: "#4ade80", glow: "#22c55e" },
    { emoji: "📅", label: "This Month",        value: fmt(summary.currentMonthIncome), color: "#38bdf8", glow: "#38bdf8" },
    { emoji: "✅", label: "Completed Orders",  value: summary.completedOrders,         color: "#a78bfa", glow: "#a78bfa" },
    { emoji: "⚖️", label: "Total Qty Sold",   value: `${summary.totalQuantitySold} kg`, color: "#fbbf24", glow: "#fbbf24" },
  ];

  return (
    <>
      <style>{DS}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Earnings</div>
          <h1 className="pg-title">💰 Income</h1>
          <p className="pg-sub">Track your farm earnings and transaction history.</p>
        </div>
      </div>

      {error && <div className="alert-error">⚠️ {error}</div>}

      {loading ? (
        <div className="loading-wrap"><div className="spinner" /><span>Loading income data…</span></div>
      ) : (
        <>
          <div className="stat-grid">
            {statCards.map(({ emoji, label, value, color, glow }) => (
              <div key={label} className="stat-card">
                <div className="stat-glow" style={{ background: glow }} />
                <div className="stat-emoji">{emoji}</div>
                <div className="stat-val" style={{ fontSize: 28 }}>{value}</div>
                <div className="stat-lbl">{label}</div>
              </div>
            ))}
          </div>

          {/* Income bar chart visual */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-title" style={{ marginBottom: 4 }}>📊 Earnings Breakdown</div>
            <div className="card-sub" style={{ marginBottom: 20 }}>Monthly income this year</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120 }}>
              {Array.from({ length: 12 }, (_, i) => {
                const month = new Date(0, i).toLocaleString("en-IN", { month: "short" });
                const monthTxns = transactions.filter((t) => new Date(t.date || t.createdAt).getMonth() === i);
                const monthTotal = monthTxns.reduce((s, t) => s + (t.amount || 0), 0);
                const max = Math.max(...Array.from({ length: 12 }, (_, j) =>
                  transactions.filter((t) => new Date(t.date || t.createdAt).getMonth() === j).reduce((s, t) => s + (t.amount || 0), 0)
                ), 1);
                const h = Math.max((monthTotal / max) * 100, 4);
                const isCur = i === new Date().getMonth();
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{ width: "100%", height: `${h}%`, borderRadius: "4px 4px 0 0", background: isCur ? "linear-gradient(to top,#22c55e,rgba(34,197,94,0.3))" : "rgba(255,255,255,0.08)", transition: "background 0.2s" }}
                      title={`${month}: ${fmt(monthTotal)}`} />
                    <div style={{ fontSize: 10, color: "var(--text2)" }}>{month}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Transactions */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>📋 Transaction History</div>
            {transactions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-emoji">💸</div>
                <div className="empty-title">No transactions yet</div>
                <div className="empty-sub">Completed orders will appear here as income.</div>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Crop</th>
                      <th>Buyer</th>
                      <th>Quantity</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t, i) => (
                      <tr key={t._id || i}>
                        <td style={{ color: "var(--text2)" }}>{new Date(t.date || t.createdAt).toLocaleDateString("en-IN")}</td>
                        <td>{t.cropName || t.crop?.name || "—"}</td>
                        <td style={{ color: "var(--text2)" }}>{t.buyerName || t.buyer?.name || "—"}</td>
                        <td>{t.quantity} {t.unit || "kg"}</td>
                        <td style={{ color: "#4ade80", fontWeight: 700 }}>{fmt(t.amount || t.totalAmount)}</td>
                        <td><span className="badge badge-green">✅ Completed</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}