import { useState, useEffect, useCallback } from "react";
import { API_URL } from "../../config/api";

const DS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
  .pg-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:16px;flex-wrap:wrap;}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#f59e0b;margin-bottom:6px;}
  .pg-title{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:800;color:#fff;line-height:1.2;}
  .pg-sub{font-size:14px;color:var(--text2);margin-top:6px;}
  .card{background:rgba(245,158,11,0.04);border:1px solid rgba(245,158,11,0.12);border-radius:18px;padding:22px;}
  .btn-gold{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:12px;background:linear-gradient(135deg,#d97706,#f59e0b);color:#fff;font-weight:700;font-size:14px;border:none;cursor:pointer;font-family:'Inter',sans-serif;}
  .btn-ghost{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:10px;border:1px solid rgba(245,158,11,0.2);background:rgba(245,158,11,0.06);color:#fef08a;font-weight:600;font-size:12px;cursor:pointer;font-family:'Inter',sans-serif;}
  .field-label{display:block;font-size:11px;font-weight:700;color:#a38a5d;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;}
  .field-input{width:100%;padding:10px 14px;border-radius:11px;border:1px solid rgba(245,158,11,0.18);background:rgba(245,158,11,0.05);color:#fff;font-size:14px;font-family:'Inter',sans-serif;outline:none;}
  .field-input:focus{border-color:rgba(245,158,11,0.4);}
  .field-input option{background:#1a1206;color:#fff;}
  .row{display:flex;justify-content:space-between;align-items:center;font-size:13px;padding:6px 0;}
  .divider{border-top:1px solid rgba(245,158,11,0.12);margin:10px 0;}
`;

/* ── Tariff rates by destination (approximate WTO/FTA rates for agri) ── */
const DESTINATIONS = [
  { name: "United Arab Emirates",  tariff: 0,   flag: "🇦🇪" },
  { name: "Saudi Arabia",          tariff: 5,   flag: "🇸🇦" },
  { name: "Qatar",                 tariff: 0,   flag: "🇶🇦" },
  { name: "Kuwait",                tariff: 5,   flag: "🇰🇼" },
  { name: "Bahrain",               tariff: 5,   flag: "🇧🇭" },
  { name: "Oman",                  tariff: 5,   flag: "🇴🇲" },
  { name: "United States",         tariff: 3.2, flag: "🇺🇸" },
  { name: "United Kingdom",        tariff: 4.0, flag: "🇬🇧" },
  { name: "Netherlands",           tariff: 4.5, flag: "🇳🇱" },
  { name: "Germany",               tariff: 4.5, flag: "🇩🇪" },
  { name: "France",                tariff: 4.5, flag: "🇫🇷" },
  { name: "Belgium",               tariff: 4.5, flag: "🇧🇪" },
  { name: "Singapore",             tariff: 0,   flag: "🇸🇬" },
  { name: "Malaysia",              tariff: 2,   flag: "🇲🇾" },
  { name: "Japan",                 tariff: 3.6, flag: "🇯🇵" },
  { name: "Australia",             tariff: 0,   flag: "🇦🇺" },
  { name: "Canada",                tariff: 3.0, flag: "🇨🇦" },
];

const STATIC_CROPS = [
  "Alphonso Mangoes", "Basmati Rice 1121", "Salem Turmeric",
  "G9 Cavendish Bananas", "Black Pepper", "Cumin Seeds",
  "Onions", "Potatoes", "Pomegranate", "Grapes",
  "Green Chilli", "Ginger", "Cardamom", "Coriander Seeds",
];

const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("agroconnect_token")}` });

function fmtUsd(n)  { return `$${Math.round(n).toLocaleString("en-US")}`; }
function fmtInr(n)  { return `₹${Math.round(n).toLocaleString("en-IN")}`; }

export default function ExportCalculator() {
  /* ── Inputs ─────────────────────────────────────────────────────── */
  const [crop,          setCrop]          = useState("Alphonso Mangoes");
  const [dest,          setDest]          = useState("United Arab Emirates");
  const [weightTons,    setWeightTons]    = useState(20);
  const [procureRate,   setProcureRate]   = useState(180);   // ₹/kg
  const [freightPerTon, setFreightPerTon] = useState(120);   // USD/ton
  const [markupPct,     setMarkupPct]     = useState(28);    // %
  const [customTariff,  setCustomTariff]  = useState(null);  // override tariff

  /* ── Live FX ─────────────────────────────────────────────────────── */
  const [usdInr,     setUsdInr]     = useState(83.42);
  const [fxLoading,  setFxLoading]  = useState(true);
  const [fxUpdated,  setFxUpdated]  = useState(null);

  /* ── Crop list from real shipments ───────────────────────────────── */
  const [cropList,  setCropList]  = useState(STATIC_CROPS);

  /* ── Advanced toggle ─────────────────────────────────────────────── */
  const [showAdv, setShowAdv] = useState(false);

  /* ── Print toast ─────────────────────────────────────────────────── */
  const [toast, setToast] = useState("");
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(""), 3000); };

  /* ── Fetch live USD/INR ──────────────────────────────────────────── */
  const fetchFx = useCallback(async () => {
    setFxLoading(true);
    try {
      const r = await fetch("https://open.er-api.com/v6/latest/USD");
      const d = await r.json();
      if (d.result === "success" && d.rates?.INR) {
        setUsdInr(d.rates.INR);
        setFxUpdated(new Date());
      }
    } catch {}
    finally { setFxLoading(false); }
  }, []);

  /* ── Fetch real crop names from exporter's shipments ─────────────── */
  const fetchCrops = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/api/exporter/shipments`, { headers: authH() });
      const d = await r.json();
      if (d.success && d.shipments?.length > 0) {
        const realCrops = [...new Set(d.shipments.map(s => s.cargo).filter(Boolean))];
        if (realCrops.length > 0) setCropList([...realCrops, ...STATIC_CROPS.filter(c => !realCrops.includes(c))]);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchFx();
    fetchCrops();
    const t = setInterval(fetchFx, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [fetchFx, fetchCrops]);

  /* ── Derived values ─────────────────────────────────────────────── */
  const destCfg      = DESTINATIONS.find(d => d.name === dest) || DESTINATIONS[0];
  const tariffPct    = customTariff !== null ? Number(customTariff) : destCfg.tariff;

  const procureCostInr = weightTons * 1000 * procureRate;
  const procureCostUsd = procureCostInr / usdInr;
  const freightUsd     = weightTons * freightPerTon;
  const insuranceUsd   = procureCostUsd * 0.005; // 0.5% of CIF value
  const cifValueUsd    = procureCostUsd + freightUsd + insuranceUsd;
  const tariffUsd      = (cifValueUsd * tariffPct) / 100;
  const landedCostUsd  = cifValueUsd + tariffUsd;
  const sellingUsd     = landedCostUsd * (1 + markupPct / 100);
  const netMarginUsd   = sellingUsd - landedCostUsd;
  const marginPctActual = (netMarginUsd / landedCostUsd) * 100;
  const pricePerTonUsd = landedCostUsd / (weightTons || 1);

  /* ── Print calculation ───────────────────────────────────────────── */
  const printCalc = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head>
      <title>Export Margin Estimate — ${crop} to ${dest}</title>
      <style>
        body{font-family:sans-serif;padding:36px;color:#1e293b;}
        h1{font-size:20px;margin-bottom:4px;}
        .sub{font-size:13px;color:#64748b;margin-bottom:24px;}
        table{width:100%;border-collapse:collapse;margin:16px 0;}
        th,td{border:1px solid #e2e8f0;padding:10px 14px;font-size:13px;text-align:left;}
        th{background:#f8fafc;font-weight:700;}
        .total{font-weight:800;font-size:14px;}
        .profit{color:#047857;font-weight:800;font-size:16px;}
        .footer{margin-top:32px;font-size:11px;color:#94a3b8;}
      </style>
    </head><body>
      <h1>🧮 CIF Export Margin Estimate</h1>
      <div class="sub">${crop} → ${dest} · Generated ${new Date().toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}</div>
      <table>
        <tr><th>Parameter</th><th>Value</th></tr>
        <tr><td>Shipment Volume</td><td>${weightTons} MT</td></tr>
        <tr><td>Procurement Rate</td><td>₹${procureRate}/kg</td></tr>
        <tr><td>Domestic Procurement Cost</td><td>${fmtInr(procureCostInr)} (${fmtUsd(procureCostUsd)})</td></tr>
        <tr><td>Ocean Freight ($${freightPerTon}/MT)</td><td>${fmtUsd(freightUsd)}</td></tr>
        <tr><td>Marine Insurance (0.5%)</td><td>${fmtUsd(insuranceUsd)}</td></tr>
        <tr><td>Destination Tariff (${tariffPct}%)</td><td>${fmtUsd(tariffUsd)}</td></tr>
        <tr class="total"><td>Total Landed CIF Cost</td><td>${fmtUsd(landedCostUsd)}</td></tr>
        <tr class="total"><td>Selling Price (${markupPct}% markup)</td><td>${fmtUsd(sellingUsd)}</td></tr>
      </table>
      <div class="profit">Net Profit Margin: +${fmtUsd(netMarginUsd)} (${marginPctActual.toFixed(1)}%)</div>
      <div class="footer">FX Rate used: 1 USD = ₹${usdInr.toFixed(2)} · AgroConnect 360 Margin Calculator</div>
      <script>window.onload=()=>setTimeout(()=>window.print(),300);<\/script>
    </body></html>`);
    w.document.close();
    showToast("📄 Opening print/PDF dialog…");
  };

  return (
    <>
      <style>{DS}</style>

      {toast && (
        <div style={{ position: "fixed", bottom: 28, right: 28, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", color: "#fbbf24", padding: "12px 20px", borderRadius: 12, fontWeight: 700, fontSize: 14, zIndex: 99999 }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="pg-head">
        <div>
          <div className="eyebrow">Financial Trade Modeling</div>
          <h1 className="pg-title">🧮 CIF Freight & Tariff Margin Calculator</h1>
          <p className="pg-sub">Estimate Cost, Insurance & Freight (CIF), destination port tariffs, landed costs, and net export profits.</p>
        </div>
        {/* Live FX badge */}
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "#a38a5d", marginBottom: 4 }}>
            {fxLoading ? "Fetching FX…" : `Live FX · ${fxUpdated ? fxUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}`}
          </div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: "#fbbf24" }}>
            1 USD = ₹{usdInr.toFixed(2)}
          </div>
          <button onClick={fetchFx} style={{ background: "none", border: "none", color: "#a38a5d", cursor: "pointer", fontSize: 12, marginTop: 2 }}>⟳ Refresh</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
        {/* ── Left: Inputs ─────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card">
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 16 }}>⚙️ Export Shipment Parameters</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label className="field-label">Crop / Commodity</label>
                <select className="field-input" value={crop} onChange={e => setCrop(e.target.value)} style={{ appearance: "none" }}>
                  {cropList.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="field-label">Destination Country</label>
                <select className="field-input" value={dest} onChange={e => { setDest(e.target.value); setCustomTariff(null); }} style={{ appearance: "none" }}>
                  {DESTINATIONS.map(d => (
                    <option key={d.name} value={d.name}>{d.flag} {d.name} (Tariff: {d.tariff}%)</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label className="field-label">Shipment Volume (MT)</label>
                  <input className="field-input" type="number" min="1" value={weightTons} onChange={e => setWeightTons(Number(e.target.value) || 1)} />
                </div>
                <div>
                  <label className="field-label">Procurement Rate (₹/kg)</label>
                  <input className="field-input" type="number" min="1" value={procureRate} onChange={e => setProcureRate(Number(e.target.value) || 1)} />
                </div>
              </div>

              {/* Advanced toggle */}
              <button
                type="button"
                className="btn-ghost"
                style={{ alignSelf: "flex-start", fontSize: 12 }}
                onClick={() => setShowAdv(p => !p)}
              >
                {showAdv ? "▲ Hide" : "▼ Advanced"} Options
              </button>

              {showAdv && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, padding: "14px", borderRadius: 12, background: "rgba(0,0,0,0.2)", border: "1px solid rgba(245,158,11,0.1)" }}>
                  <div>
                    <label className="field-label">Freight ($/MT)</label>
                    <input className="field-input" type="number" min="0" value={freightPerTon} onChange={e => setFreightPerTon(Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="field-label">Markup (%)</label>
                    <input className="field-input" type="number" min="0" max="200" value={markupPct} onChange={e => setMarkupPct(Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="field-label">Custom Tariff (%)</label>
                    <input className="field-input" type="number" min="0" max="100" placeholder={`Default: ${destCfg.tariff}%`}
                      value={customTariff ?? ""} onChange={e => setCustomTariff(e.target.value === "" ? null : Number(e.target.value))} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Price per ton summary ────────────────────────────── */}
          <div className="card" style={{ padding: "14px 18px" }}>
            <div style={{ fontSize: 11, color: "#a38a5d", textTransform: "uppercase", marginBottom: 4 }}>Landed Cost per MT</div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: "#f59e0b" }}>{fmtUsd(pricePerTonUsd)}</div>
            <div style={{ fontSize: 12, color: "#a38a5d", marginTop: 2 }}>at destination port in {destCfg.flag} {dest}</div>
          </div>
        </div>

        {/* ── Right: Output ────────────────────────────────────────── */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 16, fontWeight: 800, color: "#fff" }}>
            📊 CIF Landed Cost & Profit Projection
          </div>

          {/* Cost breakdown */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              ["Domestic Procurement Cost", `${fmtInr(procureCostInr)} (${fmtUsd(procureCostUsd)})`, "#fff"],
              [`Ocean Freight ($${freightPerTon}/MT)`,    fmtUsd(freightUsd),    "#fff"],
              ["Marine Insurance (0.5%)",                  fmtUsd(insuranceUsd),  "#fff"],
              [`Destination Tariff (${tariffPct}%)`,       fmtUsd(tariffUsd),     "#fbbf24"],
            ].map(([label, val, color]) => (
              <div key={label} className="row">
                <span style={{ color: "#a38a5d" }}>{label}</span>
                <span style={{ color, fontWeight: 700 }}>{val}</span>
              </div>
            ))}
            <div className="divider" />
            <div className="row" style={{ fontWeight: 800, fontSize: 15 }}>
              <span style={{ color: "#fff" }}>Total Landed CIF Cost</span>
              <span style={{ color: "#f59e0b" }}>{fmtUsd(landedCostUsd)}</span>
            </div>
            <div className="row" style={{ fontSize: 13 }}>
              <span style={{ color: "#a38a5d" }}>Selling Price ({markupPct}% markup)</span>
              <span style={{ color: "#fff", fontWeight: 700 }}>{fmtUsd(sellingUsd)}</span>
            </div>
          </div>

          {/* Profit box */}
          <div style={{ background: netMarginUsd > 0 ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", padding: "16px", borderRadius: 14, border: `1px solid ${netMarginUsd > 0 ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}` }}>
            <div style={{ fontSize: 11, color: "#a38a5d", textTransform: "uppercase" }}>
              Estimated Net Profit ({markupPct}% Markup)
            </div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 28, fontWeight: 800, color: netMarginUsd > 0 ? "#4ade80" : "#f87171", marginTop: 4 }}>
              {netMarginUsd > 0 ? "+" : ""}{fmtUsd(netMarginUsd)}
              <span style={{ fontSize: 14, color: "#fff", marginLeft: 8 }}>{fmtInr(netMarginUsd * usdInr)}</span>
            </div>
            <div style={{ fontSize: 12, color: "#a38a5d", marginTop: 4 }}>
              ROI: {marginPctActual.toFixed(1)}% · Based on live rate 1 USD = ₹{usdInr.toFixed(2)}
            </div>
          </div>

          {/* Disclaimer */}
          <div style={{ fontSize: 11, color: "#a38a5d", padding: "10px 12px", borderRadius: 10, background: "rgba(56,189,248,0.05)", border: "1px solid rgba(56,189,248,0.12)" }}>
            ℹ️ Estimates only. Actual freight, tariffs, and insurance vary by carrier, HS code, and trade agreement. Consult a customs broker for binding rates.
          </div>

          <button className="btn-gold" style={{ justifyContent: "center" }} onClick={printCalc}>
            🖨️ Print / Export as PDF
          </button>
        </div>
      </div>
    </>
  );
}
