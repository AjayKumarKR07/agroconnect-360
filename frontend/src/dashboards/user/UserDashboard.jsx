import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../../config/api";

const DS_USER = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
  .pg-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:16px;flex-wrap:wrap;}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#0ea5e9;margin-bottom:6px;}
  .pg-title{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:800;color:#fff;line-height:1.2;}
  .pg-sub{font-size:14px;color:var(--text2);margin-top:6px;}
  .card{background:rgba(14,165,233,0.04);border:1px solid rgba(14,165,233,0.1);border-radius:18px;padding:20px 22px;}
  .card-title{font-family:'Space Grotesk',sans-serif;font-size:16px;font-weight:800;color:#fff;}
  .loading-wrap{display:flex;align-items:center;justify-content:center;gap:12px;padding:60px 0;color:var(--text2);}
  .spinner{width:24px;height:24px;border:3px solid rgba(14,165,233,0.15);border-top-color:#0ea5e9;border-radius:50%;animation:spin 0.8s linear infinite;}
  @keyframes spin{to{transform:rotate(360deg)}}
  .btn-cyan{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:12px;background:linear-gradient(135deg,#0284c7,#0ea5e9);color:#fff;font-weight:700;font-size:14px;border:none;cursor:pointer;text-decoration:none;font-family:'Inter',sans-serif;transition:opacity 0.2s;}
  .btn-cyan:hover{opacity:0.88;}
  .btn-ghost{display:inline-flex;align-items:center;gap:8px;padding:9px 16px;border-radius:10px;border:1px solid rgba(14,165,233,0.2);background:rgba(14,165,233,0.06);color:#7dd3fc;font-weight:600;font-size:13px;cursor:pointer;text-decoration:none;font-family:'Inter',sans-serif;transition:all 0.2s;}
  .btn-ghost:hover{background:rgba(14,165,233,0.12);}
  .empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 24px;text-align:center;gap:12px;}
  .empty-emoji{font-size:48px;}
  .empty-title{font-size:18px;font-weight:700;color:#fff;}
  .empty-sub{font-size:14px;color:var(--text2);}
  .field-input{width:100%;padding:10px 14px;border-radius:11px;border:1px solid rgba(14,165,233,0.18);background:rgba(14,165,233,0.05);color:#fff;font-size:14px;font-family:'Inter',sans-serif;outline:none;transition:border-color 0.2s;}
  .field-input:focus{border-color:rgba(14,165,233,0.4);}
`;

export default function UserDashboard() {
  const user = JSON.parse(localStorage.getItem("agroconnect_user") || "{}");
  const token = localStorage.getItem("agroconnect_token");
  const [stats, setStats] = useState({ totalOrders: 0, pendingOrders: 0, deliveredOrders: 0, totalSpent: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch(`${API_URL}/api/orders/buyer`, { headers: { Authorization: `Bearer ${token}` } });
        const d = await r.json();
        if (d.success) {
          const orders = d.orders || [];
          setRecentOrders(orders.slice(0, 5));
          setStats({
            totalOrders: orders.length,
            pendingOrders: orders.filter(o => o.status === "pending").length,
            deliveredOrders: orders.filter(o => o.status === "delivered").length,
            totalSpent: orders.filter(o => !["cancelled", "rejected"].includes(o.status)).reduce((s, o) => s + (o.totalAmount || o.totalPrice || 0), 0),
          });
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const statusBadge = (s) => {
    const map = {
      pending:   { bg: "rgba(251,191,36,0.12)", color: "#fbbf24", label: "⏳ Pending" },
      accepted:  { bg: "rgba(14,165,233,0.12)",  color: "#38bdf8", label: "✅ Accepted" },
      shipped:   { bg: "rgba(167,139,250,0.12)", color: "#a78bfa", label: "🚚 Shipped" },
      delivered: { bg: "rgba(34,197,94,0.12)",   color: "#4ade80", label: "📦 Delivered" },
      rejected:  { bg: "rgba(239,68,68,0.12)",   color: "#f87171", label: "❌ Rejected" },
      cancelled: { bg: "rgba(239,68,68,0.12)",   color: "#f87171", label: "🚫 Cancelled" },
    };
    const m = map[s] || { bg: "rgba(255,255,255,0.06)", color: "var(--text2)", label: s };
    return <span style={{ padding: "3px 10px", borderRadius: 8, background: m.bg, color: m.color, fontSize: 12, fontWeight: 700 }}>{m.label}</span>;
  };

  const quickLinks = [
    { emoji: "🛒", label: "Browse Products",  to: "/user/browse",        color: "#0ea5e9" },
    { emoji: "📦", label: "Track Orders",      to: "/user/orders",        color: "#a78bfa" },
    { emoji: "❤️", label: "My Wishlist",       to: "/user/wishlist",      color: "#f43f5e" },
    { emoji: "📊", label: "Market Prices",     to: "/user/market-trends", color: "#fb923c" },
    { emoji: "🤖", label: "AI Assistant",      to: "/user/assistant",     color: "#4ade80" },
    { emoji: "👤", label: "My Profile",        to: "/user/profile",       color: "#94a3b8" },
  ];

  return (
    <>
      <style>{DS_USER}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Buyer Dashboard</div>
          <h1 className="pg-title">{greeting()}, {user.name?.split(" ")[0] || "Buyer"} 👋</h1>
          <p className="pg-sub">Welcome to your fresh produce marketplace.</p>
        </div>
        <Link to="/user/browse" className="btn-cyan" id="buyer-browse-now">🛒 Browse Products</Link>
      </div>

      {loading && <div className="loading-wrap"><div className="spinner" /><span>Loading dashboard…</span></div>}

      {!loading && (
        <>
          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: 26 }}>
            {[
              ["📦", "Total Orders",     stats.totalOrders,     "#38bdf8"],
              ["⏳", "Pending",          stats.pendingOrders,    "#fbbf24"],
              ["✅", "Delivered",        stats.deliveredOrders,  "#4ade80"],
              ["💰", "Total Spent", `₹${Number(stats.totalSpent).toLocaleString("en-IN")}`, "#0ea5e9"],
            ].map(([icon, label, val, color]) => (
              <div key={label} className="card" style={{ padding: "20px 22px" }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
                <div style={{ fontSize: 10, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 800, color }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Quick links */}
          <div className="card" style={{ marginBottom: 22 }}>
            <div className="card-title" style={{ marginBottom: 14 }}>⚡ Quick Actions</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
              {quickLinks.map(q => (
                <Link key={q.label} to={q.to} style={{ textDecoration: "none", padding: "12px 14px", background: "rgba(14,165,233,0.04)", borderRadius: 14, border: "1px solid rgba(14,165,233,0.1)", display: "flex", alignItems: "center", gap: 9, transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(14,165,233,0.09)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(14,165,233,0.04)"; }}>
                  <span style={{ fontSize: 18 }}>{q.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{q.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent orders */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div className="card-title">📦 Recent Orders</div>
              <Link to="/user/orders" style={{ fontSize: 13, color: "#38bdf8", textDecoration: "none", fontWeight: 600 }}>View All →</Link>
            </div>
            {recentOrders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-emoji">🛒</div>
                <div className="empty-title">No orders yet</div>
                <div className="empty-sub">Browse fresh produce from local farmers and place your first order.</div>
                <Link to="/user/browse" className="btn-cyan">🛒 Start Shopping</Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {recentOrders.map((o, i) => (
                  <div key={o._id || i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "rgba(14,165,233,0.03)", borderRadius: 12, border: "1px solid rgba(14,165,233,0.08)" }}>
                    <div>
                      <div style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>
                        {o.items?.map(it => it.cropName).join(", ") || "Order"}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text2)" }}>
                        {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {o.items?.length || 1} item(s)
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 800, color: "#0ea5e9", fontSize: 15 }}>₹{Number(o.totalAmount || 0).toLocaleString("en-IN")}</div>
                      {statusBadge(o.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
