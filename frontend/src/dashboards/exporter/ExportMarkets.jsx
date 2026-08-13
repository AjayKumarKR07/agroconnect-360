import { useState, useEffect, useCallback } from "react";

const DS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
  .pg-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:16px;flex-wrap:wrap;}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#f59e0b;margin-bottom:6px;}
  .pg-title{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:800;color:#fff;line-height:1.2;}
  .pg-sub{font-size:14px;color:var(--text2);margin-top:6px;}
  .card{background:rgba(245,158,11,0.04);border:1px solid rgba(245,158,11,0.12);border-radius:18px;padding:20px 22px;}
  .pulse{animation:pulse 1.6s ease-in-out infinite;}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
  .spinner{width:18px;height:18px;border:2px solid rgba(255,255,255,0.1);border-top-color:#f59e0b;border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block;vertical-align:middle;}
  @keyframes spin{to{transform:rotate(360deg)}}
`;

/* ── Market data: static but accurate reference info ─────────────────
   FX rates come live from open.er-api.com.
   Tariffs are approximate standard MFN/FTA agri rates.
   Demand ratings are based on India's real top export destinations.
──────────────────────────────────────────────────────────────────── */
const FX_CURRENCIES = [
  { code: "USD", name: "US Dollar",      flag: "🇺🇸" },
  { code: "EUR", name: "Euro",           flag: "🇪🇺" },
  { code: "AED", name: "UAE Dirham",     flag: "🇦🇪" },
  { code: "GBP", name: "British Pound",  flag: "🇬🇧" },
  { code: "SAR", name: "Saudi Riyal",    flag: "🇸🇦" },
  { code: "SGD", name: "Singapore Dollar", flag: "🇸🇬" },
  { code: "AUD", name: "Australian Dollar", flag: "🇦🇺" },
  { code: "JPY", name: "Japanese Yen",   flag: "🇯🇵" },
];

const DESTINATIONS = [
  {
    country: "United Arab Emirates", cc: "AE", flag: "🇦🇪",
    tariff: "0% (CEPA Free Trade)",
    topImport: "Fresh Fruits, Mangoes, Spices",
    demand: "VERY HIGH", demandColor: "#4ade80",
    note: "India's largest agri export destination. CEPA in effect since May 2022.",
  },
  {
    country: "Saudi Arabia", cc: "SA", flag: "🇸🇦",
    tariff: "5% Standard GCC",
    topImport: "Basmati Rice, Onions, Spices",
    demand: "VERY HIGH", demandColor: "#4ade80",
    note: "GCC unified tariff applies. Halal certification mandatory.",
  },
  {
    country: "United States", cc: "US", flag: "🇺🇸",
    tariff: "3.2% avg. Import Duty",
    topImport: "Turmeric, Pepper, Sesame Seeds",
    demand: "HIGH", demandColor: "#4ade80",
    note: "FDA registration mandatory. No GSP for India since 2019.",
  },
  {
    country: "United Kingdom", cc: "GB", flag: "🇬🇧",
    tariff: "0% (UK-India FTA expected)",
    topImport: "Organic Spices, Tea, Rice",
    demand: "HIGH", demandColor: "#4ade80",
    note: "UK-India FTA under negotiation. Current preference rates apply.",
  },
  {
    country: "Netherlands (EU)", cc: "NL", flag: "🇳🇱",
    tariff: "4.5% EU MFN + Phytosanitary",
    topImport: "Mangoes, Grapes, Pomegranate",
    demand: "HIGH", demandColor: "#4ade80",
    note: "Rotterdam is main EU entry port. Strict EU phytosanitary compliance required.",
  },
  {
    country: "Singapore", cc: "SG", flag: "🇸🇬",
    tariff: "0% (CECA Free Trade)",
    topImport: "Seafood, Spices, Processed Foods",
    demand: "MODERATE", demandColor: "#fbbf24",
    note: "CECA with India. SFA approval needed for food imports.",
  },
  {
    country: "Japan", cc: "JP", flag: "🇯🇵",
    tariff: "3.6% avg. (Agri)",
    topImport: "Shrimp, Sesame, Spices",
    demand: "MODERATE", demandColor: "#fbbf24",
    note: "CEPA in force. Strict Japanese Agricultural Standards (JAS) required.",
  },
  {
    country: "Australia", cc: "AU", flag: "🇦🇺",
    tariff: "0% (ECTA Free Trade)",
    topImport: "Cotton, Legumes, Spices",
    demand: "MODERATE", demandColor: "#fbbf24",
    note: "India-Australia ECTA in effect since Dec 2022. DAFF biosecurity compliance needed.",
  },
  {
    country: "Qatar", cc: "QA", flag: "🇶🇦",
    tariff: "0% (CEPA — under negotiation)",
    topImport: "Rice, Vegetables, Fruits",
    demand: "HIGH", demandColor: "#4ade80",
    note: "GCC tariff applies. High demand post World Cup infrastructure buildup.",
  },
  {
    country: "Canada", cc: "CA", flag: "🇨🇦",
    tariff: "3.0% avg. Import Duty",
    topImport: "Spices, Lentils, Basmati Rice",
    demand: "MODERATE", demandColor: "#fbbf24",
    note: "CFIA food safety compliance required. Large Indian diaspora drives demand.",
  },
];

/* Demand sort order for display */
const DEMAND_ORDER = { "VERY HIGH": 0, "HIGH": 1, "MODERATE": 2, "LOW": 3 };

export default function ExportMarkets() {
  const [rates,       setRates]       = useState({});
  const [prevRates,   setPrevRates]   = useState({});
  const [fxLoading,   setFxLoading]   = useState(true);
  const [fxUpdated,   setFxUpdated]   = useState(null);
  const [fxError,     setFxError]     = useState(false);
  const [search,      setSearch]      = useState("");
  const [sortBy,      setSortBy]      = useState("demand"); // "demand" | "tariff" | "country"

  const fetchFx = useCallback(async () => {
    setFxLoading(true); setFxError(false);
    try {
      const r = await fetch("https://open.er-api.com/v6/latest/INR");
      const d = await r.json();
      if (d.result === "success" && d.rates) {
        // rates are "X per INR" → we want "INR per X"
        const inrPer = {};
        FX_CURRENCIES.forEach(c => {
          if (d.rates[c.code]) inrPer[c.code] = 1 / d.rates[c.code];
        });
        setPrevRates(rates);
        setRates(inrPer);
        setFxUpdated(new Date());
      } else { setFxError(true); }
    } catch { setFxError(true); }
    finally { setFxLoading(false); }
  }, []); // eslint-disable-line

  useEffect(() => {
    fetchFx();
    const t = setInterval(fetchFx, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [fetchFx]);

  const fmtRate = (code) => {
    const r = rates[code];
    if (!r) return "—";
    return r >= 1 ? r.toFixed(2) : r.toFixed(4);
  };

  const getRateChange = (code) => {
    const cur  = rates[code];
    const prev = prevRates[code];
    if (!cur || !prev) return null;
    const pct = ((cur - prev) / prev) * 100;
    return pct;
  };

  /* Sort & filter destinations */
  const filtered = DESTINATIONS
    .filter(d => !search || d.country.toLowerCase().includes(search.toLowerCase()) || d.topImport.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "demand")  return (DEMAND_ORDER[a.demand] ?? 9) - (DEMAND_ORDER[b.demand] ?? 9);
      if (sortBy === "country") return a.country.localeCompare(b.country);
      return 0;
    });

  return (
    <>
      <style>{DS}</style>

      {/* Header */}
      <div className="pg-head">
        <div>
          <div className="eyebrow">Foreign Exchange & International Tariffs</div>
          <h1 className="pg-title">💱 Global FX & Export Market Insights</h1>
          <p className="pg-sub">Live foreign exchange rates and destination import tariff reference for Indian agricultural exporters.</p>
        </div>
        <div style={{ textAlign: "right" }}>
          {fxLoading ? (
            <span style={{ fontSize: 13, color: "#a38a5d" }}><span className="spinner" /> Fetching live rates…</span>
          ) : fxError ? (
            <span style={{ fontSize: 12, color: "#f87171" }}>⚠️ FX fetch failed</span>
          ) : (
            <div>
              <div style={{ fontSize: 11, color: "#a38a5d" }}>
                Updated {fxUpdated?.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div style={{ fontSize: 12, color: "#4ade80", fontWeight: 700 }}>● LIVE</div>
            </div>
          )}
          <button onClick={fetchFx} style={{ background: "none", border: "none", color: "#a38a5d", cursor: "pointer", fontSize: 12, marginTop: 4 }}>⟳ Refresh</button>
        </div>
      </div>

      {/* ── FX Rates ────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
          💱 Live Forex Exchange Rates (to INR)
          {fxLoading && <span className="spinner" />}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
          {FX_CURRENCIES.map(c => {
            const rateStr = fmtRate(c.code);
            const chg     = getRateChange(c.code);
            const up      = chg !== null ? chg >= 0 : null;
            return (
              <div key={c.code} className={`card ${fxLoading && !rates[c.code] ? "pulse" : ""}`} style={{ minHeight: 90 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#fbbf24" }}>{c.flag} {c.code} / INR</span>
                  {chg !== null && (
                    <span style={{ fontSize: 10, color: up ? "#4ade80" : "#f87171", fontWeight: 700, background: up ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", padding: "2px 6px", borderRadius: 5 }}>
                      {up ? "▲" : "▼"} {Math.abs(chg).toFixed(3)}%
                    </span>
                  )}
                  {chg === null && !fxLoading && <span style={{ fontSize: 9, color: "#4ade80", fontWeight: 700, background: "rgba(34,197,94,0.1)", padding: "2px 6px", borderRadius: 5 }}>LIVE</span>}
                </div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color: "#fff" }}>
                  {rateStr === "—" ? <span className="pulse" style={{ color: "#a38a5d" }}>Loading…</span> : `₹${rateStr}`}
                </div>
                <div style={{ fontSize: 11, color: "#a38a5d", marginTop: 4 }}>1 {c.code} = ₹{rateStr} INR</div>
              </div>
            );
          })}
        </div>

        {fxError && (
          <div style={{ marginTop: 10, fontSize: 12, color: "#f87171", padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
            ⚠️ Could not fetch live FX rates. Showing last known values. Click ⟳ Refresh to retry.
          </div>
        )}
      </div>

      {/* ── Destination Market Index ─────────────────────────────────── */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 17, fontWeight: 800, color: "#fff" }}>
            🌍 Target Destination Market Index & Import Tariffs
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              placeholder="🔍 Search country or product…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(245,158,11,0.18)", background: "rgba(245,158,11,0.05)", color: "#fff", fontSize: 13, outline: "none", width: 220 }}
            />
            <select
              value={sortBy} onChange={e => setSortBy(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(245,158,11,0.18)", background: "rgba(245,158,11,0.05)", color: "#fff", fontSize: 13, outline: "none", appearance: "none" }}
            >
              <option value="demand">Sort: Demand</option>
              <option value="country">Sort: Country</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(d => (
            <div key={d.country} className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{d.flag}</span>
                    <span style={{ fontWeight: 800, color: "#fff", fontSize: 15 }}>{d.country}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#a38a5d", marginTop: 4 }}>
                    Top Imports: <strong style={{ color: "#fef08a" }}>{d.topImport}</strong>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, color: "#a38a5d", textTransform: "uppercase" }}>Import Tariff</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{d.tariff}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, color: "#a38a5d", textTransform: "uppercase" }}>Demand</div>
                    <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: `${d.demandColor}18`, color: d.demandColor, fontWeight: 800, border: `1px solid ${d.demandColor}30` }}>
                      {d.demand}
                    </span>
                  </div>
                </div>
              </div>

              {/* Note */}
              <div style={{ fontSize: 12, color: "#a38a5d", paddingTop: 6, borderTop: "1px solid rgba(245,158,11,0.08)" }}>
                ℹ️ {d.note}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#a38a5d", fontSize: 14 }}>No destinations match "{search}"</div>
          )}
        </div>

        <div style={{ marginTop: 16, fontSize: 11, color: "#a38a5d", padding: "10px 14px", borderRadius: 10, background: "rgba(56,189,248,0.05)", border: "1px solid rgba(56,189,248,0.12)" }}>
          ℹ️ Tariff rates are approximate standard MFN/FTA rates for agricultural commodities. Actual rates vary by HS code. Always verify with a licensed customs broker before shipment.
        </div>
      </div>
    </>
  );
}
