import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../../config/api";
import { DS } from "../../styles/ds";
import {
  Sprout, Package, IndianRupee, Wheat, AlertTriangle, Bell,
  RefreshCw, Plus, Clock, BarChart3, AlertCircle
} from "lucide-react";

/* ─── Extra styles ────────────────────────────────────────────────────── */
const EXTRA = `
  .fd-skel {
    border-radius:10px; background:#e2e8f0;
    animation:pulse 1.8s ease-in-out infinite;
  }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }

  .fd-two { display:grid; grid-template-columns:1fr 1fr; gap:18px; margin-bottom:20px; }
  @media(max-width:800px){ .fd-two { grid-template-columns:1fr; } }

  .fd-action-row {
    display:flex; align-items:center; justify-content:space-between;
    padding:13px 16px; border-radius:12px; gap:12px;
    border:1px solid #bbf7d0;
    background:#f0fdf4;
    text-decoration:none; transition:background 0.18s, border-color 0.18s;
    cursor:pointer;
  }
  .fd-action-row:hover { background:#dcfce7; border-color:#86efac; }
  .fd-action-row.urgent { border-color:#fecaca; background:#fef2f2; }
  .fd-action-row.urgent:hover { background:#fee2e2; border-color:#fca5a5; }
  .fd-action-row.attention { border-color:#fde68a; background:#fffbeb; }
  .fd-action-row.attention:hover { background:#fef3c7; border-color:#fcd34d; }

  .fd-priority-chip {
    font-size:10px; font-weight:800; letter-spacing:0.05em;
    padding:2px 8px; border-radius:6px; text-transform:uppercase;
    flex-shrink:0;
  }
  .fd-priority-chip.urgent   { background:#fee2e2; color:#b91c1c; border:1px solid #fecaca; }
  .fd-priority-chip.attention{ background:#fef3c7; color:#b45309; border:1px solid #fde68a; }
  .fd-priority-chip.upcoming { background:#dcfce7; color:#15803d; border:1px solid #bbf7d0; }

  .fd-harvest-row {
    display:flex; align-items:center; justify-content:space-between;
    padding:10px 0; border-bottom:1px solid #e2e8f0; gap:8px;
  }
  .fd-harvest-row:last-child { border-bottom:none; }

  .fd-act-item {
    display:flex; align-items:flex-start; gap:12px;
    padding:9px 0; border-bottom:1px solid #f1f5f9;
  }
  .fd-act-item:last-child { border-bottom:none; }
  .fd-act-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; margin-top:5px; }

  .fd-price-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:10px; }

  .fd-sec-head {
    display:flex; align-items:center; justify-content:space-between;
    margin-bottom:16px; flex-wrap:wrap; gap:8px;
  }

  .fd-stock-row {
    display:flex; align-items:center; justify-content:space-between;
    padding:9px 0; border-bottom:1px solid #fef3c7; gap:8px;
  }
  .fd-stock-row:last-child { border-bottom:none; }

  /* profile bar */
  .fd-prof-bar-bg { height:6px; border-radius:3px; background:#e2e8f0; overflow:hidden; margin:6px 0; }
  .fd-prof-bar-fill { height:100%; border-radius:3px; background:linear-gradient(90deg,#16a34a,#4ade80); transition:width 0.6s ease; }

  /* kpi card hover cursor */
  .stat-card-link { display:block; text-decoration:none; }

  /* mobile KPI: prevent value clipping */
  .stat-val { min-width:0; word-break:break-word; }
  @media(max-width:480px){
    .stat-val { font-size:22px !important; }
    .stat-card { padding:16px 14px; }
  }

  /* action count bubble */
  .fd-action-count {
    display:inline-flex; align-items:center; justify-content:center;
    min-width:22px; height:22px; padding:0 6px;
    border-radius:11px; font-size:12px; font-weight:800;
    background:#fee2e2; color:#b91c1c;
    border:1px solid #fecaca;
  }
`;

/* ─── Helpers ─────────────────────────────────────────────────────────── */
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("agroconnect_token")}` });

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

const daysUntil = (d) => {
  if (!d) return null;
  return Math.ceil((new Date(d) - Date.now()) / 86400000);
};

const relTime = (ts) => {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const dv = Math.floor(diff / 86400000);
  if (m < 1)    return "Just now";
  if (m < 60)   return `${m}m ago`;
  if (h < 24)   return `${h}h ago`;
  if (dv === 1) return "Yesterday";
  return `${dv} days ago`;
};

/*
  normalizeToKg — converts a crop quantity to kg for uniform comparison.
  Crop.js unit enum: "kg" | "quintal" | "ton"  (exactly these three).
    1 quintal = 100 kg
    1 ton     = 1000 kg
  Returns null if the unit is unrecognised.
*/
const normalizeToKg = (quantity, unit) => {
  if (typeof quantity !== "number" || quantity <= 0) return null;
  switch (unit) {
    case "kg":      return quantity;
    case "quintal": return quantity * 100;
    case "ton":     return quantity * 1000;
    default:        return null; // unrecognised unit — skip
  }
};

/* Low-stock threshold: 50 kg equivalent.
   Applied after normalising ALL units to kg first,
   so 0.4 ton (400 kg) is correctly above threshold
   and 35 kg is correctly below it.
*/
const LOW_STOCK_KG = 50;
const isLowStock = (c) => {
  if (!["listed", "ready"].includes(c.status)) return false;
  const kg = normalizeToKg(c.quantity, c.unit);
  return kg !== null && kg <= LOW_STOCK_KG;
};

/* Profile completion — calculated from localStorage user + crop count.
   Fields checked: name, phone, location (or district/state), profileCompleted.
   Uses only what's already in localStorage — no extra API call.
*/
const calcProfileCompletion = (user, cropCount) => {
  const fields = [
    { label: "Name",     done: !!(user.name?.trim()) },
    { label: "Phone",    done: !!(user.phone?.trim()) },
    { label: "Location", done: !!(user.location?.trim() || user.district?.trim() || user.state?.trim()) },
    { label: "Role set", done: !!(user.role) },
    { label: "Profile",  done: !!(user.profileCompleted || user.profileComplete) },
    { label: "Crops",    done: cropCount > 0 },
  ];
  const done = fields.filter(f => f.done).length;
  const pct  = Math.round((done / fields.length) * 100);
  const missing = fields.filter(f => !f.done).map(f => f.label);
  return { pct, done, total: fields.length, missing };
};

/* ─── Sub-components ─────────────────────────────────────────────────── */
function Skel({ h = 54 }) {
  return <div className="fd-skel" style={{ height: h }} />;
}

function SectionError({ msg, onRetry }) {
  return (
    <div style={{ padding: "12px 16px", borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
      <span>⚠️ {msg}</span>
      {onRetry && (
        <button onClick={onRetry} style={{ background: "none", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
          Retry
        </button>
      )}
    </div>
  );
}

function ViewAllLink({ to, label = "View All →", color = "#16a34a" }) {
  return (
    <Link to={to} style={{ fontSize: 12, color, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>
      {label}
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════════════════════════ */
export default function FarmerDashboard() {
  const user = JSON.parse(localStorage.getItem("agroconnect_user") || "{}");
  const navigate = useNavigate();

  /* ── state ── */
  const [stats,        setStats]        = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [exportStats,  setExportStats]  = useState(null);
  const [crops,        setCrops]        = useState([]);
  const [prices,       setPrices]       = useState([]);

  const [loadingStats,  setLoadingStats]  = useState(true);
  const [loadingExport, setLoadingExport] = useState(true);
  const [loadingCrops,  setLoadingCrops]  = useState(true);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [refreshing,    setRefreshing]    = useState(false);

  const [errStats,  setErrStats]  = useState(null);
  const [errExport, setErrExport] = useState(null);
  const [errCrops,  setErrCrops]  = useState(null);
  const [errPrices, setErrPrices] = useState(null);

  /* ── fetchers ── */
  const fetchStats = useCallback(async () => {
    setLoadingStats(true); setErrStats(null);
    try {
      const r = await fetch(`${API_URL}/api/orders/farmer/dashboard-stats`, { headers: authH() });
      const d = await r.json();
      if (d.success || d.stats) {
        setStats(d.stats);
        setRecentOrders(d.recentOrders || []);
      } else {
        setErrStats(d.message || "Failed to load stats");
      }
    } catch { setErrStats("Network error — could not load stats"); }
    finally { setLoadingStats(false); }
  }, []);

  const fetchExportStats = useCallback(async () => {
    setLoadingExport(true); setErrExport(null);
    try {
      const r = await fetch(`${API_URL}/api/export/stats`, { headers: authH() });
      const d = await r.json();
      if (d.success) setExportStats(d);
      else setErrExport(d.message || "Export data unavailable");
    } catch { setErrExport("Could not load export data"); }
    finally { setLoadingExport(false); }
  }, []);

  const fetchCrops = useCallback(async () => {
    setLoadingCrops(true); setErrCrops(null);
    try {
      const r = await fetch(`${API_URL}/api/crops/my`, { headers: authH() });
      const d = await r.json();
      if (d.crops) setCrops(d.crops);
      else setErrCrops(d.message || "Failed to load crops");
    } catch { setErrCrops("Network error — could not load crops"); }
    finally { setLoadingCrops(false); }
  }, []);

  /* Fetch mandi prices for up to 3 unique listed/active crop names */
  const fetchPrices = useCallback(async (cropList) => {
    if (!cropList || cropList.length === 0) return;
    setLoadingPrices(true); setErrPrices(null);
    try {
      const names = [...new Set(cropList.map(c => c.name).filter(Boolean))].slice(0, 3);
      const results = await Promise.allSettled(
        names.map(name =>
          fetch(`${API_URL}/api/prices/live?commodity=${encodeURIComponent(name)}&state=Karnataka`, { headers: authH() })
            .then(r => r.json())
            .then(d => {
              if (d.success && d.prices?.length > 0) {
                const p = d.prices[0];
                return {
                  name,
                  modalPrice: p.modalPrice,
                  minPrice:   p.minPrice,
                  maxPrice:   p.maxPrice,
                  market:     p.market || "",
                  arrivalDate: p.arrivalDate || null,
                };
              }
              return null;
            })
            .catch(() => null)
        )
      );
      const valid = results
        .filter(r => r.status === "fulfilled" && r.value !== null)
        .map(r => r.value);
      if (valid.length === 0) setErrPrices("No mandi price data found for your crops");
      else setPrices(valid);
    } catch { setErrPrices("Could not fetch market prices"); }
    finally { setLoadingPrices(false); }
  }, []);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([fetchStats(), fetchExportStats(), fetchCrops()]);
    setRefreshing(false);
  }, [fetchStats, fetchExportStats, fetchCrops]);

  useEffect(() => { refreshAll(); }, []); // eslint-disable-line

  useEffect(() => {
    if (crops.length > 0 && !loadingCrops) fetchPrices(crops);
  }, [crops, loadingCrops, fetchPrices]);

  /* ── Derived values ── */
  const deliveredCount    = stats?.deliveredOrders  ?? 0;
  const pendingCount      = stats?.pendingOrders     ?? 0;
  const acceptedCount     = stats?.acceptedOrders    ?? 0;
  const pendingInterests  = exportStats?.pendingInterests ?? 0;

  const upcomingHarvests = crops
    .filter(c => { const d = daysUntil(c.harvestDate); return d !== null && d >= 0; })
    .sort((a, b) => new Date(a.harvestDate) - new Date(b.harvestDate))
    .slice(0, 5);

  const overdueHarvests = crops.filter(c => {
    const d = daysUntil(c.harvestDate);
    return d !== null && d < 0 && !["sold", "listed"].includes(c.status);
  });

  // Low-stock: listed/ready crops below unit threshold
  const lowStockCrops = crops.filter(isLowStock).slice(0, 5);

  // Profile completion (from localStorage only — no API call)
  const profile = calcProfileCompletion(user, crops.length);

  // Recent Activity
  const activity = (() => {
    const events = [];
    recentOrders.forEach(o => {
      const ts = o.updatedAt || o.createdAt;
      if (!ts) return;
      const map = {
        pending:    { icon: "📦", color: "#b45309", text: `Order received: ${o.cropName || "Crop"}` },
        accepted:   { icon: "✅", color: "#16a34a", text: `Order accepted: ${o.cropName || "Crop"}` },
        processing: { icon: "⚙️", color: "#7c3aed", text: `Order processing: ${o.cropName || "Crop"}` },
        shipped:    { icon: "🚚", color: "#0369a1", text: `Order shipped: ${o.cropName || "Crop"}` },
        delivered:  { icon: "🏆", color: "#16a34a", text: `Delivered: ${o.cropName || "Crop"} to ${o.buyerName || "buyer"}` },
        cancelled:  { icon: "❌", color: "#dc2626", text: `Order cancelled: ${o.cropName || "Crop"}` },
        rejected:   { icon: "🚫", color: "#64748b", text: `Order rejected: ${o.cropName || "Crop"}` },
      };
      const cfg = map[o.status];
      if (cfg) events.push({ ts: new Date(ts).getTime(), ...cfg });
    });
    crops
      .filter(c => c.createdAt && daysUntil(c.createdAt) >= -30)
      .forEach(c => events.push({
        ts:   new Date(c.createdAt).getTime(),
        icon: "🌿", color: "#16a34a",
        text: `Crop added: ${c.name} (${c.quantity} ${c.unit})`,
      }));
    return events.sort((a, b) => b.ts - a.ts).slice(0, 8);
  })();

  /* ── Action Required — sorted by priority ── */
  const buildActions = () => {
    const actions = [];

    // 🚨 URGENT — pending orders (farmer must act now)
    if (!loadingStats && stats && pendingCount > 0)
      actions.push({
        priority: "urgent", label: "🚨 Urgent",
        icon: "📦", color: "#dc2626",
        msg: `${pendingCount} order${pendingCount > 1 ? "s" : ""} awaiting your response`,
        sub: recentOrders.find(o => o.status === "pending")?.cropName
          ? `Latest: ${recentOrders.find(o => o.status === "pending").cropName}`
          : undefined,
        to: "/farmer/orders", cta: "Review →",
      });

    // 🚨 URGENT — overdue harvests (past date, not actioned)
    if (!loadingCrops && overdueHarvests.length > 0)
      actions.push({
        priority: "urgent", label: "🚨 Urgent",
        icon: "🌾", color: "#dc2626",
        msg: `${overdueHarvests.length} crop${overdueHarvests.length > 1 ? "s" : ""} past harvest date — update status`,
        sub: overdueHarvests[0]?.name ? `e.g. ${overdueHarvests[0].name}` : undefined,
        to: "/farmer/crops", cta: "Update →",
      });

    // ⚠️ ATTENTION — accepted orders ready to pack/ship
    if (!loadingStats && stats && acceptedCount > 0)
      actions.push({
        priority: "attention", label: "⚠️ Attention",
        icon: "✅", color: "#b45309",
        msg: `${acceptedCount} accepted order${acceptedCount > 1 ? "s" : ""} ready to pack`,
        to: "/farmer/orders", cta: "View →",
      });

    // ⚠️ ATTENTION — exporter interests awaiting reply
    if (!loadingExport && exportStats && pendingInterests > 0)
      actions.push({
        priority: "attention", label: "⚠️ Attention",
        icon: "🌍", color: "#b45309",
        msg: `${pendingInterests} export interest${pendingInterests > 1 ? "s" : ""} awaiting your reply`,
        sub: exportStats.unreadInterests > 0 ? `${exportStats.unreadInterests} unread` : undefined,
        to: "/farmer/export", cta: "Review →",
        navState: { tab: "interests" },
      });

    // 🌱 UPCOMING — near harvests (≤ 7 days)
    const nearHarvests = upcomingHarvests.filter(c => {
      const d = daysUntil(c.harvestDate);
      return d !== null && d <= 7;
    });
    if (!loadingCrops && nearHarvests.length > 0)
      actions.push({
        priority: "upcoming", label: "🌱 Upcoming",
        icon: "🌱", color: "#15803d",
        msg: nearHarvests.length === 1
          ? `${nearHarvests[0].name} harvest in ${daysUntil(nearHarvests[0].harvestDate)} day${daysUntil(nearHarvests[0].harvestDate) !== 1 ? "s" : ""}`
          : `${nearHarvests.length} crops harvesting within 7 days`,
        to: "/farmer/crops", cta: "View Crops →",
      });

    return actions;
  };
  const actions   = buildActions();
  const isLoading = loadingStats || loadingExport || loadingCrops;

  /* ──────────────────────────────────────────────────────────────────────
     RENDER
  ────────────────────────────────────────────────────────────────────── */
  return (
    <>
      <style>{DS + EXTRA}</style>

      {/* ══════ HEADER ══════════════════════════════════════════════ */}
      <div className="pg-head">
        <div>
          <div className="eyebrow" style={{ color: "#16a34a", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
            Farmer Dashboard
          </div>
          <h1 className="pg-title">{greeting()}, {user.name?.split(" ")[0] || "Farmer"} 👋</h1>
          <p className="pg-sub">Here's your farm and marketplace activity overview.</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={refreshAll}
            disabled={refreshing}
            className="btn-ghost"
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            {refreshing
              ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: "#22c55e" }} />
              : <RefreshCw size={14} strokeWidth={2} />}
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
          <Link to="/farmer/crops/add" className="btn-green" id="dash-add-crop">
            <Plus size={14} strokeWidth={2.5} style={{ marginRight: 4 }} /> Add Crop
          </Link>
        </div>
      </div>

      {errStats && <SectionError msg={errStats} onRetry={fetchStats} />}

      {/* ══════ PENDING ORDERS ALERT BANNER ════════════════════════ */}
      {!loadingStats && stats && pendingCount > 0 && (
        <div className="alert-warn" style={{ marginBottom: 20 }}>
          <Bell size={14} strokeWidth={2} style={{ marginRight: 6 }} /> You have <strong>{pendingCount}</strong> pending order{pendingCount > 1 ? "s" : ""} waiting for your response.
          <Link to="/farmer/orders" style={{ marginLeft: "auto", color: "#92400e", fontWeight: 700, fontSize: 13 }}>
            View Orders →
          </Link>
        </div>
      )}

      {/* ══════ KPI CARDS — all clickable ══════════════════════════ */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        {loadingStats ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} className="stat-card">
              <Skel h={24} />
              <div style={{ marginTop: 10 }}><Skel h={36} /></div>
              <div style={{ marginTop: 8 }}><Skel h={14} /></div>
            </div>
          ))
        ) : stats ? [
          { Icon: Sprout,      label: "Active Crops",    value: stats.activeCrops,    color: "#16a34a", glow: "#22c55e", link: "/farmer/crops",   sub: `${stats.totalCrops} total crop${stats.totalCrops !== 1 ? "s" : ""}` },
          { Icon: Package,     label: "Total Orders",    value: stats.totalOrders,    color: "#0369a1", glow: "#38bdf8", link: "/farmer/orders",  sub: `${pendingCount} pending` },
          { Icon: IndianRupee, label: "Total Income",    value: `₹${Number(stats.totalIncome || 0).toLocaleString("en-IN")}`, color: "#b45309", glow: "#fbbf24", link: "/farmer/income",  sub: `${deliveredCount} delivered` },
          { Icon: Wheat,       label: "Products Listed", value: stats.totalCrops,     color: "#7c3aed", glow: "#a78bfa", link: "/farmer/crops",   sub: `${stats.activeCrops} active` },
        ].map(({ Icon, label, value, color, glow, link, sub }) => (
          <Link
            to={link} key={label}
            className="stat-card"
            style={{ textDecoration: "none", cursor: "pointer" }}
            title={`Go to ${label}`}
          >
            <div className="stat-glow" style={{ background: glow }} />
            <div className="stat-icon" style={{ color }}><Icon size={22} strokeWidth={1.75} /></div>
            <div className="stat-val" style={{ color: "#0f172a" }}>{value}</div>
            <div className="stat-lbl">{label}</div>
            {sub && <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 4 }}>{sub}</div>}
            <div style={{ fontSize: 11, color: "#16a34a", marginTop: 6, fontWeight: 600 }}>→ View details</div>
          </Link>
        )) : null}
      </div>

      {/* ══════ ACTION REQUIRED ═════════════════════════════════════ */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="fd-sec-head">
          <div>
            <div className="card-title"><AlertTriangle size={16} strokeWidth={2} style={{ marginRight: 6, color: "#d97706", verticalAlign: "middle" }} />Action Required</div>
            <div className="card-sub">Items that need your immediate attention</div>
          </div>
          {!isLoading && actions.length > 0 && (
            <span className="fd-action-count">{actions.length}</span>
          )}
        </div>

        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Skel h={56} /><Skel h={56} />
          </div>
        ) : actions.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", fontSize: 13, fontWeight: 600 }}>
            ✓ No urgent actions right now. Everything looks good!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {actions.map((a, i) => (
              <Link
                key={i}
                to={a.to}
                state={a.navState}
                className={`fd-action-row ${a.priority}`}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                  {/* Priority chip */}
                  <span className={`fd-priority-chip ${a.priority}`}>{a.label}</span>
                  {/* Icon */}
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: `${a.color}18`, border: `1px solid ${a.color}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                    {a.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.msg}</div>
                    {a.sub && <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>{a.sub}</div>}
                  </div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#15803d", whiteSpace: "nowrap", flexShrink: 0, padding: "5px 11px", borderRadius: 8, border: "1px solid #bbf7d0", background: "#f0fdf4" }}>
                  {a.cta}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ══════ UPCOMING HARVESTS + RECENT ACTIVITY ═════════════════ */}
      <div className="fd-two">

        {/* Upcoming Harvests */}
        <div className="card">
          <div className="fd-sec-head">
            <div>
              <div className="card-title"><Sprout size={15} strokeWidth={1.75} style={{ marginRight: 6, color: "#16a34a", verticalAlign: "middle" }} />Upcoming Harvests</div>
              <div className="card-sub">Crops due for harvest</div>
            </div>
            <ViewAllLink to="/farmer/crops" label="View All →" />
          </div>
          {loadingCrops ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[1, 2, 3].map(i => <Skel key={i} h={42} />)}
            </div>
          ) : errCrops ? (
            <SectionError msg={errCrops} onRetry={fetchCrops} />
          ) : upcomingHarvests.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text2)", fontSize: 13 }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>🌿</div>
              No upcoming harvests found.
              <div style={{ marginTop: 10 }}>
                <Link to="/farmer/crops" style={{ fontSize: 12, color: "#16a34a", fontWeight: 700, textDecoration: "none" }}>
                  Add harvest dates to crops →
                </Link>
              </div>
            </div>
          ) : (
            <div>
              {upcomingHarvests.map(c => {
                const d = daysUntil(c.harvestDate);
                const urgency = d === 0 ? "#dc2626" : d <= 3 ? "#dc2626" : d <= 7 ? "#d97706" : "#16a34a";
                return (
                  <Link key={c._id} to={`/farmer/crops/${c._id}`} className="fd-harvest-row" style={{ textDecoration: "none" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>
                        📍 {c.location} · {c.quantity} {c.unit}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: urgency }}>
                        {d === 0 ? "Today!" : `${d} day${d !== 1 ? "s" : ""}`}
                      </span>
                      <div style={{ fontSize: 10, color: "var(--text2)", marginTop: 1 }}>to harvest</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="fd-sec-head">
            <div>
              <div className="card-title"><Clock size={15} strokeWidth={1.75} style={{ marginRight: 6, color: "#64748b", verticalAlign: "middle" }} />Recent Activity</div>
              <div className="card-sub">Latest events on your account</div>
            </div>
            <ViewAllLink to="/farmer/orders" label="View Orders →" />
          </div>
          {(loadingStats || loadingCrops) ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[1, 2, 3, 4].map(i => <Skel key={i} h={40} />)}
            </div>
          ) : activity.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text2)", fontSize: 13 }}>
              No recent activity yet.
            </div>
          ) : (
            <div>
              {activity.map((ev, i) => (
                <div key={i} className="fd-act-item">
                  <div className="fd-act-dot" style={{ background: ev.color }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 500, lineHeight: 1.4, overflow: "hidden" }}>
                        <span style={{ marginRight: 5 }}>{ev.icon}</span>{ev.text}
                      </div>
                      <span style={{ fontSize: 10, color: "var(--text2)", whiteSpace: "nowrap", flexShrink: 0, paddingTop: 2 }}>
                        {relTime(ev.ts)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══════ MARKET PRICES + EXPORT OPPORTUNITIES ════════════════ */}
      <div className="fd-two">

        {/* Market Prices — enhanced presentation */}
        <div className="card">
          <div className="fd-sec-head">
            <div>
              <div className="card-title"><BarChart3 size={15} strokeWidth={1.75} style={{ marginRight: 6, color: "#16a34a", verticalAlign: "middle" }} />Market Prices</div>
              <div className="card-sub">APMC mandi prices for your crops</div>
            </div>
            <ViewAllLink to="/farmer/market-trends" label="View Market →" />
          </div>

          {loadingPrices ? (
            <div className="fd-price-grid">
              {[1, 2, 3].map(i => <Skel key={i} h={82} />)}
            </div>
          ) : errPrices ? (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <div style={{ color: "var(--text2)", fontSize: 13, marginBottom: 12 }}>⚠️ {errPrices}</div>
              <Link to="/farmer/market-trends" className="btn-ghost" style={{ fontSize: 12, padding: "7px 14px" }}>
                View Market Trends →
              </Link>
            </div>
          ) : prices.length === 0 ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <Link to="/farmer/market-trends" style={{ color: "#16a34a", fontWeight: 700, textDecoration: "none", fontSize: 13 }}>
                View Market Trends →
              </Link>
            </div>
          ) : (
            <div className="fd-price-grid">
              {prices.map(p => (
                <div key={p.name} style={{ padding: "12px 14px", borderRadius: 12, background: "#f0fdf4", border: "1px solid rgba(34,197,94,0.12)" }}>
                  <div style={{ fontSize: 12, color: "var(--text2)", fontWeight: 700, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: "#16a34a" }}>
                    ₹{Number(p.modalPrice).toLocaleString("en-IN")}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text2)", marginTop: 3 }}>
                    per quintal
                  </div>
                  {/* Real min–max range — only when API supplies non-zero values */}
                  {p.minPrice > 0 && p.maxPrice > 0 && (
                    <div style={{ fontSize: 10, color: "var(--text2)", marginTop: 2 }}>
                      Range: ₹{Number(p.minPrice).toLocaleString("en-IN")} – ₹{Number(p.maxPrice).toLocaleString("en-IN")}
                    </div>
                  )}
                  {/* Market name — only when API supplies it */}
                  {p.market && (
                    <div style={{ fontSize: 10, color: "#15803d", marginTop: 2, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      📍 {p.market}
                    </div>
                  )}
                  {/* arrivalDate — the mandi data collection date from the API.
                      Only shown when the API actually provides this field.
                      NOT a live timestamp; it is the date the mandi reported this price. */}
                  {p.arrivalDate && (
                    <div style={{ fontSize: 10, color: "var(--text2)", marginTop: 2 }}>
                      Data from: {p.arrivalDate}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 10, fontSize: 11, color: "var(--text2)", fontStyle: "italic" }}>
            Source: Government APMC mandi data
          </div>
        </div>

        {/* Export Opportunities */}
        <div className="card" style={{ borderColor: "rgba(56,189,248,0.18)", background: "#f0f9ff" }}>
          <div className="fd-sec-head">
            <div>
              <div className="card-title">🌍 Export Opportunities</div>
              <div className="card-sub">Connect with international buyers</div>
            </div>
            <ViewAllLink to="/farmer/export" label="Open →" color="#0369a1" />
          </div>
          {loadingExport ? (
            <div style={{ display: "flex", gap: 10 }}>
              {[1, 2, 3].map(i => <Skel key={i} h={60} />)}
            </div>
          ) : errExport ? (
            <SectionError msg={errExport} onRetry={fetchExportStats} />
          ) : exportStats ? (
            <>
              <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                {[
                  [exportStats.listingCount    ?? 0, "My Listings",      "#4ade80"],
                  [exportStats.pendingInterests ?? 0, "Pending Requests", "#fbbf24"],
                  [exportStats.unreadInterests  ?? 0, "Unread Updates",   "#f87171"],
                ].map(([v, l, c]) => (
                  <div key={l} style={{ flex: 1, minWidth: 80, padding: "10px 12px", borderRadius: 10, background: "#f8fafc", textAlign: "center", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>{v}</div>
                    <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => navigate("/farmer/export", { state: { tab: "listings" } })}
                  style={{ flex: 1, padding: "10px", borderRadius: 10, background: "#f0f9ff", border: "1px solid #bae6fd", color: "#0369a1", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}
                >
                  📋 My Listings
                </button>
                <button
                  onClick={() => navigate("/farmer/export", { state: { tab: "listings", openCreate: true } })}
                  style={{ flex: 1, padding: "10px", borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}
                >
                  + List Produce
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* ══════ LOW-STOCK ALERTS + PROFILE COMPLETION ═══════════════ */}
      {(!loadingCrops && (lowStockCrops.length > 0 || profile.pct < 100)) && (
        <div className="fd-two" style={{ marginBottom: 20 }}>

          {/* Low-Stock Alerts — only shown when real low-stock data exists */}
          {lowStockCrops.length > 0 && (
            <div className="card" style={{ borderColor: "rgba(251,191,36,0.18)", background: "#fffbeb" }}>
              <div className="fd-sec-head">
                <div>
                  <div className="card-title">🌾 Stock Alerts</div>
                  <div className="card-sub">Listed/ready crops with low quantity</div>
                </div>
                <ViewAllLink to="/farmer/crops" label="Manage →" color="#d97706" />
              </div>
              <div>
                {lowStockCrops.map(c => (
                  <Link key={c._id} to={`/farmer/crops/${c._id}`} className="fd-stock-row" style={{ textDecoration: "none" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>
                        <span className={`badge ${c.status === "listed" ? "badge-green" : "badge-amber"}`} style={{ padding: "1px 6px", fontSize: 10 }}>
                          {c.status}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#d97706" }}>
                        {c.quantity} {c.unit}
                      </span>
                      <div style={{ fontSize: 10, color: "var(--text2)", marginTop: 1 }}>remaining</div>
                    </div>
                  </Link>
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: "var(--text2)", fontStyle: "italic" }}>
                Threshold: below 50 kg equivalent — all units normalised before comparison
              </div>
            </div>
          )}

          {/* Profile Completion — calculated from localStorage fields */}
          {profile.pct < 100 && (
            <div className="card">
              <div className="fd-sec-head">
                <div>
                  <div className="card-title">👤 Profile Completion</div>
                  <div className="card-sub">Strengthen your farmer profile</div>
                </div>
                <span style={{ fontSize: 16, fontWeight: 800, color: profile.pct >= 80 ? "#16a34a" : profile.pct >= 50 ? "#d97706" : "#dc2626" }}>
                  {profile.pct}%
                </span>
              </div>
              <div className="fd-prof-bar-bg">
                <div className="fd-prof-bar-fill" style={{ width: `${profile.pct}%`, background: profile.pct >= 80 ? "#16a34a" : profile.pct >= 50 ? "#d97706" : "#dc2626" }} />
              </div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 8, marginBottom: 12 }}>
                {profile.done} of {profile.total} fields complete
                {profile.missing.length > 0 && (
                  <span style={{ marginLeft: 6, color: "var(--text2)" }}>
                    — missing: {profile.missing.join(", ")}
                  </span>
                )}
              </div>
              <Link to="/farmer/profile" className="btn-ghost" style={{ fontSize: 12, padding: "8px 14px" }}>
                Complete Profile →
              </Link>
            </div>
          )}

          {/* If crops loaded & no low-stock but profile complete — show healthy stock note */}
          {lowStockCrops.length === 0 && profile.pct >= 100 && crops.length > 0 && (
            <div className="card" style={{ background: "#f0fdf4", borderColor: "rgba(34,197,94,0.15)" }}>
              <div style={{ color: "#15803d", fontSize: 13, fontWeight: 600 }}>
                ✓ Stock levels are healthy
              </div>
              <div style={{ color: "var(--text2)", fontSize: 12, marginTop: 4 }}>
                All your listed crops have sufficient quantity.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════ QUICK ACTIONS ════════════════════════════════════════ */}
      <div style={{ marginBottom: 24 }}>
        <div className="card-title" style={{ marginBottom: 16 }}>Quick Actions</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
          {[
            { emoji: "➕",  label: "Add New Crop",       to: "/farmer/crops/add",          color: "#16a34a" },
            { emoji: "🌍",  label: "Export Produce",      to: "/farmer/export",             color: "#0369a1" },
            { emoji: "🌾",  label: "Smart Farm Planner", to: "/farmer/smart-farm-planner", color: "#16a34a" },
            { emoji: "🔬",  label: "Check Crop Disease", to: "/farmer/disease-detection",  color: "#7c3aed" },
            { emoji: "📈",  label: "Price Prediction",   to: "/farmer/price-prediction",   color: "#0369a1" },
            { emoji: "🌦️", label: "Weather Advisory",   to: "/farmer/weather",            color: "#b45309" },
            { emoji: "📊",  label: "Market Trends",      to: "/farmer/market-trends",      color: "#fb923c" },
            { emoji: "🤖",  label: "AI Assistant",       to: "/farmer/assistant",          color: "#f472b6" },
            { emoji: "🏡",  label: "My Farm Profile",    to: "/farmer/my-farm",            color: "#15803d" },
            { emoji: "📉",  label: "Farm Analytics",     to: "/farmer/farm-analytics",     color: "#60a5fa" },
            { emoji: "🔔",  label: "Notifications",      to: "/farmer/notifications",      color: "#fb923c" },
          ].map(({ emoji, label, to, color }) => (
            <Link
              key={to} to={to}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 10, padding: "18px 12px", borderRadius: 16, textDecoration: "none",
                background: "var(--surface)", border: "1px solid var(--border)",
                transition: "background 0.2s, border-color 0.2s, transform 0.2s",
                color: "var(--text)", fontSize: 13, fontWeight: 600, textAlign: "center",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--surface2)"; e.currentTarget.style.borderColor = color + "33"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "none"; }}
            >
              <span style={{ fontSize: 26 }}>{emoji}</span>
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* ══════ CROP SUMMARY + ORDER SUMMARY + TIPS ═════════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))", gap: 20, marginBottom: 20 }}>

        {/* Crop Summary */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div className="card-title">🌿 Crop Summary</div>
              <div className="card-sub">Your active listings</div>
            </div>
            <ViewAllLink to="/farmer/crops" />
          </div>
          {loadingStats ? (
            <div style={{ display: "flex", gap: 12 }}>{[1, 2, 3].map(i => <Skel key={i} h={72} />)}</div>
          ) : stats ? (
            <div style={{ display: "flex", gap: 16 }}>
              {[
                [stats.activeCrops,                     "Active",   "#dcfce7", "#bbf7d0"],
                [(stats.totalCrops - stats.activeCrops), "Inactive", "#fef3c7", "#fde68a"],
                [stats.totalCrops,                       "Total",    "#e0f2fe", "#bae6fd"],
              ].map(([v, lbl, bg, bd]) => (
                <div key={lbl} style={{ flex: 1, padding: "14px", borderRadius: 12, background: bg, border: `1px solid ${bd}`, textAlign: "center" }}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>{v}</div>
                  <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>{lbl}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Order Summary — real delivered count */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div className="card-title">📦 Order Summary</div>
              <div className="card-sub">Incoming farm orders</div>
            </div>
            <ViewAllLink to="/farmer/orders" />
          </div>
          {loadingStats ? (
            <div style={{ display: "flex", gap: 12 }}>{[1, 2, 3].map(i => <Skel key={i} h={72} />)}</div>
          ) : stats ? (
            <div style={{ display: "flex", gap: 16 }}>
              {[
                [pendingCount,      "Pending",   "#fef3c7", "#fde68a"],
                [deliveredCount,    "Delivered", "#dcfce7", "#bbf7d0"],
                [stats.totalOrders, "Total",     "#e0f2fe", "#bae6fd"],
              ].map(([v, lbl, bg, bd]) => (
                <div key={lbl} style={{ flex: 1, padding: "14px", borderRadius: 12, background: bg, border: `1px solid ${bd}`, textAlign: "center" }}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>{v}</div>
                  <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>{lbl}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Get Started Tips */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>🚀 Get Started Tips</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              ["🌿", "Add your first crop listing",         "/farmer/crops/add"],
              ["📸", "Upload crop photos for better sales", "/farmer/crops"],
              ["🔬", "Scan any diseased crop leaf",         "/farmer/disease-detection"],
              ["💡", "Check today's best market prices",    "/farmer/price-prediction"],
            ].map(([icon, text, to]) => (
              <Link key={to} to={to}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, background: "var(--surface)", textDecoration: "none", color: "var(--text)", fontSize: 13, transition: "background 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
                onMouseLeave={e => e.currentTarget.style.background = "var(--surface)"}
              >
                <span style={{ fontSize: 18 }}>{icon}</span>
                <span>{text}</span>
                <span style={{ marginLeft: "auto", color: "var(--text2)", fontSize: 16 }}>→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}