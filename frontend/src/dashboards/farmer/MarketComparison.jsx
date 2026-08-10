import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../../config/api";
import { DS } from "../../styles/ds";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("agroconnect_token")}`,
  "Content-Type": "application/json",
});

const fmt  = n => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmtQ = n => `₹${Number(n || 0).toLocaleString("en-IN")}/q`;

export default function MarketComparison() {
  const user = JSON.parse(localStorage.getItem("agroconnect_user") || "{}");

  // ── State / District catalog from APMC ──────────────────────
  const [states,     setStates]     = useState([]);
  const [districts,  setDistricts]  = useState([]);
  const [loadingS,   setLoadingS]   = useState(true);
  const [loadingD,   setLoadingD]   = useState(false);

  const [state,    setState]    = useState(user.state    || "");
  const [district, setDistrict] = useState(user.district || "");

  const [tab,    setTab]    = useState("district");
  const [search, setSearch] = useState("");

  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [hasFetched, setHasFetched] = useState(false);

  // Load all states on mount
  useEffect(() => {
    fetch(`${API_URL}/api/prices/catalog/states`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => { if (d.states?.length) setStates(d.states); })
      .catch(() => {})
      .finally(() => setLoadingS(false));
  }, []);

  // Load districts when state changes
  useEffect(() => {
    if (!state) { setDistricts([]); return; }
    setLoadingD(true);
    setDistricts([]);
    setDistrict(""); // reset district on state change
    fetch(`${API_URL}/api/prices/catalog/districts?state=${encodeURIComponent(state)}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => { if (d.districts?.length) setDistricts(d.districts); })
      .catch(() => {})
      .finally(() => setLoadingD(false));
  }, [state]);

  const handleFetch = useCallback(() => {
    if (!district && !state) {
      setError("Please select a state and district.");
      return;
    }
    setLoading(true);
    setError("");
    setHasFetched(true);

    Promise.allSettled([
      fetch(
        `${API_URL}/api/prices/district-insights?district=${encodeURIComponent(district)}&state=${encodeURIComponent(state)}`,
        { headers: authHeaders() }
      ).then(r => r.json()),
      fetch(
        `${API_URL}/api/prices/market-trends?state=${encodeURIComponent(state)}`,
        { headers: authHeaders() }
      ).then(r => r.json()),
    ]).then(([distRes, trendRes]) => {
      const dist  = distRes.status  === "fulfilled" ? distRes.value  : null;
      const trend = trendRes.status === "fulfilled" ? trendRes.value : null;
      setData({ district: dist, trends: trend });
    })
    .catch(e => setError(e.message))
    .finally(() => setLoading(false));
  }, [district, state]);

  // Price data — API returns { highest: [], lowest: [] }
  const highest   = data?.district?.highest || [];
  const lowest    = data?.district?.lowest  || [];
  // Merge highest + lowest, deduplicate by commodity+market
  const seen = new Set();
  const allPrices = [...highest, ...lowest].filter(p => {
    const key = `${p.commodity}-${p.market}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const rawTrends = data?.trends?.trends || data?.trends?.data || [];

  const prices = allPrices.filter(p => (p.commodity || p.name || p.crop || "").toLowerCase().includes(search.toLowerCase()));
  const trends  = rawTrends.filter(t  => (t.crop || t.commodity || "").toLowerCase().includes(search.toLowerCase()));


  return (
    <>
      <style>{DS + `
        .mc-tab { display:inline-flex; align-items:center; gap:6px; padding:9px 20px; border-radius:30px; border:1px solid var(--border); font-size:13px; font-weight:700; cursor:pointer; transition:all .2s; background:transparent; color:var(--text2); font-family:'Inter',sans-serif; }
        .mc-tab.active { background:rgba(34,197,94,0.12); border-color:rgba(34,197,94,0.3); color:#4ade80; }
        .mc-tab:hover:not(.active) { border-color:rgba(255,255,255,0.2); color:#fff; }
        .mc-row { display:flex; align-items:center; gap:12px; padding:12px 16px; border-radius:12px; border:1px solid var(--border); background:var(--surface); transition:background .15s; }
        .mc-row:hover { background:var(--surface2); }
        .mc-crop { font-weight:700; color:#fff; font-size:14px; flex:1; }
        .mc-price { font-weight:800; color:#4ade80; font-size:14px; white-space:nowrap; }
        .mc-label { font-size:11px; color:var(--text2); }
        .mc-search { padding:10px 16px; border-radius:30px; border:1px solid var(--border); background:var(--surface); color:#fff; font-size:13px; outline:none; width:220px; transition:border-color .2s; font-family:'Inter',sans-serif; }
        .mc-search:focus { border-color:rgba(34,197,94,0.4); }
        .mc-select { width:100%; appearance:none; padding:11px 16px; border-radius:12px; border:1px solid var(--border2); background:var(--surface); color:var(--text); font-size:13px; outline:none; font-family:'Inter',sans-serif; transition:border-color .2s; }
        .mc-select:focus { border-color:rgba(34,197,94,.4); box-shadow:0 0 0 3px rgba(34,197,94,.07); }
        .mc-select option { background:#0d1f2d; color:#f0f6ff; }
      `}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">APMC Market Prices</div>
          <h1 className="pg-title">📊 Market Comparison</h1>
          <p className="pg-sub">Select your state and district to fetch real-time mandi prices from APMC data.</p>
        </div>
      </div>

      {/* Location picker */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title" style={{ marginBottom: 6 }}>📍 Select Location</div>
        <p className="card-sub" style={{ marginBottom: 18 }}>
          Your profile location: <strong style={{ color: "#fff" }}>{user.district ? `${user.district}, ${user.state}` : user.location || "—"}</strong>
          {!user.district && <> — <Link to="/farmer/profile" style={{ color: "#38bdf8" }}>update your profile</Link> to pre-fill this.</>}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginBottom: 16 }}>
          {/* State */}
          <div>
            <label className="field-label">
              State {loadingS && <span style={{ color: "var(--text2)", fontWeight: 400 }}>— loading…</span>}
            </label>
            <select
              className="mc-select"
              value={state}
              onChange={e => setState(e.target.value)}
            >
              <option value="">— Select State —</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* District — dropdown if available, text input as fallback */}
          <div>
            <label className="field-label">
              District {loadingD && <span style={{ color: "var(--text2)", fontWeight: 400 }}>— loading…</span>}
            </label>
            {districts.length > 0 ? (
              <select className="mc-select" value={district} onChange={e => setDistrict(e.target.value)}>
                <option value="">— Select District —</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            ) : (
              <input
                className="field-input"
                placeholder={state ? (loadingD ? "Loading districts…" : "Type district name") : "Select a state first"}
                value={district}
                onChange={e => setDistrict(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleFetch()}
              />
            )}
          </div>

          {/* Fetch button */}
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button
              className="btn-green"
              onClick={handleFetch}
              disabled={loading || !state}
              style={{ width: "100%" }}
            >
              {loading ? "⏳ Fetching…" : "🔍 Fetch Prices"}
            </button>
          </div>
        </div>

        <p style={{ fontSize: 12, color: "var(--text2)" }}>
          💡 Tip: Save your state in <Link to="/farmer/my-farm" style={{ color: "#4ade80" }}>My Farm</Link> to have it pre-filled in the Smart Farm Planner.
        </p>
      </div>

      {error && <div className="alert-error">⚠️ {error}</div>}

      {/* Results */}
      {!hasFetched ? (
        <div className="empty-state">
          <div className="empty-emoji">🏪</div>
          <div className="empty-title">Select state and district above</div>
          <div className="empty-sub">Choose your state from the dropdown — districts will load automatically. Then click "Fetch Prices".</div>
        </div>
      ) : loading ? (
        <div className="loading-wrap"><div className="spinner" /><span>Fetching market data…</span></div>
      ) : (
        <>
          {/* Tab bar */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
            <button className={`mc-tab ${tab === "district" ? "active" : ""}`} onClick={() => setTab("district")}>📍 District Prices</button>
            <button className={`mc-tab ${tab === "trends"   ? "active" : ""}`} onClick={() => setTab("trends")}>📈 Market Trends</button>
            <input className="mc-search" placeholder="Search crop…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {tab === "district" ? (
            prices.length === 0 ? (
              <div className="empty-state">
                <div className="empty-emoji">📊</div>
                <div className="empty-title">No price data for "{district || state}"</div>
                <div className="empty-sub">
                  APMC data may not be available for this district in the dataset.<br />
                  <span style={{ color: "#94a3b8", fontSize: 12 }}>{data?.district?.message || ""}</span>
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 12 }}>
                  {prices.length} commodity price{prices.length !== 1 ? "s" : ""} — <strong style={{ color: "#fff" }}>{district}, {state}</strong>
                </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {prices.map((p, i) => {
                    const name  = p.commodity || "—";
                    const mkt   = p.market    || "";
                    const vty   = p.variety   || "";
                    const maxP  = p.maxPrice  || 0;
                    const minP  = p.minPrice  || 0;
                    const avgP  = maxP && minP ? Math.round((maxP + minP) / 2) : (maxP || minP);
                    return (
                      <div key={i} className="mc-row">
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(34,197,94,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🌾</div>
                        <div style={{ flex: 1 }}>
                          <div className="mc-crop">{name}{vty ? ` (${vty})` : ""}</div>
                          {mkt && <div style={{ fontSize: 11, color: "#94a3b8" }}>📍 {mkt}</div>}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div className="mc-price">{fmtQ(avgP)}</div>
                          <div className="mc-label">Min {fmt(minP)} · Max {fmt(maxP)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </>
            )
          ) : (
            /* ── MARKET TRENDS TAB ── */
            (() => {
              const topH   = (data?.trends?.topHighest     || []).filter(t => (t.commodity||"").toLowerCase().includes(search.toLowerCase()));
              const topL   = (data?.trends?.topLowest      || []).filter(t => (t.commodity||"").toLowerCase().includes(search.toLowerCase()));
              const latest = (data?.trends?.latestPrices   || []).filter(t => (t.commodity||"").toLowerCase().includes(search.toLowerCase()));
              const avgs   = (data?.trends?.commodityAverage|| []).filter(t => (t._id||"").toLowerCase().includes(search.toLowerCase()));
              const totalItems = topH.length + topL.length + latest.length + avgs.length;

              if (totalItems === 0) return (
                <div className="empty-state">
                  <div className="empty-emoji">📈</div>
                  <div className="empty-title">No trend data for "{state}"</div>
                  <div className="empty-sub">Market price history for this state has not yet been synced. Fetch district prices first — this populates the trend database.</div>
                </div>
              );

              const TrendRow = ({ icon, name, sub, price, label, color }) => (
                <div className="mc-row">
                  <div style={{ width:32,height:32,borderRadius:10,background:`${color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0 }}>{icon}</div>
                  <div style={{ flex:1 }}>
                    <div className="mc-crop">{name}</div>
                    {sub && <div style={{ fontSize:11,color:"#94a3b8" }}>📍 {sub}</div>}
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontWeight:800,color,fontSize:14 }}>{price}</div>
                    <div className="mc-label">{label}</div>
                  </div>
                </div>
              );

              return (
                <div style={{ display:"flex",flexDirection:"column",gap:24 }}>

                  {/* Highest priced crops */}
                  {topH.length > 0 && (
                    <div>
                      <div style={{ fontSize:12,fontWeight:700,color:"#4ade80",textTransform:"uppercase",letterSpacing:".06em",marginBottom:10 }}>🏆 Highest Value Crops — {state}</div>
                      <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                        {topH.map((t,i) => (
                          <TrendRow key={i} icon="🌾"
                            name={`${t.commodity}${t.variety ? ` (${t.variety})` : ""}`}
                            sub={`${t.market || ""}${t.district ? ` · ${t.district}` : ""}`}
                            price={fmtQ(t.maxPrice)} label="Max price" color="#4ade80" />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lowest priced crops */}
                  {topL.length > 0 && (
                    <div>
                      <div style={{ fontSize:12,fontWeight:700,color:"#38bdf8",textTransform:"uppercase",letterSpacing:".06em",marginBottom:10 }}>💰 Most Affordable Crops — {state}</div>
                      <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                        {topL.map((t,i) => (
                          <TrendRow key={i} icon="🌿"
                            name={`${t.commodity}${t.variety ? ` (${t.variety})` : ""}`}
                            sub={`${t.market || ""}${t.district ? ` · ${t.district}` : ""}`}
                            price={fmtQ(t.minPrice)} label="Min price" color="#38bdf8" />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Commodity average prices */}
                  {avgs.length > 0 && (
                    <div>
                      <div style={{ fontSize:12,fontWeight:700,color:"#fb923c",textTransform:"uppercase",letterSpacing:".06em",marginBottom:10 }}>📊 Average Price by Crop — {state}</div>
                      <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                        {avgs.map((t,i) => (
                          <TrendRow key={i} icon="📊"
                            name={t._id || "—"}
                            sub={`${t.records || 0} price records`}
                            price={fmtQ(Math.round(t.averagePrice || 0))} label="Avg modal price" color="#fb923c" />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Latest prices */}
                  {latest.length > 0 && (
                    <div>
                      <div style={{ fontSize:12,fontWeight:700,color:"#a78bfa",textTransform:"uppercase",letterSpacing:".06em",marginBottom:10 }}>🕒 Latest Arrivals — {state}</div>
                      <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                        {latest.map((t,i) => (
                          <TrendRow key={i} icon="🗓️"
                            name={`${t.commodity}${t.variety ? ` (${t.variety})` : ""}`}
                            sub={`${t.market||""}${t.district ? ` · ${t.district}` : ""}${t.arrivalDate ? ` · ${new Date(t.arrivalDate).toLocaleDateString("en-IN")}` : ""}`}
                            price={fmtQ(t.modalPrice || t.maxPrice || 0)}
                            label={`Min ${fmt(t.minPrice||0)} · Max ${fmt(t.maxPrice||0)}`}
                            color="#a78bfa" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          )}

        </>
      )}
    </>
  );
}
