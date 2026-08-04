import { useEffect, useState } from "react";
import { DS } from "../../styles/ds";

const API_BASE = "http://localhost:5000/api";

export default function PricePrediction() {
  const token = localStorage.getItem("agroconnect_token");
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [highest, setHighest] = useState([]);
  const [lowest, setLowest] = useState([]);
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const apiGet = async (url) => {
    const r = await fetch(`${API_BASE}${url}`, { headers: { Authorization: `Bearer ${token}` } });
    const d = await r.json();
    if (!r.ok) throw new Error(d.message || "Request failed");
    return d;
  };

  useEffect(() => {
    setOptionsLoading(true);
    apiGet("/prices/catalog/states")
      .then((d) => setStates(d.states || []))
      .catch((e) => setError(e.message))
      .finally(() => setOptionsLoading(false));
  }, []);

  useEffect(() => {
    if (!state) { setDistricts([]); return; }
    apiGet(`/prices/catalog/districts?state=${encodeURIComponent(state)}`)
      .then((d) => setDistricts(d.districts || []))
      .catch((e) => setError(e.message));
  }, [state]);

  const handleStateChange = (v) => { setState(v); setDistrict(""); setHighest([]); setLowest([]); setError(""); };
  const handleDistrictChange = (v) => { setDistrict(v); setHighest([]); setLowest([]); setError(""); };

  const handleInsights = async (e) => {
    e.preventDefault();
    if (!state || !district) { setError("Please select both State and District."); return; }
    setLoading(true); setError(""); setHasSearched(true);
    try {
      const d = await apiGet(`/prices/district-insights?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}`);
      setHighest(d.highest || []);
      setLowest(d.lowest || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <>
      <style>{DS + `
        .price-table{width:100%;border-collapse:collapse;}
        .price-table th{text-align:left;font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:0.06em;padding:10px 16px;border-bottom:1px solid var(--border);}
        .price-table td{padding:13px 16px;font-size:14px;border-bottom:1px solid var(--border);}
        .price-table tr:last-child td{border-bottom:none;}
        .price-table tbody tr:hover{background:var(--surface);}
      `}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Market Intelligence</div>
          <h1 className="pg-title">📈 Price Predictions</h1>
          <p className="pg-sub">View highest and lowest crop prices by state and district from APMC data.</p>
        </div>
      </div>

      {/* Filter Card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title" style={{ marginBottom: 4 }}>🔍 Select Your Market</div>
        <div className="card-sub" style={{ marginBottom: 20 }}>Choose a state and district to view live price insights.</div>
        <form onSubmit={handleInsights}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 14, alignItems: "flex-end" }}>
            <div>
              <label className="field-label">State</label>
              <select className="field-input field-select" value={state} onChange={(e) => handleStateChange(e.target.value)} disabled={optionsLoading}>
                <option value="">{optionsLoading ? "Loading states…" : "Select State"}</option>
                {states.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">District</label>
              <select className="field-input field-select" value={district} onChange={(e) => handleDistrictChange(e.target.value)} disabled={!state || districts.length === 0}>
                <option value="">{!state ? "Select state first" : "Select District"}</option>
                {districts.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <button type="submit" className="btn-green" disabled={!state || !district || loading} style={{ height: 46 }}>
              {loading ? <span style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} /> : "📊 Get Insights"}
            </button>
          </div>
        </form>
      </div>

      {error && <div className="alert-error">⚠️ {error}</div>}

      {loading && <div className="loading-wrap"><div className="spinner" /><span>Fetching market data…</span></div>}

      {!loading && hasSearched && highest.length === 0 && lowest.length === 0 && !error && (
        <div className="card empty-state">
          <div className="empty-emoji">📭</div>
          <div className="empty-title">No price data found</div>
          <div className="empty-sub">Try a different state or district combination.</div>
        </div>
      )}

      {/* Results grid */}
      {!loading && (highest.length > 0 || lowest.length > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Highest */}
          {highest.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", background: "rgba(34,197,94,0.06)", borderBottom: "1px solid rgba(34,197,94,0.12)", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>📈</span>
                <div>
                  <div style={{ fontWeight: 700, color: "#4ade80", fontSize: 15 }}>Highest Price Crops</div>
                  <div style={{ fontSize: 12, color: "var(--text2)" }}>{district}, {state}</div>
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="price-table">
                  <thead><tr><th>Crop</th><th>Variety</th><th>Market</th><th style={{ textAlign: "right" }}>Max ₹/q</th></tr></thead>
                  <tbody>
                    {highest.map((c, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{c.commodity}</td>
                        <td style={{ color: "var(--text2)" }}>{c.variety || "—"}</td>
                        <td style={{ color: "var(--text2)" }}>{c.market}</td>
                        <td style={{ textAlign: "right", fontWeight: 800, color: "#4ade80" }}>₹{Number(c.maxPrice).toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Lowest */}
          {lowest.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", background: "rgba(239,68,68,0.06)", borderBottom: "1px solid rgba(239,68,68,0.12)", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>📉</span>
                <div>
                  <div style={{ fontWeight: 700, color: "#f87171", fontSize: 15 }}>Lowest Price Crops</div>
                  <div style={{ fontSize: 12, color: "var(--text2)" }}>{district}, {state}</div>
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="price-table">
                  <thead><tr><th>Crop</th><th>Variety</th><th>Market</th><th style={{ textAlign: "right" }}>Min ₹/q</th></tr></thead>
                  <tbody>
                    {lowest.map((c, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{c.commodity}</td>
                        <td style={{ color: "var(--text2)" }}>{c.variety || "—"}</td>
                        <td style={{ color: "var(--text2)" }}>{c.market}</td>
                        <td style={{ textAlign: "right", fontWeight: 800, color: "#f87171" }}>₹{Number(c.minPrice).toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info tips */}
      {!hasSearched && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16, marginTop: 8 }}>
          {[
            ["💡", "Sell at the Right Time", "Check prices weekly to find the best time to sell your produce at maximum value."],
            ["📍", "Compare Markets", "Prices vary between districts. Sometimes nearby markets offer 20-30% better rates."],
            ["📊", "MSP Reference", "The government's Minimum Support Price (MSP) is your baseline — always target above it."],
          ].map(([icon, title, tip]) => (
            <div key={title} className="card">
              <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
              <div style={{ fontWeight: 700, color: "#fff", marginBottom: 6, fontSize: 14 }}>{title}</div>
              <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>{tip}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}