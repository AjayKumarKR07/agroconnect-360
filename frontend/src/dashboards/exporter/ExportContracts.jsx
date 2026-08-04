import { useState } from "react";

const DS_EXPORTER = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
  .pg-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:16px;flex-wrap:wrap;}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#f59e0b;margin-bottom:6px;}
  .pg-title{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:800;color:#fff;line-height:1.2;}
  .pg-sub{font-size:14px;color:var(--text2);margin-top:6px;}
  .card{background:rgba(245,158,11,0.04);border:1px solid rgba(245,158,11,0.12);border-radius:18px;padding:22px;}
  .btn-gold{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:12px;background:linear-gradient(135deg,#d97706,#f59e0b);color:#fff;font-weight:700;font-size:14px;border:none;cursor:pointer;font-family:'Inter',sans-serif;}
  .btn-ghost{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:10px;border:1px solid rgba(245,158,11,0.2);background:rgba(245,158,11,0.06);color:#fef08a;font-weight:600;font-size:12px;cursor:pointer;font-family:'Inter',sans-serif;}
`;

const CONTRACTS = [
  { id: "lc-901", buyer: "Al Maya Trading LLC", country: "Dubai, UAE 🇦🇪", crop: "Alphonso Mangoes (20 Tons)", valUsd: "$95,000", bank: "Emirates NBD", lcType: "Irrevocable LC at Sight", status: "RELEASED (70%)", milestoneStep: 2, milestones: ["20% Advance", "50% BL Onboard", "30% Port Customs"] },
  { id: "lc-902", buyer: "EuroAgro Imports BV", country: "Rotterdam, Netherlands 🇳🇱", crop: "Basmati Rice 1121 (50 Tons)", valUsd: "$110,000", bank: "Rabobank International", lcType: "Confirmed LC 60 Days", status: "IN PROGRESS (50%)", milestoneStep: 1, milestones: ["20% Advance", "50% BL Onboard", "30% Port Customs"] },
  { id: "lc-903", buyer: "Global Spice Corp", country: "London, UK 🇬🇧", crop: "Salem Turmeric (15 Tons)", valUsd: "$43,500", bank: "Standard Chartered UK", lcType: "Irrevocable LC at Sight", status: "ADVANCE (20%)", milestoneStep: 0, milestones: ["20% Advance", "50% BL Onboard", "30% Port Customs"] },
];

export default function ExportContracts() {
  const [contracts] = useState(CONTRACTS);
  const [msg, setMsg] = useState("");

  const downloadProforma = (id) => {
    setMsg(`📄 Proforma Invoice generated for Contract #${id}!`);
    setTimeout(() => setMsg(""), 3000);
  };

  return (
    <>
      <style>{DS_EXPORTER}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Bank Letters of Credit & Trade Contracts</div>
          <h1 className="pg-title">📜 Export Contracts & Letter of Credit (LC) Hub</h1>
          <p className="pg-sub">Manage irrevocable bank Letters of Credit (LC), milestone payment releases, and proforma invoices.</p>
        </div>
      </div>

      {msg && (
        <div style={{ marginBottom: 20, padding: "12px 18px", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 14, color: "#4ade80", fontWeight: 700, fontSize: 14 }}>
          {msg}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {contracts.map(c => (
          <div key={c.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: "monospace", fontWeight: 800, color: "#fbbf24", fontSize: 16 }}>{c.id}</span>
                  <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "rgba(245,158,11,0.15)", color: "#fef08a", fontWeight: 800, border: "1px solid rgba(245,158,11,0.3)" }}>
                    {c.lcType}
                  </span>
                </div>
                <div style={{ fontWeight: 800, color: "#fff", fontSize: 16, marginTop: 4 }}>{c.buyer} <span style={{ fontSize: 13, color: "var(--text2)", fontWeight: 400 }}>({c.country})</span></div>
                <div style={{ fontSize: 13, color: "#38bdf8", fontWeight: 600, marginTop: 2 }}>🌾 {c.crop}</div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase" }}>Contract Value</div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 800, color: "#4ade80" }}>{c.valUsd}</div>
                <div style={{ fontSize: 12, color: "var(--text2)" }}>Issuing Bank: <strong style={{ color: "#fff" }}>{c.bank}</strong></div>
              </div>
            </div>

            {/* Payment Milestones Stepper */}
            <div style={{ background: "rgba(0,0,0,0.2)", padding: "14px 16px", borderRadius: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
                LC Payment Release Milestones ({c.status})
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                {c.milestones.map((m, idx) => {
                  const done = idx <= c.milestoneStep;
                  return (
                    <div key={m} style={{ flex: 1, padding: "8px 12px", borderRadius: 10, background: done ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.04)", border: `1px solid ${done ? "rgba(34,197,94,0.3)" : "rgba(245,158,11,0.1)"}`, textAlign: "center" }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: done ? "#4ade80" : "var(--text2)" }}>{done ? "✓ RELEASED" : "PENDING"}</div>
                      <div style={{ fontSize: 12, color: "#fff", fontWeight: 700, marginTop: 2 }}>{m}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button className="btn-ghost" onClick={() => downloadProforma(c.id)}>
              📄 Download Proforma Invoice & LC Terms
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
