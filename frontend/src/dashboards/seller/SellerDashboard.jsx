import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../../config/api";
import { DS } from "../../styles/ds";

/* ═══════════════════════════════════════════════════════════
   CONSTANTS & HELPERS
═══════════════════════════════════════════════════════════ */

// Low-stock thresholds in KG (normalized)
const STOCK_CRITICAL_KG = 20;
const STOCK_LOW_KG      = 50;

const toKg = (qty, unit) => {
  if (unit === "quintal") return qty * 100;
  if (unit === "ton")     return qty * 1000;
  return qty; // kg
};

const stockTier = (qty, unit) => {
  const kg = toKg(qty || 0, unit);
  if (kg === 0)               return "out";
  if (kg < STOCK_CRITICAL_KG) return "critical";
  if (kg <= STOCK_LOW_KG)     return "low";
  return "ok";
};

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

const na = (v) => (v == null || v === "" ? "Not available" : String(v));

const fmtAddr = (addr) => {
  if (!addr) return "Not available";
  if (typeof addr === "string") return addr || "Not available";
  return [addr.address, addr.city, addr.state, addr.pincode].filter(Boolean).join(", ") || "Not available";
};

/* ═══════════════════════════════════════════════════════════
   SKELETON
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
              <rect x={x} y={y} width={barW} height={barH} rx={3}
                fill={isLast ? "url(#barGrad)" : "rgba(167,139,250,0.25)"} />
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
   ORDER DETAILS MODAL
═══════════════════════════════════════════════════════════ */
const PIPELINE_STEPS = ["pending", "accepted", "shipped", "delivered"];

function OrderDetailsModal({ order, onClose }) {
  if (!order) return null;
  const status = order.status || "pending";
  const stColor = STATUS_COLOR[status] || "#94a3b8";
  const isTerminal = ["rejected", "cancelled"].includes(status);
  const curStep = PIPELINE_STEPS.indexOf(status);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
        zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20, backdropFilter: "blur(10px)",
      }}
    >
      <div style={{
        background: "#0b0a1f", border: "1px solid rgba(167,139,250,0.2)",
        borderRadius: 24, padding: 28, width: "100%", maxWidth: 520,
        maxHeight: "90vh", overflowY: "auto",
        animation: "fadeIn 0.25s ease",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 800, color: "#fff" }}>
              📋 Order Details
            </div>
            <div style={{ fontSize: 11, color: "var(--text2)", fontFamily: "monospace", marginTop: 4 }}>
              {String(order._id)}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8,
            padding: "6px 10px", color: "var(--text2)", cursor: "pointer", fontSize: 16,
          }}>✕</button>
        </div>

        {/* Status badge */}
        <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            padding: "6px 14px", borderRadius: 10,
            background: `${stColor}18`, color: stColor,
            fontWeight: 800, fontSize: 13, border: `1px solid ${stColor}30`,
          }}>
            {STATUS_LABEL[status] || status}
          </span>
          <span style={{ fontSize: 11, color: "var(--text2)" }}>{relTime(order.createdAt)}</span>
        </div>

        {/* Pipeline (positive) or terminal state */}
        {!isTerminal && (
          <div style={{ display: "flex", alignItems: "center", marginBottom: 22 }}>
            {["Order Placed", "Accepted", "Shipped", "Delivered"].map((label, idx) => (
              <div key={label} style={{ display: "flex", alignItems: "center", flex: idx < 3 ? 1 : 0 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: idx <= curStep
                      ? "linear-gradient(135deg,#7c3aed,#a78bfa)"
                      : "var(--surface)",
                    border: idx <= curStep ? "none" : "2px solid rgba(167,139,250,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, color: "#fff", fontWeight: 700,
                    boxShadow: idx === curStep ? "0 0 10px rgba(167,139,250,0.5)" : "none",
                  }}>
                    {idx < curStep ? "✓" : ""}
                  </div>
                  <div style={{
                    fontSize: 9, color: idx <= curStep ? "#a78bfa" : "var(--text2)",
                    marginTop: 4, whiteSpace: "nowrap", fontWeight: idx === curStep ? 700 : 400,
                  }}>{label}</div>
                </div>
                {idx < 3 && (
                  <div style={{
                    flex: 1, height: 2, marginBottom: 14,
                    background: idx < curStep
                      ? "linear-gradient(90deg,#7c3aed,#a78bfa)"
                      : "rgba(167,139,250,0.1)",
                  }} />
                )}
              </div>
            ))}
          </div>
        )}
        {isTerminal && (
          <div style={{
            padding: "12px 16px", borderRadius: 12,
            background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)",
            color: "#f87171", fontSize: 13, fontWeight: 600, marginBottom: 20,
          }}>
            ❌ Order {status} — no further action needed.
          </div>
        )}

        {/* Details grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          {[
            { section: "CROP", label: "Crop Name", value: na(order.cropName) },
            { section: "CROP", label: "Quantity", value: `${na(order.quantity)} ${order.unit || "kg"}` },
            { section: "CROP", label: "Price/Unit", value: order.price ? `${fmtINR(order.price)}/${order.unit || "kg"}` : "Not available" },
            { section: "CROP", label: "Subtotal", value: fmtINR(order.totalPrice || order.subtotal) },
            { section: "FARMER", label: "Farmer", value: na(order.farmerName) },
            { section: "FARMER", label: "Farmer Email", value: na(order.farmerEmail) },
            { section: "PAYMENT", label: "Payment", value: (order.paymentMethod || "cod").toUpperCase() },
            { section: "PAYMENT", label: "Order Date", value: order.createdAt ? new Date(order.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Not available" },
          ].map(r => (
            <div key={r.label} style={{
              background: "var(--surface)", borderRadius: 10, padding: "10px 12px",
              border: "1px solid var(--border)",
            }}>
              <div style={{ fontSize: 10, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{r.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginTop: 3, wordBreak: "break-word" }}>{r.value}</div>
            </div>
          ))}
        </div>

        {/* Delivery address */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", marginBottom: 10 }}>
          <div style={{ fontSize: 10, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>📍 Delivery Address</div>
          <div style={{ fontSize: 13, color: "#fff", lineHeight: 1.6 }}>{fmtAddr(order.deliveryAddress)}</div>
        </div>

        <button onClick={onClose} style={{
          width: "100%", marginTop: 14, padding: "12px",
          background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)",
          borderRadius: 12, color: "#a78bfa", fontWeight: 700, fontSize: 14,
          cursor: "pointer", fontFamily: "'Inter',sans-serif",
        }}>Close</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   EXTRA CSS
═══════════════════════════════════════════════════════════ */
const EXTRA = `
  @keyframes sklShimmer { 0% { background-position:200% 0 } 100% { background-position:-200% 0 } }
  @keyframes spin        { to { transform:rotate(360deg); } }
  @keyframes fadeIn      { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }

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

  .sd-order-row { display:flex; justify-content:space-between; align-items:center; padding:11px 14px; background:var(--surface); border-radius:12px; border:1px solid var(--border); cursor:pointer; transition:border-color 0.2s, background 0.2s; flex-wrap:wrap; gap:8px; }
  .sd-order-row:hover { border-color:rgba(167,139,250,0.2); background:rgba(167,139,250,0.04); }

  .sd-quick-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:10px; }
  .sd-quick-link { padding:13px 14px; background:var(--surface); border-radius:13px; border:1px solid var(--border); display:flex; align-items:center; gap:10px; text-decoration:none; transition:border-color 0.2s,background 0.2s; }
  .sd-quick-link:hover { border-color:rgba(167,139,250,0.25); background:rgba(167,139,250,0.04); }

  .sd-stock-row { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border-radius:11px; gap:8px; flex-wrap:wrap; }
  .sd-stock-out      { background:rgba(239,68,68,0.07); border:1px solid rgba(239,68,68,0.15); }
  .sd-stock-critical { background:rgba(251,146,60,0.07); border:1px solid rgba(251,146,60,0.15); }
  .sd-stock-low      { background:rgba(251,191,36,0.05); border:1px solid rgba(251,191,36,0.12); }

  .sd-supplier-table { width:100%; border-collapse:collapse; }
  .sd-supplier-table th { text-align:left; font-size:11px; font-weight:700; color:var(--text2); text-transform:uppercase; letter-spacing:0.06em; padding:0 12px 10px; border-bottom:1px solid var(--border); }
  .sd-supplier-table td { padding:11px 12px; font-size:13px; color:var(--text); border-bottom:1px solid var(--border); }
  .sd-supplier-table tr:last-child td { border-bottom:none; }
  .sd-supplier-table tbody tr:hover { background:rgba(167,139,250,0.03); }

  .mkt-row { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:var(--surface); border-radius:11px; border:1px solid var(--border); flex-wrap:wrap; gap:8px; }

  @media(max-width:900px){
    .sd-grid4  { grid-template-columns:1fr 1fr; }
    .sd-grid2  { grid-template-columns:1fr; }
    .sd-grid3  { grid-template-columns:1fr 1fr; }
    .sd-pipe-stages { grid-template-columns:repeat(3,1fr); }
  }
  @media(max-width:560px){
    .sd-grid4  { grid-template-columns:1fr 1fr; gap:10px; }
    .sd-grid3  { grid-template-columns:1fr 1fr; }
    .sd-pipe-stages { grid-template-columns:repeat(2,1fr); }
    .sd-quick-grid  { grid-template-columns:1fr 1fr; }
    .sd-supplier-table td, .sd-supplier-table th { padding:8px 8px; font-size:12px; }
  }
`;

/* ═══════════════════════════════════════════════════════════
   AUTO-REFRESH INTERVAL
═══════════════════════════════════════════════════════════ */
const AUTO_REFRESH_MS = 30_000;

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function SellerDashboard() {
  const user = JSON.parse(localStorage.getItem("agroconnect_user") || "{}");

  // ─── State ───────────────────────────────────────────────
  const [stats,        setStats]        = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [allOrders,    setAllOrders]    = useState([]);
  const [products,     setProducts]     = useState([]);
  const [revenue,      setRevenue]      = useState(null);
  const [marketData,   setMarketData]   = useState(null); // commodityAverage from /api/prices/market-trends
  const [loading,      setLoading]      = useState(true);
  const [errors,       setErrors]       = useState({});
  const [refreshing,   setRefreshing]   = useState(false);
  const [lastUpdated,  setLastUpdated]  = useState(null);
  const [modalOrder,   setModalOrder]   = useState(null);
  const loadRef = useRef(0);
  const timerRef = useRef(null);

  // ─── Fetch all data ───────────────────────────────────────
  const load = useCallback(async (isRefresh = false) => {
    const tick = ++loadRef.current;
    if (isRefresh) setRefreshing(true);
    else           setLoading(true);
    setErrors({});

    const errs = {};

    // Parallel fetch — all sections fail independently
    const [dashRes, ordersRes, productsRes, revenueRes, mktRes] = await Promise.allSettled([
      fetch(`${API_URL}/api/seller/dashboard-stats`,  { headers: authH() }),
      fetch(`${API_URL}/api/orders/seller`,            { headers: authH() }),
      fetch(`${API_URL}/api/seller/products`,          { headers: authH() }),
      fetch(`${API_URL}/api/seller/revenue`,           { headers: authH() }),
      fetch(`${API_URL}/api/prices/market-trends`,     { headers: authH() }),
    ]);

    if (tick !== loadRef.current) return; // stale

    // Dashboard stats
    if (dashRes.status === "fulfilled") {
      try {
        const d = await dashRes.value.json();
        if (d.success) { setStats(d.stats || {}); setRecentOrders(d.recentOrders || []); }
        else errs.dash = d.message || "Dashboard data unavailable";
      } catch { errs.dash = "Failed to parse dashboard data"; }
    } else { errs.dash = "Network error loading dashboard"; }

    // All orders (for pipeline + supplier overview)
    if (ordersRes.status === "fulfilled") {
      try {
        const d = await ordersRes.value.json();
        if (d.success) setAllOrders(d.orders || []);
        else errs.orders = d.message || "Orders unavailable";
      } catch { errs.orders = "Failed to parse orders"; }
    } else { errs.orders = "Network error loading orders"; }

    // Products (for low-stock)
    if (productsRes.status === "fulfilled") {
      try {
        const d = await productsRes.value.json();
        if (d.success) setProducts(d.products || []);
        else errs.products = d.message || "Products unavailable";
      } catch { errs.products = "Failed to parse products"; }
    } else { errs.products = "Network error loading products"; }

    // Revenue (for sales chart)
    if (revenueRes.status === "fulfilled") {
      try {
        const d = await revenueRes.value.json();
        if (d.success) setRevenue(d);
        else errs.revenue = d.message || "Revenue data unavailable";
      } catch { errs.revenue = "Failed to parse revenue"; }
    } else { errs.revenue = "Network error loading revenue"; }

    // Market trends (optional — ok if unavailable)
    if (mktRes.status === "fulfilled") {
      try {
        const d = await mktRes.value.json();
        if (d.success && d.commodityAverage) {
          // Build a map: lowercase(commodity) -> averagePrice
          const map = {};
          (d.commodityAverage || []).forEach(c => {
            if (c._id) map[c._id.toLowerCase()] = c.averagePrice;
          });
          setMarketData(map);
        }
      } catch { /* market data is optional */ }
    }

    setErrors(errs);
    setLastUpdated(new Date());
    setLoading(false);
    setRefreshing(false);
  }, []);

  // Mount + 30s auto-refresh
  useEffect(() => {
    load(false);
    timerRef.current = setInterval(() => load(false), AUTO_REFRESH_MS);
    return () => clearInterval(timerRef.current);
  }, [load]);

  /* ─── Computed values ────────────────────────────────── */

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
    rejected:   allOrders.filter(o => o.status === "rejected").length,
    cancelled:  allOrders.filter(o => o.status === "cancelled").length,
  };
  const pipelineTotal = Object.values(pipeline).reduce((s, n) => s + n, 0);

  // Stock classification
  const outOfStock     = products.filter(p => p.stock != null && p.unit && stockTier(p.stock, p.unit) === "out" && p.status !== "sold");
  const criticalStock  = products.filter(p => p.stock != null && p.unit && stockTier(p.stock, p.unit) === "critical" && p.status !== "sold");
  const lowStock       = products.filter(p => p.stock != null && p.unit && stockTier(p.stock, p.unit) === "low" && p.status !== "sold");

  // ── Supplier Overview — computed from allOrders ──────────
  const supplierMap = {};
  allOrders.forEach(o => {
    const name = o.farmerName || "Farmer";
    if (!supplierMap[name]) {
      supplierMap[name] = { orders: 0, delivered: 0, pending: 0, value: 0 };
    }
    supplierMap[name].orders++;
    supplierMap[name].value += o.totalPrice || o.subtotal || 0;
    if (o.status === "delivered") supplierMap[name].delivered++;
    if (o.status === "pending")   supplierMap[name].pending++;
  });
  const topSuppliers = Object.entries(supplierMap)
    .map(([name, d]) => ({ name, ...d }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const farmersSourcedFrom = Object.keys(supplierMap).length;
  const activeSuppliers = Object.values(supplierMap).filter(s => s.orders > 0 && s.delivered < s.orders).length;
  const totalProcurement = allOrders.reduce((s, o) => s + (o.totalPrice || o.subtotal || 0), 0);

  // ── Procurement Analytics ────────────────────────────────
  const cropProcurementMap = {};
  allOrders.forEach(o => {
    const name = (o.cropName || "Product").toLowerCase();
    if (!cropProcurementMap[name]) cropProcurementMap[name] = { display: o.cropName, value: 0, qty: 0, price: o.price || 0 };
    cropProcurementMap[name].value += o.totalPrice || o.subtotal || 0;
    cropProcurementMap[name].qty   += o.quantity || 0;
  });
  const topCropByValue = Object.values(cropProcurementMap).sort((a, b) => b.value - a.value)[0];
  const avgOrderVal = revenue?.avgOrderValue ?? (
    allOrders.length > 0 ? Math.round(totalProcurement / allOrders.length) : 0
  );

  // ── Market Price Comparison ──────────────────────────────
  // For each crop the seller has procured, compare avg purchase price vs market price
  const marketComparisons = Object.entries(cropProcurementMap).map(([key, data]) => {
    const avgPurchase = data.qty > 0 ? data.value / data.qty : data.price;
    const marketPrice = marketData?.[key] ?? marketData?.[data.display?.toLowerCase()];
    return {
      crop: data.display || key,
      avgPurchase,
      marketPrice: marketPrice || null,
      diff: marketPrice ? marketPrice - avgPurchase : null,
    };
  }).filter(c => c.avgPurchase > 0).slice(0, 5);

  // ── Action Required ──────────────────────────────────────
  const actionItems = [];
  if (stats) {
    if (outOfStock.length > 0) actionItems.push({
      urgency: "red",
      icon: "🚫",
      text: `${outOfStock.length} product${outOfStock.length !== 1 ? "s" : ""} out of stock`,
      link: "/seller/products",
      linkLabel: "Restock →",
    });
    if (pipeline.pending > 0) actionItems.push({
      urgency: "red",
      icon: "📦",
      text: `${pipeline.pending} order${pipeline.pending !== 1 ? "s" : ""} pending — awaiting farmer response`,
      link: "/seller/orders",
      linkLabel: "Review Orders →",
    });
    if (pipeline.accepted > 0) actionItems.push({
      urgency: "amber",
      icon: "✅",
      text: `${pipeline.accepted} accepted order${pipeline.accepted !== 1 ? "s" : ""} in progress`,
      link: "/seller/orders",
      linkLabel: "Track Orders →",
    });
    if (pipeline.shipped > 0) actionItems.push({
      urgency: "blue",
      icon: "🚚",
      text: `${pipeline.shipped} shipment${pipeline.shipped !== 1 ? "s" : ""} in transit`,
      link: "/seller/logistics",
      linkLabel: "Track Shipments →",
    });
    if (criticalStock.length > 0) actionItems.push({
      urgency: "amber",
      icon: "⚠️",
      text: `${criticalStock.length} product${criticalStock.length !== 1 ? "s" : ""} critically low (< ${STOCK_CRITICAL_KG} kg)`,
      link: "/seller/products",
      linkLabel: "Update Products →",
    });
    if (lowStock.length > 0) actionItems.push({
      urgency: "amber",
      icon: "📉",
      text: `${lowStock.length} product${lowStock.length !== 1 ? "s" : ""} running low on stock`,
      link: "/seller/products",
      linkLabel: "Manage Inventory →",
    });
    if (stats.activeProducts === 0 && products.length === 0) actionItems.push({
      urgency: "green",
      icon: "🛍️",
      text: "No products listed yet — add your first product to start selling",
      link: "/seller/products/add",
      linkLabel: "Add Product →",
    });
  }

  const urgencyBorder = { red: "rgba(239,68,68,0.2)", amber: "rgba(251,191,36,0.15)", blue: "rgba(56,189,248,0.15)", green: "rgba(167,139,250,0.15)" };
  const urgencyDot    = { red: "#f87171", amber: "#fbbf24", blue: "#38bdf8", green: "#a78bfa" };

  // ── Recent activity from allOrders (newest first, max 8) ──
  const activities = [...allOrders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8)
    .map(o => ({
      icon: STATUS_LABEL[o.status]?.split(" ")[0] || "📋",
      label: o.status === "pending"    ? "Order sent to farmer"
           : o.status === "accepted"   ? "Farmer accepted order"
           : o.status === "processing" ? "Order being packed"
           : o.status === "shipped"    ? "Order shipped"
           : o.status === "delivered"  ? "Order delivered"
           : o.status === "rejected"   ? "Farmer rejected order"
           : o.status === "cancelled"  ? "Order cancelled"
           : "Order updated",
      detail: `${o.cropName || "Product"} · ${o.quantity} ${o.unit || "kg"} · ${o.farmerName || "Farmer"}`,
      time: relTime(o.createdAt),
      color: STATUS_COLOR[o.status] || "#94a3b8",
      order: o,
    }));

  // KPI
  const deliveredCount = pipeline.delivered;
  const totalRevDisplay = totalProcurement > 0 ? totalProcurement : (stats?.totalRevenue ?? 0);

  /* ═══════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════ */
  return (
    <>
      <style>{DS + EXTRA}</style>

      {/* Order Details Modal */}
      {modalOrder && <OrderDetailsModal order={modalOrder} onClose={() => setModalOrder(null)} />}

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="pg-head">
        <div>
          <div className="eyebrow">Seller Dashboard</div>
          <h1 className="pg-title">{greeting()}, {user.name?.split(" ")[0] || "Seller"} 👋</h1>
          <p className="pg-sub" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            Your procurement & business control center.
            {lastUpdated && (
              <span style={{ fontSize: 11, color: "var(--text2)", background: "var(--surface)", padding: "2px 10px", borderRadius: 20, border: "1px solid var(--border)" }}>
                Updated {relTime(lastUpdated)}
              </span>
            )}
            <span style={{ fontSize: 11, color: "var(--text2)", background: "var(--surface)", padding: "2px 10px", borderRadius: 20, border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block", boxShadow: "0 0 6px #4ade80" }} />
              Auto-refreshes every 30s
            </span>
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

      {/* ── Global error ─────────────────────────────────── */}
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

      {/* ── Skeleton ─────────────────────────────────────── */}
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

      {/* ── Content ──────────────────────────────────────── */}
      {!loading && (
        <>
          {/* ── KPI Cards ─────────────────────────────────── */}
          <div className="sd-grid4">
            {[
              {
                emoji: "💰", label: "Total Procurement", sub: "accepted + shipped + delivered",
                value: fmtINR(totalRevDisplay), color: "#4ade80",
                link: "/seller/revenue", small: true,
              },
              {
                emoji: "📦", label: "Total Orders", sub: "→ View all orders",
                value: stats?.totalOrders ?? allOrders.length,
                color: "#38bdf8", link: "/seller/orders",
              },
              {
                emoji: "🎉", label: "Delivered", sub: "completed orders",
                value: deliveredCount,
                color: "#4ade80", link: "/seller/orders",
              },
              {
                emoji: "⏳", label: "Pending", sub: "awaiting farmer",
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
                  <div className="sd-kpi-val" style={{ color: s.color, fontSize: s.small ? 20 : 26, wordBreak: "break-word" }}>{s.value}</div>
                  <div className="sd-kpi-sub">{s.sub}</div>
                </div>
              </Link>
            ))}
          </div>

          {/* ── Action Required ─────────────────────────── */}
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
                {/* Rejected / Cancelled indicators */}
                {(pipeline.rejected > 0 || pipeline.cancelled > 0) && (
                  <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
                    {pipeline.rejected > 0 && (
                      <span style={{ fontSize: 12, color: "#f87171", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", padding: "4px 10px", borderRadius: 8, fontWeight: 700 }}>
                        ❌ {pipeline.rejected} Rejected
                      </span>
                    )}
                    {pipeline.cancelled > 0 && (
                      <span style={{ fontSize: 12, color: "#f87171", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", padding: "4px 10px", borderRadius: 8, fontWeight: 700 }}>
                        🚫 {pipeline.cancelled} Cancelled
                      </span>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state" style={{ padding: "20px" }}>
                <div className="empty-emoji">📦</div>
                <div className="empty-title">No orders yet</div>
                <div className="empty-sub">Your order pipeline will appear here as you place procurement orders.</div>
                <Link to="/seller/procurement" className="btn-green" style={{ background: "linear-gradient(135deg,#7c3aed,#a78bfa)", marginTop: 12, display: "inline-flex" }}>
                  🛒 Browse Farmer Produce
                </Link>
              </div>
            )}
          </div>

          {/* ── Supplier Overview + Procurement Analytics ─── */}
          <div className="sd-grid2">
            {/* 🌾 Supplier Overview */}
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                <div className="card-title">🌾 Supplier Overview</div>
                <Link to="/seller/procurement" style={{ fontSize: 12, color: "#a78bfa", textDecoration: "none", fontWeight: 700 }}>Browse Produce →</Link>
              </div>

              {errors.orders && (
                <div style={{ color: "#f87171", fontSize: 13, padding: "8px 0" }}>⚠️ Unable to load order data.</div>
              )}

              {!errors.orders && allOrders.length === 0 && (
                <div className="empty-state" style={{ padding: "24px" }}>
                  <div className="empty-emoji">🌾</div>
                  <div className="empty-title">No suppliers yet</div>
                  <div className="empty-sub">Farmer suppliers will appear once you place procurement orders.</div>
                </div>
              )}

              {!errors.orders && allOrders.length > 0 && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                    {[
                      { label: "Farmers Sourced", value: farmersSourcedFrom, color: "#a78bfa" },
                      { label: "Active Suppliers", value: activeSuppliers,   color: "#38bdf8" },
                      { label: "Total Spend",      value: fmtINR(totalProcurement), color: "#4ade80", small: true },
                    ].map(m => (
                      <div key={m.label} style={{ background: "rgba(167,139,250,0.04)", border: "1px solid var(--border)", borderRadius: 12, padding: "10px 12px" }}>
                        <div style={{ fontSize: 10, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{m.label}</div>
                        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: m.small ? 14 : 20, fontWeight: 800, color: m.color, marginTop: 4, wordBreak: "break-word" }}>{m.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Top Suppliers mini-list */}
                  {topSuppliers.slice(0, 4).map((s, i) => (
                    <div key={s.name + i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 3 ? "1px solid var(--border)" : "none", gap: 8, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,rgba(124,58,237,0.2),rgba(167,139,250,0.1))", border: "1px solid rgba(167,139,250,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#a78bfa", fontWeight: 800, flexShrink: 0 }}>
                          {i + 1}
                        </div>
                        <div style={{ fontSize: 13, color: "#fff", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#4ade80" }}>{fmtINR(s.value)}</div>
                        <div style={{ fontSize: 10, color: "var(--text2)" }}>{s.orders} order{s.orders !== 1 ? "s" : ""}</div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* 📊 Procurement Analytics */}
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                <div className="card-title">📊 Procurement Analytics</div>
                <Link to="/seller/analytics" style={{ fontSize: 12, color: "#a78bfa", textDecoration: "none", fontWeight: 700 }}>Full Analytics →</Link>
              </div>

              {allOrders.length === 0 && (
                <div style={{ color: "var(--text2)", fontSize: 13, padding: "16px 0", textAlign: "center" }}>
                  No procurement data yet. Start by placing orders from the Procurement page.
                </div>
              )}

              {allOrders.length > 0 && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                    {[
                      { label: "Total Spend",      value: fmtINR(totalProcurement), color: "#4ade80" },
                      { label: "Total Orders",     value: allOrders.length,         color: "#38bdf8" },
                      { label: "Avg Order Value",  value: avgOrderVal ? fmtINR(avgOrderVal) : "—", color: "#a78bfa" },
                      { label: "Top Crop",         value: topCropByValue?.display || "—",     color: "#fb923c" },
                    ].map(m => (
                      <div key={m.label} style={{ background: "rgba(167,139,250,0.04)", border: "1px solid var(--border)", borderRadius: 12, padding: "10px 12px" }}>
                        <div style={{ fontSize: 10, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{m.label}</div>
                        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 14, fontWeight: 800, color: m.color, marginTop: 4, wordBreak: "break-word" }}>{m.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Top crops by spend */}
                  {Object.values(cropProcurementMap).sort((a, b) => b.value - a.value).slice(0, 4).map((c, i) => {
                    const pct = totalProcurement > 0 ? (c.value / totalProcurement * 100) : 0;
                    return (
                      <div key={c.display + i} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>{c.display}</span>
                          <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 700 }}>{fmtINR(c.value)}</span>
                        </div>
                        <div style={{ height: 5, borderRadius: 4, background: "rgba(167,139,250,0.1)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: "linear-gradient(90deg,#7c3aed,#a78bfa)", borderRadius: 4, transition: "width 0.6s ease" }} />
                        </div>
                        <div style={{ fontSize: 10, color: "var(--text2)", marginTop: 2 }}>{pct.toFixed(1)}% of total spend</div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          {/* ── Sales Performance + Recent Orders ──────────── */}
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
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                    {[
                      { label: "Revenue",   value: fmtINR(revenue.totalRevenue), color: "#4ade80" },
                      { label: "Orders",    value: revenue.totalOrders,           color: "#38bdf8" },
                      { label: "Avg Order", value: revenue.avgOrderValue ? fmtINR(revenue.avgOrderValue) : "—", color: "#a78bfa" },
                    ].map(m => (
                      <div key={m.label} style={{ background: "rgba(167,139,250,0.04)", border: "1px solid var(--border)", borderRadius: 12, padding: "10px 12px" }}>
                        <div style={{ fontSize: 10, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{m.label}</div>
                        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 16, fontWeight: 800, color: m.color, marginTop: 4, wordBreak: "break-word" }}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginBottom: 4 }}>
                    <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Monthly Revenue</div>
                    <MiniBarChart monthly={revenue.monthly} />
                  </div>
                </>
              )}

              {!errors.revenue && !revenue && (
                <div style={{ color: "var(--text2)", fontSize: 13, padding: "24px 0", textAlign: "center" }}>
                  Revenue data not available. Data appears once orders are accepted or delivered.
                </div>
              )}
            </div>

            {/* 🕐 Recent Orders */}
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                <div className="card-title">🕐 Recent Orders</div>
                <Link to="/seller/orders" style={{ fontSize: 12, color: "#a78bfa", textDecoration: "none", fontWeight: 700 }}>View All →</Link>
              </div>

              {allOrders.length === 0 ? (
                <div className="empty-state" style={{ padding: "24px" }}>
                  <div className="empty-emoji">📦</div>
                  <div className="empty-title">No orders yet</div>
                  <div className="empty-sub">Place a bulk order from the Procurement page.</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {allOrders.slice(0, 5).map((o, i) => {
                    const stColor = STATUS_COLOR[o.status] || "#94a3b8";
                    return (
                      <div
                        key={(o._id || "") + i}
                        className="sd-order-row"
                        onClick={() => setModalOrder(o)}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: "#fff", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {o.cropName || "Product"}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>
                            {o.quantity} {o.unit || "kg"} · {o.farmerName || "Farmer"} · {relTime(o.createdAt)}
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontWeight: 800, color: "#4ade80", fontSize: 13 }}>{fmtINR(o.totalPrice)}</div>
                          <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 6, background: `${stColor}15`, color: stColor, fontWeight: 700, whiteSpace: "nowrap" }}>
                            {o.status || "pending"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ textAlign: "center", marginTop: 4, fontSize: 11, color: "var(--text2)" }}>
                    Click any row to see full details
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Top Suppliers Table ─────────────────────────── */}
          {topSuppliers.length > 0 && (
            <div className="card" style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                <div className="card-title">🏆 Top Farmer Suppliers</div>
                <span style={{ fontSize: 11, color: "var(--text2)" }}>Sorted by procurement value</span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="sd-supplier-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Farmer</th>
                      <th>Orders</th>
                      <th>Delivered</th>
                      <th>Pending</th>
                      <th>Procurement Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSuppliers.map((s, i) => (
                      <tr key={s.name + i}>
                        <td style={{ color: "var(--text2)", width: 28 }}>{i + 1}</td>
                        <td>
                          <div style={{ fontWeight: 700, color: "#fff" }}>{s.name}</div>
                        </td>
                        <td>
                          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 15, fontWeight: 800, color: "#38bdf8" }}>{s.orders}</span>
                        </td>
                        <td>
                          <span style={{ color: "#4ade80", fontWeight: 700 }}>{s.delivered}</span>
                        </td>
                        <td>
                          <span style={{ color: s.pending > 0 ? "#fbbf24" : "var(--text2)", fontWeight: s.pending > 0 ? 700 : 400 }}>
                            {s.pending > 0 ? s.pending : "—"}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 14, fontWeight: 800, color: "#4ade80" }}>{fmtINR(s.value)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Market Price Comparison ─────────────────────── */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
              <div className="card-title">📊 Procurement vs Market Price</div>
              <Link to="/seller/market-trends" style={{ fontSize: 12, color: "#a78bfa", textDecoration: "none", fontWeight: 700 }}>Market Trends →</Link>
            </div>

            {marketComparisons.length === 0 && (
              <div style={{ color: "var(--text2)", fontSize: 13, padding: "12px 0" }}>
                No procured crops to compare yet. Place procurement orders first.
              </div>
            )}

            {marketComparisons.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {marketComparisons.map((c, i) => (
                  <div key={c.crop + i} className="mkt-row">
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: "#fff", fontSize: 13 }}>{c.crop}</div>
                      <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>
                        Avg purchase: <span style={{ color: "#fff", fontWeight: 600 }}>{fmtINR(Math.round(c.avgPurchase))}/unit</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      {c.marketPrice != null ? (
                        <>
                          <div style={{ fontSize: 13, color: "var(--text2)" }}>
                            Market: <span style={{ color: "#fff", fontWeight: 700 }}>{fmtINR(Math.round(c.marketPrice))}</span>
                          </div>
                          <div style={{
                            fontSize: 12, fontWeight: 800, marginTop: 2,
                            color: c.diff > 0 ? "#4ade80" : c.diff < 0 ? "#f87171" : "var(--text2)",
                          }}>
                            {c.diff > 0 ? `+${fmtINR(Math.round(c.diff))} cheaper` : c.diff < 0 ? `${fmtINR(Math.round(Math.abs(c.diff)))} above market` : "At market price"}
                          </div>
                        </>
                      ) : (
                        <div style={{ fontSize: 11, color: "var(--text2)" }}>Market price unavailable</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Low Stock Alerts (3-tier) + Recent Activity ── */}
          <div className="sd-grid2">
            {/* ⚠️ Stock Alerts */}
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                <div className="card-title">⚠️ Stock Alerts</div>
                <Link to="/seller/products" style={{ fontSize: 12, color: "#a78bfa", textDecoration: "none", fontWeight: 700 }}>All Products →</Link>
              </div>

              {errors.products && (
                <div style={{ color: "#f87171", fontSize: 13, padding: "8px 0" }}>⚠️ Unable to load product data.</div>
              )}

              {!errors.products && outOfStock.length === 0 && criticalStock.length === 0 && lowStock.length === 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#4ade80", fontSize: 13, padding: "8px 0" }}>
                  <span style={{ fontSize: 18 }}>✓</span>
                  {products.length === 0
                    ? "No products listed yet."
                    : `All ${products.length} products have healthy stock.`}
                </div>
              )}

              {!errors.products && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {/* Out of Stock */}
                  {outOfStock.slice(0, 3).map(p => (
                    <Link key={p._id} to={`/seller/products/${p._id}/edit`} className="sd-stock-row sd-stock-out" style={{ textDecoration: "none" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: "#fff", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                        <span style={{ fontSize: 10, color: "#f87171", fontWeight: 800 }}>🔴 OUT OF STOCK</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#a78bfa", fontWeight: 600 }}>Restock →</div>
                    </Link>
                  ))}
                  {/* Critical Stock */}
                  {criticalStock.slice(0, 3).map(p => (
                    <Link key={p._id} to={`/seller/products/${p._id}/edit`} className="sd-stock-row sd-stock-critical" style={{ textDecoration: "none" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: "#fff", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: "#fb923c" }}>
                          🟠 Critical: {p.stock} {p.unit} ({toKg(p.stock, p.unit)} kg)
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: "#a78bfa", fontWeight: 600 }}>Update →</div>
                    </Link>
                  ))}
                  {/* Low Stock */}
                  {lowStock.slice(0, 3).map(p => (
                    <Link key={p._id} to={`/seller/products/${p._id}/edit`} className="sd-stock-row sd-stock-low" style={{ textDecoration: "none" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: "#fff", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: "#fbbf24" }}>
                          🟡 Low: {p.stock} {p.unit} ({toKg(p.stock, p.unit)} kg)
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: "#a78bfa", fontWeight: 600 }}>Update →</div>
                    </Link>
                  ))}

                  {(outOfStock.length + criticalStock.length + lowStock.length) > 9 && (
                    <Link to="/seller/products" style={{ fontSize: 12, color: "#a78bfa", textAlign: "center", textDecoration: "none", paddingTop: 4, fontWeight: 700 }}>
                      View all alerts →
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* 🕐 Recent Procurement Activity */}
            <div className="card">
              <div className="card-title" style={{ marginBottom: 16 }}>🕐 Recent Procurement Activity</div>
              {activities.length === 0 ? (
                <div className="empty-state" style={{ padding: "24px" }}>
                  <div className="empty-emoji">🕐</div>
                  <div className="empty-title">No recent activity</div>
                  <div className="empty-sub">Activity will appear as you place and track procurement orders.</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {activities.map((a, i) => (
                    <div
                      key={i}
                      style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}
                      onClick={() => setModalOrder(a.order)}
                    >
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
                      <div style={{ fontSize: 10, color: "var(--text2)", flexShrink: 0 }}>details →</div>
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
                { emoji: "🛒", label: "Procure Produce",  to: "/seller/procurement",   color: "#4ade80" },
                { emoji: "📦", label: "Manage Orders",    to: "/seller/orders",        color: "#38bdf8" },
                { emoji: "🛍️", label: "My Products",     to: "/seller/products",      color: "#a78bfa" },
                { emoji: "➕", label: "Add Product",      to: "/seller/products/add",  color: "#c4b5fd" },
                { emoji: "💰", label: "Revenue Report",   to: "/seller/revenue",       color: "#fb923c" },
                { emoji: "📈", label: "Analytics",        to: "/seller/analytics",     color: "#f472b6" },
                { emoji: "🚚", label: "Logistics",        to: "/seller/logistics",     color: "#fbbf24" },
                { emoji: "📊", label: "Market Trends",    to: "/seller/market-trends", color: "#94a3b8" },
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
