import { useState } from "react";

const DS_ADMIN = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
  .pg-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:16px;flex-wrap:wrap;}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#818cf8;margin-bottom:6px;}
  .pg-title{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:800;color:#fff;line-height:1.2;}
  .pg-sub{font-size:14px;color:#a5b4fc;margin-top:6px;}
  .card{background:rgba(99,102,241,0.04);border:1px solid rgba(99,102,241,0.12);border-radius:18px;padding:20px 22px;}
`;

const TRANSACTIONS = [
  { id: "tx-881", buyer: "Meena Fresh Produce", seller: "Ajaykumar2005", gmv: "₹14,000", fee: "₹350 (2.5%)", method: "UPI", status: "COMPLETED", date: "Today" },
  { id: "tx-882", buyer: "Sunil Organic Store", seller: "Jalgaon Banana Hub", gmv: "₹45,000", fee: "₹1,125 (2.5%)", method: "Razorpay Card", status: "COMPLETED", date: "Yesterday" },
  { id: "tx-883", buyer: "Global Agro Trade", seller: "Ratnagiri Orchards", gmv: "₹2,50,000", fee: "₹6,250 (2.5%)", method: "Bank Wire", status: "COMPLETED", date: "2 Aug 2026" },
];

export default function AdminFinance() {
  const [txs] = useState(TRANSACTIONS);

  return (
    <>
      <style>{DS_ADMIN}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Financial Analytics & Platform Monitization</div>
          <h1 className="pg-title">💰 Platform Revenue & Fee Analytics</h1>
          <p className="pg-sub">Monitor ecosystem GMV, 2.5% transaction fee commissions, and payout processing status.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16, marginBottom: 26 }}>
        {[
          ["💵", "Total GMV Volume", "₹4,82,50,000", "All Ecosystem Sales", "#4ade80"],
          ["💰", "Platform Net Revenue", "₹12,06,250", "2.5% Average Take Rate", "#818cf8"],
          ["💳", "Successful Payments", "98.8%", "UPI / Card / NetBanking", "#38bdf8"],
          ["🏦", "Farmer Payouts Settled", "₹4.70 Cr", "T+1 Automatic Settlement", "#fbbf24"],
        ].map(([emoji, label, val, sub, color]) => (
          <div key={label} className="card">
            <div style={{ fontSize: 24, marginBottom: 8 }}>{emoji}</div>
            <div style={{ fontSize: 11, color: "#a5b4fc", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 24, fontWeight: 800, color }}>{val}</div>
            <div style={{ fontSize: 12, color: "#a5b4fc", marginTop: 4 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Transaction Feed */}
      <div className="card">
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 16 }}>
          🧾 Recent Platform Transactions & Commissions
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {txs.map(t => (
            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "rgba(99,102,241,0.03)", borderRadius: 12, border: "1px solid rgba(99,102,241,0.08)", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: "monospace", fontWeight: 800, color: "#818cf8" }}>{t.id}</span>
                  <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 6, background: "rgba(34,197,94,0.15)", color: "#4ade80", fontWeight: 800 }}>
                    ● {t.status}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "#fff", fontWeight: 700, marginTop: 4 }}>Buyer: {t.buyer} → Seller: {t.seller}</div>
                <div style={{ fontSize: 11, color: "#a5b4fc", marginTop: 2 }}>Payment via {t.method} · {t.date}</div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 800, color: "#fff" }}>{t.gmv}</div>
                <div style={{ fontSize: 12, color: "#4ade80", fontWeight: 700 }}>Fee: {t.fee}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
