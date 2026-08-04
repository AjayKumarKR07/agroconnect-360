import { useEffect, useState } from "react";
import { DS } from "../styles/ds";

const API_URL = "http://localhost:5000/api";

const SECTIONS = [
  { key: "highest", label: "📈 Top Highest Prices", color: "#4ade80", accent: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.15)" },
  { key: "lowest",  label: "📉 Top Lowest Prices",  color: "#f87171", accent: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.15)"  },
  { key: "avg",     label: "💰 Average by Commodity", color: "#38bdf8", accent: "rgba(56,189,248,0.08)", border: "rgba(56,189,248,0.15)" },
  { key: "markets", label: "🏪 Most Active Markets", color: "#fbbf24", accent: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.15)" },
  { key: "districts",label: "📍 District Statistics", color: "#a78bfa", accent: "rgba(167,139,250,0.08)",border: "rgba(167,139,250,0.15)"},
  { key: "latest",  label: "⏱️ Latest Market Prices", color: "#94a3b8", accent: "rgba(148,163,184,0.08)",border: "rgba(148,163,184,0.15)"},
];

export default function MarketTrends() {
  const token = localStorage.getItem("agroconnect_token");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [topHighest, setTopHighest] = useState([]);
  const [topLowest, setTopLowest] = useState([]);
  const [commodityAverage, setCommodityAverage] = useState([]);
  const [marketStats, setMarketStats] = useState([]);
  const [districtStats, setDistrictStats] = useState([]);
  const [latestPrices, setLatestPrices] = useState([]);
  const [activeTab, setActiveTab] = useState("highest");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true); setError("");
        const r = await fetch(`${API_URL}/prices/market-trends`, { headers: { Authorization: `Bearer ${token}` } });
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
    };
    load();
  }, []);

  const activeSection = SECTIONS.find(s => s.key === activeTab);

  return (
    <>
      <style>{DS + `
        .mt-tabs { display: flex; gap: 0; flex-wrap: wrap; background: var(--surface); border-radius: 14px; padding: 5px; border: 1px solid var(--border); margin-bottom: 24px; }
        .mt-tab { padding: 9px 18px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; background: none; color: var(--text2); font-family: 'Inter',sans-serif; transition: all 0.2s; white-space: nowrap; }
        .mt-tab.active { color: #fff; }
        .mt-table { width: 100%; border-collapse: collapse; }
        .mt-table th { text-align: left; font-size: 11px; font-weight: 700; color: var(--text2); text-transform: uppercase; letter-spacing: 0.06em; padding: 11px 16px; border-bottom: 1px solid var(--border); }
        .mt-table th:last-child { text-align: right; }
        .mt-table td { padding: 13px 16px; font-size: 14px; color: var(--text); border-bottom: 1px solid rgba(255,255,255,0.04); }
        .mt-table td:last-child { text-align: right; }
        .mt-table tbody tr:last-child td { border-bottom: none; }
        .mt-table tbody tr:hover { background: rgba(255,255,255,0.025); }
        .mt-rank { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 6px; font-size: 11px; font-weight: 800; margin-right: 8px; }
        .bar-wrap { display: flex; align-items: center; gap: 10px; }
        .bar-track { flex: 1; height: 6px; background: rgba(255,255,255,0.07); border-radius: 3px; overflow: hidden; min-width: 60px; }
        .bar-fill { height: 100%; border-radius: 3px; }
      `}</style>

      {/* Header */}
      <div className="pg-head">
        <div>
          <div className="eyebrow">Live APMC Data</div>
          <h1 className="pg-title">📊 Market Trends</h1>
          <p className="pg-sub">Real-time agricultural commodity prices across Indian markets.</p>
        </div>
        <button onClick={() => window.location.reload()} className="btn-ghost" style={{ fontSize: 13 }}>🔄 Refresh</button>
      </div>

      {/* Summary stat row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 28 }}>
        {[
          ["📈", "Highest", topHighest.length, "#4ade80"],
          ["📉", "Lowest",  topLowest.length,  "#f87171"],
          ["💰", "Commodities", commodityAverage.length, "#38bdf8"],
          ["🏪", "Markets", marketStats.length, "#fbbf24"],
          ["📍", "Districts", districtStats.length, "#a78bfa"],
          ["⏱️", "Latest Entries", latestPrices.length, "#94a3b8"],
        ].map(([icon, label, val, color]) => (
          <div key={label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 18 }}>{icon}</div>
            <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
            <div style={{ fontSize: 28, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, color }}>{loading ? "—" : val}</div>
          </div>
        ))}
      </div>

      {error && <div className="alert-error">⚠️ {error}</div>}
      {loading && <div className="loading-wrap"><div className="spinner" /><span>Loading market data…</span></div>}

      {!loading && !error && (
        <>
          {/* Tabs */}
          <div className="mt-tabs">
            {SECTIONS.map(s => (
              <button
                key={s.key}
                className={`mt-tab ${activeTab === s.key ? "active" : ""}`}
                style={activeTab === s.key ? { background: `${s.accent}`, color: s.color, border: `1px solid ${s.border}` } : {}}
                onClick={() => setActiveTab(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Table Panel */}
          <div className="card" style={{
            padding: 0, overflow: "hidden",
            borderColor: activeSection?.border,
            background: `linear-gradient(180deg, ${activeSection?.accent} 0%, transparent 60%)`,
          }}>
            {/* Panel header */}
            <div style={{ padding: "18px 22px", borderBottom: `1px solid ${activeSection?.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 16, color: activeSection?.color }}>{activeSection?.label}</div>
                <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>Live APMC price data</div>
              </div>
              <div style={{ fontSize: 12, color: "var(--text2)", background: "var(--surface)", padding: "5px 12px", borderRadius: 8, border: "1px solid var(--border)" }}>
                {activeTab === "highest" && `${topHighest.length} crops`}
                {activeTab === "lowest"  && `${topLowest.length} crops`}
                {activeTab === "avg"     && `${commodityAverage.length} commodities`}
                {activeTab === "markets" && `${marketStats.length} markets`}
                {activeTab === "districts" && `${districtStats.length} districts`}
                {activeTab === "latest"  && `${latestPrices.length} entries`}
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              {/* HIGHEST */}
              {activeTab === "highest" && (
                <table className="mt-table">
                  <thead><tr><th>#</th><th>Commodity</th><th>Variety</th><th>Market</th><th>District</th><th>Max Price ₹/q</th></tr></thead>
                  <tbody>
                    {topHighest.map((item, i) => (
                      <tr key={i}>
                        <td><span className="mt-rank" style={{ background: i < 3 ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.05)", color: i < 3 ? "#4ade80" : "var(--text2)" }}>{i + 1}</span></td>
                        <td style={{ fontWeight: 700, color: "#fff" }}>{item.commodity}</td>
                        <td style={{ color: "var(--text2)" }}>{item.variety || "—"}</td>
                        <td>{item.market}</td>
                        <td style={{ color: "var(--text2)" }}>{item.district || "—"}</td>
                        <td><span style={{ fontWeight: 800, color: "#4ade80", fontSize: 15 }}>₹{Number(item.maxPrice).toLocaleString("en-IN")}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* LOWEST */}
              {activeTab === "lowest" && (
                <table className="mt-table">
                  <thead><tr><th>#</th><th>Commodity</th><th>Variety</th><th>Market</th><th>District</th><th>Min Price ₹/q</th></tr></thead>
                  <tbody>
                    {topLowest.map((item, i) => (
                      <tr key={i}>
                        <td><span className="mt-rank" style={{ background: "rgba(239,68,68,0.12)", color: "#f87171" }}>{i + 1}</span></td>
                        <td style={{ fontWeight: 700, color: "#fff" }}>{item.commodity}</td>
                        <td style={{ color: "var(--text2)" }}>{item.variety || "—"}</td>
                        <td>{item.market}</td>
                        <td style={{ color: "var(--text2)" }}>{item.district || "—"}</td>
                        <td><span style={{ fontWeight: 800, color: "#f87171", fontSize: 15 }}>₹{Number(item.minPrice).toLocaleString("en-IN")}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* COMMODITY AVERAGE */}
              {activeTab === "avg" && (
                <table className="mt-table">
                  <thead><tr><th>#</th><th>Commodity</th><th>Avg Price ₹/q</th><th>Records</th></tr></thead>
                  <tbody>
                    {(() => {
                      const maxAvg = Math.max(...commodityAverage.map(c => c.averagePrice || 0));
                      return commodityAverage.map((item, i) => (
                        <tr key={i}>
                          <td><span className="mt-rank" style={{ background: "rgba(56,189,248,0.1)", color: "#38bdf8" }}>{i + 1}</span></td>
                          <td style={{ fontWeight: 700, color: "#fff" }}>{item._id}</td>
                          <td>
                            <div className="bar-wrap">
                              <span style={{ fontWeight: 700, color: "#38bdf8", width: 80, flexShrink: 0 }}>₹{Math.round(item.averagePrice).toLocaleString("en-IN")}</span>
                              <div className="bar-track"><div className="bar-fill" style={{ width: `${(item.averagePrice / maxAvg) * 100}%`, background: "linear-gradient(90deg,#0ea5e9,#38bdf8)" }} /></div>
                            </div>
                          </td>
                          <td style={{ color: "var(--text2)" }}>{item.records} entries</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              )}

              {/* MARKETS */}
              {activeTab === "markets" && (
                <table className="mt-table">
                  <thead><tr><th>#</th><th>Market Name</th><th>Listings</th></tr></thead>
                  <tbody>
                    {(() => {
                      const maxRec = Math.max(...marketStats.map(m => m.records || 0));
                      return marketStats.map((item, i) => (
                        <tr key={i}>
                          <td><span className="mt-rank" style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24" }}>{i + 1}</span></td>
                          <td style={{ fontWeight: 700, color: "#fff" }}>🏪 {item._id}</td>
                          <td>
                            <div className="bar-wrap">
                              <span style={{ fontWeight: 700, color: "#fbbf24", width: 60, flexShrink: 0 }}>{item.records}</span>
                              <div className="bar-track"><div className="bar-fill" style={{ width: `${(item.records / maxRec) * 100}%`, background: "linear-gradient(90deg,#d97706,#fbbf24)" }} /></div>
                            </div>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              )}

              {/* DISTRICTS */}
              {activeTab === "districts" && (
                <table className="mt-table">
                  <thead><tr><th>#</th><th>District</th><th>Crops</th><th>Markets</th><th>Avg Price ₹/q</th></tr></thead>
                  <tbody>
                    {districtStats.map((item, i) => (
                      <tr key={i}>
                        <td><span className="mt-rank" style={{ background: "rgba(167,139,250,0.1)", color: "#a78bfa" }}>{i + 1}</span></td>
                        <td style={{ fontWeight: 700, color: "#fff" }}>📍 {item.district}</td>
                        <td style={{ color: "var(--text2)" }}>{item.cropCount}</td>
                        <td style={{ color: "var(--text2)" }}>{item.marketCount}</td>
                        <td><span style={{ fontWeight: 700, color: "#a78bfa" }}>₹{Math.round(item.avgPrice).toLocaleString("en-IN")}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* LATEST */}
              {activeTab === "latest" && (
                <table className="mt-table">
                  <thead><tr><th>#</th><th>Commodity</th><th>Market</th><th>Min</th><th>Max</th><th>Modal Price ₹/q</th></tr></thead>
                  <tbody>
                    {latestPrices.map((item, i) => (
                      <tr key={i}>
                        <td><span className="mt-rank" style={{ background: "rgba(148,163,184,0.1)", color: "#94a3b8" }}>{i + 1}</span></td>
                        <td style={{ fontWeight: 700, color: "#fff" }}>{item.commodity}</td>
                        <td style={{ color: "var(--text2)" }}>{item.market}</td>
                        <td style={{ color: "#f87171", fontWeight: 600 }}>₹{Number(item.minPrice || 0).toLocaleString("en-IN")}</td>
                        <td style={{ color: "#4ade80", fontWeight: 600 }}>₹{Number(item.maxPrice || 0).toLocaleString("en-IN")}</td>
                        <td><span style={{ fontWeight: 800, color: "#fff", fontSize: 15 }}>₹{Number(item.modalPrice || 0).toLocaleString("en-IN")}</span></td>
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