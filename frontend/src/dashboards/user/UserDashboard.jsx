import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../../config/api";
import {
  Package, Clock, CheckCircle2, IndianRupee,
  ShoppingCart, TrendingUp, Heart, Bot, User, Zap, Lightbulb, Sprout
} from "lucide-react";

const DS_USER = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
  .pg-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:16px;flex-wrap:wrap;}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#0ea5e9;margin-bottom:6px;}
  .pg-title{font-family:'Space Grotesk',sans-serif;font-size:clamp(22px,3vw,30px);font-weight:800;color:#0f172a;line-height:1.2;letter-spacing:-0.02em;}
  .pg-sub{font-size:14px;color:var(--text2);margin-top:6px;}
  .ud-stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px;margin-bottom:28px;}
  .ud-stat{background:rgba(14,165,233,0.05);border:1px solid rgba(14,165,233,0.12);border-radius:18px;padding:22px 20px;position:relative;overflow:hidden;transition:transform 0.2s,border-color 0.2s;}
  .ud-stat:hover{transform:translateY(-2px);border-color:rgba(14,165,233,0.25);}
  .ud-stat::before{content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);width:60%;height:1px;background:linear-gradient(90deg,transparent,rgba(14,165,233,0.5),transparent);}
  .ud-stat-glow{position:absolute;width:70px;height:70px;border-radius:50%;filter:blur(20px);top:-20px;right:-10px;opacity:0.3;}
  .ud-stat-icon{display:flex;align-items:center;margin-bottom:10px;}
  .ud-stat-val{font-family:'Space Grotesk',sans-serif;font-size:30px;font-weight:800;color:#0f172a;}
  .ud-stat-lbl{font-size:12px;color:var(--text2);margin-top:4px;text-transform:uppercase;letter-spacing:0.05em;}
  .card{background:rgba(14,165,233,0.04);border:1px solid rgba(14,165,233,0.1);border-radius:18px;padding:22px;}
  .card-title{font-family:'Space Grotesk',sans-serif;font-size:17px;font-weight:800;color:#0f172a;}
  .loading-wrap{display:flex;align-items:center;justify-content:center;gap:12px;padding:60px 0;color:var(--text2);}
  .spinner{width:24px;height:24px;border:3px solid rgba(14,165,233,0.15);border-top-color:#0ea5e9;border-radius:50%;animation:spin 0.8s linear infinite;}
  @keyframes spin{to{transform:rotate(360deg)}}
  .btn-cyan{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:12px;background:linear-gradient(135deg,#0284c7,#0ea5e9);color:#0f172a;font-weight:700;font-size:14px;border:none;cursor:pointer;text-decoration:none;font-family:'Inter',sans-serif;transition:opacity 0.2s,transform 0.2s;box-shadow:0 6px 20px rgba(14,165,233,0.3);}
  .btn-cyan:hover{opacity:0.9;transform:translateY(-1px);}
  .btn-ghost{display:inline-flex;align-items:center;gap:8px;padding:9px 16px;border-radius:10px;border:1px solid rgba(14,165,233,0.2);background:rgba(14,165,233,0.06);color:#7dd3fc;font-weight:600;font-size:13px;cursor:pointer;text-decoration:none;font-family:'Inter',sans-serif;transition:all 0.2s;}
  .btn-ghost:hover{background:rgba(14,165,233,0.12);}
  .empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 24px;text-align:center;gap:12px;}
  .empty-emoji{font-size:48px;} .empty-title{font-size:18px;font-weight:700;color:#0f172a;} .empty-sub{font-size:14px;color:var(--text2);}
  .feat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;}
  .feat-card{background:rgba(14,165,233,0.03);border:1px solid rgba(14,165,233,0.1);border-radius:14px;overflow:hidden;transition:all 0.2s;cursor:pointer;}
  .feat-card:hover{border-color:rgba(14,165,233,0.25);transform:translateY(-2px);}
  .feat-ph{width:100%;height:130px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(56,189,248,0.04));display:flex;align-items:center;justify-content:center;font-size:40px;}
  .feat-img{width:100%;height:130px;object-fit:cover;}
  .ql-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;}
  .ql-link{text-decoration:none;padding:14px 12px;background:rgba(14,165,233,0.04);border:1px solid rgba(14,165,233,0.1);border-radius:14px;display:flex;align-items:center;gap:9px;transition:all 0.2s;}
  .ql-link:hover{background:rgba(14,165,233,0.09);border-color:rgba(14,165,233,0.2);}
`;

const catEmoji = (cat) => ({ vegetables:"🥬", fruits:"🍎", grains:"🌾", spices:"🌶️", dairy:"🥛", poultry:"🐔" })[cat] || "📦";

export default function UserDashboard() {
  const user = JSON.parse(localStorage.getItem("agroconnect_user") || "{}");
  const token = localStorage.getItem("agroconnect_token");

  const [stats, setStats] = useState({ totalOrders: 0, pendingOrders: 0, deliveredOrders: 0, totalSpent: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        // Load orders
        const r = await fetch(`${API_URL}/api/orders/buyer`, { headers: { Authorization: `Bearer ${token}` } });
        const d = await r.json();
        if (d.success) {
          const orders = d.orders || [];
          setRecentOrders(orders.slice(0, 4));
          setStats({
            totalOrders: orders.length,
            pendingOrders: orders.filter(o => ["pending", "confirmed"].includes(o.status)).length,
            deliveredOrders: orders.filter(o => o.status === "delivered").length,
            // Only count money actually received / delivered
            totalSpent: orders
              .filter(o => o.status === "delivered")
              .reduce((s, o) => s + (o.totalAmount || 0), 0),
          });
        }
      } catch (e) { console.error(e); }

      try {
        // Load featured products (top 4 listed crops)
        const r2 = await fetch(`${API_URL}/api/crops?status=listed`, { headers: { Authorization: `Bearer ${token}` } });
        const d2 = await r2.json();
        setFeatured((d2.crops || []).slice(0, 4));
      } catch { setFeatured([]); }

      setLoading(false);
    };
    load();
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const addToCart = (crop) => {
    const cart = JSON.parse(localStorage.getItem("ac_cart") || "[]");
    const existing = cart.find(c => c._id === crop._id);
    const updated = existing
      ? cart.map(c => c._id === crop._id ? { ...c, qty: (c.qty || 1) + 1 } : c)
      : [...cart, { ...crop, qty: 1 }];
    localStorage.setItem("ac_cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("ac_cart_update"));
    setAddedId(crop._id);
    setTimeout(() => setAddedId(null), 1500);
  };

  const statusBadge = (s) => {
    const map = {
      pending:   { bg: "rgba(251,191,36,0.12)",  color: "#b45309", label: "⏳ Pending" },
      confirmed: { bg: "rgba(14,165,233,0.12)",  color: "#0369a1", label: "✅ Confirmed" },
      shipped:   { bg: "rgba(167,139,250,0.12)", color: "#7c3aed", label: "🚚 Shipped" },
      delivered: { bg: "rgba(34,197,94,0.12)",   color: "#15803d", label: "📦 Delivered" },
      cancelled: { bg: "rgba(239,68,68,0.12)",   color: "#dc2626", label: "🚫 Cancelled" },
    };
    const m = map[s] || { bg: "rgba(255,255,255,0.06)", color: "var(--text2)", label: s };
    return <span style={{ padding: "3px 10px", borderRadius: 8, background: m.bg, color: m.color, fontSize: 12, fontWeight: 700 }}>{m.label}</span>;
  };

  const quickLinks = [
    { Icon: ShoppingCart, label: "Browse",        to: "/user/browse",        color: "#0ea5e9" },
    { Icon: Package,      label: "Track Orders",  to: "/user/orders",        color: "#7c3aed" },
    { Icon: Heart,        label: "Wishlist",      to: "/user/wishlist",      color: "#f43f5e" },
    { Icon: TrendingUp,   label: "Market Prices", to: "/user/market-trends", color: "#fb923c" },
    { Icon: Bot,          label: "AI Assistant",  to: "/user/assistant",     color: "#15803d" },
    { Icon: User,         label: "My Profile",    to: "/user/profile",       color: "#94a3b8" },
  ];

  const statCards = [
    { Icon: Package,        label: "Total Orders",  value: stats.totalOrders,    color: "#0369a1" },
    { Icon: Clock,          label: "Active Orders", value: stats.pendingOrders,   color: "#b45309" },
    { Icon: CheckCircle2,   label: "Delivered",     value: stats.deliveredOrders, color: "#15803d" },
    { Icon: IndianRupee,    label: "Total Spent",   value: `₹${Number(stats.totalSpent).toLocaleString("en-IN")}`, color: "#0ea5e9" },
  ];

  return (
    <>
      <style>{DS_USER}</style>

      {/* Header */}
      <div className="pg-head">
        <div>
          <div className="eyebrow">Buyer Dashboard</div>
          <h1 className="pg-title">{greeting()}, {user.name?.split(" ")[0] || "Buyer"} 👋</h1>
          <p className="pg-sub">Your fresh produce marketplace — farm to your door.</p>
        </div>
        <Link to="/user/browse" className="btn-cyan" id="buyer-browse-now">🛒 Shop Now</Link>
      </div>

      {loading && <div className="loading-wrap"><div className="spinner" /><span>Loading dashboard…</span></div>}

      {!loading && (
        <>
          {/* Stat Cards */}
          <div className="ud-stat-grid">
            {statCards.map(({ Icon, label, value, color }) => (
              <div key={label} className="ud-stat">
                <div className="ud-stat-glow" style={{ background: color }} />
                <div className="ud-stat-icon" style={{ color }}>
                  <Icon size={22} strokeWidth={1.75} />
                </div>
                <div className="ud-stat-val" style={{ color }}>{value}</div>
                <div className="ud-stat-lbl">{label}</div>
              </div>
            ))}
          </div>

          {/* Two-column main layout */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, marginBottom: 24, alignItems: "start" }}>

            {/* Left: Recent Orders */}
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div className="card-title"><Package size={15} strokeWidth={1.75} style={{ marginRight: 6, verticalAlign: "middle", color: "#0369a1" }} />Recent Orders</div>
                <Link to="/user/orders" style={{ fontSize: 13, color: "#0369a1", textDecoration: "none", fontWeight: 600 }}>View All →</Link>
              </div>
              {recentOrders.length === 0 ? (
                <div className="empty-state" style={{ padding: "32px 0" }}>
                  <div className="empty-emoji"><ShoppingCart size={40} strokeWidth={1.5} color="#bae6fd" /></div>
                  <div className="empty-title">No orders yet</div>
                  <div className="empty-sub">Browse fresh produce from local farmers and place your first order.</div>
                  <Link to="/user/browse" className="btn-cyan" style={{ marginTop: 8 }}>🛒 Start Shopping</Link>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {recentOrders.map((o, i) => (
                    <div key={o._id || i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "rgba(14,165,233,0.03)", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                      <div>
                        <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>
                          {o.items?.map(it => it.cropName).join(", ") || "Order"}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>
                          {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          {o.items?.length > 0 && ` · ${o.items.length} item${o.items.length > 1 ? "s" : ""}`}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 800, color: "#0ea5e9", fontSize: 15 }}>₹{Number(o.totalAmount || 0).toLocaleString("en-IN")}</div>
                        <div style={{ marginTop: 4 }}>{statusBadge(o.status)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Quick Actions */}
            <div className="card">
              <div className="card-title" style={{ marginBottom: 14 }}><Zap size={15} strokeWidth={2} style={{ marginRight: 6, verticalAlign: "middle", color: "#d97706" }} />Quick Actions</div>
              <div className="ql-grid">
                {quickLinks.map(q => (
                  <Link key={q.label} to={q.to} className="ql-link">
                    {(() => { const Icon = q.Icon; return <Icon size={17} strokeWidth={1.75} style={{ color: q.color, flexShrink: 0 }} />; })()}
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{q.label}</span>
                  </Link>
                ))}
              </div>

              {/* Tip box */}
              <div style={{ marginTop: 18, padding: "14px 16px", background: "rgba(14,165,233,0.06)", borderRadius: 12, border: "1px solid rgba(14,165,233,0.14)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#0369a1", marginBottom: 6 }}>💡 Buyer Tips</div>
                <ul style={{ fontSize: 12, color: "var(--text2)", paddingLeft: 16, lineHeight: 1.8, margin: 0 }}>
                  <li>Free delivery on orders above ₹500</li>
                  <li>Set price alerts to buy at the right time</li>
                  <li>Subscribe for weekly fresh baskets</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Featured Products from Live Listings */}
          {featured.length > 0 && (
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div className="card-title"><Sprout size={15} strokeWidth={1.75} style={{ marginRight: 6, color: "#16a34a", verticalAlign: "middle" }} />Fresh Arrivals from Farmers</div>
                  <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 3 }}>Directly sourced — no middlemen</div>
                </div>
                <Link to="/user/browse" className="btn-ghost">See All →</Link>
              </div>
              <div className="feat-grid">
                {featured.map(c => (
                  <div key={c._id} className="feat-card">
                    {c.image?.url
                      ? <img src={c.image.url} alt={c.name} className="feat-img" />
                      : <div className="feat-ph">{catEmoji(c.category)}</div>
                    }
                    <div style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 14, marginBottom: 2 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 10 }}>
                        📍 {c.location} · {c.quantity} {c.unit} avail.
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 800, color: "#0ea5e9" }}>
                          ₹{c.price}<span style={{ fontSize: 10, color: "var(--text2)", fontWeight: 400 }}>/{c.unit}</span>
                        </div>
                        <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, background: "rgba(34,197,94,0.1)", color: "#15803d", fontWeight: 700 }}>🌿 FRESH</span>
                      </div>
                      <button
                        onClick={() => addToCart(c)}
                        style={{
                          width: "100%", padding: "8px 0", borderRadius: 10, border: "none", cursor: "pointer",
                          fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: 13,
                          background: addedId === c._id ? "rgba(34,197,94,0.15)" : "linear-gradient(135deg,#0284c7,#0ea5e9)",
                          color: addedId === c._id ? "#4ade80" : "#fff",
                          transition: "all 0.2s",
                        }}
                      >
                        {addedId === c._id ? "✅ Added!" : "🛒 Add to Cart"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
