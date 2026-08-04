import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../../config/api";
import { DS } from "../../styles/ds";

export default function SellerDashboard() {
  const user = JSON.parse(localStorage.getItem("agroconnect_user") || "{}");
  const [stats, setStats] = useState({ totalProducts: 0, activeProducts: 0, totalOrders: 0, pendingOrders: 0, totalRevenue: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("agroconnect_token");

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch(`${API_URL}/api/seller/dashboard-stats`, { headers: { Authorization: `Bearer ${token}` } });
        const d = await r.json();
        if (d.success) {
          setStats(d.stats || stats);
          setRecentOrders(d.recentOrders || []);
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

  const statCards = [
    { emoji: "🛍️", label: "Active Products", value: stats.activeProducts, color: "#a78bfa", link: "/seller/products" },
    { emoji: "📦", label: "Total Orders",    value: stats.totalOrders,    color: "#38bdf8", link: "/seller/orders" },
    { emoji: "💰", label: "Total Revenue",   value: `₹${Number(stats.totalRevenue || 0).toLocaleString("en-IN")}`, color: "#4ade80", link: "/seller/revenue" },
    { emoji: "⏳", label: "Pending Orders",  value: stats.pendingOrders,  color: "#fbbf24", link: "/seller/orders" },
  ];

  const quickLinks = [
    { emoji: "➕", label: "Add Product",       to: "/seller/products/add",   color: "#a78bfa" },
    { emoji: "📦", label: "Manage Orders",      to: "/seller/orders",         color: "#38bdf8" },
    { emoji: "📊", label: "Market Trends",      to: "/seller/market-trends",  color: "#fb923c" },
    { emoji: "💰", label: "Revenue Report",     to: "/seller/revenue",        color: "#4ade80" },
    { emoji: "🤖", label: "AI Assistant",       to: "/seller/assistant",      color: "#f472b6" },
    { emoji: "👤", label: "My Profile",         to: "/seller/profile",        color: "#94a3b8" },
  ];

  return (
    <>
      <style>{DS}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Seller Dashboard</div>
          <h1 className="pg-title">{greeting()}, {user.name?.split(" ")[0] || "Seller"} 👋</h1>
          <p className="pg-sub">Here's your sales and marketplace activity overview.</p>
        </div>
        <Link to="/seller/products/add" className="btn-green" id="seller-add-product" style={{ background: "linear-gradient(135deg,#7c3aed,#a78bfa)", boxShadow: "0 4px 14px rgba(167,139,250,0.3)" }}>
          ➕ Add Product
        </Link>
      </div>

      {loading && <div className="loading-wrap"><div className="spinner" /><span>Loading dashboard…</span></div>}

      {!loading && (
        <>
          {/* Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 28 }}>
            {statCards.map((s) => (
              <Link key={s.label} to={s.link} style={{ textDecoration: "none" }}>
                <div className="card" style={{ padding: "22px 24px", transition: "transform 0.2s, border-color 0.2s", cursor: "pointer" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.borderColor = `${s.color}30`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = "var(--border)"; }}
                >
                  <div style={{ fontSize: 26, marginBottom: 10 }}>{s.emoji}</div>
                  <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 28, fontWeight: 800, color: s.color }}>
                    {s.value}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Quick Links */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-title" style={{ marginBottom: 16 }}>⚡ Quick Actions</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
              {quickLinks.map((q) => (
                <Link key={q.label} to={q.to} style={{ textDecoration: "none", padding: "14px 16px", background: "var(--surface)", borderRadius: 14, border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10, transition: "border-color 0.2s, background 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${q.color}30`; e.currentTarget.style.background = "var(--surface2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--surface)"; }}
                >
                  <span style={{ fontSize: 20 }}>{q.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{q.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div className="card-title">📦 Recent Orders</div>
              <Link to="/seller/orders" style={{ fontSize: 13, color: "#a78bfa", textDecoration: "none", fontWeight: 600 }}>View All →</Link>
            </div>
            {recentOrders.length === 0 ? (
              <div className="empty-state" style={{ padding: "32px 24px" }}>
                <div className="empty-emoji">📦</div>
                <div className="empty-title">No orders yet</div>
                <div className="empty-sub">Orders from buyers will appear here.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {recentOrders.slice(0, 5).map((o, i) => (
                  <div key={o._id || i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)" }}>
                    <div>
                      <div style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>{o.cropName || o.productName || "Product"}</div>
                      <div style={{ fontSize: 12, color: "var(--text2)" }}>Qty: {o.quantity} · {o.buyerName || "Buyer"}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 800, color: "#4ade80" }}>₹{Number(o.totalPrice || 0).toLocaleString("en-IN")}</div>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: o.status === "pending" ? "rgba(251,191,36,0.1)" : "rgba(34,197,94,0.1)", color: o.status === "pending" ? "#fbbf24" : "#4ade80", fontWeight: 600 }}>
                        {o.status || "pending"}
                      </span>
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
