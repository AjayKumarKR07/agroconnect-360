import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../../config/api";
import { DS_ADMIN, ROLE_COLOR, fmtINR, relativeTime } from "./adminStyles";

const ACTION_ICONS = {
  user_suspended: "🚫",
  user_activated: "✅",
  crop_deleted: "🗑️",
  order_status_changed: "📦",
  rfq_status_changed: "🚢",
  shipment_status_changed: "⛴️",
  dispute_resolved: "⚖️",
  dispute_rejected: "❌",
  dispute_under_review: "🔍",
  dispute_open: "📂",
  broadcast_sent: "📢",
};

const ENTITY_ROUTES = {
  user: "/admin/users",
  order: "/admin/orders",
  crop: "/admin/crops",
  rfq: "/admin/exports",
  shipment: "/admin/exports?tab=shipments",
  export: "/admin/exports",
  dispute: "/admin/disputes",
  broadcast: "/admin/broadcast",
  system: "/admin/system",
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Helper to calculate real trend from monthly growth arrays
const calculateTrend = (growthArray, valueKey = "count") => {
  if (!Array.isArray(growthArray) || growthArray.length < 2) {
    return { hasData: false, label: "— No previous data" };
  }
  const curr = Number(growthArray[growthArray.length - 1]?.[valueKey]) || 0;
  const prev = Number(growthArray[growthArray.length - 2]?.[valueKey]) || 0;

  if (prev === 0) {
    if (curr > 0) return { hasData: true, positive: true, label: `+${curr} this month` };
    return { hasData: false, label: "— No previous data" };
  }

  const diff = curr - prev;
  const pct = Math.round((diff / prev) * 100 * 10) / 10;
  if (pct > 0) return { hasData: true, positive: true, label: `↑ ${pct}% vs last mo.` };
  if (pct < 0) return { hasData: true, positive: false, label: `↓ ${Math.abs(pct)}% vs last mo.` };
  return { hasData: true, neutral: true, label: "— 0.0% vs last mo." };
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [growthMetric, setGrowthMetric] = useState("users"); // 'users' | 'orders' | 'gmv'
  const [hoveredMonth, setHoveredMonth] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTarget, setSearchTarget] = useState("users");
  const [bgError, setBgError] = useState(null); // non-blocking background refresh error
  const token = localStorage.getItem("agroconnect_token");
  const autoRefreshTimerRef = useRef(null);
  // Overlap-prevention guard: prevents a new silent refresh from starting
  // while a previous one is still in-flight.
  const isRefreshingRef = useRef(false);

  const load = useCallback(
    async (isSilent = false) => {
      // Prevent overlapping silent refreshes
      if (isSilent && isRefreshingRef.current) return;
      if (isSilent) {
        isRefreshingRef.current = true;
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      setBgError(null);
      try {
        const res = await fetch(`${API_URL}/api/admin/dashboard-overview`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const resData = await res.json();
        if (resData.success && resData.data) {
          setData(resData.data);
          setLastUpdated(new Date());
        } else {
          throw new Error(resData.message || "Failed to load platform control center data");
        }
      } catch (e) {
        if (isSilent) {
          // Don't hide existing data; show a small non-blocking banner instead
          setBgError("Background refresh failed. Data may be stale.");
        } else {
          setError(e.message || "Unable to connect to AgroConnect 360 Admin API");
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        if (isSilent) isRefreshingRef.current = false;
      }
    },
    [token]
  );

  // Initial load
  useEffect(() => {
    load();
  }, [load]);

  // Auto-refresh every 30 seconds (silent — overlap-guarded, non-blocking)
  useEffect(() => {
    autoRefreshTimerRef.current = setInterval(() => {
      load(true);
    }, 30000);

    return () => {
      if (autoRefreshTimerRef.current) clearInterval(autoRefreshTimerRef.current);
    };
  }, [load]);

  // Global Search Navigation
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    if (searchTarget === "users") {
      navigate(`/admin/users?search=${encodeURIComponent(query)}`);
    } else if (searchTarget === "orders") {
      navigate(`/admin/orders?search=${encodeURIComponent(query)}`);
    } else if (searchTarget === "crops") {
      navigate(`/admin/crops?search=${encodeURIComponent(query)}`);
    } else if (searchTarget === "disputes") {
      navigate(`/admin/disputes?status=all`);
    } else if (searchTarget === "exports") {
      navigate(`/admin/exports?status=all`);
    }
  };

  // Real Trends Calculation
  const userTrend = calculateTrend(data?.growth?.users, "count");
  const orderTrend = calculateTrend(data?.growth?.orders, "ordersCount");
  const gmvTrend = calculateTrend(data?.growth?.orders, "deliveredGmv");

  // Construct Prioritized Actions (URGENT -> ATTENTION -> NORMAL)
  const urgentActions = [];
  const attentionActions = [];
  const normalActions = [];

  if (data?.kpis) {
    const { kpis, exports, crops } = data;

    // 🚨 URGENT
    if (kpis.openDisputes > 0) {
      urgentActions.push({
        level: "URGENT",
        levelColor: "#f87171",
        emoji: "🚨",
        title: `${kpis.openDisputes} Open Dispute${kpis.openDisputes > 1 ? "s" : ""}`,
        desc: "Mediation required between buyer/seller or farmer.",
        to: "/admin/disputes?status=open",
        badge: "Requires Resolution",
      });
    }
    if (kpis.suspendedUsers > 0) {
      urgentActions.push({
        level: "URGENT",
        levelColor: "#f87171",
        emoji: "🚫",
        title: `${kpis.suspendedUsers} Suspended Account${kpis.suspendedUsers > 1 ? "s" : ""}`,
        desc: "Users locked pending administrative compliance review.",
        to: "/admin/users?status=suspended",
        badge: "Review Accounts",
      });
    }

    // ⚠️ ATTENTION
    if (kpis.pendingOrders > 0) {
      attentionActions.push({
        level: "ATTENTION",
        levelColor: "#fbbf24",
        emoji: "⚠️",
        title: `${kpis.pendingOrders} Pending Order${kpis.pendingOrders > 1 ? "s" : ""}`,
        desc: "Marketplace orders awaiting dispatch or farmer acceptance.",
        to: "/admin/orders?status=pending",
        badge: "Pending Processing",
      });
    }
    if (kpis.pendingRFQs > 0) {
      attentionActions.push({
        level: "ATTENTION",
        levelColor: "#fbbf24",
        emoji: "🚢",
        title: `${kpis.pendingRFQs} Pending Export RFQ${kpis.pendingRFQs > 1 ? "s" : ""}`,
        desc: "International export inquiries waiting for quotation review.",
        to: "/admin/exports?status=pending",
        badge: "Quotation Needed",
      });
    }
    if (exports?.interestsStatuses?.pending > 0) {
      attentionActions.push({
        level: "ATTENTION",
        levelColor: "#fbbf24",
        emoji: "🌍",
        title: `${exports.interestsStatuses.pending} Export Inquir${exports.interestsStatuses.pending > 1 ? "ies" : "y"}`,
        desc: "Foreign buyer interests awaiting farmer deal terms.",
        to: "/admin/exports",
        badge: "Trade Inquiries",
      });
    }

    // 📋 NORMAL
    if (crops?.statuses?.ready > 0) {
      normalActions.push({
        level: "NORMAL",
        levelColor: "#38bdf8",
        emoji: "🌾",
        title: `${crops.statuses.ready} Ready Crop Listing${crops.statuses.ready > 1 ? "s" : ""}`,
        desc: "Crops harvested and ready for marketplace catalog listing.",
        to: "/admin/crops?status=ready",
        badge: "Ready for Listing",
      });
    }
  }

  const allActions = [...urgentActions, ...attentionActions, ...normalActions];

  // Helper stats
  const totalOrders = data?.orders?.total || 0;
  const orderStatuses = data?.orders?.statuses || {};
  const getOrderPct = (count) => (totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0);

  const totalCrops = data?.crops?.total || 0;
  const cropStatuses = data?.crops?.statuses || {};
  const getCropPct = (count) => (totalCrops > 0 ? Math.round((count / totalCrops) * 100) : 0);

  const totalUsers = data?.users?.total || 0;
  const userRoles = data?.users?.roles || {};
  const getUserPct = (count) => (totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0);

  // Platform Growth rendering calculation (defensive access)
  const growthList = (() => {
    if (!data?.growth) return [];
    if (growthMetric === "users") {
      return (data.growth.users || []).map((u) => {
        const month = u?._id?.month;
        const year = u?._id?.year;
        const validDate = typeof month === "number" && month >= 1 && month <= 12 && year;
        const label = validDate ? `${MONTH_NAMES[month - 1]} ${year}` : "—";
        const val = typeof u?.count === "number" ? u.count : 0;
        return {
          month: month || 0,
          year: year || 0,
          label,
          value: val,
          display: `${val} users`,
        };
      });
    } else if (growthMetric === "orders") {
      return (data.growth.orders || []).map((o) => {
        const month = o?._id?.month;
        const year = o?._id?.year;
        const validDate = typeof month === "number" && month >= 1 && month <= 12 && year;
        const label = validDate ? `${MONTH_NAMES[month - 1]} ${year}` : "—";
        const val = typeof o?.ordersCount === "number" ? o.ordersCount : 0;
        return {
          month: month || 0,
          year: year || 0,
          label,
          value: val,
          display: `${val} orders`,
        };
      });
    } else {
      return (data.growth.orders || []).map((o) => {
        const month = o?._id?.month;
        const year = o?._id?.year;
        const validDate = typeof month === "number" && month >= 1 && month <= 12 && year;
        const label = validDate ? `${MONTH_NAMES[month - 1]} ${year}` : "—";
        const val = typeof o?.deliveredGmv === "number" ? o.deliveredGmv : 0;
        return {
          month: month || 0,
          year: year || 0,
          label,
          value: val,
          display: fmtINR(val),
        };
      });
    }
  })();

  const maxGrowthVal = growthList.length > 0 ? Math.max(...growthList.map((g) => g.value), 1) : 1;

  return (
    <>
      <style>{DS_ADMIN}</style>

      {/* ── Top Header & System Health Bar ── */}
      <div className="pg-head">
        <div>
          <div className="eyebrow">AgroConnect 360 — Platform Control Center V3</div>
          <h1 className="pg-title">⚡ Executive Command &amp; Operations</h1>
          <p className="pg-sub">
            Real-time platform telemetry across domestic marketplace, global exports, user lifecycle, and revenue.
          </p>
        </div>

        {/* Right side status & action buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {/* Live System Health Badge */}
          {data?.system ? (
            <Link
              to="/admin/system"
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                background: data.system.api === "operational" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                border: `1px solid ${data.system.api === "operational" ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
                borderRadius: 12,
                fontSize: 12,
                color: data.system.api === "operational" ? "#4ade80" : "#f87171",
                fontWeight: 700,
                transition: "all 0.2s",
              }}
              title="Click to view full System Health Dashboard"
            >
              <span style={{ fontSize: 10 }}>●</span>
              <span>{data.system.api === "operational" ? "API OPERATIONAL" : "API DEGRADED"}</span>
              <span style={{ color: "rgba(255,255,255,0.2)" }}>|</span>
              <span>{data.system.database === "connected" ? "DB CONNECTED" : "DB UNAVAILABLE"}</span>
              <span style={{ color: "rgba(255,255,255,0.2)" }}>|</span>
              <span style={{ color: "#a5b4fc" }}>{data.system.responseTimeMs} ms</span>
            </Link>
          ) : (
            <div style={{ fontSize: 12, color: "#a5b4fc" }}>● System health unavailable</div>
          )}

          {lastUpdated && (
            <div style={{ fontSize: 12, color: "#a5b4fc", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>
              {refreshing && <span className="spinner" style={{ width: 12, height: 12 }} />}
              <span>Last updated: {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          )}

          <button
            className="btn-indigo"
            onClick={() => load(false)}
            disabled={loading || refreshing}
            style={{ opacity: loading || refreshing ? 0.7 : 1 }}
          >
            {loading || refreshing ? <span className="spinner" style={{ width: 14, height: 14 }} /> : "🔄"} Refresh
          </button>
        </div>
      </div>

      {/* ── Global Quick Search & Module Switcher ── */}
      <div
        className="card"
        style={{
          marginBottom: 24,
          padding: "14px 18px",
          background: "rgba(99,102,241,0.03)",
          border: "1px solid rgba(99,102,241,0.12)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          {/* Quick jump search form */}
          <form onSubmit={handleSearchSubmit} style={{ display: "flex", alignItems: "center", gap: 8, flex: "1 1 340px", maxWidth: 540 }}>
            <select
              className="field-input"
              style={{ width: "auto", padding: "8px 12px", fontSize: 13, flexShrink: 0 }}
              value={searchTarget}
              onChange={(e) => setSearchTarget(e.target.value)}
            >
              <option value="users">👤 Users</option>
              <option value="orders">📦 Orders</option>
              <option value="crops">🌾 Crops</option>
              <option value="disputes">⚖️ Disputes</option>
              <option value="exports">🚢 Exports</option>
            </select>
            <input
              type="text"
              className="field-input"
              placeholder={`Search ${searchTarget} by name, ID, or keyword…`}
              style={{ padding: "8px 14px", fontSize: 13 }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="btn-indigo" style={{ padding: "8px 16px", fontSize: 13 }}>
              Search →
            </button>
          </form>

          {/* Quick Navigation Pills */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {[
              { label: "Users", to: "/admin/users", emoji: "👥" },
              { label: "Crops", to: "/admin/crops", emoji: "🌾" },
              { label: "Orders", to: "/admin/orders", emoji: "📦" },
              { label: "Exports", to: "/admin/exports", emoji: "🚢" },
              { label: "Finance", to: "/admin/finance", emoji: "💰" },
              { label: "Disputes", to: "/admin/disputes", emoji: "⚖️" },
              { label: "Broadcast", to: "/admin/broadcast", emoji: "📢" },
              { label: "Audit", to: "/admin/audit-logs", emoji: "📜" },
              { label: "System", to: "/admin/system", emoji: "⚡" },
              { label: "AI Models", to: "/admin/ai-models", emoji: "🤖" },
            ].map((nav) => (
              <Link
                key={nav.to}
                to={nav.to}
                className="tab-btn"
                style={{ textDecoration: "none", fontSize: 12, padding: "6px 11px" }}
              >
                <span>{nav.emoji}</span> {nav.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Loading Skeleton ── */}
      {loading && !data && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }} />
            ))}
          </div>
          <div className="skeleton" style={{ height: 90, borderRadius: 16 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div className="skeleton" style={{ height: 320, borderRadius: 16 }} />
            <div className="skeleton" style={{ height: 320, borderRadius: 16 }} />
          </div>
        </div>
      )}

      {/* ── Error State (initial load failure only) ── */}
      {!loading && error && (
        <div className="card error-state" style={{ marginBottom: 24 }}>
          <div className="error-state-icon">⚠️</div>
          <div className="error-state-msg">Unable to load platform control center data</div>
          <div className="error-state-sub">{error}</div>
          <button className="btn-indigo" onClick={() => load(false)}>
            🔄 Retry Connection
          </button>
        </div>
      )}

      {/* ── Background Refresh Error Banner (non-blocking, data still displayed) ── */}
      {bgError && data && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          padding: "10px 16px", marginBottom: 16, borderRadius: 12,
          background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)",
          color: "#fbbf24", fontSize: 13, fontWeight: 600,
        }}>
          <span>⚠️ {bgError}</span>
          <button
            onClick={() => { setBgError(null); load(true); }}
            style={{ background: "none", border: "none", color: "#fbbf24", cursor: "pointer", fontWeight: 800, fontSize: 13 }}
          >
            Retry ↺
          </button>
        </div>
      )}

      {/* ── Live Control Center Content ── */}
      {data && (
        <>
          {/* 1. PLATFORM OVERVIEW KPI ROW (6 Cards with Real Trends) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
              gap: 16,
              marginBottom: 24,
            }}
          >
            {[
              {
                emoji: "👥",
                label: "Total Users",
                val: data.kpis.totalUsers,
                trend: userTrend,
                sub: `${data.users.roles.farmer} Farmers · ${data.users.roles.user} Buyers`,
                color: "#818cf8",
                to: "/admin/users",
              },
              {
                emoji: "📦",
                label: "Domestic Orders",
                val: data.kpis.totalOrders,
                trend: orderTrend,
                sub: `${data.orders.statuses.delivered} Delivered · ${data.orders.statuses.pending} Pending`,
                color: "#a78bfa",
                to: "/admin/orders",
              },
              {
                emoji: "💎",
                label: "Delivered GMV",
                val: fmtINR(data.kpis.totalGmv),
                trend: gmvTrend,
                sub: `Est. Fee (2.5%): ${fmtINR(data.kpis.platformFeesEstimated)}`,
                color: "#4ade80",
                to: "/admin/finance",
              },
              {
                emoji: "🌾",
                label: "Total Crops",
                val: data.kpis.totalCrops,
                trend: { hasData: true, label: `${data.crops.statuses.listed} Listed for Sale` },
                sub: `${data.crops.statuses.growing} Growing in field`,
                color: "#fbbf24",
                to: "/admin/crops",
              },
              {
                emoji: "🌍",
                label: "Export Trades",
                val: data.kpis.totalExportDeals,
                trend: { hasData: true, label: `${data.exports.activeContracts || 0} Active Contracts` },
                sub: `${data.exports.rfqCount} RFQs · ${data.exports.activeShipments} Shipments`,
                color: "#fb923c",
                to: "/admin/exports",
              },
              {
                emoji: "⚖️",
                label: "Active Disputes",
                val: data.kpis.openDisputes,
                trend: { hasData: true, positive: data.kpis.openDisputes === 0, label: `${data.disputes.resolved || 0} Resolved Total` },
                sub: `${data.disputes.open} Open · ${data.disputes.underReview} In Review`,
                color: data.kpis.openDisputes > 0 ? "#f87171" : "#38bdf8",
                to: "/admin/disputes",
              },
            ].map((k) => (
              <Link
                key={k.label}
                to={k.to}
                style={{
                  textDecoration: "none",
                  display: "block",
                  transition: "transform 0.15s, border-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div className="card" style={{ height: "100%", boxSizing: "border-box" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <span style={{ fontSize: 22 }}>{k.emoji}</span>
                    <span style={{ fontSize: 11, color: "#818cf8", fontWeight: 700 }}>Open →</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#a5b4fc", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                    {k.label}
                  </div>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color: k.color }}>
                    {k.val}
                  </div>

                  {/* Real Trend Badge */}
                  <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: k.trend?.positive ? "#4ade80" : k.trend?.positive === false ? "#f87171" : "#a5b4fc" }}>
                    {k.trend?.label}
                  </div>

                  <div style={{ fontSize: 11, color: "#a5b4fc", marginTop: 4, lineHeight: 1.4 }}>
                    {k.sub}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* 2. PLATFORM HEALTH PIPELINE (Visual End-to-End Stepper) */}
          <div className="card" style={{ marginBottom: 24, padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
              <div>
                <div className="card-title">🔄 Platform Trade &amp; Lifecycle Pipeline</div>
                <div style={{ fontSize: 12, color: "#a5b4fc", marginTop: 2 }}>
                  Real-time end-to-end flow from agricultural production to international shipping
                </div>
              </div>
              <span style={{ fontSize: 11, color: "#818cf8", fontWeight: 700 }}>Click any stage to inspect →</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 8 }}>
              {[
                { emoji: "🌾", label: "Crops Listed", count: data.crops.total, to: "/admin/crops", color: "#818cf8" },
                { emoji: "📦", label: "Orders Placed", count: data.orders.total, to: "/admin/orders", color: "#a78bfa" },
                { emoji: "✅", label: "Delivered", count: data.orders.statuses.delivered || 0, to: "/admin/orders?status=delivered", color: "#4ade80" },
                { emoji: "🌍", label: "Export Inquiries", count: data.exports.interestsCount || 0, to: "/admin/exports", color: "#fbbf24" },
                { emoji: "🤝", label: "Confirmed Deals", count: data.kpis.totalExportDeals || 0, to: "/admin/exports", color: "#fb923c" },
                { emoji: "🚢", label: "Active Shipments", count: data.exports.activeShipments || 0, to: "/admin/exports?tab=shipments", color: "#38bdf8" },
              ].map((step, idx, arr) => (
                <Link
                  key={step.label}
                  to={step.to}
                  style={{
                    textDecoration: "none",
                    padding: "12px 14px",
                    background: "rgba(99,102,241,0.04)",
                    borderRadius: 12,
                    border: `1px solid ${step.color}25`,
                    textAlign: "center",
                    position: "relative",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${step.color}15`;
                    e.currentTarget.style.borderColor = step.color;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(99,102,241,0.04)";
                    e.currentTarget.style.borderColor = `${step.color}25`;
                  }}
                >
                  <div style={{ fontSize: 18, marginBottom: 2 }}>{step.emoji}</div>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 800, color: step.color }}>
                    {step.count}
                  </div>
                  <div style={{ fontSize: 11, color: "#a5b4fc", fontWeight: 600 }}>{step.label}</div>
                  {idx < arr.length - 1 && (
                    <div
                      style={{
                        position: "absolute",
                        right: -10,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#6366f1",
                        fontSize: 12,
                        zIndex: 2,
                        opacity: 0.6,
                      }}
                    >
                      ›
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* 3. ACTION REQUIRED — CONTROL CENTER (Urgent -> Attention -> Normal) */}
          <div
            className="card"
            style={{
              marginBottom: 24,
              borderColor: allActions.length > 0 ? "rgba(251,191,36,0.3)" : "rgba(34,197,94,0.2)",
              background: allActions.length > 0 ? "rgba(251,191,36,0.02)" : "rgba(34,197,94,0.02)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="card-title">🚨 Action Required — Operational Priority</span>
                {allActions.length > 0 && (
                  <span
                    style={{
                      fontSize: 11,
                      padding: "3px 9px",
                      borderRadius: 12,
                      background: "rgba(239,68,68,0.15)",
                      color: "#f87171",
                      fontWeight: 800,
                    }}
                  >
                    {allActions.length} Item{allActions.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <span style={{ fontSize: 12, color: "#a5b4fc" }}>Sorted by severity (Urgent → Attention → Normal)</span>
            </div>

            {allActions.length === 0 ? (
              <div
                style={{
                  padding: "16px 20px",
                  background: "rgba(34,197,94,0.06)",
                  border: "1px solid rgba(34,197,94,0.2)",
                  borderRadius: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 22 }}>✅</span>
                <div>
                  <div style={{ fontWeight: 800, color: "#4ade80", fontSize: 14 }}>
                    ✓ All clear
                  </div>
                  <div style={{ fontSize: 12, color: "#a5b4fc", marginTop: 2 }}>
                    No urgent administrative actions require attention. All marketplace orders, RFQs, and accounts are currently healthy.
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
                  gap: 12,
                }}
              >
                {allActions.map((act) => (
                  <Link
                    key={act.title}
                    to={act.to}
                    style={{
                      textDecoration: "none",
                      padding: "14px 16px",
                      background: "rgba(99,102,241,0.04)",
                      borderRadius: 14,
                      border: `1px solid ${act.levelColor}40`,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `${act.levelColor}12`;
                      e.currentTarget.style.borderColor = act.levelColor;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(99,102,241,0.04)";
                      e.currentTarget.style.borderColor = `${act.levelColor}40`;
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 18 }}>{act.emoji}</span>
                        <span
                          style={{
                            fontSize: 10,
                            padding: "2px 7px",
                            borderRadius: 6,
                            background: `${act.levelColor}20`,
                            color: act.levelColor,
                            fontWeight: 800,
                            letterSpacing: "0.05em",
                          }}
                        >
                          {act.level}
                        </span>
                      </div>
                      <div style={{ fontWeight: 800, color: "#fff", fontSize: 14, marginBottom: 4 }}>
                        {act.title}
                      </div>
                      <div style={{ fontSize: 12, color: "#a5b4fc", lineHeight: 1.4 }}>
                        {act.desc}
                      </div>
                    </div>
                    <div
                      style={{
                        marginTop: 12,
                        fontSize: 11,
                        color: act.levelColor,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <span>Take Action</span>
                      <span>→</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 4. TWO-COLUMN GRID: USER DISTRIBUTION & MARKETPLACE HEALTH */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 20, marginBottom: 24 }}>
            {/* Column 1: 👥 USER DISTRIBUTION */}
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div className="card-title">👥 User Distribution &amp; Roles</div>
                  <div style={{ fontSize: 12, color: "#a5b4fc", marginTop: 2 }}>
                    Total Registered: <strong style={{ color: "#fff" }}>{totalUsers}</strong>
                    {data.users.suspended > 0 && (
                      <span style={{ color: "#f87171", marginLeft: 8 }}>
                        ({data.users.suspended} suspended)
                      </span>
                    )}
                  </div>
                </div>
                <Link to="/admin/users" style={{ fontSize: 12, color: "#818cf8", textDecoration: "none", fontWeight: 700 }}>
                  Manage Users →
                </Link>
              </div>

              {/* Roles Breakdown Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(100px,1fr))", gap: 8, marginBottom: 16 }}>
                {[
                  { role: "farmer", label: "Farmers", count: userRoles.farmer || 0, color: ROLE_COLOR.farmer, emoji: "👨‍🌾" },
                  { role: "user", label: "Buyers", count: userRoles.user || 0, color: ROLE_COLOR.user, emoji: "🛒" },
                  { role: "seller", label: "Sellers", count: userRoles.seller || 0, color: ROLE_COLOR.seller, emoji: "🏪" },
                  { role: "exporter", label: "Exporters", count: userRoles.exporter || 0, color: ROLE_COLOR.exporter, emoji: "🌐" },
                  { role: "admin", label: "Admins", count: userRoles.admin || 0, color: ROLE_COLOR.admin, emoji: "🛡️" },
                ].map((r) => (
                  <Link
                    key={r.role}
                    to={`/admin/users?role=${r.role}`}
                    style={{
                      textDecoration: "none",
                      padding: "10px 8px",
                      background: `${r.color}0a`,
                      border: `1px solid ${r.color}25`,
                      borderRadius: 12,
                      textAlign: "center",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `${r.color}1a`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = `${r.color}0a`;
                    }}
                    title={`Click to filter users by ${r.label}`}
                  >
                    <div style={{ fontSize: 18, marginBottom: 2 }}>{r.emoji}</div>
                    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 800, color: r.color }}>
                      {r.count}
                    </div>
                    <div style={{ fontSize: 11, color: "#a5b4fc", fontWeight: 600 }}>{r.label}</div>
                    <div style={{ fontSize: 10, color: r.color, marginTop: 2 }}>{getUserPct(r.count)}%</div>
                  </Link>
                ))}
              </div>

              {/* Progress bar of role distribution */}
              <div style={{ height: 6, background: "rgba(99,102,241,0.1)", borderRadius: 4, overflow: "hidden", display: "flex", marginBottom: 16 }}>
                {[
                  { role: "farmer", count: userRoles.farmer || 0, color: ROLE_COLOR.farmer },
                  { role: "user", count: userRoles.user || 0, color: ROLE_COLOR.user },
                  { role: "seller", count: userRoles.seller || 0, color: ROLE_COLOR.seller },
                  { role: "exporter", count: userRoles.exporter || 0, color: ROLE_COLOR.exporter },
                  { role: "admin", count: userRoles.admin || 0, color: ROLE_COLOR.admin },
                ].map((r) => (
                  <div
                    key={r.role}
                    style={{
                      width: `${getUserPct(r.count)}%`,
                      background: r.color,
                      height: "100%",
                      transition: "width 0.4s",
                    }}
                    title={`${r.role}: ${r.count} (${getUserPct(r.count)}%)`}
                  />
                ))}
              </div>

              {/* Recent Signups */}
              <div style={{ fontSize: 12, fontWeight: 700, color: "#c7d2fe", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Recent User Registrations
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(data.users.recent || []).length === 0 ? (
                  <div className="empty-state" style={{ padding: "16px 0" }}>
                    <div className="empty-state-msg" style={{ fontSize: 13 }}>No users registered yet</div>
                  </div>
                ) : (
                  (data.users.recent || []).map((u) => (
                    <div
                      key={u._id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 12px",
                        background: "rgba(99,102,241,0.03)",
                        borderRadius: 10,
                        border: "1px solid rgba(99,102,241,0.08)",
                        gap: 10,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 700, color: "#fff", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {u.name || "Unnamed"}
                          </span>
                          <span
                            style={{
                              fontSize: 9,
                              padding: "1px 6px",
                              borderRadius: 4,
                              background: `${ROLE_COLOR[u.role] || "#818cf8"}20`,
                              color: ROLE_COLOR[u.role] || "#818cf8",
                              fontWeight: 800,
                              textTransform: "uppercase",
                            }}
                          >
                            {u.role}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: "#a5b4fc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {u.email}
                        </div>
                      </div>
                      <div style={{ fontSize: 10, color: "#a5b4fc", textAlign: "right", flexShrink: 0 }}>
                        {relativeTime(u.createdAt)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Column 2: 📦 MARKETPLACE HEALTH (Orders & Crops Pipelines) */}
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div className="card-title">📦 Marketplace Health &amp; Pipeline</div>
                  <div style={{ fontSize: 12, color: "#a5b4fc", marginTop: 2 }}>
                    Real fulfillment rates across Orders and Crop listings
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Link to="/admin/orders" style={{ fontSize: 12, color: "#818cf8", textDecoration: "none", fontWeight: 700 }}>
                    Orders →
                  </Link>
                  <Link to="/admin/crops" style={{ fontSize: 12, color: "#818cf8", textDecoration: "none", fontWeight: 700 }}>
                    Crops →
                  </Link>
                </div>
              </div>

              {/* Domestic Orders Pipeline */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                    Domestic Order Lifecycle ({totalOrders} Total)
                  </span>
                  <span style={{ fontSize: 12, color: "#4ade80", fontWeight: 700 }}>
                    {getOrderPct(orderStatuses.delivered || 0)}% Fulfillment
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(80px,1fr))", gap: 6, marginBottom: 8 }}>
                  {[
                    { key: "pending", label: "Pending", count: orderStatuses.pending || 0, color: "#fbbf24" },
                    { key: "accepted", label: "Accepted", count: orderStatuses.accepted || 0, color: "#38bdf8" },
                    { key: "processing", label: "Processing", count: orderStatuses.processing || 0, color: "#818cf8" },
                    { key: "shipped", label: "Shipped", count: orderStatuses.shipped || 0, color: "#a78bfa" },
                    { key: "delivered", label: "Delivered", count: orderStatuses.delivered || 0, color: "#4ade80" },
                    { key: "cancelled", label: "Cancelled", count: (orderStatuses.cancelled || 0) + (orderStatuses.rejected || 0), color: "#f87171" },
                  ].map((st) => (
                    <Link
                      key={st.key}
                      to={`/admin/orders?status=${st.key}`}
                      style={{
                        textDecoration: "none",
                        padding: "8px 6px",
                        background: `${st.color}0a`,
                        border: `1px solid ${st.color}25`,
                        borderRadius: 10,
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 15, fontWeight: 800, color: st.color }}>
                        {st.count}
                      </div>
                      <div style={{ fontSize: 10, color: "#a5b4fc" }}>{st.label}</div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Crop Catalog Lifecycle */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                    Crop Catalog Status ({totalCrops} Total)
                  </span>
                  <span style={{ fontSize: 12, color: "#fbbf24", fontWeight: 700 }}>
                    {data.crops.exportCount || 0} Export Listings
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(80px,1fr))", gap: 6 }}>
                  {[
                    { key: "growing", label: "Growing", count: cropStatuses.growing || 0, color: "#4ade80" },
                    { key: "ready", label: "Ready", count: cropStatuses.ready || 0, color: "#fbbf24" },
                    { key: "listed", label: "Listed", count: cropStatuses.listed || 0, color: "#818cf8" },
                    { key: "sold", label: "Sold", count: cropStatuses.sold || 0, color: "#38bdf8" },
                  ].map((cs) => (
                    <Link
                      key={cs.key}
                      to={`/admin/crops?status=${cs.key}`}
                      style={{
                        textDecoration: "none",
                        padding: "8px 6px",
                        background: `${cs.color}0a`,
                        border: `1px solid ${cs.color}25`,
                        borderRadius: 10,
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 15, fontWeight: 800, color: cs.color }}>
                        {cs.count}
                      </div>
                      <div style={{ fontSize: 10, color: "#a5b4fc" }}>{cs.label}</div>
                      <div style={{ fontSize: 9, color: cs.color, marginTop: 2 }}>{getCropPct(cs.count)}%</div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 5. TWO-COLUMN LOWER GRID: PLATFORM GROWTH & EXPORT/DISPUTES ACTIVITY */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 20, marginBottom: 24 }}>
            {/* Column 1: 📈 PLATFORM GROWTH WITH HOVER TOOLTIPS */}
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div className="card-title">📈 Platform Growth &amp; Trajectory</div>
                  <div style={{ fontSize: 12, color: "#a5b4fc", marginTop: 2 }}>
                    Real 6-month historical trends from MongoDB
                  </div>
                </div>
                {/* Metric Selector Tabs */}
                <div style={{ display: "flex", gap: 4 }}>
                  {[
                    { id: "users", label: "Users" },
                    { id: "orders", label: "Orders" },
                    { id: "gmv", label: "GMV" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      className={`tab-btn ${growthMetric === tab.id ? "active" : ""}`}
                      onClick={() => setGrowthMetric(tab.id)}
                      style={{ padding: "4px 10px", fontSize: 11 }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {growthList.length === 0 ? (
                <div className="empty-state" style={{ padding: "30px 0" }}>
                  <div className="empty-state-icon">📈</div>
                  <div className="empty-state-msg" style={{ fontSize: 14 }}>Not enough historical data</div>
                  <div className="empty-state-sub">Growth charts will render once platform transactions span multiple months.</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "8px 0" }}>
                  {growthList.map((item, idx) => {
                    const pct = Math.max(8, Math.min(100, Math.round((item.value / maxGrowthVal) * 100)));
                    const isHovered = hoveredMonth === `${item.label}-${idx}`;
                    return (
                      <div
                        key={`${item.label}-${idx}`}
                        style={{ display: "flex", alignItems: "center", gap: 12, position: "relative", cursor: "pointer" }}
                        onMouseEnter={() => setHoveredMonth(`${item.label}-${idx}`)}
                        onMouseLeave={() => setHoveredMonth(null)}
                      >
                        <div style={{ width: 72, fontSize: 11, color: isHovered ? "#fff" : "#a5b4fc", flexShrink: 0, fontWeight: 600 }}>
                          {item.label}
                        </div>
                        <div style={{ flex: 1, background: "rgba(99,102,241,0.08)", borderRadius: 6, height: 22, overflow: "hidden", position: "relative" }}>
                          <div
                            style={{
                              width: `${pct}%`,
                              height: "100%",
                              background:
                                growthMetric === "gmv"
                                  ? "linear-gradient(90deg,#059669,#10b981)"
                                  : growthMetric === "orders"
                                  ? "linear-gradient(90deg,#7c3aed,#a78bfa)"
                                  : "linear-gradient(90deg,#4f46e5,#6366f1)",
                              borderRadius: 6,
                              transition: "width 0.4s",
                            }}
                          />
                        </div>
                        <div style={{ width: 90, fontSize: 11, fontWeight: 700, color: "#fff", textAlign: "right", flexShrink: 0 }}>
                          {item.display}
                        </div>

                        {/* Hover Tooltip */}
                        {isHovered && (
                          <div
                            style={{
                              position: "absolute",
                              left: "50%",
                              bottom: "100%",
                              transform: "translateX(-50%)",
                              padding: "4px 10px",
                              background: "#0c0f24",
                              border: "1px solid #6366f1",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#fff",
                              whiteSpace: "nowrap",
                              zIndex: 10,
                              boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                            }}
                          >
                            {item.label}: <span style={{ color: "#4ade80" }}>{item.display}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Column 2: 🌍 EXPORT & DISPUTE HEALTH PANELS */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Export Marketplace Health Card */}
              <div className="card" style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <div className="card-title">🌍 Export Marketplace &amp; Trade</div>
                    <div style={{ fontSize: 11, color: "#a5b4fc", marginTop: 2 }}>
                      Cross-border transactions &amp; logistics
                    </div>
                  </div>
                  <Link to="/admin/exports" style={{ fontSize: 12, color: "#818cf8", textDecoration: "none", fontWeight: 700 }}>
                    Export Hub →
                  </Link>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(95px,1fr))", gap: 8 }}>
                  {[
                    { label: "Listings", count: data.exports.listingsCount ?? "—", color: "#fbbf24", to: "/admin/crops" },
                    { label: "RFQs", count: data.exports.rfqCount ?? "—", color: "#38bdf8", to: "/admin/exports" },
                    { label: "Inquiries", count: data.exports.interestsCount ?? "—", color: "#4ade80", to: "/admin/exports" },
                    { label: "Shipments", count: data.exports.activeShipments ?? "—", color: "#a78bfa", to: "/admin/exports?tab=shipments" },
                    { label: "Contracts", count: data.exports.activeContracts ?? "—", color: "#fb923c", to: "/admin/exports" },
                  ].map((ex) => (
                    <Link
                      key={ex.label}
                      to={ex.to}
                      style={{
                        textDecoration: "none",
                        padding: "8px",
                        background: "rgba(99,102,241,0.05)",
                        borderRadius: 10,
                        border: "1px solid rgba(99,102,241,0.12)",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 16, fontWeight: 800, color: ex.color }}>
                        {ex.count}
                      </div>
                      <div style={{ fontSize: 10, color: "#a5b4fc", marginTop: 2 }}>{ex.label}</div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Dispute Health Panel */}
              <div className="card" style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <div className="card-title">⚖️ Dispute Resolution Health</div>
                    <div style={{ fontSize: 11, color: "#a5b4fc", marginTop: 2 }}>
                      {data.disputes.total || 0} Total mediation cases
                    </div>
                  </div>
                  <Link to="/admin/disputes" style={{ fontSize: 12, color: "#818cf8", textDecoration: "none", fontWeight: 700 }}>
                    Mediation Center →
                  </Link>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(70px,1fr))", gap: 8 }}>
                  {[
                    { label: "Open", count: data.disputes.open || 0, color: "#f87171", to: "/admin/disputes?status=open" },
                    { label: "In Review", count: data.disputes.underReview || 0, color: "#fbbf24", to: "/admin/disputes?status=under_review" },
                    { label: "Resolved", count: data.disputes.resolved || 0, color: "#4ade80", to: "/admin/disputes?status=resolved" },
                    { label: "Rejected", count: data.disputes.rejected || 0, color: "#a5b4fc", to: "/admin/disputes?status=rejected" },
                  ].map((dp) => (
                    <Link
                      key={dp.label}
                      to={dp.to}
                      style={{
                        textDecoration: "none",
                        padding: "8px 6px",
                        background: `${dp.color}0a`,
                        borderRadius: 10,
                        border: `1px solid ${dp.color}25`,
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 15, fontWeight: 800, color: dp.color }}>
                        {dp.count}
                      </div>
                      <div style={{ fontSize: 10, color: "#a5b4fc", marginTop: 2 }}>{dp.label}</div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 6. RECENT ADMIN ACTIVITY (Clickable Audit Trail) */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div className="card-title">📜 Recent Administrative Activity</div>
                <div style={{ fontSize: 12, color: "#a5b4fc", marginTop: 2 }}>
                  Real-time security and moderation audit trail from MongoDB (Click any entry to view module)
                </div>
              </div>
              <Link to="/admin/audit-logs" style={{ fontSize: 12, color: "#818cf8", textDecoration: "none", fontWeight: 700 }}>
                View Full Audit Trail ({data.activity?.length || 0}) →
              </Link>
            </div>

            {(data.activity || []).length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📜</div>
                <div className="empty-state-msg">No admin actions recorded yet</div>
                <div className="empty-state-sub">Administrative actions across users, orders, and moderation will appear here automatically.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(data.activity || []).map((log) => {
                  const targetRoute = ENTITY_ROUTES[log.entityType] || "/admin/audit-logs";
                  return (
                    <Link
                      key={log._id}
                      to={targetRoute}
                      style={{
                        textDecoration: "none",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        padding: "10px 14px",
                        background: "rgba(99,102,241,0.03)",
                        borderRadius: 12,
                        border: "1px solid rgba(99,102,241,0.08)",
                        gap: 12,
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(99,102,241,0.08)";
                        e.currentTarget.style.borderColor = "rgba(99,102,241,0.25)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(99,102,241,0.03)";
                        e.currentTarget.style.borderColor = "rgba(99,102,241,0.08)";
                      }}
                      title={`Click to open ${log.entityType || "audit"} module`}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 18, flexShrink: 0 }}>
                          {ACTION_ICONS[log.action] || "⚙️"}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: "#fff", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {log.description}
                          </div>
                          <div style={{ fontSize: 11, color: "#a5b4fc", marginTop: 1 }}>
                            by <strong style={{ color: "#c7d2fe" }}>{log.admin?.name || "Admin"}</strong>
                            {log.entityType && (
                              <span style={{ marginLeft: 6, fontSize: 10, padding: "1px 6px", borderRadius: 4, background: "rgba(99,102,241,0.12)", color: "#818cf8" }}>
                                {log.entityType}
                              </span>
                            )}
                            {log.entityId && (
                              <span style={{ marginLeft: 6, fontSize: 10, color: "#6366f1", fontFamily: "monospace" }}>
                                ID: …{String(log.entityId).slice(-6)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: "#a5b4fc", flexShrink: 0, textAlign: "right" }}>
                        {relativeTime(log.createdAt)}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
