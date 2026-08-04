import { useState } from "react";

const DS_ADMIN = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
  .pg-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:16px;flex-wrap:wrap;}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#818cf8;margin-bottom:6px;}
  .pg-title{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:800;color:#fff;line-height:1.2;}
  .pg-sub{font-size:14px;color:#a5b4fc;margin-top:6px;}
  .card{background:rgba(99,102,241,0.04);border:1px solid rgba(99,102,241,0.12);border-radius:18px;padding:20px 22px;}
`;

const DISPUTES = [
  { id: "dsp-101", partyA: "Meena Consumer", partyB: "Ajaykumar2005", issue: "Damaged packaging during transit (Tomatoes)", amount: "₹840", status: "UNDER REVIEW", color: "#fbbf24" },
  { id: "dsp-102", partyA: "Sunil Organic Store", partyB: "Ratnagiri Co-op", issue: "Quantity discrepancy in Mango shipment", amount: "₹4,200", status: "RESOLVED (REFUNDED)", color: "#4ade80" },
];

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState(DISPUTES);
  const [msg, setMsg] = useState("");

  const resolve = (id, resolution) => {
    setDisputes(prev => prev.map(d => d.id === id ? { ...d, status: resolution, color: "#4ade80" } : d));
    setMsg(`✅ Dispute #${id} marked as ${resolution}`);
    setTimeout(() => setMsg(""), 3000);
  };

  return (
    <>
      <style>{DS_ADMIN}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Platform Mediation & Escrow Escrow</div>
          <h1 className="pg-title">⚖️ Dispute Resolution Center</h1>
          <p className="pg-sub">Mediate disputes between buyers, farmers, sellers, and logistics partners.</p>
        </div>
      </div>

      {msg && (
        <div style={{ marginBottom: 20, padding: "12px 18px", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 14, color: "#4ade80", fontWeight: 700, fontSize: 14 }}>
          {msg}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {disputes.map(d => (
          <div key={d.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: "monospace", fontWeight: 800, color: "#818cf8" }}>{d.id}</span>
                  <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 6, background: `${d.color}20`, color: d.color, fontWeight: 800 }}>
                    ● {d.status}
                  </span>
                </div>
                <div style={{ fontWeight: 800, color: "#fff", fontSize: 15, marginTop: 4 }}>
                  Complainant: {d.partyA} vs Respondent: {d.partyB}
                </div>
                <div style={{ fontSize: 13, color: "#a5b4fc", marginTop: 2 }}>Claim Reason: {d.issue}</div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "#a5b4fc", textTransform: "uppercase" }}>Disputed Value</div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color: "#fbbf24" }}>{d.amount}</div>
              </div>
            </div>

            {d.status === "UNDER REVIEW" && (
              <div style={{ display: "flex", gap: 10, marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(99,102,241,0.1)" }}>
                <button onClick={() => resolve(d.id, "RESOLVED (REFUNDED)")}
                  style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.12)", color: "#4ade80", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                  ✅ Approve Refund to Buyer
                </button>
                <button onClick={() => resolve(d.id, "DISMISSED (SELLER FAVORED)")}
                  style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#f87171", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                  🚫 Dismiss Claim
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
