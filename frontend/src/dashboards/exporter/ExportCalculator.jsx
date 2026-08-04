import { useState } from "react";

const DS_EXPORTER = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
  .pg-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:16px;flex-wrap:wrap;}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#f59e0b;margin-bottom:6px;}
  .pg-title{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:800;color:#fff;line-height:1.2;}
  .pg-sub{font-size:14px;color:var(--text2);margin-top:6px;}
  .card{background:rgba(245,158,11,0.04);border:1px solid rgba(245,158,11,0.12);border-radius:18px;padding:22px;}
  .btn-gold{display:inline-flex;align-items:center;gap:8px;padding:12px 22px;border-radius:12px;background:linear-gradient(135deg,#d97706,#f59e0b);color:#fff;font-weight:700;font-size:14px;border:none;cursor:pointer;font-family:'Inter',sans-serif;}
  .field-label{display:block;font-size:12px;font-weight:700;color:var(--text2);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.04em;}
  .field-input{width:100%;padding:10px 14px;border-radius:11px;border:1px solid rgba(245,158,11,0.18);background:rgba(245,158,11,0.05);color:#fff;font-size:14px;font-family:'Inter',sans-serif;outline:none;}
  .field-input option, select option{background:#1a1206;color:#fff;padding:8px;}
`;


export default function ExportCalculator() {
  const [crop, setCrop] = useState("Alphonso Mangoes");
  const [dest, setDest] = useState("United Arab Emirates");
  const [weightTons, setWeightTons] = useState(20);
  const [procureRateInr, setProcureRateInr] = useState(180); // per kg

  // Calculation Math
  const totalProcureCostInr = weightTons * 1000 * procureRateInr; // INR
  const oceanFreightUsd = weightTons * 120; // $120 per ton
  const insuranceUsd = weightTons * 15;
  const cifValueUsd = (totalProcureCostInr / 83.42) + oceanFreightUsd + insuranceUsd;
  const tariffPct = dest === "United Arab Emirates" ? 0 : dest === "Saudi Arabia" ? 5 : dest === "United States" ? 3.2 : 4.5;
  const tariffUsd = (cifValueUsd * tariffPct) / 100;
  const totalLandedCostUsd = cifValueUsd + tariffUsd;
  const sellingPriceUsd = totalLandedCostUsd * 1.28; // 28% export markup
  const netMarginUsd = sellingPriceUsd - totalLandedCostUsd;

  return (
    <>
      <style>{DS_EXPORTER}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Financial Trade Modeling</div>
          <h1 className="pg-title">🧮 CIF Freight & Tariff Margin Calculator</h1>
          <p className="pg-sub">Estimate Cost, Insurance & Freight (CIF), destination port tariffs, landed costs, and net export profits.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Left Input Card */}
        <div className="card">
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 16 }}>
            ⚙️ Export Shipment Parameters
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label className="field-label">Crop / Commodity</label>
              <select className="field-input" value={crop} onChange={e => setCrop(e.target.value)}>
                <option>Alphonso Mangoes</option>
                <option>Basmati Rice 1121</option>
                <option>Salem Turmeric</option>
                <option>G9 Cavendish Bananas</option>
                <option>Black Pepper</option>
              </select>
            </div>

            <div>
              <label className="field-label">Destination Country</label>
              <select className="field-input" value={dest} onChange={e => setDest(e.target.value)}>
                <option>United Arab Emirates</option>
                <option>Saudi Arabia</option>
                <option>United States</option>
                <option>United Kingdom</option>
                <option>Netherlands</option>
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label className="field-label">Shipment Volume (Tons)</label>
                <input className="field-input" type="number" value={weightTons} onChange={e => setWeightTons(Number(e.target.value))} />
              </div>
              <div>
                <label className="field-label">Procurement Rate (₹/kg)</label>
                <input className="field-input" type="number" value={procureRateInr} onChange={e => setProcureRateInr(Number(e.target.value))} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Output Cost Breakdown */}
        <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 16 }}>
              📊 CIF Landed Cost & Profit Projection
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--text2)" }}>Domestic Procurement Cost</span>
                <span style={{ color: "#fff", fontWeight: 700 }}>₹{totalProcureCostInr.toLocaleString("en-IN")} (${Math.round(totalProcureCostInr / 83.42).toLocaleString()})</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--text2)" }}>Sea Freight ($120/Ton)</span>
                <span style={{ color: "#fff", fontWeight: 700 }}>${oceanFreightUsd.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--text2)" }}>Cargo Marine Insurance</span>
                <span style={{ color: "#fff", fontWeight: 700 }}>${insuranceUsd.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--text2)" }}>Destination Tariff ({tariffPct}%)</span>
                <span style={{ color: "#fbbf24", fontWeight: 700 }}>${Math.round(tariffUsd).toLocaleString()}</span>
              </div>

              <div style={{ borderTop: "1px solid rgba(245,158,11,0.15)", paddingTop: 10, display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 800 }}>
                <span style={{ color: "#fff" }}>Total Landed CIF Cost</span>
                <span style={{ color: "#f59e0b" }}>${Math.round(totalLandedCostUsd).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div style={{ background: "rgba(34,197,94,0.08)", padding: "16px", borderRadius: 14, border: "1px solid rgba(34,197,94,0.2)" }}>
            <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase" }}>Estimated Net Profit Margin (28% Markup)</div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 800, color: "#4ade80", marginTop: 4 }}>
              +${Math.round(netMarginUsd).toLocaleString()} USD <span style={{ fontSize: 14, color: "#fff" }}>(₹{Math.round(netMarginUsd * 83.42).toLocaleString("en-IN")})</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
