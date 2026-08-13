import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../../config/api";

const DS_EXPORTER = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
  .pg-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:16px;flex-wrap:wrap;}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#f59e0b;margin-bottom:6px;}
  .pg-title{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:800;color:#fff;line-height:1.2;}
  .pg-sub{font-size:14px;color:var(--text2);margin-top:6px;}
  .card{background:rgba(245,158,11,0.04);border:1px solid rgba(245,158,11,0.12);border-radius:18px;padding:20px 22px;}
  .card-title{font-family:'Space Grotesk',sans-serif;font-size:16px;font-weight:800;color:#fff;}
  .btn-gold{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:12px;background:linear-gradient(135deg,#d97706,#f59e0b);color:#fff;font-weight:700;font-size:14px;border:none;cursor:pointer;text-decoration:none;font-family:'Inter',sans-serif;}
  .btn-gold:hover{opacity:0.9;}
  .btn-ghost{display:inline-flex;align-items:center;gap:8px;padding:9px 16px;border-radius:10px;border:1px solid rgba(245,158,11,0.2);background:rgba(245,158,11,0.06);color:#fef08a;font-weight:600;font-size:13px;cursor:pointer;text-decoration:none;font-family:'Inter',sans-serif;}
  .spinner{width:20px;height:20px;border:2px solid rgba(255,255,255,0.12);border-top-color:#f59e0b;border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block;}
  @keyframes spin{to{transform:rotate(360deg)}}
  .pulse{animation:pulse 2s ease-in-out infinite;}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
`;

const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("agroconnect_token")}` });

/* ── FX pairs to fetch from ExchangeRate-API (free, no key needed) ─── */
const FX_PAIRS = [
  { pair: "USD / INR", from: "USD", to: "INR" },
  { pair: "EUR / INR", from: "EUR", to: "INR" },
  { pair: "AED / INR", from: "AED", to: "INR" },
  { pair: "GBP / INR", from: "GBP", to: "INR" },
];

const STATUS_CFG = {
  cfs_cold_storage:  { label: "In CFS / Cold Storage", color: "#a78bfa" },
  customs_submitted: { label: "Customs Submitted",    color: "#fbbf24" },
  customs_cleared:   { label: "Customs Cleared",      color: "#4ade80" },
  onboard_vessel:    { label: "On-board Vessel",      color: "#38bdf8" },
  in_transit:        { label: "In Transit",           color: "#38bdf8" },
  delivered:         { label: "Delivered",            color: "#4ade80" },
  cancelled:         { label: "Cancelled",            color: "#f87171" },
};

export default function ExporterDashboard() {
  const user = JSON.parse(localStorage.getItem("agroconnect_user") || "{}");

  const [stats,     setStats]     = useState(null);
  const [shipments, setShipments] = useState([]);
  const [interests, setInterests] = useState([]);
  const [fxRates,   setFxRates]   = useState([]);
  const [fxLoading, setFxLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [shipLoading,  setShipLoading]  = useState(true);
  const [lastFxUpdate, setLastFxUpdate] = useState(null);

  /* ── Fetch exporter stats ─────────────────────────────────────────── */
  const loadStats = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/api/exporter/stats`, { headers: authH() });
      const d = await r.json();
      if (d.success) setStats(d.stats);
    } catch {}
    finally { setStatsLoading(false); }
  }, []);

  /* ── Fetch shipments (last 3 active) ─────────────────────────────── */
  const loadShipments = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/api/exporter/shipments`, { headers: authH() });
      const d = await r.json();
      if (d.success) setShipments(d.shipments || []);
    } catch {}
    finally { setShipLoading(false); }
  }, []);

  /* ── Fetch export interests (for My Interests card) ──────────────── */
  const loadInterests = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/api/export/exporter/interests`, { headers: authH() });
      const d = await r.json();
      if (d.success) setInterests(d.interests || []);
    } catch {}
  }, []);

  /* ── Live FX rates (ExchangeRate-API free tier) ───────────────────── */
  const loadFxRates = useCallback(async () => {
    setFxLoading(true);
    try {
      // Fetch USD base rates (covers all pairs)
      const r = await fetch("https://open.er-api.com/v6/latest/USD");
      const d = await r.json();
      if (d.result === "success" && d.rates) {
        const usdInr = d.rates.INR;
        const rates = [
          { pair: "USD / INR", from: "USD", rate: usdInr,                    },
          { pair: "EUR / INR", from: "EUR", rate: usdInr / d.rates.EUR       },
          { pair: "AED / INR", from: "AED", rate: usdInr / d.rates.AED       },
          { pair: "GBP / INR", from: "GBP", rate: usdInr / d.rates.GBP       },
        ].map(r => ({ ...r, display: r.rate.toFixed(2) }));
        setFxRates(rates);
        setLastFxUpdate(new Date());
      }
    } catch {
      // Fallback: use approximate rates if network fails
      setFxRates([
        { pair: "USD / INR", from: "USD", display: "83.42" },
        { pair: "EUR / INR", from: "EUR", display: "90.18" },
        { pair: "AED / INR", from: "AED", display: "22.71" },
        { pair: "GBP / INR", from: "GBP", display: "105.60" },
      ]);
    }
    finally { setFxLoading(false); }
  }, []);

  useEffect(() => {
    loadStats();
    loadShipments();
    loadInterests();
    loadFxRates();
    // Refresh FX every 5 minutes
    const fxTimer = setInterval(loadFxRates, 5 * 60 * 1000);
    return () => clearInterval(fxTimer);
  }, [loadStats, loadShipments, loadInterests, loadFxRates]);

  /* ── Derived values ───────────────────────────────────────────────── */
  const activeShipments    = shipments.filter(s => !["delivered","cancelled"].includes(s.status));
  const pendingInterests   = interests.filter(i => i.status === "pending");
  const activeInterests    = interests.filter(i => ["accepted","negotiating"].includes(i.status));
  const confirmedInterests = interests.filter(i => i.status === "confirmed");

  const fmtUsd = (n) => n > 0 ? `$${Number(n).toLocaleString("en-US")}` : "—";
  const fmtInr = (n) => n > 0 ? `₹${(Number(n) * 83.5 / 100000).toFixed(2)} Cr` : "—";

  const activeShipmentRows = activeShipments.slice(0, 5);

  return (
    <>
      <style>{DS_EXPORTER}</style>

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="pg-head">
        <div>
          <div className="eyebrow">Global Trade Command Center</div>
          <h1 className="pg-title">Welcome back, {user.name?.split(" ")[0] || "Exporter"} 🚢</h1>
          <p className="pg-sub">Monitor international agricultural exports, customs compliance, and port logistics.</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
          <Link to="/exporter/my-interests" className="btn-ghost">📩 My Interests {interests.length > 0 && `(${interests.length})`}</Link>
          <Link to="/exporter/sourcing" className="btn-gold">🌐 Source Produce</Link>
        </div>
      </div>

      {/* ── Live FX Rates ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#a38a5d", textTransform: "uppercase", letterSpacing: "0.06em" }}>💱 Live FX Rates</span>
          {fxLoading ? (
            <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
          ) : lastFxUpdate && (
            <span style={{ fontSize: 11, color: "#a38a5d" }}>
              Updated {lastFxUpdate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button onClick={loadFxRates} style={{ background: "none", border: "none", color: "#fbbf24", cursor: "pointer", fontSize: 14, padding: 0 }} title="Refresh FX rates">⟳</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
          {fxLoading ? (
            [1,2,3,4].map(i => (
              <div key={i} style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.1)", height: 62 }} className="pulse" />
            ))
          ) : fxRates.map(f => (
            <div key={f.pair} style={{ padding: "12px 16px", borderRadius: 14, background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.12)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 10, color: "#a38a5d", textTransform: "uppercase", fontWeight: 700, marginBottom: 2 }}>{f.pair}</div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 800, color: "#fff" }}>₹{f.display}</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#4ade80", background: "rgba(34,197,94,0.1)", padding: "2px 6px", borderRadius: 5 }}>LIVE</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Real Stats Cards ─────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14, marginBottom: 24 }}>
        {statsLoading ? (
          [1,2,3,4].map(i => (
            <div key={i} className="card pulse" style={{ height: 96 }} />
          ))
        ) : [
          ["💵", "Export Revenue", stats?.totalRevenueUsd > 0 ? fmtUsd(stats.totalRevenueUsd) : "₹0", stats?.totalRevenueUsd > 0 ? fmtInr(stats.totalRevenueUsd) : "No completed shipments", "#f59e0b"],
          ["🚢", "Active Shipments", stats?.activeContainers ?? 0, `${stats?.totalShipments ?? 0} total shipments`, "#38bdf8"],
          ["✅", "Customs Cleared", stats?.customsCleared ?? 0, `${stats?.totalVolumeTons ?? 0} MT total volume`, "#4ade80"],
          ["📩", "Export Interests", interests.length, `${pendingInterests.length} pending · ${activeInterests.length} active`, "#a78bfa"],
        ].map(([emoji, label, val, sub, color]) => (
          <div key={label} className="card" style={{ position: "relative" }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{emoji}</div>
            <div style={{ fontSize: 10, color: "#a38a5d", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 24, fontWeight: 800, color }}>{val}</div>
            <div style={{ fontSize: 11, color: "#a38a5d", marginTop: 4 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── Export Interests Summary ──────────────────────────────────── */}
      {interests.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div className="card-title">📩 My Export Interests</div>
            <Link to="/exporter/my-interests" style={{ fontSize: 13, color: "#fbbf24", textDecoration: "none", fontWeight: 700 }}>View All →</Link>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              [`⏳ ${pendingInterests.length} Pending`,  "#fbbf24", "rgba(251,191,36,0.08)"],
              [`💬 ${activeInterests.length} In Progress`, "#38bdf8", "rgba(56,189,248,0.08)"],
              [`🤝 ${confirmedInterests.length} Confirmed`, "#4ade80", "rgba(34,197,94,0.08)"],
            ].map(([label, color, bg]) => (
              <div key={label} style={{ flex: 1, minWidth: 110, padding: "10px 14px", borderRadius: 12, background: bg, border: `1px solid ${color}22`, textAlign: "center" }}>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 16, fontWeight: 800, color }}>{label}</div>
              </div>
            ))}
          </div>
          {/* Most recent pending interest */}
          {pendingInterests.length > 0 && (() => {
            const i = pendingInterests[0];
            const lst = i.listing || {};
            const far = i.farmer  || {};
            return (
              <div style={{ marginTop: 14, padding: "12px 16px", borderRadius: 12, background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.15)" }}>
                <div style={{ fontSize: 11, color: "#a38a5d", textTransform: "uppercase", marginBottom: 6 }}>Latest Pending · Awaiting Farmer Response</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>{lst.name || "—"}</div>
                    <div style={{ fontSize: 12, color: "#a38a5d" }}>🌾 {far.name || "Farmer"} · {i.requestedQty} {i.requestedUnit || "MT"}</div>
                  </div>
                  <Link to="/exporter/my-interests" style={{ padding: "8px 16px", borderRadius: 10, background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)", color: "#fbbf24", fontWeight: 700, fontSize: 12, textDecoration: "none" }}>
                    View Details →
                  </Link>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Quick Actions ─────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title" style={{ marginBottom: 14 }}>⚡ Global Trade Operations</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
          {[
            { emoji: "🌐", label: "Browse Produce", to: "/exporter/sourcing" },
            { emoji: "📩", label: "My Interests",   to: "/exporter/my-interests" },
            { emoji: "🚢", label: "Port Logistics", to: "/exporter/logistics" },
            { emoji: "📑", label: "Customs Hub",    to: "/exporter/compliance" },
            { emoji: "💱", label: "FX & Tariffs",   to: "/exporter/markets" },
            { emoji: "🤖", label: "Export AI",      to: "/exporter/assistant" },
          ].map(q => (
            <Link key={q.label} to={q.to} style={{ textDecoration: "none", padding: "14px 16px", background: "rgba(245,158,11,0.04)", borderRadius: 14, border: "1px solid rgba(245,158,11,0.1)", display: "flex", alignItems: "center", gap: 10, transition: "all 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(245,158,11,0.09)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(245,158,11,0.04)"}>
              <span style={{ fontSize: 20 }}>{q.emoji}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{q.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Active Container Shipments (real data) ───────────────────── */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div className="card-title">🚢 Active Container Shipments</div>
          <Link to="/exporter/logistics" style={{ fontSize: 13, color: "#fbbf24", textDecoration: "none", fontWeight: 700 }}>View Logistics →</Link>
        </div>

        {shipLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1,2].map(i => <div key={i} className="pulse" style={{ height: 72, borderRadius: 12, background: "rgba(245,158,11,0.05)" }} />)}
          </div>
        ) : activeShipmentRows.length === 0 ? (
          <div style={{ textAlign: "center", padding: "36px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🚢</div>
            <div style={{ fontWeight: 700, color: "#fff", marginBottom: 6 }}>No active shipments</div>
            <div style={{ fontSize: 13, color: "#a38a5d", marginBottom: 16 }}>Add shipments from the Port Logistics page to track them here.</div>
            <Link to="/exporter/logistics" style={{ padding: "10px 20px", borderRadius: 12, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", color: "#fbbf24", fontWeight: 700, fontSize: 13, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
              🚢 Go to Port Logistics
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {activeShipmentRows.map((s, i) => {
              const cfg = STATUS_CFG[s.status] || { label: s.status, color: "#a38a5d" };
              return (
                <div key={s._id || i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "rgba(245,158,11,0.03)", borderRadius: 14, border: "1px solid rgba(245,158,11,0.08)", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 800, color: "#fbbf24" }}>{s.containerNo || "—"}</span>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: `${cfg.color}20`, color: cfg.color, fontWeight: 700 }}>{cfg.label}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "#fff", fontWeight: 600, marginTop: 4 }}>{s.cargo || "—"} {s.quantityTons ? `(${s.quantityTons} MT)` : ""}</div>
                    <div style={{ fontSize: 12, color: "#a38a5d", marginTop: 2 }}>
                      📍 {s.portOfOrigin || "—"} → <strong style={{ color: "#fff" }}>{s.destPort || s.destinationCountry || "—"}</strong>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, color: "#a38a5d", textTransform: "uppercase", marginBottom: 2 }}>ETA</div>
                    <div style={{ fontWeight: 800, color: "#fff", fontSize: 14 }}>
                      {s.eta ? new Date(s.eta).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
