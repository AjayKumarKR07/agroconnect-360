import { useEffect, useState } from "react";
import { API_URL } from "../../config/api";
import { DS } from "../../styles/ds";

/* ── helpers ─────────────────────────────────────────────────────── */
const fmt  = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const na   = (v) => (v != null && v !== "" ? v : "—");

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const PAYMENT_LABELS = {
  cod:        "Cash on Delivery",
  upi:        "UPI",
  card:       "Card",
  netbanking: "Net Banking",
};

export default function Income() {
  const [summary,      setSummary]      = useState({
    totalIncome: 0, currentMonthIncome: 0,
    completedOrders: 0, totalQuantitySold: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");

  useEffect(() => {
    const token = localStorage.getItem("agroconnect_token");
    fetch(`${API_URL}/api/orders/farmer/income`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.summary)      setSummary(d.summary);
        if (d.transactions) setTransactions(d.transactions);
        if (!d.summary)     setError(d.message || "Unable to load income");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  /* ── Bar chart data ─────────────────────────────────────────────
     API returns transactions[].amount (farmerAmount per order)
     and transactions[].date (= order.updatedAt / deliveredAt)
  ─────────────────────────────────────────────────────────────── */
  const curYear = new Date().getFullYear();
  const curMon  = new Date().getMonth();

  // Build monthly totals (current year only)
  const monthlyTotals = MONTHS.map((_, i) =>
    transactions.reduce((sum, t) => {
      const d = new Date(t.date || t.deliveredAt || t.createdAt);
      if (d.getFullYear() === curYear && d.getMonth() === i) {
        return sum + Number(t.amount || t.totalAmount || 0);
      }
      return sum;
    }, 0)
  );

  const maxVal = Math.max(...monthlyTotals, 1); // avoid /0

  const statCards = [
    { emoji: "💰", label: "Total Earnings",   value: fmt(summary.totalIncome),        color: "#4ade80", glow: "#22c55e" },
    { emoji: "📅", label: "This Month",       value: fmt(summary.currentMonthIncome),  color: "#38bdf8", glow: "#38bdf8" },
    { emoji: "✅", label: "Completed Orders", value: summary.completedOrders,          color: "#a78bfa", glow: "#a78bfa" },
    { emoji: "⚖️", label: "Qty Sold",        value: `${summary.totalQuantitySold}`,   color: "#fbbf24", glow: "#fbbf24" },
  ];

  return (
    <>
      <style>{DS + `
        .inc-chart-wrap {
          display: flex;
          align-items: flex-end;
          gap: 5px;
          height: 140px;
          padding-bottom: 28px;   /* space for month labels */
          position: relative;
        }
        .inc-bar-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
          justify-content: flex-end;
          gap: 0;
        }
        .inc-bar {
          width: 100%;
          min-height: 3px;
          border-radius: 4px 4px 0 0;
          transition: background 0.3s, height 0.4s;
          cursor: default;
        }
        .inc-bar:hover { filter: brightness(1.25); }
        .inc-month-lbl {
          font-size: 10px;
          color: var(--text2);
          margin-top: 6px;
          white-space: nowrap;
        }
        .inc-bar-cur { background: linear-gradient(to top,#22c55e,rgba(34,197,94,0.45)); }
        .inc-bar-def { background: rgba(255,255,255,0.10); }
        .inc-bar-has { background: rgba(56,189,248,0.35); }
        .inc-amount-tip {
          font-size: 9px;
          color: var(--text2);
          text-align: center;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          width: 100%;
        }
      `}</style>

      {/* ── Page header ── */}
      <div className="pg-head">
        <div>
          <div className="eyebrow">Earnings</div>
          <h1 className="pg-title">💰 Income</h1>
          <p className="pg-sub">Track your farm earnings and transaction history.</p>
        </div>
      </div>

      {error && <div className="alert-error">⚠️ {error}</div>}

      {loading ? (
        <div className="loading-wrap">
          <div className="spinner" />
          <span>Loading income data…</span>
        </div>
      ) : (
        <>
          {/* ── Stat cards ── */}
          <div className="stat-grid">
            {statCards.map(({ emoji, label, value, color, glow }) => (
              <div key={label} className="stat-card">
                <div className="stat-glow" style={{ background: glow }} />
                <div className="stat-emoji">{emoji}</div>
                <div className="stat-val" style={{ fontSize: 26 }}>{value}</div>
                <div className="stat-lbl">{label}</div>
              </div>
            ))}
          </div>

          {/* ── Earnings Breakdown chart ── */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div className="card-title">📊 Earnings Breakdown</div>
                <div className="card-sub">Monthly income — {curYear}</div>
              </div>
              {maxVal > 1 && (
                <div style={{ fontSize: 12, color: "#7a8fa6" }}>
                  Peak: {fmt(maxVal)}
                </div>
              )}
            </div>

            {transactions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text2)", fontSize: 14 }}>
                No completed orders yet — earnings will appear here once orders are delivered.
              </div>
            ) : (
              <div className="inc-chart-wrap">
                {MONTHS.map((mon, i) => {
                  const val    = monthlyTotals[i];
                  const pct    = val > 0 ? Math.max((val / maxVal) * 100, 6) : 0;
                  const isCur  = i === curMon;
                  const hasVal = val > 0;
                  return (
                    <div
                      key={mon}
                      className="inc-bar-col"
                      title={`${mon} ${curYear}: ${fmt(val)}`}
                    >
                      {/* Bar — only render if there's a value */}
                      <div
                        className={`inc-bar ${isCur ? "inc-bar-cur" : hasVal ? "inc-bar-has" : "inc-bar-def"}`}
                        style={{ height: `${pct}%` }}
                      />
                      {/* Month label */}
                      <div className="inc-month-lbl" style={{ color: isCur ? "#4ade80" : undefined }}>
                        {mon}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Legend */}
            {transactions.length > 0 && (
              <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#7a8fa6" }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: "#22c55e" }} />
                  Current month
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#7a8fa6" }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: "rgba(56,189,248,0.4)" }} />
                  Past months
                </div>
              </div>
            )}
          </div>

          {/* ── Transaction History ── */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div className="card-title">📋 Transaction History</div>
              {transactions.length > 0 && (
                <div style={{
                  fontSize: 12, color: "#7a8fa6",
                  background: "var(--surface2)", padding: "4px 10px",
                  borderRadius: 8, border: "1px solid var(--border)",
                }}>
                  {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
                </div>
              )}
            </div>

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
                      <th>Payment</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t, i) => {
                      const txDate  = new Date(t.date || t.deliveredAt || t.createdAt);
                      const txAmt   = t.amount ?? t.totalAmount ?? 0;
                      const txQty   = t.quantity ?? 0;
                      const txUnit  = t.unit || "kg";
                      const txCrop  = t.cropName || t.crop?.name || na(null);
                      const txBuyer = t.buyerName || t.buyer?.name || na(null);
                      const txPay   = PAYMENT_LABELS[t.paymentMethod] || t.paymentMethod || na(null);
                      return (
                        <tr key={t.orderId || t._id || i}>
                          <td style={{ color: "var(--text2)", whiteSpace: "nowrap" }}>
                            {txDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </td>
                          <td style={{ fontWeight: 600 }}>{txCrop}</td>
                          <td style={{ color: "var(--text2)" }}>{txBuyer}</td>
                          <td>{txQty} {txUnit}</td>
                          <td style={{ color: "var(--text2)", fontSize: 12 }}>{txPay}</td>
                          <td style={{ color: "#4ade80", fontWeight: 700 }}>{fmt(txAmt)}</td>
                          <td>
                            <span className="badge badge-green">✅ Delivered</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Items breakdown (if multi-item orders exist) ── */}
          {transactions.some(t => Array.isArray(t.items) && t.items.length > 1) && (
            <div className="card" style={{ marginTop: 20 }}>
              <div className="card-title" style={{ marginBottom: 16 }}>🌾 Order Item Details</div>
              {transactions.map((t, ti) => {
                const items = Array.isArray(t.items) ? t.items : [];
                if (items.length === 0) return null;
                return (
                  <div key={ti} style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#7a8fa6", marginBottom: 8 }}>
                      Order #{String(t.orderId || "").slice(-8).toUpperCase()} &nbsp;·&nbsp;
                      {new Date(t.date || t.deliveredAt).toLocaleDateString("en-IN")}
                    </div>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Crop</th>
                          <th>Qty</th>
                          <th>Price/Unit</th>
                          <th>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, ii) => (
                          <tr key={ii}>
                            <td>{item.cropName || "—"}</td>
                            <td>{item.quantity} {item.unit || "kg"}</td>
                            <td style={{ color: "var(--text2)" }}>{fmt(item.price)}</td>
                            <td style={{ color: "#4ade80", fontWeight: 700 }}>{fmt(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </>
  );
}