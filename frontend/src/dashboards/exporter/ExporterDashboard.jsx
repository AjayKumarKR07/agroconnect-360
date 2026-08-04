import { useState } from "react";
import { Link } from "react-router-dom";

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
`;

export default function ExporterDashboard() {
  const user = JSON.parse(localStorage.getItem("agroconnect_user") || "{}");

  const [fxRates] = useState([
    { pair: "USD / INR", rate: "83.42", change: "+0.15%", up: true },
    { pair: "EUR / INR", rate: "90.18", change: "-0.08%", up: false },
    { pair: "AED / INR", rate: "22.71", change: "+0.04%", up: true },
    { pair: "GBP / INR", rate: "105.60", change: "+0.22%", up: true },
  ]);

  const recentShipments = [
    { container: "MSKU-948201", dest: "Jebel Ali, UAE", crop: "Alphonso Mangoes (20 Tons)", port: "Nhava Sheva (JNPT)", status: "Customs Cleared", eta: "8 Aug 2026", color: "#4ade80" },
    { container: "CMAU-102938", dest: "Rotterdam, Netherlands", crop: "Basmati Rice (50 Tons)", port: "Mundra Port", status: "Vessel En-Route", eta: "14 Aug 2026", color: "#38bdf8" },
    { container: "HLCU-883012", dest: "London, UK", crop: "Salem Turmeric (15 Tons)", port: "Chennai Port", status: "Documentation Pending", eta: "19 Aug 2026", color: "#fbbf24" },
  ];

  return (
    <>
      <style>{DS_EXPORTER}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Global Trade Command Center</div>
          <h1 className="pg-title">Welcome back, {user.name?.split(" ")[0] || "Exporter"} 🚢</h1>
          <p className="pg-sub">Monitor international agricultural exports, customs compliance, and port logistics.</p>
        </div>
        <Link to="/exporter/sourcing" className="btn-gold">🌐 Sourcing Produce</Link>
      </div>

      {/* FX Rates Live Ticker */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginBottom: 24 }}>
        {fxRates.map(f => (
          <div key={f.pair} style={{ padding: "12px 16px", borderRadius: 14, background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.12)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", fontWeight: 700 }}>{f.pair}</div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 800, color: "#fff" }}>₹{f.rate}</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: f.up ? "#4ade80" : "#f87171", background: f.up ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", padding: "2px 8px", borderRadius: 6 }}>
              {f.change}
            </span>
          </div>
        ))}
      </div>

      {/* High-level metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 26 }}>
        {[
          ["💵", "Export Revenue (YTD)", "$248,500", "₹2.07 Cr", "#f59e0b"],
          ["🚢", "Active Containers", "8 Shipments", "3 Ports Active", "#38bdf8"],
          ["📜", "Customs Cleared", "96.4%", "28 Certificates", "#4ade80"],
          ["🌐", "Target Destinations", "12 Countries", "UAE, EU, USA", "#a78bfa"],
        ].map(([emoji, label, val, sub, color]) => (
          <div key={label} className="card">
            <div style={{ fontSize: 24, marginBottom: 8 }}>{emoji}</div>
            <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 24, fontWeight: 800, color }}>{val}</div>
            <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Quick Action Links */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title" style={{ marginBottom: 14 }}>⚡ Global Trade Operations</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
          {[
            { emoji: "🌐", label: "Bulk Sourcing", to: "/exporter/sourcing" },
            { emoji: "🚢", label: "Port Logistics", to: "/exporter/logistics" },
            { emoji: "📑", label: "Customs Hub", to: "/exporter/compliance" },
            { emoji: "💱", label: "FX & Tariffs", to: "/exporter/markets" },
            { emoji: "🤖", label: "Export AI Helper", to: "/exporter/assistant" },
          ].map(q => (
            <Link key={q.label} to={q.to} style={{ textDecoration: "none", padding: "14px 16px", background: "rgba(245,158,11,0.04)", borderRadius: 14, border: "1px solid rgba(245,158,11,0.1)", display: "flex", alignItems: "center", gap: 10, transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(245,158,11,0.09)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(245,158,11,0.04)"; }}>
              <span style={{ fontSize: 20 }}>{q.emoji}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{q.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Live Port & Container Tracker Preview */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div className="card-title">🚢 Active Container Shipments</div>
          <Link to="/exporter/logistics" style={{ fontSize: 13, color: "#fbbf24", textDecoration: "none", fontWeight: 700 }}>View Logistics →</Link>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {recentShipments.map((s, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "rgba(245,158,11,0.03)", borderRadius: 14, border: "1px solid rgba(245,158,11,0.08)", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 800, color: "#fbbf24" }}>{s.container}</span>
                  <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 6, background: `${s.color}20`, color: s.color, fontWeight: 700 }}>{s.status}</span>
                </div>
                <div style={{ fontSize: 13, color: "#fff", fontWeight: 600, marginTop: 4 }}>{s.crop}</div>
                <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>📍 Port: {s.port} → Dest: <strong style={{ color: "#fff" }}>{s.dest}</strong></div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase" }}>Est. Arrival</div>
                <div style={{ fontWeight: 800, color: "#fff", fontSize: 14 }}>{s.eta}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
