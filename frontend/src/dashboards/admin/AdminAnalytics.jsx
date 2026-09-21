import { useState, useEffect, useCallback } from "react";
import { API_URL } from "../../config/api";
import { DS_ADMIN, ROLE_COLOR, fmtINR, relativeTime } from "./adminStyles";
import {
  BarChart3, Users, Package, ShoppingCart,
  TrendingUp, TrendingDown, Minus, RefreshCw,
  Wheat, Store, Ship, DollarSign, AlertTriangle
} from "lucide-react";

const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("agroconnect_token")}` });

function StatCard({ icon: Icon, iconColor, label, value, sub, subPositive }) {
  return (
    <div className="card" style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div style={{ fontSize:12, fontWeight:600, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.05em" }}>{label}</div>
        <div style={{ width:36, height:36, borderRadius:10, background:iconColor+"18", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Icon size={17} color={iconColor} />
        </div>
      </div>
      <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:28, fontWeight:800, color:"#0f172a", lineHeight:1 }}>{value}</div>
      {sub && (
        <div style={{ fontSize:12, color: subPositive === true ? "#16a34a" : subPositive === false ? "#dc2626" : "#64748b", display:"flex", alignItems:"center", gap:4 }}>
          {subPositive === true && <TrendingUp size={12} />}
          {subPositive === false && <TrendingDown size={12} />}
          {subPositive === null && <Minus size={12} />}
          {sub}
        </div>
      )}
    </div>
  );
}

function MiniBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
      <div style={{ width:100, fontSize:12, color:"#475569", fontWeight:500, flexShrink:0 }}>{label}</div>
      <div style={{ flex:1, height:8, borderRadius:4, background:"#f1f5f9", overflow:"hidden" }}>
        <div style={{ width:`${pct}%`, height:"100%", borderRadius:4, background:color, transition:"width 0.6s ease" }} />
      </div>
      <div style={{ width:36, fontSize:12, fontWeight:700, color:"#0f172a", textAlign:"right" }}>{value}</div>
    </div>
  );
}

export default function AdminAnalytics() {
  const [data, setData]     = useState(null);
  const [loading, setLoad]  = useState(true);
  const [err, setErr]       = useState("");

  const load = useCallback(async () => {
    setLoad(true); setErr("");
    try {
      const [statsR, overviewR] = await Promise.all([
        fetch(`${API_URL}/api/admin/stats`,             { headers: authH() }),
        fetch(`${API_URL}/api/admin/dashboard-overview`,{ headers: authH() }),
      ]);
      const stats    = await statsR.json();
      const overview = await overviewR.json();
      if (stats.success && overview.success) {
        setData({ stats: stats.data || stats, overview: overview.data || overview });
      } else {
        setErr("Failed to load analytics data.");
      }
    } catch { setErr("Network error loading analytics."); }
    finally { setLoad(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <>
      <style>{DS_ADMIN}</style>
      <div className="loading-wrap" style={{ height:300 }}><div className="spinner" /><span>Loading analytics…</span></div>
    </>
  );

  if (err) return (
    <>
      <style>{DS_ADMIN}</style>
      <div className="pg-head"><div><div className="eyebrow">Platform Intelligence</div><h1 className="pg-title">Analytics</h1></div></div>
      <div style={{ padding:"12px 16px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, color:"#dc2626", display:"flex", gap:8, alignItems:"center", fontSize:13 }}>
        <AlertTriangle size={14} />{err}
        <button className="btn-indigo" style={{ marginLeft:"auto", fontSize:12, padding:"6px 12px" }} onClick={load}><RefreshCw size={12} /> Retry</button>
      </div>
    </>
  );

  const s  = data?.stats    || {};
  const ov = data?.overview || {};

  const roleData = [
    { label:"Farmers",   value: s.farmers   || ov.farmers   || 0, color: ROLE_COLOR.farmer   },
    { label:"Sellers",   value: s.sellers   || ov.sellers   || 0, color: ROLE_COLOR.user     },
    { label:"Buyers",    value: s.buyers    || ov.buyers    || 0, color: "#0284c7"            },
    { label:"Exporters", value: s.exporters || ov.exporters || 0, color: ROLE_COLOR.exporter  },
    { label:"Admins",    value: s.admins    || ov.admins    || 0, color: ROLE_COLOR.admin     },
  ];
  const maxRole = Math.max(...roleData.map(r => r.value), 1);

  const orderBreakdown = [
    { label:"Pending",   value: s.pendingOrders  || 0, color:"#f59e0b" },
    { label:"Completed", value: s.deliveredOrders|| 0, color:"#16a34a" },
    { label:"Cancelled", value: s.cancelledOrders|| 0, color:"#dc2626" },
    { label:"Processing",value: (s.totalOrders||0) - (s.pendingOrders||0) - (s.deliveredOrders||0) - (s.cancelledOrders||0), color:"#0284c7" },
  ].filter(o => o.value > 0);
  const maxOrder = Math.max(...orderBreakdown.map(o => o.value), 1);

  return (
    <>
      <style>{DS_ADMIN}</style>

      {/* Header */}
      <div className="pg-head">
        <div>
          <div className="eyebrow">Platform Intelligence</div>
          <h1 className="pg-title" style={{ display:"flex", alignItems:"center", gap:8 }}>
            <BarChart3 size={22} color="#4f46e5" />Analytics Overview
          </h1>
          <p className="pg-sub">Real-time platform metrics and growth indicators.</p>
        </div>
        <button className="btn-indigo" onClick={load} style={{ display:"inline-flex", alignItems:"center", gap:6 }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* KPI Grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:16, marginBottom:24 }}>
        <StatCard icon={Users}        iconColor="#4f46e5" label="Total Users"   value={s.totalUsers   || ov.totalUsers   || 0}       sub={`${s.suspendedUsers||0} suspended`} subPositive={null} />
        <StatCard icon={Wheat}        iconColor="#16a34a" label="Crop Listings" value={s.totalCrops   || 0}                           sub={`${s.listedCrops||0} active`}      subPositive={null} />
        <StatCard icon={ShoppingCart} iconColor="#0284c7" label="Total Orders"  value={s.totalOrders  || ov.totalOrders  || 0}        sub={`${s.pendingOrders||0} pending`}   subPositive={null} />
        <StatCard icon={DollarSign}   iconColor="#d97706" label="Revenue (INR)"  value={fmtINR(s.totalRevenue || ov.totalRevenue || 0)} sub="Platform earnings"                 subPositive={null} />
        <StatCard icon={Ship}         iconColor="#7c3aed" label="Shipments"     value={s.shipmentCount|| 0}                           sub={`${s.rfqCount||0} RFQs`}           subPositive={null} />
        <StatCard icon={Package}      iconColor="#dc2626" label="Open Disputes" value={s.openDisputes || ov.openDisputes  || 0}        sub="Requiring attention"               subPositive={s.openDisputes > 0 ? false : null} />
      </div>

      {/* Charts Row */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
        {/* User Breakdown */}
        <div className="card">
          <div style={{ marginBottom:16 }}>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:16, fontWeight:700, color:"#0f172a" }}>User Breakdown</div>
            <div style={{ fontSize:12, color:"#64748b" }}>Distribution by role</div>
          </div>
          {roleData.map(r => <MiniBar key={r.label} label={r.label} value={r.value} max={maxRole} color={r.color} />)}
        </div>

        {/* Order Status */}
        <div className="card">
          <div style={{ marginBottom:16 }}>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:16, fontWeight:700, color:"#0f172a" }}>Order Status</div>
            <div style={{ fontSize:12, color:"#64748b" }}>Breakdown by status</div>
          </div>
          {orderBreakdown.length > 0
            ? orderBreakdown.map(o => <MiniBar key={o.label} label={o.label} value={o.value} max={maxOrder} color={o.color} />)
            : <div style={{ color:"#94a3b8", fontSize:13 }}>No order data available.</div>
          }
        </div>
      </div>

      {/* Monthly user growth if available */}
      {Array.isArray(ov.userGrowth) && ov.userGrowth.length > 0 && (
        <div className="card">
          <div style={{ marginBottom:16 }}>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:16, fontWeight:700, color:"#0f172a" }}>Monthly New Users</div>
            <div style={{ fontSize:12, color:"#64748b" }}>Last {ov.userGrowth.length} months</div>
          </div>
          <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:120 }}>
            {ov.userGrowth.map((m, i) => {
              const maxVal = Math.max(...ov.userGrowth.map(x => x.count||0), 1);
              const h = Math.round(((m.count||0) / maxVal) * 100);
              return (
                <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                  <div style={{ fontSize:10, color:"#64748b", fontWeight:600 }}>{m.count||0}</div>
                  <div style={{ width:"100%", height:`${h}%`, minHeight:4, borderRadius:4, background:"#4f46e5", opacity:i===ov.userGrowth.length-1?1:0.55 }} />
                  <div style={{ fontSize:10, color:"#94a3b8" }}>{m.month||""}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Platform Snapshot */}
      <div className="card" style={{ marginTop:20 }}>
        <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:16, fontWeight:700, color:"#0f172a", marginBottom:16 }}>Platform Snapshot</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:16 }}>
          {[
            { label:"Verified Farmers",   value: s.farmers        || 0 },
            { label:"Active Sellers",      value: s.sellers        || 0 },
            { label:"Registered Buyers",   value: s.buyers         || 0 },
            { label:"Exporters",           value: s.exporters      || 0 },
            { label:"Active Crop Listings",value: s.listedCrops    || 0 },
            { label:"Total RFQs",          value: s.rfqCount       || 0 },
            { label:"Pending RFQs",        value: s.pendingRFQs    || 0 },
            { label:"Total Shipments",     value: s.shipmentCount  || 0 },
          ].map(item => (
            <div key={item.label} style={{ padding:"12px 16px", borderRadius:10, background:"#f8fafc", border:"1px solid #e2e8f0" }}>
              <div style={{ fontSize:11, color:"#64748b", fontWeight:600, marginBottom:4 }}>{item.label}</div>
              <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:20, fontWeight:800, color:"#0f172a" }}>{item.value.toLocaleString("en-IN")}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}