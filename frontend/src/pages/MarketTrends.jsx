import { useEffect, useState, useCallback } from "react";
import { DS } from "../styles/ds";
import {
  TrendingUp, TrendingDown, Coins, Store, MapPin,
  Clock, BarChart3, RotateCcw, AlertTriangle, X
} from "lucide-react";

const API_URL = "http://localhost:5000/api";

const SECTIONS = [
  { key: "highest",   label: "Top Highest Prices",   Icon: TrendingUp,   color: "#15803d", accent: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.15)"  },
  { key: "lowest",    label: "Top Lowest Prices",    Icon: TrendingDown, color: "#dc2626", accent: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.15)"  },
  { key: "avg",       label: "Avg by Commodity",     Icon: Coins,        color: "#0369a1", accent: "rgba(56,189,248,0.08)",  border: "rgba(56,189,248,0.15)" },
  { key: "markets",   label: "Most Active Markets",  Icon: Store,        color: "#b45309", accent: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.15)" },
  { key: "districts", label: "District Statistics",  Icon: MapPin,       color: "#7c3aed", accent: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.15)"},
  { key: "latest",    label: "Latest Market Prices", Icon: Clock,        color: "#94a3b8", accent: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.15)"},
];

export default function MarketTrends() {
  const token = localStorage.getItem("agroconnect_token");

  const [states, setStates]           = useState([]);
  const [districts, setDistricts]     = useState([]);
  const [selState, setSelState]       = useState("");
  const [selDistrict, setSelDistrict] = useState("");

  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState("");
  const [topHighest, setTopHighest]         = useState([]);
  const [topLowest, setTopLowest]           = useState([]);
  const [commodityAverage, setCommodityAverage] = useState([]);
  const [marketStats, setMarketStats]       = useState([]);
  const [districtStats, setDistrictStats]   = useState([]);
  const [latestPrices, setLatestPrices]     = useState([]);
  const [activeTab, setActiveTab]           = useState("highest");

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch(`${API_URL}/prices/options/states`, { headers })
      .then(r => r.json())
      .then(d => { if (d.success) setStates(d.states || []); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setSelDistrict("");
    setDistricts([]);
    if (!selState) return;
    fetch(`${API_URL}/prices/options/districts?state=${encodeURIComponent(selState)}`, { headers })
      .then(r => r.json())
      .then(d => { if (d.success) setDistricts(d.districts || []); })
      .catch(() => {});
  }, [selState]);

  const loadTrends = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const params = new URLSearchParams();
      if (selState)    params.set("state", selState);
      if (selDistrict) params.set("district", selDistrict);
      const qs = params.toString() ? "?" + params : "";
      const r = await fetch(`${API_URL}/prices/market-trends${qs}`, { headers });
      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.message || "Unable to load market trends.");
      setTopHighest(d.topHighest || []);
      setTopLowest(d.topLowest || []);
      setCommodityAverage(d.commodityAverage || []);
      setMarketStats(d.marketStats || []);
      setDistrictStats(d.districtStats || []);
      setLatestPrices(d.latestPrices || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [selState, selDistrict, token]);

  useEffect(() => { loadTrends(); }, [loadTrends]);

  const activeSection = SECTIONS.find(s => s.key === activeTab);

  return (
    <>
      <style>{DS + `
        .mt-filter-bar { display:flex; gap:12px; flex-wrap:wrap; align-items:center; margin-bottom:24px; }
        .mt-filter-label { font-size:12px; color:var(--text2); font-weight:600; letter-spacing:0.04em; white-space:nowrap; }
        .mt-filter-select { flex:1; min-width:160px; max-width:260px; background:var(--surface); border:1px solid var(--border); color:var(--text); border-radius:10px; padding:10px 14px; font-family:'Inter',sans-serif; font-size:13px; cursor:pointer; outline:none; transition:border-color 0.2s; }
        .mt-filter-select:focus { border-color:#15803d; }
        .mt-filter-select option { background:#1a2332; }
        .filter-chip { display:inline-flex; align-items:center; gap:6px; padding:4px 10px 4px 12px; background:rgba(74,222,128,0.08); border:1px solid rgba(74,222,128,0.2); border-radius:20px; font-size:12px; font-weight:600; color:#15803d; }
        .chip-x { cursor:pointer; opacity:.7; font-size:14px; }
        .chip-x:hover { opacity:1; }
        .mt-tabs { display:flex; gap:0; flex-wrap:wrap; background:var(--surface); border-radius:14px; padding:5px; border:1px solid var(--border); margin-bottom:24px; }
        .mt-tab { padding:9px 18px; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; border:none; background:none; color:var(--text2); font-family:'Inter',sans-serif; transition:all 0.2s; white-space:nowrap; }
        .mt-tab.active { color:#0f172a; }
        .mt-table { width:100%; border-collapse:collapse; }
        .mt-table th { text-align:left; font-size:11px; font-weight:700; color:var(--text2); text-transform:uppercase; letter-spacing:0.06em; padding:11px 16px; border-bottom:1px solid var(--border); }
        .mt-table th:last-child { text-align:right; }
        .mt-table td { padding:13px 16px; font-size:14px; color:var(--text); border-bottom:1px solid rgba(255,255,255,0.04); }
        .mt-table td:last-child { text-align:right; }
        .mt-table tbody tr:last-child td { border-bottom:none; }
        .mt-table tbody tr:hover { background:rgba(255,255,255,0.025); }
        .mt-rank { display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px; border-radius:6px; font-size:11px; font-weight:800; margin-right:8px; }
        .bar-wrap { display:flex; align-items:center; gap:10px; }
        .bar-track { flex:1; height:6px; background:rgba(255,255,255,0.07); border-radius:3px; overflow:hidden; min-width:60px; }
        .bar-fill { height:100%; border-radius:3px; }
      `}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Live APMC Data · All India</div>
          <h1 className="pg-title"><BarChart3 size={22} strokeWidth={2} style={{ marginRight: 8, color: "#16a34a", verticalAlign: "middle" }} />Market Trends</h1>
          <p className="pg-sub">Agricultural commodity prices across Indian markets — filter by State & District.</p>
        </div>
        <button onClick={loadTrends} className="btn-ghost" style={{ fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <RotateCcw size={14} /> Refresh
        </button>
      </div>

      <div className="mt-filter-bar">
        <span className="mt-filter-label">Filter by:</span>
        <select id="mt-state-select" className="mt-filter-select" value={selState} onChange={e => setSelState(e.target.value)}>
          <option value="">All States</option>
          {states.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {selState && (
          <select id="mt-district-select" className="mt-filter-select" value={selDistrict} onChange={e => setSelDistrict(e.target.value)}>
            <option value="">All Districts</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        )}
        {selState && (
          <span className="filter-chip">
            {selState}
            <X size={12} className="chip-x" onClick={() => { setSelState(""); setSelDistrict(""); }} />
          </span>
        )}
        {selDistrict && (
          <span className="filter-chip" style={{ background:"rgba(167,139,250,0.08)", borderColor:"rgba(167,139,250,0.2)", color: "#7c3aed" }}>
            {selDistrict}
            <X size={12} className="chip-x" onClick={() => setSelDistrict("")} />
          </span>
        )}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:12, marginBottom:28 }}>
        {[
          [TrendingUp,   "Highest",     topHighest.length,        "#4ade80"],
          [TrendingDown, "Lowest",      topLowest.length,         "#f87171"],
          [Coins,        "Commodities", commodityAverage.length,  "#38bdf8"],
          [Store,        "Markets",     marketStats.length,       "#fbbf24"],
          [MapPin,       "Districts",   districtStats.length,     "#a78bfa"],
          [Clock,        "Latest",      latestPrices.length,      "#94a3b8"],
        ].map(([Icon, label, val, color]) => (
          <div key={label} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, padding:"16px 18px", display:"flex", flexDirection:"column", gap:6 }}>
            <div style={{ color }}><Icon size={20} /></div>
            <div style={{ fontSize:11, color:"var(--text2)", textTransform:"uppercase", letterSpacing:"0.05em" }}>{label}</div>
            <div style={{ fontSize:28, fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, color }}>{loading ? "—" : val}</div>
          </div>
        ))}
      </div>

      {error  && <div className="alert-error" style={{ display: "flex", alignItems: "center", gap: 8 }}><AlertTriangle size={16} /> {error}</div>}
      {loading && <div className="loading-wrap"><div className="spinner" /><span>Loading market data…</span></div>}

      {!loading && !error && (
        <>
          <div className="mt-tabs">
            {SECTIONS.map(s => (
              <button key={s.key} className={`mt-tab ${activeTab === s.key ? "active" : ""}`}
                style={activeTab === s.key ? { background:`${s.accent}`, color:s.color, border:`1px solid ${s.border}` } : {}}
                onClick={() => setActiveTab(s.key)}>
                {s.Icon && <s.Icon size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />}{s.label}
              </button>
            ))}
          </div>

          <div className="card" style={{ padding:0, overflow:"hidden", borderColor:activeSection?.border, background:`linear-gradient(180deg, ${activeSection?.accent} 0%, transparent 60%)` }}>
            <div style={{ padding:"18px 22px", borderBottom:`1px solid ${activeSection?.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:16, color:activeSection?.color, display: "flex", alignItems: "center", gap: 8 }}>
                  {activeSection?.Icon && <activeSection.Icon size={18} />} {activeSection?.label}
                </div>
                <div style={{ fontSize:12, color:"var(--text2)", marginTop:2 }}>
                  {selState ? `${selState}${selDistrict ? " › " + selDistrict : ""}` : "All India"} · APMC price data
                </div>
              </div>
              <div style={{ fontSize:12, color:"var(--text2)", background:"var(--surface)", padding:"5px 12px", borderRadius:8, border:"1px solid var(--border)" }}>
                {activeTab === "highest"   && `${topHighest.length} crops`}
                {activeTab === "lowest"    && `${topLowest.length} crops`}
                {activeTab === "avg"       && `${commodityAverage.length} commodities`}
                {activeTab === "markets"   && `${marketStats.length} markets`}
                {activeTab === "districts" && `${districtStats.length} districts`}
                {activeTab === "latest"    && `${latestPrices.length} entries`}
              </div>
            </div>

            <div style={{ overflowX:"auto" }}>
              {activeTab === "highest" && (
                <table className="mt-table">
                  <thead><tr><th>#</th><th>Commodity</th><th>Variety</th><th>Market</th><th>District</th><th>Max Price Rs/q</th></tr></thead>
                  <tbody>
                    {topHighest.map((item, i) => (
                      <tr key={i}>
                        <td><span className="mt-rank" style={{ background:i<3?"rgba(34,197,94,0.12)":"rgba(255,255,255,0.05)", color:i<3?"#4ade80":"var(--text2)" }}>{i+1}</span></td>
                        <td style={{ fontWeight:700, color: "#0f172a" }}>{item.commodity}</td>
                        <td style={{ color:"var(--text2)" }}>{item.variety || "—"}</td>
                        <td>{item.market}</td>
                        <td style={{ color:"var(--text2)" }}>{item.district || "—"}</td>
                        <td><span style={{ fontWeight:800, color: "#15803d", fontSize:15 }}>Rs.{Number(item.maxPrice).toLocaleString("en-IN")}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {activeTab === "lowest" && (
                <table className="mt-table">
                  <thead><tr><th>#</th><th>Commodity</th><th>Variety</th><th>Market</th><th>District</th><th>Min Price Rs/q</th></tr></thead>
                  <tbody>
                    {topLowest.map((item, i) => (
                      <tr key={i}>
                        <td><span className="mt-rank" style={{ background:"rgba(239,68,68,0.12)", color: "#dc2626" }}>{i+1}</span></td>
                        <td style={{ fontWeight:700, color: "#0f172a" }}>{item.commodity}</td>
                        <td style={{ color:"var(--text2)" }}>{item.variety || "—"}</td>
                        <td>{item.market}</td>
                        <td style={{ color:"var(--text2)" }}>{item.district || "—"}</td>
                        <td><span style={{ fontWeight:800, color: "#dc2626", fontSize:15 }}>Rs.{Number(item.minPrice).toLocaleString("en-IN")}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {activeTab === "avg" && (
                <table className="mt-table">
                  <thead><tr><th>#</th><th>Commodity</th><th>Avg Price Rs/q</th><th>Records</th></tr></thead>
                  <tbody>
                    {(() => {
                      const maxAvg = Math.max(...commodityAverage.map(c => c.averagePrice || 0));
                      return commodityAverage.map((item, i) => (
                        <tr key={i}>
                          <td><span className="mt-rank" style={{ background:"rgba(56,189,248,0.1)", color: "#0369a1" }}>{i+1}</span></td>
                          <td style={{ fontWeight:700, color: "#0f172a" }}>{item._id}</td>
                          <td>
                            <div className="bar-wrap">
                              <span style={{ fontWeight:700, color: "#0369a1", width:80, flexShrink:0 }}>Rs.{Math.round(item.averagePrice).toLocaleString("en-IN")}</span>
                              <div className="bar-track"><div className="bar-fill" style={{ width:`${(item.averagePrice/maxAvg)*100}%`, background:"linear-gradient(90deg,#0ea5e9,#38bdf8)" }} /></div>
                            </div>
                          </td>
                          <td style={{ color:"var(--text2)" }}>{item.records} entries</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              )}
              {activeTab === "markets" && (
                <table className="mt-table">
                  <thead><tr><th>#</th><th>Market Name</th><th>Listings</th></tr></thead>
                  <tbody>
                    {(() => {
                      const maxRec = Math.max(...marketStats.map(m => m.records || 0));
                      return marketStats.map((item, i) => (
                        <tr key={i}>
                          <td><span className="mt-rank" style={{ background:"rgba(251,191,36,0.1)", color: "#b45309" }}>{i+1}</span></td>
                          <td style={{ fontWeight:700, color: "#0f172a" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Store size={15} color="#b45309" /> {item._id}</span></td>
                          <td>
                            <div className="bar-wrap">
                              <span style={{ fontWeight:700, color: "#b45309", width:60, flexShrink:0 }}>{item.records}</span>
                              <div className="bar-track"><div className="bar-fill" style={{ width:`${(item.records/maxRec)*100}%`, background:"linear-gradient(90deg,#d97706,#fbbf24)" }} /></div>
                            </div>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              )}
              {activeTab === "districts" && (
                <table className="mt-table">
                  <thead><tr><th>#</th><th>District</th><th>Crops</th><th>Markets</th><th>Avg Price Rs/q</th></tr></thead>
                  <tbody>
                    {districtStats.map((item, i) => (
                      <tr key={i}>
                        <td><span className="mt-rank" style={{ background:"rgba(167,139,250,0.1)", color: "#7c3aed" }}>{i+1}</span></td>
                        <td style={{ fontWeight:700, color: "#0f172a" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><MapPin size={15} color="#7c3aed" /> {item.district}</span></td>
                        <td style={{ color:"var(--text2)" }}>{item.cropCount}</td>
                        <td style={{ color:"var(--text2)" }}>{item.marketCount}</td>
                        <td><span style={{ fontWeight:700, color: "#7c3aed" }}>Rs.{Math.round(item.avgPrice).toLocaleString("en-IN")}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {activeTab === "latest" && (
                <table className="mt-table">
                  <thead><tr><th>#</th><th>Commodity</th><th>Market</th><th>District</th><th>Min</th><th>Max</th><th>Modal Price Rs/q</th></tr></thead>
                  <tbody>
                    {latestPrices.map((item, i) => (
                      <tr key={i}>
                        <td><span className="mt-rank" style={{ background:"rgba(148,163,184,0.1)", color:"#94a3b8" }}>{i+1}</span></td>
                        <td style={{ fontWeight:700, color: "#0f172a" }}>{item.commodity}</td>
                        <td style={{ color:"var(--text2)" }}>{item.market}</td>
                        <td style={{ color:"var(--text2)" }}>{item.district || "—"}</td>
                        <td style={{ color: "#dc2626", fontWeight:600 }}>Rs.{Number(item.minPrice||0).toLocaleString("en-IN")}</td>
                        <td style={{ color: "#15803d", fontWeight:600 }}>Rs.{Number(item.maxPrice||0).toLocaleString("en-IN")}</td>
                        <td><span style={{ fontWeight:800, color: "#0f172a", fontSize:15 }}>Rs.{Number(item.modalPrice||0).toLocaleString("en-IN")}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
