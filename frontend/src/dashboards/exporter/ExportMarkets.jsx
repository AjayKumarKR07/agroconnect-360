import { useState } from "react";

const DS_EXPORTER = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
  .pg-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:16px;flex-wrap:wrap;}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#f59e0b;margin-bottom:6px;}
  .pg-title{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:800;color:#fff;line-height:1.2;}
  .pg-sub{font-size:14px;color:var(--text2);margin-top:6px;}
  .card{background:rgba(245,158,11,0.04);border:1px solid rgba(245,158,11,0.12);border-radius:18px;padding:20px 22px;}
`;

const DESTINATIONS = [
  { country: "United Arab Emirates 🇦🇪", topImport: "Fresh Fruits & Spices", tariff: "0% (CEPA Free Trade)", demandScore: "HIGH", scoreColor: "#4ade80" },
  { country: "Saudi Arabia 🇸🇦", topImport: "Basmati Rice & Grains", tariff: "5% Standard", demandScore: "VERY HIGH", scoreColor: "#4ade80" },
  { country: "United Kingdom 🇬🇧", topImport: "Organic Spices & Tea", tariff: "0% Preference", demandScore: "MODERATE", scoreColor: "#fbbf24" },
  { country: "Netherlands (EU) 🇳🇱", topImport: "Mangoes & Fresh Grapes", tariff: "EU Phytosanitary Tax", demandScore: "HIGH", scoreColor: "#4ade80" },
  { country: "United States 🇺🇸", topImport: "Turmeric & Pepper", tariff: "3.2% Import Duty", demandScore: "HIGH", scoreColor: "#4ade80" },
];

export default function ExportMarkets() {
  const [currencies] = useState([
    { code: "USD", name: "US Dollar", rate: 83.42, symbol: "$", change: "+0.15%" },
    { code: "EUR", name: "Euro", rate: 90.18, symbol: "€", change: "-0.08%" },
    { code: "AED", name: "UAE Dirham", rate: 22.71, symbol: "AED", change: "+0.04%" },
    { code: "GBP", name: "British Pound", rate: 105.60, symbol: "£", change: "+0.22%" },
  ]);

  return (
    <>
      <style>{DS_EXPORTER}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Foreign Exchange & International Tariffs</div>
          <h1 className="pg-title">💱 Global FX & Export Market Insights</h1>
          <p className="pg-sub">Track foreign currency exchange rates, destination tariffs, and global agricultural demand scores.</p>
        </div>
      </div>

      {/* Currency Exchange Rates */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 14 }}>
          💱 Live Forex Exchange Rates (to INR)
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
          {currencies.map(c => (
            <div key={c.code} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#fbbf24" }}>{c.code} / INR</span>
                <span style={{ fontSize: 11, color: c.change.startsWith("+") ? "#4ade80" : "#f87171", fontWeight: 700 }}>{c.change}</span>
              </div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 800, color: "#fff" }}>
                ₹{c.rate}
              </div>
              <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 4 }}>1 {c.code} = ₹{c.rate} INR</div>
            </div>
          ))}
        </div>
      </div>

      {/* Target Destination Market & Tariff Index */}
      <div>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 14 }}>
          🌍 Target Destination Market Index & Import Tariffs
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {DESTINATIONS.map(d => (
            <div key={d.country} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 800, color: "#fff", fontSize: 16 }}>{d.country}</div>
                <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 2 }}>
                  Top Import Category: <strong style={{ color: "#fef08a" }}>{d.topImport}</strong>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase" }}>Import Tariff</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{d.tariff}</div>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase" }}>Demand Rating</div>
                  <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: `${d.scoreColor}20`, color: d.scoreColor, fontWeight: 800 }}>
                    {d.demandScore}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
