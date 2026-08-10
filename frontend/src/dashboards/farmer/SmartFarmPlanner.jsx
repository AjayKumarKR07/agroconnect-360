import { useEffect, useState, useCallback } from "react";
import { API_URL } from "../../config/api";
import { DS } from "../../styles/ds";

// ============================================================
// HELPERS
// ============================================================
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("agroconnect_token")}`,
  "Content-Type": "application/json",
});

const fmt = (n) => (n != null ? Number(n).toLocaleString("en-IN") : null);
const scoreColor = (s) =>
  s >= 75 ? "#4ade80" : s >= 50 ? "#fbbf24" : "#f87171";
const scoreBg = (s) =>
  s >= 75
    ? "rgba(34,197,94,0.12)"
    : s >= 50
    ? "rgba(251,191,36,0.12)"
    : "rgba(239,68,68,0.12)";

const RANKS = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
const SIGNAL_STYLES = {
  favorable: { bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.25)", color: "#4ade80", icon: "🟢" },
  neutral:   { bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.2)", color: "#fde68a", icon: "🟡" },
  unfavorable: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)", color: "#f87171", icon: "🔴" },
};

const SUITABILITY_ICON = { Suitable: "✅", Moderate: "⚠️", Unfavorable: "❌" };

// ============================================================
// EXTRA PAGE STYLES (extend DS)
// ============================================================
const SFP_CSS = `
  .sfp-grid2 { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:16px; }
  .sfp-grid3 { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:14px; }
  .sfp-form-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:16px; }
  .sfp-section-title {
    font-family:'Space Grotesk',sans-serif;
    font-size:17px; font-weight:700; color:#fff; margin-bottom:16px;
    display:flex; align-items:center; gap:8px;
  }
  .sfp-score-bar-wrap { display:flex; align-items:center; gap:10px; margin-bottom:8px; }
  .sfp-score-bar-label { font-size:12px; color:var(--text2); min-width:160px; }
  .sfp-score-bar-track { flex:1; height:6px; border-radius:3px; background:rgba(255,255,255,0.07); overflow:hidden; }
  .sfp-score-bar-fill { height:100%; border-radius:3px; transition:width 0.6s ease; }
  .sfp-score-badge {
    display:inline-flex; align-items:center; justify-content:center;
    width:44px; height:44px; border-radius:12px; font-size:16px; font-weight:800;
    font-family:'Space Grotesk',sans-serif; flex-shrink:0;
  }
  .sfp-rec-row {
    display:grid; grid-template-columns:40px 1fr 80px 80px 80px 100px 90px;
    gap:8px; align-items:center; padding:14px 16px;
    border-bottom:1px solid var(--border); font-size:13px;
    transition:background 0.15s;
  }
  .sfp-rec-row:hover { background:var(--surface2); }
  .sfp-rec-head {
    display:grid; grid-template-columns:40px 1fr 80px 80px 80px 100px 90px;
    gap:8px; padding:10px 16px; font-size:11px; font-weight:700;
    color:var(--text2); text-transform:uppercase; letter-spacing:0.06em;
    border-bottom:1px solid var(--border);
  }
  .sfp-market-row {
    display:flex; align-items:center; justify-content:space-between;
    padding:10px 14px; border-radius:10px; margin-bottom:8px;
    background:var(--surface);
  }
  .sfp-weather-metric { text-align:center; padding:16px 12px; border-radius:14px; background:var(--surface); }
  .sfp-weather-val { font-family:'Space Grotesk',sans-serif; font-size:22px; font-weight:800; color:#fff; }
  .sfp-weather-lbl { font-size:12px; color:var(--text2); margin-top:4px; }
  .sfp-profit-card { padding:20px; border-radius:16px; background:var(--surface); border:1px solid var(--border); text-align:center; }
  .sfp-profit-val { font-family:'Space Grotesk',sans-serif; font-size:24px; font-weight:800; color:#fff; }
  .sfp-profit-lbl { font-size:12px; color:var(--text2); margin-top:4px; }
  .sfp-ai-text { font-size:14px; color:var(--text); line-height:1.8; white-space:pre-wrap; }
  .sfp-req-item { display:flex; gap:12px; padding:10px 0; border-bottom:1px solid var(--border); font-size:13px; }
  .sfp-req-label { color:var(--text2); min-width:160px; flex-shrink:0; }
  .sfp-req-val { color:var(--text); font-weight:500; }
  .sfp-crop-btn {
    background:var(--surface); border:1px solid var(--border); border-radius:10px;
    padding:10px 16px; cursor:pointer; font-size:13px; font-weight:600;
    color:var(--text); transition:all 0.2s; text-align:left;
    font-family:'Inter',sans-serif; width:100%;
  }
  .sfp-crop-btn:hover { background:var(--surface2); border-color:var(--border2); }
  .sfp-crop-btn.active { background:rgba(34,197,94,0.1); border-color:rgba(34,197,94,0.3); color:#4ade80; }
  .sfp-unavailable { font-size:13px; color:var(--text2); font-style:italic; }
  .sfp-skeleton {
    background:linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
    background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:8px;
  }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  @media(max-width:768px) {
    .sfp-rec-row,.sfp-rec-head { grid-template-columns:36px 1fr 70px 70px; }
    .sfp-rec-row span:nth-child(n+6), .sfp-rec-head span:nth-child(n+6) { display:none; }
  }
`;

// ============================================================
// SUB-COMPONENTS
// ============================================================
function ScoreBar({ label, score, maxScore }) {
  const pct = Math.round((score / maxScore) * 100);
  return (
    <div className="sfp-score-bar-wrap">
      <span className="sfp-score-bar-label">{label}</span>
      <div className="sfp-score-bar-track">
        <div
          className="sfp-score-bar-fill"
          style={{ width: `${pct}%`, background: scoreColor(pct) }}
        />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor(pct), minWidth: 36, textAlign: "right" }}>
        {score}/{maxScore}
      </span>
    </div>
  );
}

function WeatherPanel({ weather }) {
  if (!weather || weather.unavailable) {
    return (
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="sfp-section-title">🌦️ Weather Analysis</div>
        <div className="alert-warn">⚠️ {weather?.message || "Weather data unavailable. Please check your location name."}</div>
      </div>
    );
  }
  const icon = SUITABILITY_ICON[weather.suitabilityLabel] || "🌤️";
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div className="sfp-section-title" style={{ marginBottom: 0 }}>🌦️ Weather Analysis — {weather.city}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 12, background: scoreBg(weather.suitabilityScore), border: `1px solid ${scoreColor(weather.suitabilityScore)}33` }}>
          <span style={{ fontSize: 22 }}>{icon}</span>
          <div>
            <div style={{ fontSize: 11, color: "var(--text2)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Suitability</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: scoreColor(weather.suitabilityScore), fontFamily: "'Space Grotesk',sans-serif" }}>
              {weather.suitabilityScore}%
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: scoreColor(weather.suitabilityScore) }}>{weather.suitabilityLabel}</div>
        </div>
      </div>
      <div className="sfp-grid3" style={{ marginBottom: 16 }}>
        {[
          { emoji: "🌡️", val: `${weather.temperature?.toFixed(1)}°C`, lbl: "Temperature" },
          { emoji: "💧", val: `${weather.humidity}%`, lbl: "Humidity" },
          { emoji: "💨", val: `${weather.windSpeed?.toFixed(1)} m/s`, lbl: "Wind Speed" },
          { emoji: "☁️", val: weather.condition || "—", lbl: "Condition" },
          { emoji: "🌡️", val: `${weather.feelsLike?.toFixed(1)}°C`, lbl: "Feels Like" },
          { emoji: "🔵", val: `${weather.pressure} hPa`, lbl: "Pressure" },
        ].map(({ emoji, val, lbl }) => (
          <div key={lbl} className="sfp-weather-metric">
            <div style={{ fontSize: 22, marginBottom: 6 }}>{emoji}</div>
            <div className="sfp-weather-val">{val}</div>
            <div className="sfp-weather-lbl">{lbl}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 13, color: "var(--text2)", background: "var(--surface)", padding: "10px 14px", borderRadius: 10 }}>
        📍 <strong style={{ color: "var(--text)" }}>{weather.description}</strong> — Weather data from OpenWeatherMap
      </div>
    </div>
  );
}

function MarketPanel({ market, district }) {
  if (!market || market.unavailable) {
    return (
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="sfp-section-title">📊 Market Intelligence</div>
        <div className="alert-warn">⚠️ {market?.message || "Market data is temporarily unavailable for this district. Please try again."}</div>
      </div>
    );
  }
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
        <div className="sfp-section-title" style={{ marginBottom: 0 }}>📊 Market Intelligence — {district}</div>
        <span className="badge badge-blue">{market.totalRecords} records</span>
      </div>

      <div className="sfp-grid2" style={{ marginBottom: 20 }}>
        {/* Highest Price */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#4ade80", marginBottom: 12 }}>🔥 Top Value Crops</div>
          {market.highest?.slice(0, 5).map((m, i) => (
            <div key={i} className="sfp-market-row">
              <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>{m.commodity}</span>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#4ade80" }}>₹{fmt(m.maxPrice)}/q</div>
                <div style={{ fontSize: 11, color: "var(--text2)" }}>{m.market}</div>
              </div>
            </div>
          ))}
        </div>
        {/* Lowest Price */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#f87171", marginBottom: 12 }}>⚠️ Low Trend Crops</div>
          {market.lowest?.slice(0, 5).map((m, i) => (
            <div key={i} className="sfp-market-row">
              <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>{m.commodity}</span>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#f87171" }}>₹{fmt(m.minPrice)}/q</div>
                <div style={{ fontSize: 11, color: "var(--text2)" }}>{m.market}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ fontSize: 11, color: "var(--text2)" }}>
        * Prices are from APMC mandi records (MarketPrice collection + data.gov.in fallback). ₹/quintal = ₹ per 100 kg.
      </div>
    </div>
  );
}

function RecommendationsTable({ recommendations, selectedCrop, onSelect }) {
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="sfp-section-title">🌾 Crop Recommendation Engine — Top 5</div>
      <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 16 }}>
        Scored using: Agricultural Suitability 30% · Weather 25% · Market Trend 20% · Profit 15% · Water 10%
      </div>

      {/* Table header */}
      <div className="sfp-rec-head">
        <span>#</span>
        <span>Crop</span>
        <span>Score</span>
        <span>Weather</span>
        <span>Market</span>
        <span>Est. Profit</span>
        <span>Risk</span>
      </div>

      {recommendations.map((r) => (
        <div
          key={r.crop}
          className="sfp-rec-row"
          style={{ cursor: "pointer", background: selectedCrop?.crop === r.crop ? "rgba(34,197,94,0.06)" : undefined }}
          onClick={() => onSelect(r.crop === selectedCrop?.crop ? null : r)}
        >
          <span style={{ fontSize: 18 }}>{RANKS[r.rank - 1]}</span>
          <div>
            <div style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>{r.crop}</div>
            <div style={{ fontSize: 11, color: "var(--text2)" }}>{r.duration}</div>
          </div>
          <div
            className="sfp-score-badge"
            style={{ background: scoreBg(r.totalScore), color: scoreColor(r.totalScore), fontSize: 14 }}
          >
            {r.totalScore}
          </div>
          <span className={`badge ${r.weatherFit === "High" ? "badge-green" : r.weatherFit === "Moderate" ? "badge-amber" : "badge-red"}`}>
            {r.weatherFit}
          </span>
          <span className={`badge ${r.marketTrend === "Rising" ? "badge-green" : r.marketTrend === "Stable" ? "badge-amber" : "badge-red"}`}>
            {r.marketTrend}
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: r.financial.estimatedProfit > 0 ? "#4ade80" : "var(--text2)" }}>
            {r.financial.estimatedProfit != null ? `₹${fmt(r.financial.estimatedProfit)}` : <span className="sfp-unavailable">N/A</span>}
          </span>
          <span className={`badge ${r.risk === "Low" ? "badge-green" : r.risk === "Medium" ? "badge-amber" : "badge-red"}`}>
            {r.risk}
          </span>
        </div>
      ))}
      <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 12 }}>
        💡 Click any row to see farming requirements and profit breakdown.
      </div>
    </div>
  );
}

function CropDetailPanel({ rec }) {
  if (!rec) return null;
  const req = rec.farmingRequirements;
  const fin = rec.financial;
  const reqItems = [
    { label: "Suitable Soil",        val: req.soilSuitability },
    { label: "Temperature Range",    val: req.tempRange },
    { label: "Water Requirement",    val: req.waterRequirement },
    { label: "Irrigation",           val: req.irrigationRequirement },
    { label: "Sowing Period",        val: req.sowingPeriod },
    { label: "Crop Duration",        val: req.duration },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16, marginBottom: 20 }}>
      {/* Farming Requirements */}
      <div className="card">
        <div className="sfp-section-title">🌱 Farming Requirements — {rec.crop}</div>
        {reqItems.map(({ label, val }) => (
          <div key={label} className="sfp-req-item">
            <span className="sfp-req-label">{label}</span>
            <span className="sfp-req-val">{val}</span>
          </div>
        ))}
        {/* Score breakdown */}
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text2)", marginBottom: 12 }}>Score Breakdown</div>
          <ScoreBar label="Agricultural Suitability" score={rec.breakdown.agriSuitability.score} maxScore={rec.breakdown.agriSuitability.maxScore} />
          <ScoreBar label="Weather Suitability" score={rec.breakdown.weatherSuitability.score} maxScore={rec.breakdown.weatherSuitability.maxScore} />
          <ScoreBar label="Market Trend" score={rec.breakdown.marketTrend.score} maxScore={rec.breakdown.marketTrend.maxScore} />
          <ScoreBar label="Expected Profit" score={rec.breakdown.expectedProfit.score} maxScore={rec.breakdown.expectedProfit.maxScore} />
          <ScoreBar label="Water Requirement" score={rec.breakdown.waterRequirement.score} maxScore={rec.breakdown.waterRequirement.maxScore} />
        </div>
      </div>

      {/* Profit Calculator */}
      <div className="card">
        <div className="sfp-section-title">💰 Expected Profit — {rec.crop}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div className="sfp-profit-card">
            <div className="sfp-profit-val">
              {rec.yield.total} q
            </div>
            <div className="sfp-profit-lbl">Expected Yield ({rec.yield.perAcre} q/acre)</div>
          </div>
          <div className="sfp-profit-card">
            <div className="sfp-profit-val" style={{ color: "#7dd3fc" }}>
              {fin.marketPrice ? `₹${fmt(fin.marketPrice)}` : <span className="sfp-unavailable" style={{ fontSize: 14 }}>N/A</span>}
            </div>
            <div className="sfp-profit-lbl">Market Price ({fin.marketPriceSource})</div>
          </div>
          <div className="sfp-profit-card">
            <div className="sfp-profit-val" style={{ color: "#fbbf24" }}>
              ₹{fmt(fin.estimatedCost)}
            </div>
            <div className="sfp-profit-lbl">Estimated Investment</div>
          </div>
          <div className="sfp-profit-card">
            <div className="sfp-profit-val" style={{ color: "#7dd3fc" }}>
              {fin.estimatedRevenue != null ? `₹${fmt(fin.estimatedRevenue)}` : <span className="sfp-unavailable" style={{ fontSize: 14 }}>N/A</span>}
            </div>
            <div className="sfp-profit-lbl">Estimated Revenue</div>
          </div>
          <div className="sfp-profit-card" style={{ gridColumn: "span 2", background: fin.estimatedProfit > 0 ? "rgba(34,197,94,0.08)" : "var(--surface)", border: fin.estimatedProfit > 0 ? "1px solid rgba(34,197,94,0.2)" : "1px solid var(--border)" }}>
            <div className="sfp-profit-val" style={{ fontSize: 28, color: fin.estimatedProfit > 0 ? "#4ade80" : fin.estimatedProfit != null ? "#f87171" : "var(--text2)" }}>
              {fin.estimatedProfit != null ? `₹${fmt(Math.abs(fin.estimatedProfit))}` : "Data unavailable"}
            </div>
            <div className="sfp-profit-lbl">
              {fin.estimatedProfit != null ? (fin.estimatedProfit >= 0 ? "📈 Estimated Profit" : "📉 Estimated Loss") : "Market price unavailable for calculation"}
            </div>
          </div>
        </div>
        {fin.breakEvenPrice && (
          <div style={{ padding: "10px 14px", borderRadius: 10, background: "var(--surface)", fontSize: 13 }}>
            <span style={{ color: "var(--text2)" }}>Break-even Price: </span>
            <strong style={{ color: "#fbbf24" }}>₹{fmt(fin.breakEvenPrice)}/quintal</strong>
          </div>
        )}
        {!fin.marketPrice && (
          <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 12, fontStyle: "italic" }}>
            * Market price for {rec.crop} was not found in district APMC data. Revenue and profit calculations require real market price data.
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function SmartFarmPlanner() {
  const [form, setForm] = useState({
    state: "",
    district: "",
    location: "",
    farmArea: "",
    areaUnit: "Acre",
    soilType: "Loamy",
    irrigation: "Available",
    waterSource: "Borewell",
    season: "Current Season",
    budget: "",
    previousCrop: "",
  });

  const [states, setStates]       = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loadingStates, setLoadingStates]     = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [plan, setPlan]             = useState(null);
  const [error, setError]           = useState("");
  const [selectedCrop, setSelectedCrop] = useState(null);

  // ── My Farm auto-fill ─────────────────────────────────────
  const [farmLoading, setFarmLoading]   = useState(false);
  const [farmLoaded, setFarmLoaded]     = useState(false);
  const [planSaving, setPlanSaving]     = useState(false);
  const [planSaved, setPlanSaved]       = useState(false);
  const [planSaveError, setPlanSaveError] = useState("");

  const loadMyFarm = useCallback(async () => {
    setFarmLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/profile/farm`, { headers: authHeaders() });
      const d = await r.json();
      if (d.farm && (d.farm.farmArea || d.farm.district || d.farm.soilType)) {
        setForm(f => ({
          ...f,
          state:        d.farm.state    || f.state,
          district:     d.farm.district || f.district,
          location:     d.farm.district || d.farm.location || f.location,
          farmArea:     d.farm.farmArea ? String(d.farm.farmArea) : f.farmArea,
          areaUnit:     d.farm.areaUnit     || f.areaUnit,
          soilType:     d.farm.soilType     || f.soilType,
          irrigation:   d.farm.irrigation   || f.irrigation,
          waterSource:  d.farm.waterSource  || f.waterSource,
          season:       d.farm.season       || f.season,
          previousCrop: d.farm.previousCrop || f.previousCrop,
        }));
        setFarmLoaded(true);
      } else {
        setError("No farm details saved yet. Go to My Farm to set them first.");
      }
    } catch { setError("Unable to load farm details."); }
    finally { setFarmLoading(false); }
  }, []);

  const handleSavePlan = useCallback(async () => {
    if (!plan) return;
    setPlanSaving(true); setPlanSaveError(""); setPlanSaved(false);
    try {
      const r = await fetch(`${API_URL}/api/farmer/smart-farm-plans`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          farmDetails:          plan.farmDetails,
          recommendations:      plan.recommendations,
          weather:              plan.weather,
          market:               plan.market,
          bestMarket:           plan.bestMarket,
          sellingRecommendation: plan.sellingRecommendation,
          aiExplanation:        plan.aiExplanation,
          meta:                 plan.meta,
        }),
      });
      const d = await r.json();
      if (d.success) setPlanSaved(true);
      else setPlanSaveError(d.message || "Save failed");
    } catch { setPlanSaveError("Network error. Could not save plan."); }
    finally { setPlanSaving(false); }
  }, [plan]);

  // ── Fetch states on mount ─────────────────────────────────
  useEffect(() => {
    fetch(`${API_URL}/api/prices/catalog/states`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => { if (d.states) setStates(d.states); })
      .catch(() => {})
      .finally(() => setLoadingStates(false));
  }, []);

  // ── Fetch districts when state changes ────────────────────
  useEffect(() => {
    if (!form.state) { setDistricts([]); return; }
    setLoadingDistricts(true);
    setDistricts([]);
    setForm((f) => ({ ...f, district: "", location: "" }));
    fetch(`${API_URL}/api/prices/catalog/districts?state=${encodeURIComponent(form.state)}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => { if (d.districts) setDistricts(d.districts); })
      .catch(() => {})
      .finally(() => setLoadingDistricts(false));
  }, [form.state]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }, []);

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setPlan(null);
    setSelectedCrop(null);

    if (!form.state || !form.district) { setError("Please select a state and district."); return; }
    if (!form.farmArea || parseFloat(form.farmArea) <= 0) { setError("Please enter a valid farm area."); return; }

    setSubmitting(true);
    try {
      const resp = await fetch(`${API_URL}/api/farmer/smart-farm-plan`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          ...form,
          location: form.location || form.district,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        setError(data.message || "Failed to generate farm plan. Please try again.");
      } else {
        setPlan(data);
        // Auto-select top crop
        if (data.recommendations?.[0]) setSelectedCrop(data.recommendations[0]);
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Download Report ───────────────────────────────────────
  const downloadReport = useCallback(() => {
    if (!plan) return;
    const fd    = plan.farmDetails;
    const top   = plan.recommendations?.[0];
    const w     = plan.weather;
    const m     = plan.market;
    const sell  = plan.sellingRecommendation;
    const meta  = plan.meta;
    const genDate = new Date(meta?.generatedAt || Date.now()).toLocaleString("en-IN", {
      dateStyle: "long", timeStyle: "short"
    });

    const rankLabel = ["1st", "2nd", "3rd", "4th", "5th"];
    const trendDot  = (t) => t === "Rising" ? "🟢" : t === "Stable" ? "🟡" : "🔴";
    const riskDot   = (r) => r === "Low"    ? "🟢" : r === "Medium" ? "🟡" : "🔴";
    const scoreBar  = (score, max) => {
      const pct = Math.min(100, Math.round((score / max) * 100));
      const col = pct >= 75 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444";
      return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
        <div style="flex:1;height:7px;border-radius:4px;background:#e5e7eb;overflow:hidden;">
          <div style="width:${pct}%;height:100%;border-radius:4px;background:${col};"></div>
        </div>
        <span style="font-size:12px;font-weight:700;color:${col};min-width:32px;text-align:right;">${score}/${max}</span>
      </div>`;
    };

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Smart Farm Plan — ${fd.district}, ${fd.state}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Inter',sans-serif;color:#111827;background:#fff;font-size:13px;}
  .page{max-width:850px;margin:0 auto;padding:32px;}
  h1{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:800;color:#15803d;}
  h2{font-family:'Space Grotesk',sans-serif;font-size:16px;font-weight:700;color:#166534;margin-bottom:12px;
     padding-bottom:6px;border-bottom:2px solid #dcfce7;}
  h3{font-size:14px;font-weight:700;color:#1f2937;margin-bottom:8px;}
  /* Header */
  .header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:28px;
    padding-bottom:20px;border-bottom:3px solid #16a34a;}
  .brand{display:flex;align-items:center;gap:12px;}
  .logo{width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#16a34a,#059669);
    display:flex;align-items:center;justify-content:center;font-size:22px;}
  .brand-name{font-family:'Space Grotesk',sans-serif;font-size:18px;font-weight:800;color:#166534;}
  .brand-sub{font-size:11px;color:#6b7280;margin-top:2px;}
  .report-info{text-align:right;font-size:12px;color:#6b7280;}
  .report-info strong{color:#1f2937;display:block;font-size:13px;}
  /* Farm details band */
  .farm-band{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;
    display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px;}
  .farm-item .lbl{font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;}
  .farm-item .val{font-size:13px;font-weight:700;color:#111827;margin-top:2px;}
  /* Summary cards */
  .sum-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px;}
  .sum-card{border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;}
  .sum-card .title{font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;}
  .sum-card .val{font-size:18px;font-weight:800;color:#111827;margin-top:4px;font-family:'Space Grotesk',sans-serif;}
  .sum-card .sub{font-size:11px;color:#6b7280;margin-top:2px;}
  /* Section */
  .section{margin-bottom:26px;}
  /* Weather grid */
  .wx-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px;}
  .wx-cell{border:1px solid #e5e7eb;border-radius:8px;padding:12px;text-align:center;}
  .wx-cell .val{font-size:16px;font-weight:800;color:#1f2937;}
  .wx-cell .lbl{font-size:10px;color:#6b7280;margin-top:2px;}
  /* Table */
  table{width:100%;border-collapse:collapse;font-size:12px;}
  th{text-align:left;font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;
    letter-spacing:.04em;padding:8px 10px;border-bottom:2px solid #e5e7eb;background:#f9fafb;}
  td{padding:9px 10px;border-bottom:1px solid #f3f4f6;vertical-align:top;}
  tr:nth-child(even) td{background:#f9fafb;}
  .score-chip{display:inline-block;padding:3px 8px;border-radius:5px;font-size:11px;font-weight:700;}
  .green{background:#dcfce7;color:#166534;}
  .amber{background:#fef9c3;color:#854d0e;}
  .red{background:#fee2e2;color:#991b1b;}
  /* Req table */
  .req-row{display:flex;gap:12px;padding:8px 0;border-bottom:1px solid #f3f4f6;}
  .req-lbl{font-size:12px;color:#6b7280;min-width:160px;flex-shrink:0;}
  .req-val{font-size:12px;font-weight:600;color:#111827;}
  /* Profit grid */
  .profit-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:14px;}
  .profit-card{border:1px solid #e5e7eb;border-radius:8px;padding:14px;text-align:center;}
  .profit-card .val{font-size:17px;font-weight:800;color:#1f2937;font-family:'Space Grotesk',sans-serif;}
  .profit-card .lbl{font-size:10px;color:#6b7280;margin-top:3px;}
  .profit-highlight{grid-column:span 2;background:#f0fdf4;border-color:#86efac;}
  .profit-highlight .val{color:#15803d;font-size:20px;}
  /* Sell box */
  .sell-box{border-radius:10px;padding:16px;margin-bottom:24px;}
  .sell-box.favorable{background:#f0fdf4;border:1px solid #86efac;}
  .sell-box.neutral{background:#fefce8;border:1px solid #fde68a;}
  /* AI */
  .ai-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px;
    font-size:13px;line-height:1.8;color:#374151;white-space:pre-wrap;}
  /* Market rows */
  .mkt-row{display:flex;justify-content:space-between;align-items:center;
    padding:8px 10px;border-radius:6px;margin-bottom:6px;background:#f9fafb;}
  .mkt-price{font-size:13px;font-weight:800;}
  /* Disclaimer */
  .disclaimer{margin-top:28px;padding:14px 16px;border-radius:8px;background:#f3f4f6;
    font-size:11px;color:#6b7280;line-height:1.7;}
  /* Weights table */
  .weights{display:flex;gap:14px;flex-wrap:wrap;padding:10px 0;}
  .weight-item{font-size:11px;color:#6b7280;}
  .weight-item strong{color:#1f2937;}
  @media print{
    body{font-size:12px;}
    .page{padding:20px;}
    .section{page-break-inside:avoid;}
    h2{page-break-after:avoid;}
  }
</style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div class="header">
    <div class="brand">
      <div class="logo">🌱</div>
      <div>
        <div class="brand-name">AgroConnect 360</div>
        <div class="brand-sub">Farmer Portal — Smart Farm Planner</div>
      </div>
    </div>
    <div class="report-info">
      <strong>Smart Farm Plan Report</strong>
      Generated: ${genDate}<br/>
      ${fd.district}, ${fd.state}<br/>
      ${fd.farmArea} ${fd.areaUnit} · ${fd.soilType} soil
    </div>
  </div>

  <!-- FARM DETAILS BAND -->
  <div class="farm-band">
    <div class="farm-item"><div class="lbl">Location</div><div class="val">${fd.district}, ${fd.state}</div></div>
    <div class="farm-item"><div class="lbl">Farm Area</div><div class="val">${fd.farmArea} ${fd.areaUnit} (${fd.areaInAcres?.toFixed(2)} acres)</div></div>
    <div class="farm-item"><div class="lbl">Soil Type</div><div class="val">${fd.soilType}</div></div>
    <div class="farm-item"><div class="lbl">Irrigation</div><div class="val">${fd.irrigation}</div></div>
    <div class="farm-item"><div class="lbl">Water Source</div><div class="val">${fd.waterSource}</div></div>
    <div class="farm-item"><div class="lbl">Season</div><div class="val">${fd.season}</div></div>
    ${fd.budget ? `<div class="farm-item"><div class="lbl">Budget</div><div class="val">₹${Number(fd.budget).toLocaleString("en-IN")}</div></div>` : ""}
    ${fd.previousCrop ? `<div class="farm-item"><div class="lbl">Previous Crop</div><div class="val">${fd.previousCrop}</div></div>` : ""}
  </div>

  <!-- SUMMARY CARDS -->
  <div class="sum-grid">
    <div class="sum-card">
      <div class="title">Top Recommended Crop</div>
      <div class="val">🥇 ${top?.crop || "—"}</div>
      <div class="sub">Score: ${top?.totalScore}/100 · Risk: ${top?.risk}</div>
    </div>
    <div class="sum-card">
      <div class="title">Weather Suitability</div>
      <div class="val">${w?.unavailable ? "N/A" : `${w?.suitabilityScore}%`}</div>
      <div class="sub">${w?.unavailable ? "Data unavailable" : `${w?.city} · ${w?.condition} · ${w?.temperature?.toFixed(1)}°C`}</div>
    </div>
    <div class="sum-card">
      <div class="title">Best Market</div>
      <div class="val">🏆 ${plan.bestMarket?.market || "—"}</div>
      <div class="sub">${plan.bestMarket ? `₹${plan.bestMarket.price?.toLocaleString("en-IN")}/q · ${top?.crop}` : "Data unavailable"}</div>
    </div>
  </div>

  <!-- WEATHER ANALYSIS -->
  <div class="section">
    <h2>🌦️ Weather Analysis${w?.city ? " — " + w.city : ""}</h2>
    ${w?.unavailable
      ? `<p style="color:#b45309;background:#fef9c3;padding:10px 14px;border-radius:8px;border:1px solid #fde68a;">⚠️ ${w.message}</p>`
      : `<div class="wx-grid">
          <div class="wx-cell"><div class="val">${w.temperature?.toFixed(1)}°C</div><div class="lbl">Temperature</div></div>
          <div class="wx-cell"><div class="val">${w.humidity}%</div><div class="lbl">Humidity</div></div>
          <div class="wx-cell"><div class="val">${w.windSpeed?.toFixed(1)} m/s</div><div class="lbl">Wind Speed</div></div>
          <div class="wx-cell"><div class="val">${w.condition}</div><div class="lbl">Condition</div></div>
          <div class="wx-cell"><div class="val">${w.feelsLike?.toFixed(1)}°C</div><div class="lbl">Feels Like</div></div>
          <div class="wx-cell"><div class="val" style="color:${w.suitabilityScore >= 75 ? "#15803d" : w.suitabilityScore >= 50 ? "#b45309" : "#991b1b"}">${w.suitabilityScore}% — ${w.suitabilityLabel}</div><div class="lbl">Farm Suitability</div></div>
        </div>`
    }
  </div>

  <!-- MARKET INTELLIGENCE -->
  <div class="section">
    <h2>📊 Market Intelligence — ${fd.district}</h2>
    ${m?.unavailable
      ? `<p style="color:#b45309;background:#fef9c3;padding:10px 14px;border-radius:8px;border:1px solid #fde68a;">⚠️ ${m.message}</p>`
      : `<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div>
            <h3>🔥 Top Value Crops</h3>
            ${(m.highest?.slice(0, 6) || []).map(item =>
              `<div class="mkt-row"><span>${item.commodity}${item.variety ? " ("+item.variety+")" : ""}<br/><span style="font-size:10px;color:#6b7280;">${item.market}</span></span>
               <span class="mkt-price" style="color:#15803d;">₹${item.maxPrice?.toLocaleString("en-IN")}/q</span></div>`
            ).join("")}
          </div>
          <div>
            <h3>⚠️ Low Trend Crops</h3>
            ${(m.lowest?.slice(0, 6) || []).map(item =>
              `<div class="mkt-row"><span>${item.commodity}${item.variety ? " ("+item.variety+")" : ""}<br/><span style="font-size:10px;color:#6b7280;">${item.market}</span></span>
               <span class="mkt-price" style="color:#991b1b;">₹${item.minPrice?.toLocaleString("en-IN")}/q</span></div>`
            ).join("")}
          </div>
        </div>`
    }
  </div>

  <!-- CROP RECOMMENDATIONS -->
  <div class="section">
    <h2>🌾 Crop Recommendations — Top 5</h2>
    <p style="font-size:11px;color:#6b7280;margin-bottom:12px;">Scoring weights: Agricultural Suitability 30% · Weather 25% · Market 20% · Profit 15% · Water 10%</p>
    <table>
      <thead><tr>
        <th>#</th><th>Crop</th><th>Score</th><th>Weather Fit</th><th>Market Trend</th>
        <th>Expected Yield</th><th>Market Price</th><th>Est. Profit</th><th>Risk</th>
      </tr></thead>
      <tbody>
        ${plan.recommendations.map((r, i) => {
          const sc = r.totalScore >= 75 ? "green" : r.totalScore >= 50 ? "amber" : "red";
          const wc = r.weatherFit === "High" ? "green" : r.weatherFit === "Moderate" ? "amber" : "red";
          const mc = r.marketTrend === "Rising" ? "green" : r.marketTrend === "Stable" ? "amber" : "red";
          const rc = r.risk === "Low" ? "green" : r.risk === "Medium" ? "amber" : "red";
          return `<tr>
            <td style="font-weight:700;">${rankLabel[i]}</td>
            <td><strong>${r.crop}</strong><br/><span style="color:#6b7280;font-size:11px;">${r.duration}</span></td>
            <td><span class="score-chip ${sc}">${r.totalScore}/100</span></td>
            <td><span class="score-chip ${wc}">${r.weatherFit}</span></td>
            <td>${trendDot(r.marketTrend)} <span class="score-chip ${mc}">${r.marketTrend}</span></td>
            <td>${r.yield.total} q (${r.yield.perAcre} q/ac)</td>
            <td>${r.financial.marketPrice ? "₹" + r.financial.marketPrice.toLocaleString("en-IN") + "/q" : "<em>N/A</em>"}</td>
            <td>${r.financial.estimatedProfit != null ? "₹" + Math.abs(r.financial.estimatedProfit).toLocaleString("en-IN") + (r.financial.estimatedProfit < 0 ? " (loss)" : "") : "<em>N/A</em>"}</td>
            <td>${riskDot(r.risk)} <span class="score-chip ${rc}">${r.risk}</span></td>
          </tr>`;
        }).join("")}
      </tbody>
    </table>
  </div>

  <!-- TOP CROP DETAILS -->
  ${top ? `
  <div class="section">
    <h2>🌱 Farming Requirements — ${top.crop}</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
      <div>
        ${[
          ["Suitable Soil",     top.farmingRequirements.soilSuitability],
          ["Temperature Range", top.farmingRequirements.tempRange],
          ["Water Requirement", top.farmingRequirements.waterRequirement],
          ["Irrigation",        top.farmingRequirements.irrigationRequirement],
          ["Sowing Period",     top.farmingRequirements.sowingPeriod],
          ["Crop Duration",     top.farmingRequirements.duration],
        ].map(([l, v]) => `<div class="req-row"><span class="req-lbl">${l}</span><span class="req-val">${v}</span></div>`).join("")}
      </div>
      <div>
        <h3>Score Breakdown</h3>
        <p style="font-size:11px;color:#6b7280;margin-bottom:10px;">Agricultural Suitability (30%)</p>
        ${scoreBar(top.breakdown.agriSuitability.score, top.breakdown.agriSuitability.maxScore)}
        <p style="font-size:11px;color:#6b7280;margin:8px 0 4px;">Weather Suitability (25%)</p>
        ${scoreBar(top.breakdown.weatherSuitability.score, top.breakdown.weatherSuitability.maxScore)}
        <p style="font-size:11px;color:#6b7280;margin:8px 0 4px;">Market Trend (20%)</p>
        ${scoreBar(top.breakdown.marketTrend.score, top.breakdown.marketTrend.maxScore)}
        <p style="font-size:11px;color:#6b7280;margin:8px 0 4px;">Expected Profit (15%)</p>
        ${scoreBar(top.breakdown.expectedProfit.score, top.breakdown.expectedProfit.maxScore)}
        <p style="font-size:11px;color:#6b7280;margin:8px 0 4px;">Water Requirement (10%)</p>
        ${scoreBar(top.breakdown.waterRequirement.score, top.breakdown.waterRequirement.maxScore)}
      </div>
    </div>
  </div>

  <!-- PROFIT CALCULATOR -->
  <div class="section">
    <h2>💰 Profit Calculator — ${top.crop}</h2>
    <div class="profit-grid">
      <div class="profit-card">
        <div class="val">${top.yield.total} quintals</div>
        <div class="lbl">Expected Yield (${top.yield.perAcre} q/acre × ${fd.areaInAcres?.toFixed(2)} acres)</div>
      </div>
      <div class="profit-card">
        <div class="val">${top.financial.marketPrice ? "₹" + top.financial.marketPrice.toLocaleString("en-IN") + "/q" : "Data unavailable"}</div>
        <div class="lbl">Market Price (${top.financial.marketPriceSource})</div>
      </div>
      <div class="profit-card" style="border-color:#fde68a;">
        <div class="val" style="color:#b45309;">₹${top.financial.estimatedCost?.toLocaleString("en-IN")}</div>
        <div class="lbl">Estimated Investment (farming cost)</div>
      </div>
      <div class="profit-card" style="border-color:#bfdbfe;">
        <div class="val" style="color:#1d4ed8;">${top.financial.estimatedRevenue != null ? "₹" + top.financial.estimatedRevenue.toLocaleString("en-IN") : "Data unavailable"}</div>
        <div class="lbl">Estimated Revenue</div>
      </div>
      <div class="profit-card profit-highlight">
        <div class="val">${top.financial.estimatedProfit != null ? "₹" + Math.abs(top.financial.estimatedProfit).toLocaleString("en-IN") + (top.financial.estimatedProfit < 0 ? " (loss)" : " profit") : "Market price unavailable — profit not calculated"}</div>
        <div class="lbl">Net Estimated ${top.financial.estimatedProfit >= 0 ? "Profit" : "Loss"} · Break-even price: ${top.financial.breakEvenPrice ? "₹" + top.financial.breakEvenPrice.toLocaleString("en-IN") + "/q" : "N/A"}</div>
      </div>
    </div>
    <p style="font-size:11px;color:#6b7280;">* Revenue = yield × market price. Cost = estimated farming cost. Profit = Revenue − Cost. Market prices from APMC District Data.</p>
  </div>` : ""}

  <!-- SELLING RECOMMENDATION -->
  ${sell ? `
  <div class="section">
    <h2>📈 Smart Selling Recommendation</h2>
    <div class="sell-box ${sell.signal}">
      <p style="font-size:14px;font-weight:700;color:#166534;margin-bottom:8px;">${sell.signal === "favorable" ? "🟢" : "🟡"} ${sell.headline}</p>
      <p style="font-size:13px;color:#374151;margin-bottom:10px;">${sell.details}</p>
      <p style="font-size:11px;color:#6b7280;font-style:italic;">⚠️ ${sell.disclaimer}</p>
    </div>
  </div>` : ""}

  <!-- AI EXPLANATION -->
  ${plan.aiExplanation ? `
  <div class="section">
    <h2>🤖 AI Explanation</h2>
    <p style="font-size:11px;color:#6b7280;margin-bottom:10px;">Powered by Groq (Llama 3.3 70B) · Based on actual calculated data above</p>
    <div class="ai-box">${plan.aiExplanation}</div>
  </div>` : ""}

  <!-- DISCLAIMER -->
  <div class="disclaimer">
    <strong>Important Disclaimer:</strong> This Smart Farm Plan is generated for informational purposes only using available real-time data from OpenWeatherMap, APMC mandi records, and AI analysis. Crop recommendations, yield estimates, and profit projections are based on historical agricultural parameters and current market data. Actual results may vary significantly due to weather changes, pest outbreaks, market fluctuations, and other factors.
    Do not rely solely on this report for financial decisions. Always consult your local Krishi Vigyan Kendra (KVK), Agricultural Extension Officer, or experienced farmers before investing. Market prices are subject to change.
    <br/><br/>
    Generated by AgroConnect 360 Smart Farm Planner · ${genDate} · Data sources: OpenWeatherMap, data.gov.in (APMC), Groq AI
  </div>

</div>
<script>window.onload = () => window.print();<\/script>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url, "_blank", "width=950,height=900");
    if (!win) {
      // Fallback: direct download if popup blocked
      const a = document.createElement("a");
      a.href = url;
      a.download = `SmartFarmPlan_${fd.district}_${fd.state}_${new Date().toISOString().slice(0, 10)}.html`;
      a.click();
    }
    // Revoke after 60 s
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }, [plan]);

  // ── Derived values ────────────────────────────────────────
  const topRec = plan?.recommendations?.[0];

  const selStyle = SIGNAL_STYLES[plan?.sellingRecommendation?.signal || "neutral"];

  return (
    <>
      <style>{DS}{SFP_CSS}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">AI-Powered Decision Support</div>
          <h1 className="pg-title">🌾 Smart Farm Planner</h1>
          <p className="pg-sub">
            Plan your crop using farm conditions, real-time weather, APMC market intelligence and AI.
          </p>
        </div>
        {plan ? (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {planSaved ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 30, background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "#4ade80", fontSize: 13, fontWeight: 700 }}>✅ Plan Saved</span>
            ) : (
              <button className="btn-green" onClick={handleSavePlan} disabled={planSaving} id="sfp-save-plan-btn">
                {planSaving ? "💾 Saving…" : "💾 Save Farm Plan"}
              </button>
            )}
            <button
              className="btn-ghost"
              onClick={downloadReport}
              id="sfp-download-report-btn"
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              📄 Download Report
            </button>
            <button
              className="btn-ghost"
              onClick={() => { setPlan(null); setSelectedCrop(null); setError(""); setPlanSaved(false); setPlanSaveError(""); }}
            >
              🔄 New Plan
            </button>
          </div>
        ) : (
          <button className="btn-ghost" onClick={loadMyFarm} disabled={farmLoading} id="sfp-use-my-farm-btn" style={{ color: "#4ade80", borderColor: "rgba(34,197,94,0.3)" }}>
            {farmLoading ? "⏳ Loading…" : farmLoaded ? "✅ Farm Details Loaded" : "🌾 Use My Farm Details"}
          </button>
        )}
      </div>
      {planSaveError && <div className="alert-error" style={{ marginBottom: 16 }}>⚠️ {planSaveError}</div>}

      {/* ── SUMMARY CARDS (after plan) ────────────────────────── */}
      {plan && topRec && (
        <div className="stat-grid" style={{ marginBottom: 24 }}>
          {[
            { emoji: "📐", label: "Farm Area",       value: `${plan.farmDetails.farmArea} ${plan.farmDetails.areaUnit}`, color: "#38bdf8" },
            { emoji: "📍", label: "Location",        value: `${plan.farmDetails.district}, ${plan.farmDetails.state}`, color: "#a78bfa" },
            { emoji: "🌡️", label: "Weather Score",   value: plan.weather?.unavailable ? "N/A" : `${plan.weather?.suitabilityScore}%`, color: plan.weather?.suitabilityScore >= 75 ? "#22c55e" : "#fbbf24" },
            { emoji: "🥇", label: "Top Crop",        value: topRec.crop, color: "#22c55e" },
            { emoji: "📊", label: "Recommendation",  value: `${topRec.totalScore}/100`, color: scoreColor(topRec.totalScore) },
            { emoji: "🏆", label: "Best Market",     value: plan.bestMarket?.market || "See below", color: "#fbbf24" },
          ].map(({ emoji, label, value, color }) => (
            <div key={label} className="stat-card">
              <div className="stat-glow" style={{ background: color }} />
              <div className="stat-emoji">{emoji}</div>
              <div className="stat-val" style={{ fontSize: 18 }}>{value}</div>
              <div className="stat-lbl">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── FARM PLANNING FORM ───────────────────────────────── */}
      {!plan && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 10 }}>
            <div className="sfp-section-title" style={{ marginBottom: 0 }}>🗂️ Farm Planning Details</div>
            <button className="btn-ghost" onClick={loadMyFarm} disabled={farmLoading} style={{ fontSize: 12, padding: "7px 14px", color: "#4ade80", borderColor: "rgba(34,197,94,0.3)" }}>
              {farmLoading ? "⏳ Loading…" : farmLoaded ? "✅ Farm Loaded" : "🌾 Use My Farm Details"}
            </button>
          </div>
          {farmLoaded && <div style={{ fontSize: 12, color: "#4ade80", marginBottom: 12 }}>✅ Farm details auto-filled from My Farm profile. You can adjust any field below.</div>}
          <p className="card-sub" style={{ marginBottom: 24 }}>
            Enter your farm details to generate a personalised crop recommendation.
          </p>

          {error && <div className="alert-error">⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="sfp-form-grid">
              {/* State */}
              <div>
                <label className="field-label">State *</label>
                <select
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  className="field-input field-select"
                  required
                >
                  <option value="">{loadingStates ? "Loading…" : "Select State"}</option>
                  {states.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* District */}
              <div>
                <label className="field-label">District *</label>
                <select
                  name="district"
                  value={form.district}
                  onChange={handleChange}
                  className="field-input field-select"
                  required
                  disabled={!form.state}
                >
                  <option value="">{loadingDistricts ? "Loading…" : "Select District"}</option>
                  {districts.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Location / Village */}
              <div>
                <label className="field-label">Location / Village</label>
                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder={form.district || "e.g. Kolar"}
                  className="field-input"
                />
              </div>

              {/* Farm Area */}
              <div>
                <label className="field-label">Farm Area *</label>
                <input
                  type="number"
                  name="farmArea"
                  value={form.farmArea}
                  onChange={handleChange}
                  placeholder="e.g. 1"
                  min="0.1"
                  step="0.1"
                  className="field-input"
                  required
                />
              </div>

              {/* Area Unit */}
              <div>
                <label className="field-label">Area Unit</label>
                <select name="areaUnit" value={form.areaUnit} onChange={handleChange} className="field-input field-select">
                  <option value="Acre">Acre</option>
                  <option value="Hectare">Hectare</option>
                </select>
              </div>

              {/* Soil Type */}
              <div>
                <label className="field-label">Soil Type</label>
                <select name="soilType" value={form.soilType} onChange={handleChange} className="field-input field-select">
                  {["Loamy","Clay","Sandy","Black Soil","Red Soil","Other"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Irrigation */}
              <div>
                <label className="field-label">Irrigation Availability</label>
                <select name="irrigation" value={form.irrigation} onChange={handleChange} className="field-input field-select">
                  <option value="Available">Available</option>
                  <option value="Limited">Limited</option>
                  <option value="Rainfed">Rainfed</option>
                </select>
              </div>

              {/* Water Source */}
              <div>
                <label className="field-label">Water Source</label>
                <select name="waterSource" value={form.waterSource} onChange={handleChange} className="field-input field-select">
                  {["Borewell","Canal","Rainwater","Other"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Season */}
              <div>
                <label className="field-label">Season</label>
                <select name="season" value={form.season} onChange={handleChange} className="field-input field-select">
                  {["Current Season","Kharif","Rabi","Zaid"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Budget */}
              <div>
                <label className="field-label">Farming Budget (₹) — Optional</label>
                <input
                  type="number"
                  name="budget"
                  value={form.budget}
                  onChange={handleChange}
                  placeholder="e.g. 50000"
                  className="field-input"
                />
              </div>

              {/* Previous Crop */}
              <div>
                <label className="field-label">Previous Crop — Optional</label>
                <input
                  type="text"
                  name="previousCrop"
                  value={form.previousCrop}
                  onChange={handleChange}
                  placeholder="e.g. Tomato"
                  className="field-input"
                />
              </div>
            </div>

            {/* Example hint */}
            <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 12, background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.12)", fontSize: 13, color: "var(--text2)", marginBottom: 24 }}>
              💡 <strong style={{ color: "#4ade80" }}>Example:</strong> State: Karnataka · District: Kolar · Area: 1 Acre · Soil: Loamy · Irrigation: Available · Season: Current Season
            </div>

            <button
              type="submit"
              className="btn-green"
              disabled={submitting}
              id="sfp-generate-btn"
              style={{ fontSize: 15, padding: "13px 28px" }}
            >
              {submitting ? (
                <>
                  <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  Generating Smart Farm Plan…
                </>
              ) : (
                "🌾 Generate Smart Farm Plan"
              )}
            </button>
          </form>
        </div>
      )}

      {/* ── LOADING STATE ─────────────────────────────────────── */}
      {submitting && (
        <div className="loading-wrap" style={{ paddingTop: 40 }}>
          <div className="spinner" />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text)", marginBottom: 8 }}>
              Generating your Smart Farm Plan…
            </div>
            <div style={{ color: "var(--text2)", fontSize: 14 }}>
              Fetching weather · Analysing market prices · Running crop scoring · Getting AI explanation
            </div>
          </div>
        </div>
      )}

      {/* ── ERROR ─────────────────────────────────────────────── */}
      {error && !submitting && plan === null && (
        <div className="alert-error">⚠️ {error}</div>
      )}

      {/* ── PLAN RESULTS ──────────────────────────────────────── */}
      {plan && !submitting && (
        <>
          {/* Weather */}
          <WeatherPanel weather={plan.weather} />

          {/* Market Intelligence */}
          <MarketPanel market={plan.market} district={plan.farmDetails?.district} />

          {/* Recommendations Table */}
          <RecommendationsTable
            recommendations={plan.recommendations}
            selectedCrop={selectedCrop}
            onSelect={setSelectedCrop}
          />

          {/* Crop Detail + Profit */}
          {selectedCrop && <CropDetailPanel rec={selectedCrop} />}

          {/* Best Market Comparison */}
          {plan.bestMarket && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="sfp-section-title">🏆 Best Available Market — {plan.bestMarket.crop}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "16px 20px", borderRadius: 14, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", flexWrap: "wrap" }}>
                <span style={{ fontSize: 32 }}>🏆</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: "'Space Grotesk',sans-serif" }}>
                    {plan.bestMarket.market}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 2 }}>
                    {plan.bestMarket.district} · Highest observed market price
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#4ade80", fontFamily: "'Space Grotesk',sans-serif" }}>
                    ₹{fmt(plan.bestMarket.price)}/quintal
                  </div>
                  {plan.bestMarket.minPrice > 0 && (
                    <div style={{ fontSize: 12, color: "var(--text2)" }}>
                      Min: ₹{fmt(plan.bestMarket.minPrice)}/q
                    </div>
                  )}
                </div>
              </div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 10, fontStyle: "italic" }}>
                * "{plan.bestMarket.note}" Transportation costs are not included in this comparison.
              </div>
            </div>
          )}

          {/* Selling Recommendation */}
          {plan.sellingRecommendation && (
            <div className="card" style={{ marginBottom: 20, background: selStyle.bg, border: `1px solid ${selStyle.border}` }}>
              <div className="sfp-section-title" style={{ color: selStyle.color }}>
                {selStyle.icon} Smart Selling Recommendation
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 10 }}>
                {plan.sellingRecommendation.headline}
              </div>
              <div style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.7, marginBottom: 12 }}>
                {plan.sellingRecommendation.details}
              </div>
              <div style={{ fontSize: 12, color: "var(--text2)", fontStyle: "italic" }}>
                ⚠️ {plan.sellingRecommendation.disclaimer}
              </div>
            </div>
          )}

          {/* AI Explanation */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="sfp-section-title">🤖 AI Explanation — {topRec?.crop}</div>
            <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 16 }}>
              Powered by Groq (Llama 3.3 70B) · Explanation based on actual calculated data above
            </div>
            {typeof plan.aiExplanation === "string" && plan.aiExplanation ? (
              <div className="sfp-ai-text">{plan.aiExplanation}</div>
            ) : (
              <div className="alert-warn">⚠️ AI explanation is temporarily unavailable. The recommendation data above is calculated from real market and weather data.</div>
            )}
          </div>

          {/* Engine Info */}
          <div style={{ padding: "12px 16px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)", fontSize: 12, color: "var(--text2)", marginBottom: 20 }}>
            ⚙️ {plan.meta?.engine} · Generated: {new Date(plan.meta?.generatedAt).toLocaleString("en-IN")} ·{" "}
            <span title="Weights: Agri 30% · Weather 25% · Market 20% · Profit 15% · Water 10%">
              Weights: Agri {(plan.meta?.weights?.agriculturalSuitability * 100)}% · Weather {(plan.meta?.weights?.weatherSuitability * 100)}% · Market {(plan.meta?.weights?.marketTrend * 100)}% · Profit {(plan.meta?.weights?.expectedProfit * 100)}% · Water {(plan.meta?.weights?.waterRequirement * 100)}%
            </span>
          </div>
        </>
      )}
    </>
  );
}
