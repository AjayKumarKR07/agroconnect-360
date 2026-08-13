import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../../config/api";
import { DS } from "../../styles/ds";

export default function FarmerDashboard() {
  const user = JSON.parse(localStorage.getItem("agroconnect_user") || "{}");

  const [stats, setStats] = useState({ totalCrops: 0, activeCrops: 0, totalOrders: 0, pendingOrders: 0, totalIncome: 0 });
  const [exportStats, setExportStats] = useState({ listingCount: 0, pendingInterests: 0, unreadInterests: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("agroconnect_token");
    const h = { Authorization: `Bearer ${token}` };
    fetch(`${API_URL}/api/orders/farmer/dashboard-stats`, { headers: h })
      .then((r) => r.json())
      .then((d) => { if (d.stats) setStats(d.stats); else setError(d.message || "Failed to load"); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    // Load export stats silently (non-blocking)
    fetch(`${API_URL}/api/export/stats`, { headers: h })
      .then(r => r.json())
      .then(d => { if (d.success) setExportStats(d); })
      .catch(() => {});
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const statCards = [
    { emoji: "🌿", label: "Active Crops",    value: stats.activeCrops,    color: "#22c55e", glow: "#22c55e", link: "/farmer/crops" },
    { emoji: "📦", label: "Total Orders",    value: stats.totalOrders,    color: "#38bdf8", glow: "#38bdf8", link: "/farmer/orders" },
    { emoji: "💰", label: "Total Income",    value: `₹${Number(stats.totalIncome||0).toLocaleString("en-IN")}`, color: "#fbbf24", glow: "#fbbf24", link: "/farmer/income" },
    { emoji: "🌾", label: "Products Listed", value: stats.totalCrops,     color: "#a78bfa", glow: "#a78bfa", link: "/farmer/crops" },
  ];

  const quickLinks = [
    { emoji: "➕", label: "Add New Crop",          to: "/farmer/crops/add",            color: "#22c55e" },
    { emoji: "🌍", label: "Export Produce",         to: "/farmer/export",               color: "#38bdf8" },
    { emoji: "🌾", label: "Smart Farm Planner",    to: "/farmer/smart-farm-planner",   color: "#16a34a" },
    { emoji: "🔬", label: "Check Crop Disease",    to: "/farmer/disease-detection",    color: "#a78bfa" },
    { emoji: "📈", label: "Price Prediction",      to: "/farmer/price-prediction",     color: "#38bdf8" },
    { emoji: "🌦️", label: "Weather Advisory",      to: "/farmer/weather",              color: "#fbbf24" },
    { emoji: "📊", label: "Market Trends",         to: "/farmer/market-trends",        color: "#fb923c" },
    { emoji: "🤖", label: "AI Assistant",          to: "/farmer/assistant",            color: "#f472b6" },
    { emoji: "🏡", label: "My Farm Profile",       to: "/farmer/my-farm",              color: "#4ade80" },
    { emoji: "📊", label: "Farm Analytics",        to: "/farmer/farm-analytics",       color: "#60a5fa" },
    { emoji: "🔔", label: "Notifications",         to: "/farmer/notifications",        color: "#fb923c" },
  ];


  return (
    <>
      <style>{DS}</style>

      {/* Welcome */}
      <div className="pg-head">
        <div>
          <div className="eyebrow">Farmer Dashboard</div>
          <h1 className="pg-title">{greeting()}, {user.name?.split(" ")[0] || "Farmer"} 👋</h1>
          <p className="pg-sub">Here's your farm and marketplace activity overview.</p>
        </div>
        <Link to="/farmer/crops/add" className="btn-green" id="dash-add-crop">
          ➕ Add Crop
        </Link>
      </div>

      {/* Error */}
      {error && <div className="alert-error">⚠️ {error}</div>}

      {/* Pending Orders Alert */}
      {!loading && stats.pendingOrders > 0 && (
        <div className="alert-warn" style={{ marginBottom: 24 }}>
          🔔 You have <strong>{stats.pendingOrders}</strong> pending order{stats.pendingOrders > 1 ? "s" : ""} waiting for your response.
          <Link to="/farmer/orders" style={{ marginLeft: "auto", color: "#fbbf24", fontWeight: 700, fontSize: 13 }}>View Orders →</Link>
        </div>
      )}

      {/* Stat Cards */}
      {loading ? (
        <div className="loading-wrap"><div className="spinner" /><span>Loading dashboard…</span></div>
      ) : (
        <div className="stat-grid">
          {statCards.map(({ emoji, label, value, color, glow, link }) => (
            <Link to={link} key={label} className="stat-card" style={{ textDecoration: "none" }}>
              <div className="stat-glow" style={{ background: glow }} />
              <div className="stat-emoji">{emoji}</div>
              <div className="stat-val">{value}</div>
              <div className="stat-lbl">{label}</div>
              <div className="stat-trend" style={{ color }}><span>→ View details</span></div>
            </Link>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ marginBottom: 28 }}>
        <div className="card-title" style={{ marginBottom: 16 }}>Quick Actions</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
          {quickLinks.map(({ emoji, label, to, color }) => (
            <Link
              key={to} to={to}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 10, padding: "20px 12px", borderRadius: 16, textDecoration: "none",
                background: "var(--surface)", border: "1px solid var(--border)",
                transition: "background 0.2s, border-color 0.2s, transform 0.2s",
                color: "var(--text)", fontSize: 13, fontWeight: 600, textAlign: "center",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface2)"; e.currentTarget.style.borderColor = color + "33"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "none"; }}
            >
              <span style={{ fontSize: 28 }}>{emoji}</span>
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Info Panels */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div className="card-title">🌿 Crop Summary</div>
              <div className="card-sub">Your active listings</div>
            </div>
            <Link to="/farmer/crops" style={{ fontSize: 13, color: "var(--green)", fontWeight: 600, textDecoration: "none" }}>View all →</Link>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1, padding: "16px", borderRadius: 12, background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.12)", textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#4ade80" }}>{stats.activeCrops}</div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>Active</div>
            </div>
            <div style={{ flex: 1, padding: "16px", borderRadius: 12, background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.12)", textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#fbbf24" }}>{stats.totalCrops - stats.activeCrops}</div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>Inactive</div>
            </div>
            <div style={{ flex: 1, padding: "16px", borderRadius: 12, background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.12)", textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#38bdf8" }}>{stats.totalCrops}</div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>Total</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div className="card-title">📦 Order Summary</div>
              <div className="card-sub">Incoming farm orders</div>
            </div>
            <Link to="/farmer/orders" style={{ fontSize: 13, color: "var(--green)", fontWeight: 600, textDecoration: "none" }}>View all →</Link>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1, padding: "16px", borderRadius: 12, background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.12)", textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#fbbf24" }}>{stats.pendingOrders}</div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>Pending</div>
            </div>
            <div style={{ flex: 1, padding: "16px", borderRadius: 12, background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.12)", textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#4ade80" }}>{stats.totalOrders - stats.pendingOrders}</div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>Fulfilled</div>
            </div>
            <div style={{ flex: 1, padding: "16px", borderRadius: 12, background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.12)", textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#38bdf8" }}>{stats.totalOrders}</div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>Total</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>🚀 Get Started Tips</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              ["🌿", "Add your first crop listing", "/farmer/crops/add"],
              ["📸", "Upload crop photos for better sales", "/farmer/crops"],
              ["🔬", "Scan any diseased crop leaf", "/farmer/disease-detection"],
              ["💡", "Check today's best market prices", "/farmer/price-prediction"],
            ].map(([icon, text, to]) => (
              <Link key={to} to={to} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, background: "var(--surface)", textDecoration: "none", color: "var(--text)", fontSize: 13, transition: "background 0.2s" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface2)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "var(--surface)"}
              >
                <span style={{ fontSize: 18 }}>{icon}</span>
                <span>{text}</span>
                <span style={{ marginLeft: "auto", color: "var(--text2)", fontSize: 16 }}>→</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Export Opportunities Card */}
        <div className="card" style={{ borderColor: "rgba(56,189,248,0.18)", background: "rgba(56,189,248,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div className="card-title">🌍 Export Opportunities</div>
              <div className="card-sub">Connect with international buyers</div>
            </div>
            <Link to="/farmer/export" style={{ fontSize: 13, color: "#38bdf8", fontWeight: 600, textDecoration: "none" }}>Open →</Link>
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            {[
              [exportStats.listingCount    || 0, "My Listings",    "#4ade80"],
              [exportStats.pendingInterests|| 0, "Pending Requests","#fbbf24"],
              [exportStats.unreadInterests || 0, "Unread Updates",  "#f87171"],
            ].map(([v, l, c]) => (
              <div key={l} style={{ flex: 1, minWidth: 80, padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", textAlign: "center", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: c }}>{v}</div>
                <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link to="/farmer/export" style={{ flex: 1, padding: "10px", borderRadius: 10, background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)", color: "#38bdf8", fontWeight: 700, fontSize: 12, textAlign: "center", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              📋 My Listings
            </Link>
            <Link to="/farmer/export" style={{ flex: 1, padding: "10px", borderRadius: 10, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80", fontWeight: 700, fontSize: 12, textAlign: "center", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              + List Produce
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}