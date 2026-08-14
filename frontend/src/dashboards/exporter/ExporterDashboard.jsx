import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../../config/api";
import { DS } from "../../styles/ds";

/* ─── Exporter-specific overrides on top of DS ─────────────────────────── */
const EX_STYLES = `
  :root {
    --bg:#0f0a03; --bg2:#170f05;
    --surface:rgba(245,158,11,0.05); --surface2:rgba(245,158,11,0.09);
    --border:rgba(245,158,11,0.14); --border2:rgba(245,158,11,0.25);
    --text:#fffbeb; --text2:#a38a5d;
    --green:#f59e0b; --green-dim:rgba(245,158,11,0.12);
    --amber:rgba(251,191,36,0.1); --amber-text:#fde68a;
    --blue:rgba(56,189,248,0.1); --blue-text:#7dd3fc;
  }

  /* Eyebrow in amber */
  .eyebrow { color:#f59e0b !important; }

  /* stat-card top shimmer in amber */
  .stat-card::before {
    background:linear-gradient(90deg,transparent,rgba(245,158,11,0.3),transparent) !important;
  }

  /* amber btn */
  .btn-amber {
    display:inline-flex; align-items:center; gap:8px;
    background:linear-gradient(135deg,#d97706,#f59e0b);
    color:#fff; font-weight:700; font-size:14px;
    padding:11px 22px; border-radius:12px; border:none; cursor:pointer;
    box-shadow:0 6px 20px rgba(245,158,11,0.25);
    transition:transform 0.2s,box-shadow 0.2s;
    font-family:'Inter',sans-serif; text-decoration:none;
  }
  .btn-amber:hover { transform:translateY(-1px); box-shadow:0 12px 32px rgba(245,158,11,0.35); }

  .btn-ghost {
    border-color:var(--border2) !important;
    color:#fef08a !important;
  }
  .btn-ghost:hover { background:var(--surface2) !important; }

  /* badge overrides */
  .badge-green { background:rgba(34,197,94,0.12); color:#4ade80; border:1px solid rgba(34,197,94,0.2); }
  .badge-amber { background:rgba(245,158,11,0.12); color:#fde68a; border:1px solid rgba(245,158,11,0.2); }
  .badge-red   { background:rgba(239,68,68,0.12);  color:#f87171; border:1px solid rgba(239,68,68,0.2); }
  .badge-blue  { background:rgba(56,189,248,0.12); color:#7dd3fc; border:1px solid rgba(56,189,248,0.2); }
  .badge-purple{ background:rgba(167,139,250,0.12);color:#c4b5fd; border:1px solid rgba(167,139,250,0.2); }
  .badge-grey  { background:rgba(148,163,184,0.12);color:#94a3b8; border:1px solid rgba(148,163,184,0.2); }

  /* table */
  .data-table th { border-bottom:1px solid rgba(245,158,11,0.14) !important; }
  .data-table td { border-bottom:1px solid rgba(245,158,11,0.08) !important; }

  /* field-input amber focus */
  .field-input:focus { border-color:rgba(245,158,11,0.4) !important; box-shadow:0 0 0 4px rgba(245,158,11,0.07) !important; }

  /* spinner amber */
  .spinner { border-top-color:#f59e0b !important; }

  /* pipeline stage */
  .pipe-stage {
    display:flex; flex-direction:column; align-items:center; gap:6px; flex:1;
  }
  .pipe-count {
    width:44px; height:44px; border-radius:12px;
    display:flex; align-items:center; justify-content:center;
    font-family:'Space Grotesk',sans-serif; font-size:18px; font-weight:800;
    border:1px solid rgba(245,158,11,0.2); background:rgba(245,158,11,0.05);
    color:#fff; transition:all 0.2s;
  }
  .pipe-count.active { background:rgba(245,158,11,0.15); border-color:rgba(245,158,11,0.4); color:#fbbf24; }
  .pipe-label { font-size:10px; font-weight:700; color:var(--text2); text-transform:uppercase; letter-spacing:0.06em; text-align:center; }
  .pipe-arrow { color:rgba(245,158,11,0.3); font-size:16px; flex-shrink:0; padding-top:12px; }

  /* section heading */
  .sec-head {
    display:flex; align-items:center; justify-content:space-between;
    margin-bottom:16px; flex-wrap:wrap; gap:8px;
  }

  /* listing card */
  .listing-card {
    padding:14px 16px; border-radius:14px;
    border:1px solid rgba(245,158,11,0.1);
    background:rgba(245,158,11,0.03);
    transition:border-color 0.2s,background 0.2s;
  }
  .listing-card:hover { border-color:rgba(245,158,11,0.22); background:rgba(245,158,11,0.06); }

  /* action item */
  .action-item {
    display:flex; align-items:center; justify-content:space-between;
    padding:13px 16px; border-radius:12px; gap:12px;
    border:1px solid rgba(251,191,36,0.18);
    background:rgba(251,191,36,0.05);
    text-decoration:none; transition:background 0.18s,border-color 0.18s;
  }
  .action-item:hover {
    background:rgba(251,191,36,0.09);
    border-color:rgba(251,191,36,0.28);
  }

  /* ship alert row */
  .ship-alert-item {
    display:flex; align-items:center; justify-content:space-between;
    padding:12px 14px; border-radius:12px; gap:10px; flex-wrap:wrap;
    border:1px solid rgba(245,158,11,0.12);
    background:rgba(245,158,11,0.04);
    transition:background 0.18s;
  }
  .ship-alert-item:hover { background:rgba(245,158,11,0.08); }

  /* activity timeline item */
  .activity-item {
    display:flex; align-items:flex-start; gap:12px;
    padding:10px 0; border-bottom:1px solid rgba(245,158,11,0.07);
  }
  .activity-item:last-child { border-bottom:none; }
  .activity-dot {
    width:8px; height:8px; border-radius:50%; flex-shrink:0;
    margin-top:5px;
  }

  /* interest status row */
  .int-row {
    display:flex; align-items:center; justify-content:space-between;
    padding:9px 0; border-bottom:1px solid rgba(245,158,11,0.08);
  }
  .int-row:last-child { border-bottom:none; }

  /* fx card */
  .fx-card {
    padding:14px 16px; border-radius:14px;
    border:1px solid rgba(245,158,11,0.12);
    background:rgba(245,158,11,0.04);
  }

  /* skeleton pulse */
  .skel {
    border-radius:8px; background:rgba(245,158,11,0.07);
    animation:pulse 1.8s ease-in-out infinite;
  }

  /* compliance row */
  .comp-row {
    display:flex; align-items:center; justify-content:space-between;
    padding:10px 0; border-bottom:1px solid rgba(245,158,11,0.07);
    gap:8px;
  }
  .comp-row:last-child { border-bottom:none; }

  /* two-col responsive grid */
  .two-col  { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
  .three-col{ display:grid; grid-template-columns:1fr 1fr 1fr; gap:18px; }

  @media(max-width:900px) {
    .two-col   { grid-template-columns:1fr !important; }
    .three-col { grid-template-columns:1fr 1fr !important; }
  }
  @media(max-width:600px) {
    .three-col { grid-template-columns:1fr !important; }
  }

  .overflow-x-auto { overflow-x:auto; }
  .nowrap { white-space:nowrap; }
`;

/* ─── Constants ─────────────────────────────────────────────────────────── */
const SHIPMENT_STATUSES = {
  farm_packed:     { label:"Farm Packed",      badge:"badge-grey",   step:0 },
  cfs_cold_storage:{ label:"CFS / Cold Storage",badge:"badge-purple",step:1 },
  port_gate_in:    { label:"Port Gate-In",     badge:"badge-amber",  step:2 },
  customs_cleared: { label:"Customs Cleared",  badge:"badge-blue",   step:3 },
  onboard_vessel:  { label:"On-board Vessel",  badge:"badge-blue",   step:4 },
  delivered:       { label:"Delivered",        badge:"badge-green",  step:5 },
  cancelled:       { label:"Cancelled",        badge:"badge-red",    step:-1},
};

const PIPE_STAGES = [
  { key:"cfs_cold_storage", label:"CFS"      },
  { key:"port_gate_in",     label:"Gate-In"  },
  { key:"customs_cleared",  label:"Cleared"  },
  { key:"onboard_vessel",   label:"On-board" },
  { key:"delivered",        label:"Delivered"},
];

const INTEREST_STATUS_CFG = {
  pending:     { label:"Pending",     badge:"badge-amber"  },
  accepted:    { label:"Accepted",    badge:"badge-blue"   },
  negotiating: { label:"Negotiating", badge:"badge-purple" },
  confirmed:   { label:"Confirmed",   badge:"badge-green"  },
  rejected:    { label:"Rejected",    badge:"badge-red"    },
  cancelled:   { label:"Cancelled",   badge:"badge-grey"   },
  completed:   { label:"Completed",   badge:"badge-green"  },
};

const COMPLIANCE_STATUS_CFG = {
  VERIFIED:    { badge:"badge-green",  label:"Verified"    },
  ACTIVE:      { badge:"badge-blue",   label:"Active"      },
  "RENEWAL DUE":{ badge:"badge-amber", label:"Renewal Due" },
  EXPIRED:     { badge:"badge-red",    label:"Expired"     },
  PENDING:     { badge:"badge-purple", label:"Pending"     },
};

const FX_CURRENCIES = [
  { pair:"USD / INR", from:"USD", flag:"🇺🇸" },
  { pair:"EUR / INR", from:"EUR", flag:"🇪🇺" },
  { pair:"AED / INR", from:"AED", flag:"🇦🇪" },
  { pair:"GBP / INR", from:"GBP", flag:"🇬🇧" },
  { pair:"SGD / INR", from:"SGD", flag:"🇸🇬" },
  { pair:"JPY / INR", from:"JPY", flag:"🇯🇵" },
];

/* ─── helpers ───────────────────────────────────────────────────────────── */
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("agroconnect_token")}` });

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }) : "—";

const daysUntil = (d) => {
  if (!d) return null;
  return Math.ceil((new Date(d) - Date.now()) / 86400000);
};

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

/* ─── Small sub-components ──────────────────────────────────────────────── */

function Skeleton({ h = 60, mb = 0 }) {
  return <div className="skel" style={{ height: h, marginBottom: mb }} />;
}

function SectionError({ msg, onRetry }) {
  return (
    <div style={{ padding:"16px", borderRadius:12, background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.15)", color:"#fca5a5", fontSize:13, display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
      <span>⚠️ {msg}</span>
      {onRetry && (
        <button onClick={onRetry} style={{ background:"none", border:"1px solid rgba(239,68,68,0.25)", color:"#f87171", borderRadius:8, padding:"5px 12px", cursor:"pointer", fontSize:12, fontWeight:700 }}>
          Retry
        </button>
      )}
    </div>
  );
}

function EmptyState({ icon, msg, action }) {
  return (
    <div style={{ textAlign:"center", padding:"28px 16px", color:"var(--text2)", fontSize:13 }}>
      <div style={{ fontSize:32, marginBottom:8 }}>{icon}</div>
      <div style={{ color:"#fff", fontWeight:600, marginBottom:6 }}>{msg}</div>
      {action}
    </div>
  );
}

function EtaDisplay({ eta, status }) {
  if (status === "delivered")  return <span className="badge badge-green">Delivered</span>;
  if (status === "cancelled")  return <span className="badge badge-red">Cancelled</span>;
  if (!eta)                    return <span style={{ color:"var(--text2)", fontSize:12 }}>ETA not set</span>;
  const d = daysUntil(eta);
  if (d < 0) return <span className="badge badge-red">⚠️ Overdue</span>;
  if (d === 0) return <span className="badge badge-amber">Today</span>;
  if (d <= 3)  return <span className="badge badge-amber">{d}d left</span>;
  return <span style={{ fontSize:12, color:"var(--text2)" }}>{fmtDate(eta)}</span>;
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════════════════════════════════════════ */
export default function ExporterDashboard() {
  const user = JSON.parse(localStorage.getItem("agroconnect_user") || "{}");

  /* ── state ── */
  const [stats,       setStats]       = useState(null);
  const [shipments,   setShipments]   = useState([]);
  const [rfqs,        setRfqs]        = useState([]);
  const [interests,   setInterests]   = useState([]);
  const [listings,    setListings]    = useState([]);
  const [compliance,  setCompliance]  = useState([]);
  const [fxRates,     setFxRates]     = useState([]);
  const [lastFx,      setLastFx]      = useState(null);

  const [loadingStats,  setLoadingStats]  = useState(true);
  const [loadingShip,   setLoadingShip]   = useState(true);
  const [loadingRfqs,   setLoadingRfqs]   = useState(true);
  const [loadingInt,    setLoadingInt]    = useState(true);
  const [loadingList,   setLoadingList]   = useState(true);
  const [loadingComp,   setLoadingComp]   = useState(true);
  const [loadingFx,     setLoadingFx]     = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);

  const [errStats,   setErrStats]   = useState(null);
  const [errShip,    setErrShip]    = useState(null);
  const [errRfqs,    setErrRfqs]    = useState(null);
  const [errInt,     setErrInt]     = useState(null);
  const [errList,    setErrList]    = useState(null);
  const [errComp,    setErrComp]    = useState(null);
  const [errFx,      setErrFx]      = useState(null);

  /* ── fetchers ── */
  const fetchStats = useCallback(async () => {
    setLoadingStats(true); setErrStats(null);
    try {
      const r = await fetch(`${API_URL}/api/exporter/stats`, { headers: authH() });
      const d = await r.json();
      if (d.success) setStats(d.stats);
      else setErrStats(d.message || "Failed to load stats");
    } catch { setErrStats("Network error — could not load stats"); }
    finally { setLoadingStats(false); }
  }, []);

  const fetchShipments = useCallback(async () => {
    setLoadingShip(true); setErrShip(null);
    try {
      const r = await fetch(`${API_URL}/api/exporter/shipments`, { headers: authH() });
      const d = await r.json();
      if (d.success) setShipments(d.shipments || []);
      else setErrShip(d.message || "Failed to load shipments");
    } catch { setErrShip("Network error — could not load shipments"); }
    finally { setLoadingShip(false); }
  }, []);

  const fetchRfqs = useCallback(async () => {
    setLoadingRfqs(true); setErrRfqs(null);
    try {
      const r = await fetch(`${API_URL}/api/exporter/rfqs`, { headers: authH() });
      const d = await r.json();
      if (d.success) setRfqs(d.rfqs || []);
      else setErrRfqs(d.message || "Failed to load RFQs");
    } catch { setErrRfqs("Network error — could not load RFQs"); }
    finally { setLoadingRfqs(false); }
  }, []);

  const fetchInterests = useCallback(async () => {
    setLoadingInt(true); setErrInt(null);
    try {
      const r = await fetch(`${API_URL}/api/export/exporter/interests`, { headers: authH() });
      const d = await r.json();
      if (d.success) setInterests(d.interests || []);
      else setErrInt(d.message || "Failed to load interests");
    } catch { setErrInt("Network error — could not load interests"); }
    finally { setLoadingInt(false); }
  }, []);

  const fetchListings = useCallback(async () => {
    setLoadingList(true); setErrList(null);
    try {
      const r = await fetch(`${API_URL}/api/export/listings?sort=newest`, { headers: authH() });
      const d = await r.json();
      if (d.success) setListings(d.listings || []);
      else setErrList(d.message || "Failed to load farmer listings");
    } catch { setErrList("Network error — could not load farmer listings"); }
    finally { setLoadingList(false); }
  }, []);

  const fetchCompliance = useCallback(async () => {
    setLoadingComp(true); setErrComp(null);
    try {
      const r = await fetch(`${API_URL}/api/compliance`, { headers: authH() });
      const d = await r.json();
      if (d.success) setCompliance(d.docs || []);
      else setErrComp(d.message || "Failed to load compliance documents");
    } catch { setErrComp("Network error — could not load compliance documents"); }
    finally { setLoadingComp(false); }
  }, []);

  const fetchFx = useCallback(async () => {
    setLoadingFx(true); setErrFx(null);
    try {
      const r = await fetch("https://open.er-api.com/v6/latest/USD");
      const d = await r.json();
      if (d.result === "success" && d.rates) {
        const usdInr = d.rates.INR;
        setFxRates(FX_CURRENCIES.map(c => ({
          ...c,
          rate: c.from === "USD" ? usdInr : usdInr / d.rates[c.from],
        })));
        setLastFx(new Date());
      } else {
        setErrFx("Exchange rate data unavailable");
      }
    } catch { setErrFx("Could not fetch exchange rates"); }
    finally { setLoadingFx(false); }
  }, []);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([
      fetchStats(), fetchShipments(), fetchRfqs(),
      fetchInterests(), fetchListings(), fetchCompliance(), fetchFx(),
    ]);
    setRefreshing(false);
  }, [fetchStats, fetchShipments, fetchRfqs, fetchInterests, fetchListings, fetchCompliance, fetchFx]);

  useEffect(() => {
    refreshAll();
    // Soft poll: interests + shipments every 90s
    const poll = setInterval(() => {
      fetchInterests();
      fetchShipments();
    }, 90000);
    // FX every 5min
    const fxPoll = setInterval(fetchFx, 5 * 60 * 1000);
    return () => { clearInterval(poll); clearInterval(fxPoll); };
  }, []); // eslint-disable-line

  /* ── derived values ── */
  const activeShipments    = shipments.filter(s => !["delivered","cancelled"].includes(s.status));
  const deliveredShipments = shipments.filter(s => s.status === "delivered");
  const totalVolume        = shipments.reduce((n, s) => n + (s.quantityTons || 0), 0);

  const intByStatus = (status) => interests.filter(i => i.status === status);
  const pendingInt    = intByStatus("pending");
  const acceptedInt   = intByStatus("accepted");
  const negotiatingInt= intByStatus("negotiating");
  const confirmedInt  = intByStatus("confirmed");

  const pendingRfqs   = rfqs.filter(r => r.status === "pending");
  const activeRfqs    = rfqs.filter(r => ["accepted","quoted"].includes(r.status));

  // Shipments with ETA ≤ 3 days (not delivered/cancelled)
  const approachingShipments = activeShipments.filter(s => {
    const d = daysUntil(s.eta);
    return d !== null && d <= 3 && d >= 0;
  });

  // Compliance docs needing attention
  const complianceAlerts = compliance.filter(d =>
    ["EXPIRED","RENEWAL DUE"].includes(d.status)
  );

  /* pipeline counts */
  const pipeCount = (key) => shipments.filter(s => s.status === key).length;

  /* ════════════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════════════ */
  return (
    <>
      <style>{DS + EX_STYLES}</style>

      {/* ══════ HEADER ══════════════════════════════════════════════════ */}
      <div className="pg-head">
        <div>
          <div className="eyebrow">Global Trade Dashboard</div>
          <h1 className="pg-title">{greeting()}, {user.name?.split(" ")[0] || "Exporter"} 👋</h1>
          <p className="pg-sub">Manage your sourcing, shipments and international trade from one place.</p>
        </div>
        <button
          onClick={refreshAll}
          disabled={refreshing}
          className="btn-ghost"
          style={{ alignSelf:"flex-start", display:"flex", alignItems:"center", gap:7 }}
        >
          {refreshing ? <span className="spinner" style={{ width:14, height:14, borderWidth:2 }} /> : "🔄"}
          {refreshing ? "Refreshing…" : "Refresh Dashboard"}
        </button>
      </div>

      {/* ══════ QUICK ACTIONS ══════════════════════════════════════════ */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:12, marginBottom:28 }}>
        {[
          { emoji:"🌾", label:"Farmer Produce",  sub:"Browse export listings",    to:"/exporter/sourcing"      },
          { emoji:"📩", label:"My Interests",     sub:"Manage negotiations",       to:"/exporter/my-interests"  },
          { emoji:"🚢", label:"Shipments",        sub:"Track active shipments",    to:"/exporter/logistics"     },
          { emoji:"📋", label:"RFQs",             sub:"Manage export requests",    to:"/exporter/sourcing"      },
          { emoji:"📑", label:"Customs & Docs",   sub:"Compliance vault",          to:"/exporter/compliance"    },
          { emoji:"🧮", label:"Margin Calc",      sub:"Calculate export margin",   to:"/exporter/calculator"    },
        ].map(q => (
          <Link
            key={q.label} to={q.to}
            style={{ textDecoration:"none", padding:"14px 16px", background:"var(--surface)", borderRadius:14, border:"1px solid var(--border)", display:"flex", alignItems:"center", gap:12, transition:"all 0.18s" }}
            onMouseEnter={e => { e.currentTarget.style.background="var(--surface2)"; e.currentTarget.style.borderColor="var(--border2)"; }}
            onMouseLeave={e => { e.currentTarget.style.background="var(--surface)"; e.currentTarget.style.borderColor="var(--border)"; }}
          >
            <span style={{ fontSize:22 }}>{q.emoji}</span>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:"#fff" }}>{q.label}</div>
              <div style={{ fontSize:11, color:"var(--text2)", marginTop:2 }}>{q.sub}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* ══════ KPI CARDS ══════════════════════════════════════════════ */}
      <div className="stat-grid" style={{ marginBottom:28 }}>
        {loadingStats ? (
          [1,2,3,4,5,6].map(i => <div key={i} className="stat-card"><Skeleton h={80} /></div>)
        ) : errStats ? (
          <div style={{ gridColumn:"1/-1" }}><SectionError msg={errStats} onRetry={fetchStats} /></div>
        ) : [
          {
            emoji:"💰", label:"Export Revenue",
            val: stats.totalRevenueUsd > 0 ? `$${Number(stats.totalRevenueUsd).toLocaleString("en-US")}` : "—",
            sub: stats.totalRevenueUsd > 0
              ? `${deliveredShipments.length} completed shipment${deliveredShipments.length !== 1 ? "s" : ""}`
              : "No completed shipments yet",
            color:"#f59e0b",
          },
          {
            emoji:"🚢", label:"Active Shipments",
            val: stats.activeContainers ?? "—",
            sub: `${stats.totalShipments} total shipment${stats.totalShipments !== 1 ? "s" : ""}`,
            color:"#38bdf8",
          },
          {
            emoji:"📦", label:"Export Volume",
            val: totalVolume > 0 ? `${totalVolume} MT` : "—",
            sub: "metric tons across all shipments",
            color:"#a78bfa",
          },
          {
            emoji:"✅", label:"Customs Cleared",
            val: stats.customsCleared ?? "—",
            sub: "shipments past customs",
            color:"#4ade80",
          },
          {
            emoji:"📩", label:"Export Interests",
            val: loadingInt ? "…" : interests.length,
            sub: loadingInt ? "" : `${pendingInt.length} pending · ${confirmedInt.length} confirmed`,
            color:"#fbbf24",
          },
          {
            emoji:"📋", label:"Active RFQs",
            val: loadingRfqs ? "…" : rfqs.length,
            sub: loadingRfqs ? "" : `${pendingRfqs.length} pending · ${activeRfqs.length} active`,
            color:"#fb923c",
          },
        ].map(({ emoji, label, val, sub, color }) => (
          <div key={label} className="stat-card">
            <div className="stat-glow" style={{ background: color }} />
            <div className="stat-emoji">{emoji}</div>
            <div className="stat-val" style={{ color }}>{val}</div>
            <div className="stat-lbl">{label}</div>
            <div style={{ fontSize:11, color:"var(--text2)", marginTop:4 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ══════ ROW 1: Farmer Listings + Interests ════════════════════ */}
      <div className="two-col" style={{ marginBottom:18 }}>

        {/* ── Farmer Marketplace ── */}
        <div className="card">
          <div className="sec-head">
            <div>
              <div className="card-title">🌾 Farmer Produce</div>
              <div className="card-sub">Available export listings from farmers</div>
            </div>
            <Link to="/exporter/sourcing" className="btn-amber" style={{ fontSize:13, padding:"8px 16px" }}>
              Browse All
            </Link>
          </div>

          {loadingList ? (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[1,2,3].map(i => <Skeleton key={i} h={76} />)}
            </div>
          ) : errList ? (
            <SectionError msg={errList} onRetry={fetchListings} />
          ) : listings.length === 0 ? (
            <EmptyState
              icon="🌾" msg="No farmer export listings available."
              action={<Link to="/exporter/sourcing" className="btn-amber" style={{ fontSize:13, padding:"8px 16px", marginTop:8, display:"inline-flex" }}>Browse Farmer Produce</Link>}
            />
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {listings.slice(0, 5).map(l => (
                <div key={l._id} className="listing-card">
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, flexWrap:"wrap" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, color:"#fff", fontSize:14 }}>{l.name}</div>
                      <div style={{ fontSize:12, color:"var(--text2)", marginTop:3 }}>
                        👤 {l.farmer?.name || "Farmer"} &nbsp;·&nbsp; 📍 {l.location || l.farmer?.location || "—"}
                      </div>
                      <div style={{ fontSize:12, color:"var(--text2)", marginTop:2 }}>
                        📦 {l.exportQuantity} {l.exportUnit || "MT"}
                        {l.exportGrade && <> &nbsp;·&nbsp; 🏷️ {l.exportGrade}</>}
                        {l.expectedExportPrice > 0 && <> &nbsp;·&nbsp; ₹{Number(l.expectedExportPrice).toLocaleString("en-IN")}/{l.exportUnit || "MT"}</>}
                      </div>
                      {l.preferredDestination && (
                        <div style={{ fontSize:11, color:"#f59e0b", marginTop:2 }}>🌍 Preferred: {l.preferredDestination}</div>
                      )}
                    </div>
                    <Link
                      to="/exporter/sourcing"
                      style={{ fontSize:12, fontWeight:700, color:"#fbbf24", textDecoration:"none", padding:"6px 12px", borderRadius:8, border:"1px solid rgba(245,158,11,0.25)", background:"rgba(245,158,11,0.08)", flexShrink:0 }}
                    >
                      View →
                    </Link>
                  </div>
                </div>
              ))}
              {listings.length > 5 && (
                <Link to="/exporter/sourcing" style={{ fontSize:13, color:"#fbbf24", fontWeight:700, textDecoration:"none", textAlign:"center", padding:"8px 0" }}>
                  +{listings.length - 5} more listings — Browse All
                </Link>
              )}
            </div>
          )}
        </div>

        {/* ── Export Interests Summary ── */}
        <div className="card">
          <div className="sec-head">
            <div>
              <div className="card-title">📩 Export Interests</div>
              <div className="card-sub">Your farmer negotiations</div>
            </div>
            <Link to="/exporter/my-interests" className="btn-ghost" style={{ fontSize:13, padding:"8px 14px" }}>
              View All →
            </Link>
          </div>

          {loadingInt ? (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[1,2,3,4,5].map(i => <Skeleton key={i} h={34} />)}
            </div>
          ) : errInt ? (
            <SectionError msg={errInt} onRetry={fetchInterests} />
          ) : interests.length === 0 ? (
            <EmptyState
              icon="📩" msg="No export interests yet."
              action={<Link to="/exporter/sourcing" className="btn-amber" style={{ fontSize:12, padding:"7px 14px", marginTop:8, display:"inline-flex" }}>Browse Farmer Produce</Link>}
            />
          ) : (
            <>
              {[
                { label:"Pending",     count: pendingInt.length,     badge:"badge-amber"  },
                { label:"Accepted",    count: acceptedInt.length,    badge:"badge-blue"   },
                { label:"Negotiating", count: negotiatingInt.length, badge:"badge-purple" },
                { label:"Confirmed",   count: confirmedInt.length,   badge:"badge-green"  },
                { label:"Rejected",    count: intByStatus("rejected").length, badge:"badge-red" },
              ].map(({ label, count, badge }) => (
                <div key={label} className="int-row">
                  <span style={{ fontSize:14, color: count > 0 ? "#fff" : "var(--text2)", fontWeight: count > 0 ? 600 : 400 }}>
                    {label}
                  </span>
                  <span className={`badge ${badge}`}>{count}</span>
                </div>
              ))}

              {/* Latest pending interest preview */}
              {pendingInt.length > 0 && (() => {
                const top = pendingInt[0];
                return (
                  <div style={{ marginTop:14, padding:"12px 14px", borderRadius:12, background:"rgba(245,158,11,0.05)", border:"1px solid rgba(245,158,11,0.18)" }}>
                    <div style={{ fontSize:10, color:"var(--text2)", textTransform:"uppercase", fontWeight:700, marginBottom:6 }}>
                      Latest Pending
                    </div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#fff" }}>{top.listing?.name || "—"}</div>
                    <div style={{ fontSize:12, color:"var(--text2)", marginTop:2 }}>
                      👤 {top.farmer?.name || "Farmer"} &nbsp;·&nbsp; {top.requestedQty} {top.requestedUnit || "MT"}
                    </div>
                    <Link
                      to="/exporter/my-interests"
                      style={{ fontSize:12, fontWeight:700, color:"#fbbf24", textDecoration:"none", display:"inline-block", marginTop:8 }}
                    >
                      Review Interest →
                    </Link>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </div>

      {/* ══════ ACTION REQUIRED ════════════════════════════════════════ */}
      {(() => {
        const actions = [];
        if (!loadingInt && !errInt) {
          if (pendingInt.length > 0)
            actions.push({
              icon:"📩",
              color:"#fbbf24",
              msg:`${pendingInt.length} farmer interest${pendingInt.length > 1 ? "s" : ""} awaiting your review`,
              sub: pendingInt[0]?.listing?.name ? `Latest: ${pendingInt[0].listing.name}` : undefined,
              to:"/exporter/my-interests",
              cta:"Review →"
            });
          if (negotiatingInt.length > 0)
            actions.push({
              icon:"💬",
              color:"#a78bfa",
              msg:`${negotiatingInt.length} interest${negotiatingInt.length > 1 ? "s" : ""} in active negotiation`,
              sub: negotiatingInt[0]?.listing?.name ? `Latest: ${negotiatingInt[0].listing.name}` : undefined,
              to:"/exporter/my-interests",
              cta:"Negotiate →"
            });
        }
        if (!loadingShip && !errShip && approachingShipments.length > 0)
          actions.push({
            icon:"🚢",
            color:"#38bdf8",
            msg:`${approachingShipments.length} shipment${approachingShipments.length > 1 ? "s" : ""} arriving within 3 days`,
            sub: approachingShipments[0]?.containerNo ? `Container: ${approachingShipments[0].containerNo}` : undefined,
            to:"/exporter/logistics",
            cta:"Track →"
          });
        const overdueShipments = activeShipments.filter(s => { const d = daysUntil(s.eta); return d !== null && d < 0; });
        if (!loadingShip && !errShip && overdueShipments.length > 0)
          actions.push({
            icon:"⚠️",
            color:"#f87171",
            msg:`${overdueShipments.length} shipment${overdueShipments.length > 1 ? "s" : ""} past ETA — follow up required`,
            sub: overdueShipments[0]?.containerNo ? `Container: ${overdueShipments[0].containerNo}` : undefined,
            to:"/exporter/logistics",
            cta:"View →"
          });
        if (!loadingRfqs && !errRfqs && pendingRfqs.length > 0)
          actions.push({
            icon:"📋",
            color:"#fb923c",
            msg:`${pendingRfqs.length} RFQ${pendingRfqs.length > 1 ? "s" : ""} awaiting response`,
            sub: pendingRfqs[0]?.cropName ? `Latest: ${pendingRfqs[0].cropName} → ${pendingRfqs[0].destinationCountry}` : undefined,
            to:"/exporter/sourcing",
            cta:"Review →"
          });
        if (!loadingComp && !errComp && complianceAlerts.length > 0)
          actions.push({
            icon:"📑",
            color:"#f87171",
            msg:`${complianceAlerts.length} compliance document${complianceAlerts.length > 1 ? "s" : ""} need attention`,
            sub: complianceAlerts[0]?.title || undefined,
            to:"/exporter/compliance",
            cta:"Open Vault →"
          });

        const isLoading = loadingInt || loadingShip || loadingRfqs || loadingComp;

        return (
          <div className="card" style={{ marginBottom:18 }}>
            <div className="sec-head">
              <div>
                <div className="card-title">⚠️ Action Required</div>
                <div className="card-sub">Items that need your attention right now</div>
              </div>
              {actions.length > 0 && (
                <span className="badge badge-red">{actions.length} item{actions.length > 1 ? "s" : ""}</span>
              )}
            </div>
            {isLoading ? (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {[1,2].map(i => <Skeleton key={i} h={52} />)}
              </div>
            ) : actions.length === 0 ? (
              <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px", borderRadius:10, background:"rgba(34,197,94,0.06)", border:"1px solid rgba(34,197,94,0.15)", color:"#4ade80", fontSize:13, fontWeight:600 }}>
                ✓ No urgent actions right now. Everything looks good.
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {actions.map((a, i) => (
                  <Link key={i} to={a.to} className="action-item">
                    <div style={{ display:"flex", alignItems:"center", gap:12, flex:1 }}>
                      <div style={{ width:36, height:36, borderRadius:10, background:`${a.color}18`, border:`1px solid ${a.color}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
                        {a.icon}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:"#fff" }}>{a.msg}</div>
                        {a.sub && <div style={{ fontSize:11, color:"var(--text2)", marginTop:2 }}>{a.sub}</div>}
                      </div>
                    </div>
                    <span style={{ fontSize:12, fontWeight:700, color:a.color, whiteSpace:"nowrap", flexShrink:0, padding:"6px 12px", borderRadius:8, border:`1px solid ${a.color}30`, background:`${a.color}10` }}>
                      {a.cta}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* ══════ SHIPMENT ALERTS + RECENT ACTIVITY ═══════════════════════ */}
      <div className="two-col" style={{ marginBottom:18 }}>

        {/* ── Shipment Alerts ── */}
        <div className="card">
          <div className="sec-head">
            <div>
              <div className="card-title">🚢 Shipment Alerts</div>
              <div className="card-sub">Shipments needing attention</div>
            </div>
            <Link to="/exporter/logistics" className="btn-ghost" style={{ fontSize:12, padding:"7px 12px" }}>All Shipments →</Link>
          </div>
          {loadingShip ? (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>{[1,2,3].map(i => <Skeleton key={i} h={56} />)}</div>
          ) : errShip ? (
            <SectionError msg={errShip} onRetry={fetchShipments} />
          ) : (() => {
            // Build alert list from real shipments only
            const alerts = [];
            // Overdue first
            shipments.filter(s => !['delivered','cancelled'].includes(s.status) && s.eta && daysUntil(s.eta) < 0)
              .forEach(s => alerts.push({ s, kind:'overdue' }));
            // Arriving soon (≤3 days)
            shipments.filter(s => !['delivered','cancelled'].includes(s.status) && s.eta && daysUntil(s.eta) >= 0 && daysUntil(s.eta) <= 3)
              .forEach(s => alerts.push({ s, kind:'soon' }));
            // Cancelled recently (within last 7 days)
            shipments.filter(s => s.status === 'cancelled' && s.updatedAt && daysUntil(s.updatedAt) >= -7)
              .forEach(s => alerts.push({ s, kind:'cancelled' }));

            if (alerts.length === 0) return (
              <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", borderRadius:10, background:"rgba(34,197,94,0.06)", border:"1px solid rgba(34,197,94,0.15)", color:"#4ade80", fontSize:13, fontWeight:600 }}>
                ✓ No shipment alerts.
              </div>
            );

            return (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {alerts.slice(0,6).map(({ s, kind }, i) => {
                  const d = daysUntil(s.eta);
                  const kindCfg = kind === 'overdue'
                    ? { color:'#f87171', bg:'rgba(239,68,68,0.06)', icon:'⚠️', label:'Past ETA' }
                    : kind === 'soon'
                    ? { color:'#fbbf24', bg:'rgba(251,191,36,0.06)', icon:'🕐', label: d === 0 ? 'Due Today' : `${d}d to ETA` }
                    : { color:'#94a3b8', bg:'rgba(148,163,184,0.06)', icon:'❌', label:'Cancelled' };
                  return (
                    <div key={s._id || i} className="ship-alert-item" style={{ borderColor:`${kindCfg.color}22`, background:kindCfg.bg }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                          <span style={{ fontSize:13 }}>{kindCfg.icon}</span>
                          <span style={{ fontFamily:"monospace", fontSize:13, fontWeight:800, color:"#fbbf24" }}>{s.containerNo}</span>
                          <span style={{ fontSize:11, fontWeight:700, color:kindCfg.color }}>{kindCfg.label}</span>
                        </div>
                        <div style={{ fontSize:12, color:"#fff", fontWeight:600 }}>{s.cargo}{s.quantityTons ? ` · ${s.quantityTons} MT` : ""}</div>
                        <div style={{ fontSize:11, color:"var(--text2)" }}>{s.portOfOrigin} → {s.destPort || s.destinationCountry}</div>
                      </div>
                      <Link
                        to="/exporter/logistics"
                        style={{ fontSize:11, fontWeight:700, color:kindCfg.color, textDecoration:"none", padding:"5px 10px", borderRadius:8, border:`1px solid ${kindCfg.color}30`, background:`${kindCfg.color}0d`, flexShrink:0 }}
                      >
                        Track →
                      </Link>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* ── Recent Activity ── */}
        <div className="card">
          <div className="sec-head">
            <div>
              <div className="card-title">🕐 Recent Activity</div>
              <div className="card-sub">Latest events across your account</div>
            </div>
          </div>
          {(loadingInt || loadingShip || loadingRfqs) ? (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>{[1,2,3,4].map(i => <Skeleton key={i} h={44} />)}</div>
          ) : (() => {
            // Build timeline from real data only — use updatedAt/createdAt timestamps
            const events = [];

            // Interests — recent status changes
            interests.forEach(int => {
              const ts = int.updatedAt || int.createdAt;
              if (!ts) return;
              const statusMap = {
                pending:     { icon:'📩', color:'#fbbf24', text:`Interest submitted for ${int.listing?.name || 'a listing'}` },
                accepted:    { icon:'✅', color:'#4ade80', text:`Interest accepted: ${int.listing?.name || 'listing'}` },
                negotiating: { icon:'💬', color:'#a78bfa', text:`Negotiating: ${int.listing?.name || 'listing'} with ${int.farmer?.name || 'farmer'}` },
                confirmed:   { icon:'🤝', color:'#4ade80', text:`Deal confirmed: ${int.listing?.name || 'listing'}` },
                rejected:    { icon:'❌', color:'#f87171', text:`Interest rejected: ${int.listing?.name || 'listing'}` },
                cancelled:   { icon:'🚫', color:'#94a3b8', text:`Interest cancelled: ${int.listing?.name || 'listing'}` },
                completed:   { icon:'🏆', color:'#4ade80', text:`Deal completed: ${int.listing?.name || 'listing'}` },
              };
              const cfg = statusMap[int.status];
              if (cfg) events.push({ ts: new Date(ts).getTime(), icon:cfg.icon, color:cfg.color, text:cfg.text });
            });

            // Shipments — use updatedAt for status change events
            shipments.forEach(s => {
              const ts = s.updatedAt || s.createdAt;
              if (!ts) return;
              const cfg = SHIPMENT_STATUSES[s.status];
              events.push({
                ts: new Date(ts).getTime(),
                icon: '🚢',
                color: '#38bdf8',
                text: `Shipment ${s.containerNo} — ${cfg?.label || s.status}${ s.cargo ? ` (${s.cargo})` : '' }`,
              });
            });

            // RFQs — creation events
            rfqs.forEach(r => {
              const ts = r.createdAt;
              if (!ts) return;
              events.push({
                ts: new Date(ts).getTime(),
                icon: '📋',
                color: '#fb923c',
                text: `RFQ created: ${r.cropName} → ${r.destinationCountry} (${r.quantityTons} MT)`,
              });
            });

            // Sort newest first, cap at 8
            events.sort((a, b) => b.ts - a.ts);
            const top = events.slice(0, 8);

            // Relative time helper
            const relTime = (ts) => {
              const diff = Date.now() - ts;
              const m = Math.floor(diff / 60000);
              const h = Math.floor(diff / 3600000);
              const d = Math.floor(diff / 86400000);
              if (m < 1)   return 'Just now';
              if (m < 60)  return `${m}m ago`;
              if (h < 24)  return `${h}h ago`;
              if (d === 1) return 'Yesterday';
              return `${d} days ago`;
            };

            if (top.length === 0) return (
              <div style={{ textAlign:"center", padding:"20px 0", color:"var(--text2)", fontSize:13 }}>
                No recent activity yet.
              </div>
            );

            return (
              <div>
                {top.map((ev, i) => (
                  <div key={i} className="activity-item">
                    <div className="activity-dot" style={{ background:ev.color, boxShadow:`0 0 6px ${ev.color}60` }} />
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8 }}>
                        <div style={{ fontSize:13, color:"#fff", fontWeight:500, lineHeight:1.4 }}>
                          <span style={{ marginRight:6 }}>{ev.icon}</span>{ev.text}
                        </div>
                        <span style={{ fontSize:10, color:"var(--text2)", whiteSpace:"nowrap", flexShrink:0, paddingTop:2 }}>{relTime(ev.ts)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      {/* ══════ ROW 2: Shipment Pipeline + RFQ Overview ══════════════ */}
      <div className="two-col" style={{ marginBottom:18 }}>

        {/* ── Shipment Pipeline ── */}
        <div className="card">
          <div className="sec-head">
            <div>
              <div className="card-title">🚢 Shipment Pipeline</div>
              <div className="card-sub">{shipments.length} total shipments tracked</div>
            </div>
            <Link to="/exporter/logistics" className="btn-ghost" style={{ fontSize:13, padding:"8px 14px" }}>
              Manage →
            </Link>
          </div>

          {loadingShip ? (
            <Skeleton h={60} mb={16} />
          ) : errShip ? (
            <SectionError msg={errShip} onRetry={fetchShipments} />
          ) : (
            <>
              {/* Pipeline stage counts */}
              <div style={{ display:"flex", alignItems:"flex-start", gap:4, marginBottom:20, overflowX:"auto" }}>
                {PIPE_STAGES.map((stage, idx) => {
                  const count = pipeCount(stage.key);
                  return (
                    <div key={stage.key} style={{ display:"contents" }}>
                      <div className="pipe-stage">
                        <div className={`pipe-count${count > 0 ? " active" : ""}`}>{count}</div>
                        <div className="pipe-label">{stage.label}</div>
                      </div>
                      {idx < PIPE_STAGES.length - 1 && (
                        <div className="pipe-arrow">›</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Active shipment rows */}
              {activeShipments.length === 0 ? (
                <EmptyState
                  icon="🚢" msg="No active shipments."
                  action={<Link to="/exporter/logistics" className="btn-ghost" style={{ fontSize:12, padding:"7px 14px", marginTop:8, display:"inline-flex" }}>Add Shipment</Link>}
                />
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {activeShipments.slice(0, 4).map(s => {
                    const cfg = SHIPMENT_STATUSES[s.status] || { label:s.status, badge:"badge-grey" };
                    return (
                      <div key={s._id} style={{ padding:"12px 14px", borderRadius:12, background:"var(--surface)", border:"1px solid var(--border)" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, flexWrap:"wrap" }}>
                          <div style={{ flex:1 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
                              <span style={{ fontFamily:"monospace", fontSize:13, fontWeight:800, color:"#fbbf24" }}>{s.containerNo}</span>
                              <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
                            </div>
                            <div style={{ fontSize:12, color:"#fff", fontWeight:600 }}>{s.cargo} {s.quantityTons ? `(${s.quantityTons} MT)` : ""}</div>
                            <div style={{ fontSize:11, color:"var(--text2)", marginTop:2 }}>
                              {s.portOfOrigin} → <strong style={{ color:"#e5e7eb" }}>{s.destPort || s.destinationCountry}</strong>
                              {s.vessel && <> &nbsp;·&nbsp; 🚢 {s.vessel}</>}
                            </div>
                          </div>
                          <EtaDisplay eta={s.eta} status={s.status} />
                        </div>
                      </div>
                    );
                  })}
                  {activeShipments.length > 4 && (
                    <Link to="/exporter/logistics" style={{ fontSize:13, color:"#fbbf24", fontWeight:700, textDecoration:"none", textAlign:"center", padding:"6px 0" }}>
                      +{activeShipments.length - 4} more — View All Shipments
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── RFQ Overview ── */}
        <div className="card">
          <div className="sec-head">
            <div>
              <div className="card-title">📋 RFQ Overview</div>
              <div className="card-sub">Export requests for quotation</div>
            </div>
            <Link to="/exporter/sourcing" className="btn-ghost" style={{ fontSize:13, padding:"8px 14px" }}>
              + New RFQ
            </Link>
          </div>

          {loadingRfqs ? (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[1,2,3].map(i => <Skeleton key={i} h={40} />)}
            </div>
          ) : errRfqs ? (
            <SectionError msg={errRfqs} onRetry={fetchRfqs} />
          ) : rfqs.length === 0 ? (
            <EmptyState
              icon="📋" msg="No RFQs raised yet."
              action={<Link to="/exporter/sourcing" className="btn-amber" style={{ fontSize:12, padding:"7px 14px", marginTop:8, display:"inline-flex" }}>Browse & Request</Link>}
            />
          ) : (
            <>
              {/* Status summary */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
                {[
                  { label:"Total",   count:rfqs.length,        badge:"badge-grey"   },
                  { label:"Pending", count:pendingRfqs.length,  badge:"badge-amber"  },
                  { label:"Active",  count:activeRfqs.length,   badge:"badge-blue"   },
                  { label:"Rejected",count:rfqs.filter(r=>r.status==="rejected").length, badge:"badge-red" },
                ].map(({ label, count, badge }) => (
                  <div key={label} style={{ padding:"10px 12px", borderRadius:10, background:"var(--surface)", border:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:12, color:"var(--text2)" }}>{label}</span>
                    <span className={`badge ${badge}`}>{count}</span>
                  </div>
                ))}
              </div>

              {/* Recent RFQs */}
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {rfqs.slice(0, 5).map(r => {
                  const sc = { pending:"badge-amber", accepted:"badge-blue", quoted:"badge-blue", rejected:"badge-red" };
                  return (
                    <div key={r._id} style={{ padding:"10px 12px", borderRadius:10, background:"var(--surface)", border:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:"#fff" }}>{r.cropName}</div>
                        <div style={{ fontSize:11, color:"var(--text2)", marginTop:2 }}>
                          🌍 {r.destinationCountry} &nbsp;·&nbsp; {r.quantityTons} MT
                          {r.targetPriceUsd > 0 && <> &nbsp;·&nbsp; ${r.targetPriceUsd}/MT</>}
                        </div>
                        <div style={{ fontSize:10, color:"var(--text2)", marginTop:1 }}>{fmtDate(r.createdAt)}</div>
                      </div>
                      <span className={`badge ${sc[r.status] || "badge-grey"}`} style={{ flexShrink:0 }}>{r.status}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ══════ FX RATES ════════════════════════════════════════════════ */}
      <div className="card" style={{ marginBottom:18 }}>
        <div className="sec-head">
          <div>
            <div className="card-title">💱 Exchange Rates</div>
            <div className="card-sub">
              {errFx
                ? "Exchange rate data unavailable"
                : lastFx
                ? `Last updated: ${lastFx.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" })}`
                : "Fetching live rates…"
              }
            </div>
          </div>
          <button
            onClick={fetchFx}
            className="btn-ghost"
            disabled={loadingFx}
            style={{ fontSize:13, padding:"8px 14px", display:"flex", alignItems:"center", gap:6 }}
          >
            {loadingFx ? <span className="spinner" style={{ width:12, height:12, borderWidth:2 }} /> : "🔄"} Refresh
          </button>
        </div>

        {loadingFx ? (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:10 }}>
            {FX_CURRENCIES.map((c,i) => <Skeleton key={i} h={62} />)}
          </div>
        ) : errFx ? (
          <SectionError msg={errFx} onRetry={fetchFx} />
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:10 }}>
            {fxRates.map(f => (
              <div key={f.pair} className="fx-card">
                <div style={{ fontSize:11, color:"var(--text2)", fontWeight:700, marginBottom:4 }}>{f.flag} {f.pair}</div>
                <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:20, fontWeight:800, color:"#fff" }}>
                  ₹{f.from === "JPY" ? f.rate.toFixed(4) : f.rate.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══════ ROW 3: Compliance + Analytics note ═══════════════════════ */}
      <div className="two-col" style={{ marginBottom:18 }}>

        {/* ── Compliance Overview ── */}
        <div className="card">
          <div className="sec-head">
            <div>
              <div className="card-title">📑 Compliance Overview</div>
              <div className="card-sub">Your export documents & certifications</div>
            </div>
            <Link to="/exporter/compliance" className="btn-ghost" style={{ fontSize:13, padding:"8px 14px" }}>
              Open Vault →
            </Link>
          </div>

          {loadingComp ? (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {[1,2,3,4].map(i => <Skeleton key={i} h={38} />)}
            </div>
          ) : errComp ? (
            <SectionError msg={errComp} onRetry={fetchCompliance} />
          ) : compliance.length === 0 ? (
            <EmptyState
              icon="📑" msg="No compliance documents added yet."
              action={<Link to="/exporter/compliance" className="btn-amber" style={{ fontSize:12, padding:"7px 14px", marginTop:8, display:"inline-flex" }}>Add Documents</Link>}
            />
          ) : (
            <>
              {/* Summary counts */}
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14 }}>
                {["VERIFIED","ACTIVE","RENEWAL DUE","EXPIRED","PENDING"].map(st => {
                  const count = compliance.filter(d => d.status === st).length;
                  if (count === 0) return null;
                  const cfg = COMPLIANCE_STATUS_CFG[st] || { badge:"badge-grey", label:st };
                  return (
                    <span key={st} className={`badge ${cfg.badge}`}>{count} {cfg.label}</span>
                  );
                })}
              </div>

              {/* Document rows */}
              <div>
                {compliance.slice(0, 6).map(doc => {
                  const cfg = COMPLIANCE_STATUS_CFG[doc.status] || { badge:"badge-grey", label:doc.status };
                  const dl = doc.isLifetime ? null : daysUntil(doc.validTill);
                  const expiring = dl !== null && dl <= 30 && dl >= 0;
                  const expired  = dl !== null && dl < 0;
                  return (
                    <div key={doc._id} className="comp-row">
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {doc.title}
                        </div>
                        {doc.isLifetime ? (
                          <div style={{ fontSize:11, color:"var(--text2)" }}>Lifetime · {doc.docType}</div>
                        ) : doc.validTill ? (
                          <div style={{ fontSize:11, color: expired ? "#f87171" : expiring ? "#fbbf24" : "var(--text2)" }}>
                            {expired ? "⚠️ Expired" : expiring ? `⚠️ Expires in ${dl}d` : `Valid till ${fmtDate(doc.validTill)}`}
                          </div>
                        ) : (
                          <div style={{ fontSize:11, color:"var(--text2)" }}>{doc.docType}</div>
                        )}
                      </div>
                      <span className={`badge ${cfg.badge}`} style={{ flexShrink:0 }}>{cfg.label}</span>
                    </div>
                  );
                })}
                {compliance.length > 6 && (
                  <Link to="/exporter/compliance" style={{ fontSize:13, color:"#fbbf24", fontWeight:700, textDecoration:"none", display:"block", textAlign:"center", paddingTop:12 }}>
                    +{compliance.length - 6} more documents →
                  </Link>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Export Analytics note ── */}
        <div className="card">
          <div className="sec-head">
            <div>
              <div className="card-title">📊 Export Analytics</div>
              <div className="card-sub">Volume, revenue and interest trends</div>
            </div>
          </div>

          {/* Summary metrics from real data */}
          {loadingStats || loadingShip || loadingRfqs || loadingInt ? (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[1,2,3,4].map(i => <Skeleton key={i} h={44} />)}
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[
                { label:"Total Shipments",    val: stats?.totalShipments ?? "—",    icon:"🚢" },
                { label:"Delivered",          val: deliveredShipments.length,       icon:"✅" },
                { label:"Total Volume",       val: totalVolume > 0 ? `${totalVolume} MT` : "—", icon:"📦" },
                { label:"Total Interests",    val: interests.length,                icon:"📩" },
                { label:"Confirmed Deals",    val: confirmedInt.length,             icon:"🤝" },
                { label:"Total RFQs",         val: rfqs.length,                     icon:"📋" },
              ].map(({ label, val, icon }) => (
                <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", borderRadius:10, background:"var(--surface)", border:"1px solid var(--border)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:16 }}>{icon}</span>
                    <span style={{ fontSize:13, color:"var(--text2)" }}>{label}</span>
                  </div>
                  <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:16, color:"#fff" }}>{val}</span>
                </div>
              ))}
              <div style={{ padding:"10px 12px", borderRadius:10, background:"rgba(245,158,11,0.04)", border:"1px solid rgba(245,158,11,0.1)", fontSize:12, color:"var(--text2)", textAlign:"center", marginTop:4 }}>
                Detailed chart analytics available after sufficient shipment history is recorded.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════ RECENT SHIPMENTS TABLE ════════════════════════════════ */}
      <div className="card">
        <div className="sec-head">
          <div>
            <div className="card-title">📦 Recent Shipments</div>
            <div className="card-sub">{shipments.length} total records</div>
          </div>
          <Link to="/exporter/logistics" className="btn-ghost" style={{ fontSize:13, padding:"8px 14px" }}>
            View All →
          </Link>
        </div>

        {loadingShip ? (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {[1,2,3].map(i => <Skeleton key={i} h={50} />)}
          </div>
        ) : errShip ? (
          <SectionError msg={errShip} onRetry={fetchShipments} />
        ) : shipments.length === 0 ? (
          <EmptyState
            icon="📦" msg="No shipments found."
            action={<Link to="/exporter/logistics" className="btn-amber" style={{ fontSize:12, padding:"7px 14px", marginTop:8, display:"inline-flex" }}>Add First Shipment</Link>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table" style={{ minWidth:640 }}>
              <thead>
                <tr>
                  <th>Container</th>
                  <th>Commodity</th>
                  <th>Vessel</th>
                  <th>Route</th>
                  <th>Volume</th>
                  <th>ETA</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {shipments.slice(0, 8).map(s => {
                  const cfg = SHIPMENT_STATUSES[s.status] || { label:s.status, badge:"badge-grey" };
                  return (
                    <tr key={s._id}>
                      <td className="nowrap" style={{ fontFamily:"monospace", fontWeight:800, color:"#fbbf24" }}>{s.containerNo}</td>
                      <td style={{ fontWeight:600 }}>{s.cargo}</td>
                      <td style={{ color:"var(--text2)" }}>{s.vessel || "—"}</td>
                      <td className="nowrap" style={{ color:"var(--text2)" }}>
                        {s.portOfOrigin} → <strong style={{ color:"#fff" }}>{s.destPort || s.destinationCountry}</strong>
                      </td>
                      <td style={{ color:"#fbbf24" }}>{s.quantityTons ? `${s.quantityTons} MT` : "—"}</td>
                      <td className="nowrap"><EtaDisplay eta={s.eta} status={s.status} /></td>
                      <td><span className={`badge ${cfg.badge}`}>{cfg.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {shipments.length > 8 && (
              <div style={{ textAlign:"center", padding:"14px 0" }}>
                <Link to="/exporter/logistics" style={{ fontSize:13, color:"#fbbf24", fontWeight:700, textDecoration:"none" }}>
                  +{shipments.length - 8} more — View All in Logistics →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
