import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../../config/api";
import { DS } from "../../styles/ds";

/* ═══════════════════════════════════════════════════════════
   CONSTANTS & HELPERS
═══════════════════════════════════════════════════════════ */

// Low-stock threshold in KG (normalized). One constant to change later.
const LOW_STOCK_KG = 50;

const toKg = (qty, unit) => {
  if (unit === "quintal") return qty * 100;
  if (unit === "ton")     return qty * 1000;
  return qty; // kg
};

const isLowStock = (qty, unit) => toKg(qty, unit) <= LOW_STOCK_KG;

const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("agroconnect_token")}` });

const STATUS_COLOR = {
  pending:    "#fbbf24",
  accepted:   "#38bdf8",
  processing: "#a78bfa",
  shipped:    "#fb923c",
  delivered:  "#4ade80",
  rejected:   "#f87171",
  cancelled:  "#f87171",
};

const STATUS_LABEL = {
  pending:    "⏳ Pending",
  accepted:   "✅ Accepted",
  processing: "📦 Processing",
  shipped:    "🚚 Shipped",
  delivered:  "🎉 Delivered",
  rejected:   "❌ Rejected",
  cancelled:  "🚫 Cancelled",
};

const relTime = (iso) => {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "yesterday";
  if (d < 7)   return `${d} days ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const fmtINR = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

/* ═══════════════════════════════════════════════════════════
   SKELETON COMPONENT
═══════════════════════════════════════════════════════════ */
const Skel = ({ w = "100%", h = 18, r = 8 }) => (
  <div style={{
    width: w, height: h, borderRadius: r, flexShrink: 0,
    background: "linear-gradient(90deg,rgba(167,139,250,0.05) 25%,rgba(167,139,250,0.11) 50%,rgba(167,139,250,0.05) 75%)",
    backgroundSize: "200% 100%",
    animation: "sklShimmer 1.6s ease infinite",
  }} />
);

/* ═══════════════════════════════════════════════════════════
   SVG MINI BAR CHART — Monthly Revenue
═══════════════════════════════════════════════════════════ */
function MiniBarChart({ monthly }) {
  if (!monthly || monthly.length === 0) return (
    <div style={{ padding: "32px", textAlign: "center", color: "var(--text2)", fontSize: 13 }}>
      Not enough historical data to display a chart.
    </div>
  );
  const max = Math.max(...monthly.map(m => m.revenue), 1);
  const W = 320, H = 80, barW = Math.floor(W / monthly.length) - 4, gap = 4;
  return (
    <div style={{ overflowX: "auto" }}>
      <svg viewBox={`0 0 ${W} ${H + 24}`} style={{ width: "100%", maxWidth: W, display: "block" }}>
        {monthly.map((m, i) => {
          const barH = Math.max(3, Math.round((m.revenue / max) * H));
          const x = i * (barW + gap);
          const y = H - barH;
          const isLast = i === monthly.length - 1;
          return (
            <g key={m.month || i}>
              <rect
                x={x} y={y} width={barW} height={barH} rx={3}
                fill={isLast ? "url(#barGrad)" : "rgba(167,139,250,0.25)"}
              />
              <text x={x + barW / 2} y={H + 16} textAnchor="middle" fill="rgba(167,139,250,0.6)" fontSize={8}>
                {(m.month || "").split(" ")[0]}
              </text>
            </g>
          );
        })}
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   EXTRA CSS
═══════════════════════════════════════════════════════════ */
const EXTRA = `
  @keyframes sklShimmer { 0% { background-position:200% 0 } 100% { background-position:-200% 0 } }
  @keyframes spin        { to { transform:rotate(360deg); } }
  @keyframes fadeIn      { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }

  .sd-grid4  { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:24px; }
  .sd-grid2  { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:24px; }
  .sd-grid3  { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; margin-bottom:24px; }
  .sd-kpi    { padding:20px 22px; border-radius:16px; background:var(--surface); border:1px solid var(--border); cursor:pointer; transition:transform 0.2s, border-color 0.2s, box-shadow 0.2s; animation:fadeIn 0.4s ease; }
  .sd-kpi:hover { transform:translateY(-3px); box-shadow:0 12px 28px rgba(0,0,0,0.35); }
  .sd-kpi-val { font-family:'Space Grotesk',sans-serif; font-size:26px; font-weight:800; margin-top:8px; }
  .sd-kpi-lbl { font-size:11px; color:var(--text2); text-transform:uppercase; letter-spacing:0.05em; }
  .sd-kpi-sub { font-size:11px; color:var(--text2); margin-top:4px; }

  .sd-pipe-bar { display:flex; gap:0; border-radius:12px; overflow:hidden; height:10px; margin:14px 0; }
  .sd-pipe-seg { transition:flex 0.5s ease; }
  .sd-pipe-stages { display:grid; grid-template-columns:repeat(5,1fr); gap:8px; }
  .sd-pipe-stage  { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:12px 14px; cursor:pointer; transition:border-color 0.2s; text-decoration:none; display:block; }
  .sd-pipe-stage:hover { border-color:rgba(167,139,250,0.3); }

  .sd-act-row  { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-radius:13px; background:var(--surface); border:1px solid var(--border); flex-wrap:wrap; gap:8px; transition:border-color 0.2s; animation:fadeIn 0.35s ease; }
  .sd-act-row:hover { border-color:rgba(167,139,250,0.2); }
  .sd-act-link { font-size:12px; color:#a78bfa; font-weight:700; text-decoration:none; white-space:nowrap; flex-shrink:0; }
  .sd-act-link:hover { text-decoration:underline; }

  .sd-order-row { display:flex; justify-content:space-between; align-items:center; padding:11px 14px; background:var(--surface); border-radius:12px; border:1px solid var(--border); cursor:pointer; transition:border-color 0.2s; flex-wrap:wrap; gap:8px; }
  .sd-order-row:hover { border-color:rgba(167,139,250,0.2); }

  .sd-quick-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:10px; }
  .sd-quick-link { padding:13px 14px; background:var(--surface); border-radius:13px; border:1px solid var(--border); display:flex; align-items:center; gap:10px; text-decoration:none; transition:border-color 0.2s,background 0.2s; }
  .sd-quick-link:hover { border-color:rgba(167,139,250,0.25); background:rgba(167,139,250,0.04); }

  .sd-stock-row { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:rgba(251,191,36,0.05); border:1px solid rgba(251,191,36,0.12); border-radius:11px; gap:8px; flex-wrap:wrap; }

  @media(max-width:900px){
    .sd-grid4  { grid-template-columns:1fr 1fr; }
    .sd-grid2  { grid-template-columns:1fr; }
    .sd-pipe-stages { grid-template-columns:repeat(3,1fr); }
  }
  @media(max-width:560px){
    .sd-grid4  { grid-template-columns:1fr 1fr; gap:10px; }
    .sd-grid3  { grid-template-columns:1fr 1fr; }
    .sd-pipe-stages { grid-template-columns:repeat(2,1fr); }
    .sd-quick-grid  { grid-template-columns:1fr 1fr; }
  }
`;

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function SellerDashboard() {
  const user = JSON.parse(localStorage.getItem("agroconnect_user") || "{}");

  // ─── State ───────────────────────────────────────────────
  const [stats,        setStats]        = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [allOrders,    setAllOrders]    = useState([]); // for pipeline counts
  const [products,     setProducts]     = useState([]);
  const [revenue,      setRevenue]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [errors,       setErrors]       = useState({});  // per-section errors
  const [refreshing,   setRefreshing]   = useState(false);
  const [lastUpdated,  setLastUpdated]  = useState(null);
  const loadRef = useRef(0);

  // ─── Fetch all data ───────────────────────────────────────
  const load = useCallback(async (isRefresh = false) => {
    const tick = ++loadRef.current;
    if (isRefresh) setRefreshing(true);
    else           setLoading(true);
    setErrors({});

    const errs = {};

    // Parallel fetch — fail independently
    const [dashRes, ordersRes, productsRes, revenueRes] = await Promise.allSettled([
      fetch(`${API_URL}/api/seller/dashboard-stats`, { headers: authH() }),
      fetch(`${API_URL}/api/orders/seller`,           { headers: authH() }),
      fetch(`${API_URL}/api/seller/products`,         { headers: authH() }),
      fetch(`${API_URL}/api/seller/revenue`,          { headers: authH() }),
    ]);

    if (tick !== loadRef.current) return; // stale fetch

    // Dashboard stats
    if (dashRes.status === "fulfilled") {
      try {
        const d = await dashRes.value.json();
        if (d.success) { setStats(d.stats || {}); setRecentOrders(d.recentOrders || []); }
        else errs.dash = d.message || "Dashboard data unavailable";
      } catch { errs.dash = "Failed to parse dashboard data"; }
    } else {
      errs.dash = "Network error loading dashboard";
    }

    // All orders (for pipeline counts)
    if (ordersRes.status === "fulfilled") {
      try {
        const d = await ordersRes.value.json();
        if (d.success) setAllOrders(d.orders || []);
        else errs.orders = d.message || "Orders unavailable";
      } catch { errs.orders = "Failed to parse orders"; }
    } else {
      errs.orders = "Network error loading orders";
    }

    // Products (for low-stock)
    if (productsRes.status === "fulfilled") {
      try {
        const d = await productsRes.value.json();
        if (d.success) setProducts(d.products || []);
        else errs.products = d.message || "Products unavailable";
      } catch { errs.products = "Failed to parse products"; }
    } else {
      errs.products = "Network error loading products";
    }

    // Revenue (for sales chart)
    if (revenueRes.status === "fulfilled") {
      try {
        const d = await revenueRes.value.json();
        if (d.success) setRevenue(d);
        else errs.revenue = d.message || "Revenue data unavailable";
      } catch { errs.revenue = "Failed to parse revenue"; }
    } else {
      errs.revenue = "Network error loading revenue";
    }

    setErrors(errs);
    setLastUpdated(new Date());
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(false); }, [load]);

  // ─── Computed values ──────────────────────────────────────
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  // Pipeline counts from real allOrders
  const pipeline = {
    pending:    allOrders.filter(o => o.status === "pending").length,
    accepted:   allOrders.filter(o => o.status === "accepted").length,
    processing: allOrders.filter(o => o.status === "processing").length,
    shipped:    allOrders.filter(o => o.status === "shipped").length,
    delivered:  allOrders.filter(o => o.status === "delivered").length,
  };
  const pipelineTotal = Object.values(pipeline).reduce((s, n) => s + n, 0);

  // Low-stock products (normalized kg)
  const lowStockProducts = products.filter(p =>
    p.stock != null && p.unit && isLowStock(p.stock, p.unit) && p.status !== "sold"
  );

  // Action Required — real urgency levels
  const actionItems = [];
  if (stats) {
    if (pipeline.pending > 0) actionItems.push({
      urgency: "red",
      icon: "📦",
      text: `${pipeline.pending} order${pipeline.pending !== 1 ? "s" : ""} pending — awaiting your response`,
      link: "/seller/orders",
      linkLabel: "Review Orders →",
    });
    if (pipeline.accepted > 0) actionItems.push({
      urgency: "amber",
      icon: "📋",
      text: `${pipeline.accepted} accepted order${pipeline.accepted !== 1 ? "s" : ""} need to be packed`,
      link: "/seller/orders",
      linkLabel: "Pack Orders →",
    });
    if (pipeline.shipped > 0) actionItems.push({
      urgency: "blue",
      icon: "🚚",
      text: `${pipeline.shipped} shipment${pipeline.shipped !== 1 ? "s" : ""} in transit`,
      link: "/seller/logistics",
      linkLabel: "Track Shipments →",
    });
    if (lowStockProducts.length > 0) actionItems.push({
      urgency: "amber",
      icon: "⚠️",
      text: `${lowStockProducts.length} product${lowStockProducts.length !== 1 ? "s" : ""} running low on stock`,
      link: "/seller/products",
      linkLabel: "Update Products →",
    });
    if (stats.activeProducts === 0 && products.length === 0) actionItems.push({
      urgency: "green",
      icon: "🛍️",
      text: "No products listed yet — add your first product to start selling",
      link: "/seller/products/add",
      linkLabel: "Add Product →",
    });
  }

  const urgencyBorder = {
    red:   "rgba(239,68,68,0.2)",
    amber: "rgba(251,191,36,0.15)",
    blue:  "rgba(56,189,248,0.15)",
    green: "rgba(167,139,250,0.15)",
  };
  const urgencyDot = {
    red:   "#f87171",
    amber: "#fbbf24",
    blue:  "#38bdf8",
    green: "#a78bfa",
  };

  // Recent activity from recentOrders
  const activities = [...recentOrders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8)
    .map(o => ({
      icon: STATUS_LABEL[o.status]?.split(" ")[0] || "📋",
      label: o.status === "pending"    ? "Order received"
           : o.status === "accepted"   ? "Order accepted"
           : o.status === "processing" ? "Order packed"
           : o.status === "shipped"    ? "Order shipped"
           : o.status === "delivered"  ? "Order delivered"
           : o.status === "rejected"   ? "Order rejected"
           : o.status === "cancelled"  ? "Order cancelled"
           : "Order updated",
      detail: `${o.cropName || "Product"} · ${o.quantity} ${o.unit || "kg"} · ${o.buyerName || "Buyer"}`,
      time: relTime(o.createdAt),
      color: STATUS_COLOR[o.status] || "#94a3b8",
    }));

  // KPI cards from real stats + revenue
  const deliveredCount = allOrders.filter(o => o.status === "delivered").length;
  const avgOrderValue  = revenue?.avgOrderValue ?? (
    deliveredCount > 0 && stats?.totalRevenue
      ? Math.round(stats.totalRevenue / deliveredCount)
      : null
  );

  /* ═══════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════ */
  return (
    <>
      <style>{DS + EXTRA}</style>

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="pg-head">
        <div>
          <div className="eyebrow">Seller Dashboard</div>
          <h1 className="pg-title">{greeting()}, {user.name?.split(" ")[0] || "Seller"} 👋</h1>
          <p className="pg-sub" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            Your business control center.
            {lastUpdated && (
              <span style={{ fontSize: 11, color: "var(--text2)", background: "var(--surface)", padding: "2px 10px", borderRadius: 20, border: "1px solid var(--border)" }}>
                Updated {relTime(lastUpdated)}
              </span>
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "10px 18px", borderRadius: 12,
              border: "1px solid rgba(167,139,250,0.2)",
              background: "rgba(167,139,250,0.06)",
              color: refreshing ? "var(--text2)" : "#a78bfa",
              fontWeight: 700, fontSize: 13,
              cursor: refreshing ? "not-allowed" : "pointer",
              fontFamily: "'Inter',sans-serif", transition: "all 0.2s",
            }}
          >
            <span style={{ display: "inline-block", animation: refreshing ? "spin 1s linear infinite" : "none" }}>🔄</span>
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
          <Link to="/seller/products/add" className="btn-green" id="seller-add-product"
            style={{ background: "linear-gradient(135deg,#7c3aed,#a78bfa)", boxShadow: "0 4px 14px rgba(167,139,250,0.3)" }}>
            ➕ Add Product
          </Link>
        </div>
      </div>

      {/* ── Global error (dash stats failed) ───────────────── */}
      {errors.dash && !loading && (
        <div className="card" style={{ marginBottom: 24, borderColor: "rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <span style={{ color: "#f87171", fontWeight: 600, fontSize: 14 }}>{errors.dash}</span>
            </div>
            <button onClick={() => load(false)} className="btn-ghost" style={{ fontSize: 13, padding: "8px 16px" }}>🔄 Retry</button>
          </div>
        </div>
      )}

      {/* ── Skeleton ───────────────────────────────────────── */}
      {loading && (
        <>
          <div className="sd-grid4" style={{ marginBottom: 24 }}>
            {[1,2,3,4].map(i => (
              <div key={i} className="card" style={{ padding: "20px 22px" }}>
                <Skel w={32} h={32} r={8} /><div style={{ height: 10 }} />
                <Skel w="60%" h={11} /><div style={{ height: 8 }} />
                <Skel w="45%" h={26} />
              </div>
            ))}
          </div>
          <div className="sd-grid2">
            {[1,2].map(i => (
              <div key={i} className="card" style={{ padding: "22px 24px" }}>
                <Skel w="40%" h={16} /><div style={{ height: 16 }} />
                {[1,2,3].map(j => <div key={j} style={{ marginBottom: 10 }}><Skel h={38} /></div>)}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Content ────────────────────────────────────────── */}
      {!loading && (
        <>
          {/* ── KPI Cards ─────────────────────────────────── */}
          <div className="sd-grid4">
            {[
              {
                emoji: "💰", label: "Total Revenue", sub: "accepted + shipped + delivered",
                value: fmtINR(stats?.totalRevenue), color: "#4ade80",
                link: "/seller/revenue", small: true,
              },
              {
                emoji: "📦", label: "Total Orders", sub: "→ View orders",
                value: stats?.totalOrders ?? allOrders.length,
                color: "#38bdf8", link: "/seller/orders",
              },
              {
                emoji: "✅", label: "Delivered", sub: "completed orders",
                value: deliveredCount,
                color: "#4ade80", link: "/seller/orders",
              },
              {
                emoji: "⏳", label: "Pending", sub: "awaiting action",
                value: pipeline.pending,
                color: "#fbbf24", link: "/seller/orders",
              },
            ].map(s => (
              <Link key={s.label} to={s.link} style={{ textDecoration: "none" }}>
                <div className="sd-kpi"
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${s.color}30`; e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.3)`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{ fontSize: 24 }}>{s.emoji}</div>
                  <div className="sd-kpi-lbl" style={{ marginTop: 10 }}>{s.label}</div>
                  <div className="sd-kpi-val" style={{ color: s.color, fontSize: s.small ? 20 : 26 }}>{s.value}</div>
                  <div className="sd-kpi-sub">{s.sub}</div>
                </div>
              </Link>
            ))}
          </div>

          {/* ── Action Required ───────────────────────────── */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
              <div className="card-title">⚠️ Action Required</div>
              {actionItems.length > 0 && (
                <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "rgba(239,68,68,0.1)", color: "#f87171", fontWeight: 700, border: "1px solid rgba(239,68,68,0.2)" }}>
                  {actionItems.length} item{actionItems.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            {actionItems.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#4ade80", fontSize: 14, padding: "8px 0" }}>
                <span style={{ fontSize: 20 }}>✓</span>
                <span>No urgent actions — everything looks good!</span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {actionItems.map((item, i) => (
                  <div key={i} className="sd-act-row" style={{ borderColor: urgencyBorder[item.urgency] }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: urgencyDot[item.urgency], flexShrink: 0, boxShadow: `0 0 8px ${urgencyDot[item.urgency]}80` }} />
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                      <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.text}</span>
                    </div>
                    <Link to={item.link} className="sd-act-link">{item.linkLabel}</Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Order Pipeline ────────────────────────────── */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
              <div className="card-title">📦 Order Pipeline</div>
              <Link to="/seller/orders" style={{ fontSize: 12, color: "#a78bfa", textDecoration: "none", fontWeight: 700 }}>View All Orders →</Link>
            </div>

            {/* Stacked bar */}
            {pipelineTotal > 0 ? (
              <>
                <div className="sd-pipe-bar">
                  {[
                    { key: "pending",    color: "#fbbf24" },
                    { key: "accepted",   color: "#38bdf8" },
                    { key: "processing", color: "#a78bfa" },
                    { key: "shipped",    color: "#fb923c" },
                    { key: "delivered",  color: "#4ade80" },
                  ].filter(s => pipeline[s.key] > 0).map(s => (
                    <div key={s.key} className="sd-pipe-seg"
                      style={{ flex: pipeline[s.key], background: s.color, opacity: 0.8 }}
                      title={`${STATUS_LABEL[s.key]}: ${pipeline[s.key]}`}
                    />
                  ))}
                </div>
                <div className="sd-pipe-stages">
                  {[
                    { key: "pending",    emoji: "⏳", label: "Pending",    color: "#fbbf24" },
                    { key: "accepted",   emoji: "✅", label: "Accepted",   color: "#38bdf8" },
                    { key: "processing", emoji: "📦", label: "Processing", color: "#a78bfa" },
                    { key: "shipped",    emoji: "🚚", label: "Shipped",    color: "#fb923c" },
                    { key: "delivered",  emoji: "🎉", label: "Delivered",  color: "#4ade80" },
                  ].map(s => (
                    <Link key={s.key} to="/seller/orders" className="sd-pipe-stage"
                      onMouseEnter={e => { e.currentTarget.style.borderColor = `${s.color}40`; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; }}
                    >
                      <div style={{ fontSize: 18, marginBottom: 6 }}>{s.emoji}</div>
                      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color: s.color }}>{pipeline[s.key]}</div>
                      <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>{s.label}</div>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state" style={{ padding: "20px" }}>
                <div className="empty-emoji">📦</div>
                <div className="empty-title">No orders yet</div>
                <div className="empty-sub">Your order pipeline will appear here as buyers place orders.</div>
              </div>
            )}
          </div>

          {/* ── Sales Performance + Recent Orders ─────────── */}
          <div className="sd-grid2">
            {/* 📈 Sales Performance */}
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                <div className="card-title">📈 Sales Performance</div>
                <Link to="/seller/revenue" style={{ fontSize: 12, color: "#a78bfa", textDecoration: "none", fontWeight: 700 }}>Full Report →</Link>
              </div>

              {errors.revenue && (
                <div style={{ color: "#f87171", fontSize: 13, padding: "8px 0", display: "flex", gap: 8, alignItems: "center" }}>
                  <span>⚠️</span> Unable to load revenue data.
                  <button onClick={() => load(false)} style={{ color: "#a78bfa", background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Retry</button>
                </div>
              )}

              {!errors.revenue && revenue && (
                <>
                  {/* 3 metrics */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                    {[
                      { label: "Revenue", value: fmtINR(revenue.totalRevenue), color: "#4ade80" },
                      { label: "Orders",  value: revenue.totalOrders,           color: "#38bdf8" },
                      { label: "Avg Order", value: avgOrderValue != null ? fmtINR(avgOrderValue) : "—", color: "#a78bfa" },
                    ].map(m => (
                      <div key={m.label} style={{ background: "rgba(167,139,250,0.04)", border: "1px solid var(--border)", borderRadius: 12, padding: "10px 12px" }}>
                        <div style={{ fontSize: 10, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{m.label}</div>
                        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 16, fontWeight: 800, color: m.color, marginTop: 4, wordBreak: "break-word" }}>{m.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Monthly bar chart */}
                  <div style={{ marginBottom: 4 }}>
                    <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Monthly Revenue</div>
                    <MiniBarChart monthly={revenue.monthly} />
                  </div>
                </>
              )}

              {!errors.revenue && !revenue && (
                <div style={{ color: "var(--text2)", fontSize: 13, padding: "24px 0", textAlign: "center" }}>
                  Revenue data not available.
                </div>
              )}
            </div>

            {/* 🕐 Recent Orders */}
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                <div className="card-title">🕐 Recent Orders</div>
                <Link to="/seller/orders" style={{ fontSize: 12, color: "#a78bfa", textDecoration: "none", fontWeight: 700 }}>View All →</Link>
              </div>

              {recentOrders.length === 0 ? (
                <div className="empty-state" style={{ padding: "24px" }}>
                  <div className="empty-emoji">📦</div>
                  <div className="empty-title">No orders yet</div>
                  <div className="empty-sub">Orders from buyers will appear here.</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {recentOrders.slice(0, 5).map((o, i) => {
                    const stColor = STATUS_COLOR[o.status] || "#94a3b8";
                    return (
                      <Link key={o._id || i} to="/seller/orders" className="sd-order-row" style={{ textDecoration: "none" }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: "#fff", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {o.cropName || "Product"}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>
                            {o.quantity} {o.unit || "kg"}
                            {o.buyerName ? ` · ${o.buyerName}` : ""}
                            {" · "}{relTime(o.createdAt)}
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontWeight: 800, color: "#4ade80", fontSize: 13 }}>{fmtINR(o.totalPrice)}</div>
                          <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 6, background: `${stColor}15`, color: stColor, fontWeight: 700, whiteSpace: "nowrap" }}>
                            {o.status || "pending"}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Low Stock + Recent Activity ───────────────── */}
          <div className="sd-grid2">
            {/* ⚠️ Low Stock */}
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                <div className="card-title">⚠️ Low Stock Alerts</div>
                <Link to="/seller/products" style={{ fontSize: 12, color: "#a78bfa", textDecoration: "none", fontWeight: 700 }}>All Products →</Link>
              </div>

              {errors.products && (
                <div style={{ color: "#f87171", fontSize: 13, padding: "8px 0", display: "flex", gap: 8, alignItems: "center" }}>
                  <span>⚠️</span> Unable to load product data.
                </div>
              )}

              {!errors.products && lowStockProducts.length === 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#4ade80", fontSize: 13, padding: "8px 0" }}>
                  <span style={{ fontSize: 18 }}>✓</span>
                  {products.length === 0
                    ? "No products listed yet."
                    : `All ${products.length} products have sufficient stock.`}
                </div>
              )}

              {!errors.products && lowStockProducts.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 4 }}>
                    Threshold: ≤ {LOW_STOCK_KG} kg equivalent
                  </div>
                  {lowStockProducts.slice(0, 5).map(p => (
                    <Link key={p._id} to={`/seller/products/${p._id}/edit`} className="sd-stock-row" style={{ textDecoration: "none" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: "#fff", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: 11, color: "#fbbf24", marginTop: 2 }}>
                          {p.stock} {p.unit} remaining
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6,
                          background: p.status === "listed" ? "rgba(34,197,94,0.1)" : p.status === "ready" ? "rgba(56,189,248,0.1)" : "rgba(251,191,36,0.1)",
                          color:      p.status === "listed" ? "#4ade80"             : p.status === "ready" ? "#38bdf8"             : "#fbbf24",
                          fontWeight: 700 }}>
                          {p.status}
                        </span>
                        <div style={{ fontSize: 10, color: "#a78bfa", marginTop: 3, fontWeight: 600 }}>Update →</div>
                      </div>
                    </Link>
                  ))}
                  {lowStockProducts.length > 5 && (
                    <Link to="/seller/products" style={{ fontSize: 12, color: "#a78bfa", textAlign: "center", textDecoration: "none", paddingTop: 4, fontWeight: 700 }}>
                      +{lowStockProducts.length - 5} more →
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* 🕐 Recent Activity */}
            <div className="card">
              <div className="card-title" style={{ marginBottom: 16 }}>🕐 Recent Activity</div>
              {activities.length === 0 ? (
                <div className="empty-state" style={{ padding: "24px" }}>
                  <div className="empty-emoji">🕐</div>
                  <div className="empty-title">No recent activity</div>
                  <div className="empty-sub">Activity will appear as orders are placed.</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {activities.map((a, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                        background: `${a.color}15`, border: `1px solid ${a.color}30`,
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
                      }}>
                        {a.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: "var(--text)", fontWeight: 700, lineHeight: 1.4 }}>{a.label}</div>
                        <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.detail}</div>
                        <div style={{ fontSize: 11, color: a.color, marginTop: 2, fontWeight: 600 }}>{a.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Quick Actions ─────────────────────────────── */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>⚡ Quick Actions</div>
            <div className="sd-quick-grid">
              {[
                { emoji: "➕", label: "Add Product",     to: "/seller/products/add",  color: "#a78bfa" },
                { emoji: "📦", label: "Manage Orders",   to: "/seller/orders",        color: "#38bdf8" },
                { emoji: "📥", label: "Procurement",     to: "/seller/procurement",   color: "#4ade80" },
                { emoji: "💰", label: "Revenue Report",  to: "/seller/revenue",       color: "#fb923c" },
                { emoji: "📈", label: "Analytics",       to: "/seller/analytics",     color: "#f472b6" },
                { emoji: "🚚", label: "Logistics",       to: "/seller/logistics",     color: "#fbbf24" },
                { emoji: "📊", label: "Market Trends",   to: "/seller/market-trends", color: "#94a3b8" },
                { emoji: "🤖", label: "AI Assistant",    to: "/seller/assistant",     color: "#c4b5fd" },
              ].map(q => (
                <Link key={q.label} to={q.to} className="sd-quick-link"
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${q.color}35`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; }}
                >
                  <span style={{ fontSize: 18 }}>{q.emoji}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{q.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
