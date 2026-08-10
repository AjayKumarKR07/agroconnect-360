import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../../config/api";

const DS_ADMIN = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
  .pg-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:16px;flex-wrap:wrap;}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#818cf8;margin-bottom:6px;}
  .pg-title{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:800;color:#fff;line-height:1.2;}
  .pg-sub{font-size:14px;color:#a5b4fc;margin-top:6px;}
  .card{background:rgba(99,102,241,0.04);border:1px solid rgba(99,102,241,0.12);border-radius:18px;padding:20px 22px;}
  .card-title{font-family:'Space Grotesk',sans-serif;font-size:16px;font-weight:800;color:#fff;}
  .btn-indigo{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:12px;background:linear-gradient(135deg,#4f46e5,#6366f1);color:#fff;font-weight:700;font-size:14px;border:none;cursor:pointer;text-decoration:none;font-family:'Inter',sans-serif;}
  .btn-indigo:hover{opacity:0.9;}
  .spinner{width:20px;height:20px;border:3px solid rgba(99,102,241,0.15);border-top-color:#818cf8;border-radius:50%;animation:spin 0.8s linear infinite;display:inline-block;}
  @keyframes spin{to{transform:rotate(360deg)}}
`;

const ROLE_COLOR = {
  farmer: "#4ade80", seller: "#a78bfa", user: "#38bdf8", exporter: "#fbbf24", admin: "#f87171",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("agroconnect_token");

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch(`${API_URL}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = await r.json();
        if (d.success) {
          setStats(d.stats);
          setRecentUsers(d.recentUsers || []);
        }
      } catch (e) { console.error("Admin stats error:", e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const fmt = (n) => {
    if (!n && n !== 0) return "—";
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
    return `₹${Math.round(n).toLocaleString("en-IN")}`;
  };

  return (
    <>
      <style>{DS_ADMIN}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">AgroConnect 360 Admin Suite</div>
          <h1 className="pg-title">⚙️ System Control & Analytics</h1>
          <p className="pg-sub">Monitor platform ecosystem, user verification, crop moderation, and platform revenue.</p>
        </div>
        <Link to="/admin/users" className="btn-indigo">👥 Manage Users</Link>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#a5b4fc" }}>
          <div className="spinner" style={{ margin: "0 auto 12px" }} />
          <div>Loading platform stats…</div>
        </div>
      )}

      {!loading && stats && (
        <>
          {/* Primary KPI Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 26 }}>
            {[
              ["👥", "Total Registered Users", stats.totalUsers,
                `${stats.farmers} Farmers · ${stats.sellers} Sellers · ${stats.buyers} Buyers`, "#818cf8"],
              ["💎", "Total GMV Processed", fmt(stats.totalGmv), "All Delivered Orders", "#4ade80"],
              ["💰", "Platform Commission (2.5%)", fmt(stats.platformFees), "Net Revenue Earned", "#38bdf8"],
              ["🌾", "Active Listings", stats.listedCrops, `${stats.totalCrops} total crops on platform`, "#fbbf24"],
              ["📦", "Total Orders", stats.totalOrders, `${stats.pendingOrders} pending approval`, "#a78bfa"],
              ["🚢", "Export Activity", stats.rfqCount + " RFQs", `${stats.shipmentCount} active shipments`, "#fb923c"],
            ].map(([emoji, label, val, sub, color]) => (
              <div key={label} className="card">
                <div style={{ fontSize: 24, marginBottom: 8 }}>{emoji}</div>
                <div style={{ fontSize: 11, color: "#a5b4fc", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color }}>{val}</div>
                <div style={{ fontSize: 12, color: "#a5b4fc", marginTop: 4 }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Quick Action Shortcuts */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-title" style={{ marginBottom: 14 }}>⚡ Admin Quick Actions</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
              {[
                { emoji: "👥", label: "User KYC Verification", to: "/admin/users" },
                { emoji: "🌾", label: "Crop Moderation Queue", to: "/admin/crops" },
                { emoji: "📦", label: "All Platform Orders", to: "/admin/orders" },
                { emoji: "🚢", label: "Export RFQs & Shipments", to: "/admin/exports" },
                { emoji: "💰", label: "Commission Analytics", to: "/admin/finance" },
                { emoji: "⚖️", label: "Dispute Center", to: "/admin/disputes" },
                { emoji: "⚡", label: "Server Telemetry", to: "/admin/system" },
              ].map(q => (
                <Link key={q.label} to={q.to}
                  style={{ textDecoration: "none", padding: "14px 16px", background: "rgba(99,102,241,0.04)", borderRadius: 14, border: "1px solid rgba(99,102,241,0.12)", display: "flex", alignItems: "center", gap: 10, transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.09)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(99,102,241,0.04)"; }}>
                  <span style={{ fontSize: 20 }}>{q.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{q.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent User Registrations */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div className="card-title">👥 Recent Registrations</div>
              <Link to="/admin/users" style={{ fontSize: 13, color: "#818cf8", textDecoration: "none", fontWeight: 700 }}>Manage All →</Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recentUsers.length === 0 && (
                <div style={{ fontSize: 14, color: "#a5b4fc", textAlign: "center", padding: 20 }}>No users yet</div>
              )}
              {recentUsers.map((u, i) => (
                <div key={u._id || i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "rgba(99,102,241,0.03)", borderRadius: 12, border: "1px solid rgba(99,102,241,0.08)", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 800, color: "#fff", fontSize: 14 }}>{u.name || "Unnamed"}</span>
                      <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 6, background: `${ROLE_COLOR[u.role] || "#818cf8"}20`, color: ROLE_COLOR[u.role] || "#818cf8", fontWeight: 700, textTransform: "uppercase" }}>
                        {u.role}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "#a5b4fc", marginTop: 2 }}>📧 {u.email}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: u.isActive ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color: u.isActive ? "#4ade80" : "#f87171", fontWeight: 800 }}>
                      ● {u.isActive ? "ACTIVE" : "SUSPENDED"}
                    </span>
                    <div style={{ fontSize: 11, color: "#a5b4fc", marginTop: 4 }}>
                      {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
