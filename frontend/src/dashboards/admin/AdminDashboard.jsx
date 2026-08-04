import { useState } from "react";
import { Link } from "react-router-dom";

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
`;

export default function AdminDashboard() {
  const [stats] = useState({
    totalUsers: 1420,
    farmers: 680,
    sellers: 310,
    buyers: 380,
    exporters: 50,
    totalGmv: "₹4.82 Cr",
    platformFees: "₹12.05 Lakhs",
    activeListings: 245,
    pendingKYC: 18,
  });

  const recentUsers = [
    { name: "Ajaykumar2005", role: "Farmer", email: "vivekshetty659@gmail.com", date: "Today", status: "VERIFIED", color: "#4ade80" },
    { name: "Global Agro Trade LLC", role: "Exporter", email: "trade@globalagro.com", date: "Today", status: "VERIFIED", color: "#4ade80" },
    { name: "Sunil Organic Store", role: "Seller", email: "sunil@store.com", date: "Yesterday", status: "PENDING KYC", color: "#fbbf24" },
    { name: "Meena Fresh Produce", role: "Buyer", email: "meena@fresh.com", date: "2 Aug 2026", status: "VERIFIED", color: "#4ade80" },
  ];

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

      {/* Primary KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 26 }}>
        {[
          ["👥", "Total Registered Users", stats.totalUsers, `${stats.farmers} Farmers · ${stats.sellers} Sellers`, "#818cf8"],
          ["💎", "Total GMV Processed", stats.totalGmv, "All Ecosystem Trades", "#4ade80"],
          ["💰", "Platform Commission (2.5%)", stats.platformFees, "Net Revenue Earned", "#38bdf8"],
          ["🌾", "Active Crop Listings", stats.activeListings, `${stats.pendingKYC} Pending KYC Approval`, "#fbbf24"],
        ].map(([emoji, label, val, sub, color]) => (
          <div key={label} className="card">
            <div style={{ fontSize: 24, marginBottom: 8 }}>{emoji}</div>
            <div style={{ fontSize: 11, color: "#a5b4fc", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 24, fontWeight: 800, color }}>{val}</div>
            <div style={{ fontSize: 12, color: "#a5b4fc", marginTop: 4 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Quick Action Shortcuts */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title" style={{ marginBottom: 14 }}>⚡ Admin Quick Actions</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
          {[
            { emoji: "👥", label: "User KYC Verification", to: "/admin/users" },
            { emoji: "🌾", label: "Crop Moderation Queue", to: "/admin/crops" },
            { emoji: "💰", label: "Commission Analytics", to: "/admin/finance" },
            { emoji: "⚖️", label: "Dispute Center", to: "/admin/disputes" },
            { emoji: "⚡", label: "Server Telemetry", to: "/admin/system" },
          ].map(q => (
            <Link key={q.label} to={q.to} style={{ textDecoration: "none", padding: "14px 16px", background: "rgba(99,102,241,0.04)", borderRadius: 14, border: "1px solid rgba(99,102,241,0.12)", display: "flex", alignItems: "center", gap: 10, transition: "all 0.2s" }}
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
          <div className="card-title">👥 Recent Registrations & KYC</div>
          <Link to="/admin/users" style={{ fontSize: 13, color: "#818cf8", textDecoration: "none", fontWeight: 700 }}>Manage All Users →</Link>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {recentUsers.map((u, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "rgba(99,102,241,0.03)", borderRadius: 12, border: "1px solid rgba(99,102,241,0.08)", flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 800, color: "#fff", fontSize: 14 }}>{u.name}</span>
                  <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 6, background: "rgba(99,102,241,0.15)", color: "#c7d2fe", fontWeight: 700 }}>
                    {u.role}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#a5b4fc", marginTop: 2 }}>📧 {u.email}</div>
              </div>

              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: `${u.color}20`, color: u.color, fontWeight: 800 }}>
                  ● {u.status}
                </span>
                <div style={{ fontSize: 11, color: "#a5b4fc", marginTop: 4 }}>{u.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
