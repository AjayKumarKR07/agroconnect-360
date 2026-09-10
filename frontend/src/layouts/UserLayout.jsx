import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation, Link } from "react-router-dom";

export default function UserLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("agroconnect_user") || "{}"));

  // Re-read user from localStorage whenever profile is saved
  useEffect(() => {
    const refresh = () => setUser(JSON.parse(localStorage.getItem("agroconnect_user") || "{}"));
    window.addEventListener("ac_user_update", refresh);
    window.addEventListener("storage", refresh);
    return () => { window.removeEventListener("ac_user_update", refresh); window.removeEventListener("storage", refresh); };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("agroconnect_token");
    localStorage.removeItem("agroconnect_user");
    navigate("/login", { replace: true });
  };

  const nav = [
    { emoji: "🏠", name: "Home",        path: "/user/dashboard" },
    { emoji: "🔍", name: "Browse",      path: "/user/browse" },
    { emoji: "🛍️", name: "My Orders",   path: "/user/orders" },
    { emoji: "❤️", name: "Wishlist",    path: "/user/wishlist" },
    { emoji: "🛒", name: "Cart",        path: "/user/cart" },
    { emoji: "🧺", name: "Subscriptions", path: "/user/subscriptions" },
    { emoji: "💬", name: "Inquiries",   path: "/user/inquiries" },
    { emoji: "🔔", name: "Alerts",      path: "/user/alerts" },
    { emoji: "🤖", name: "AI Assistant", path: "/user/assistant" },
    { emoji: "👤", name: "Profile",     path: "/user/profile" },
  ];

  // Cart count badge
  const [cartCount, setCartCount] = useState(
    () => JSON.parse(localStorage.getItem("ac_cart") || "[]").length
  );
  useEffect(() => {
    const update = () => setCartCount(JSON.parse(localStorage.getItem("ac_cart") || "[]").length);
    window.addEventListener("ac_cart_update", update);
    window.addEventListener("storage", update);
    return () => { window.removeEventListener("ac_cart_update", update); window.removeEventListener("storage", update); };
  }, []);

  const initials = (user.name || "U").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const currentPage = nav.find(n => location.pathname.startsWith(n.path))?.name || "Buyer Portal";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:        #030d0f;
          --bg2:       #041214;
          --sidebar:   #041a1f;
          --surface:   rgba(14,165,233,0.05);
          --surface2:  rgba(14,165,233,0.09);
          --border:    rgba(14,165,233,0.12);
          --border2:   rgba(14,165,233,0.22);
          --text:      #e8f8ff;
          --text2:     #5a8fa6;
          --accent:    #0ea5e9;
          --accent2:   #0284c7;
          --accent-dim:rgba(14,165,233,0.12);
          --ul-w:      248px;
          --ul-wc:     68px;
        }

        body { font-family:'Inter',sans-serif; background:var(--bg); color:var(--text); }

        .ul-wrap { display:flex; min-height:100vh; }

        /* ── SIDEBAR ── */
        .ul-sidebar {
          position:fixed; top:0; left:0; bottom:0; z-index:50;
          width:var(--ul-w);
          background:var(--sidebar);
          border-right:1px solid var(--border);
          display:flex; flex-direction:column;
          transition:width 0.3s cubic-bezier(.4,0,.2,1);
          overflow:hidden;
        }
        .ul-sidebar.collapsed { width:var(--ul-wc); }
        .ul-sidebar::before {
          content:'';
          position:absolute; top:0; left:0; right:0; height:200px;
          background:radial-gradient(ellipse at 50% 0%, rgba(14,165,233,0.15) 0%, transparent 70%);
          pointer-events:none;
        }

        .ul-head {
          display:flex; align-items:center; gap:12px;
          padding:20px 16px; height:70px; flex-shrink:0;
          border-bottom:1px solid var(--border); overflow:hidden; position:relative;
        }
        .ul-logo {
          width:38px; height:38px; border-radius:12px; flex-shrink:0;
          background:linear-gradient(135deg,#0284c7,#38bdf8);
          display:flex; align-items:center; justify-content:center;
          font-size:20px; box-shadow:0 4px 20px rgba(14,165,233,0.45);
        }
        .ul-brand-name { font-family:'Space Grotesk',sans-serif; font-size:14px; font-weight:800; color:#fff; white-space:nowrap; }
        .ul-brand-role {
          display:inline-block; margin-top:2px; font-size:10px; font-weight:700;
          letter-spacing:0.08em; color:#38bdf8; text-transform:uppercase;
          background:rgba(14,165,233,0.12); border:1px solid rgba(14,165,233,0.2);
          padding:1px 7px; border-radius:20px;
        }

        .ul-nav { flex:1; overflow-y:auto; padding:16px 10px; display:flex; flex-direction:column; gap:3px; }
        .ul-nav::-webkit-scrollbar { width:0; }
        .ul-divider { font-size:10px; font-weight:700; color:var(--text2); text-transform:uppercase; letter-spacing:0.08em; padding:10px 12px 6px; opacity:0.6; white-space:nowrap; }

        .ul-link {
          display:flex; align-items:center; gap:12px;
          padding:11px 12px; border-radius:12px;
          text-decoration:none; color:var(--text2);
          font-size:13.5px; font-weight:500;
          transition:all 0.2s; white-space:nowrap; overflow:hidden; position:relative;
        }
        .ul-link:hover { background:var(--surface2); color:var(--text); }
        .ul-link.active {
          background:linear-gradient(135deg,rgba(2,132,199,0.2),rgba(14,165,233,0.08));
          color:#7dd3fc; border:1px solid rgba(14,165,233,0.22);
          font-weight:700; box-shadow:0 2px 12px rgba(14,165,233,0.12);
        }
        .ul-link.active::after {
          content:''; position:absolute; right:10px; top:50%; transform:translateY(-50%);
          width:6px; height:6px; border-radius:50%;
          background:var(--accent); box-shadow:0 0 8px rgba(14,165,233,0.8);
        }
        .ul-emoji { font-size:17px; flex-shrink:0; width:20px; text-align:center; }

        .ul-foot { padding:12px 10px; border-top:1px solid var(--border); flex-shrink:0; }
        .ul-user {
          display:flex; align-items:center; gap:10px;
          padding:10px 12px; border-radius:12px; overflow:hidden;
          background:var(--surface); border:1px solid var(--border);
          margin-bottom:8px;
        }
        .ul-avatar {
          width:34px; height:34px; border-radius:10px; flex-shrink:0;
          background:linear-gradient(135deg,#0284c7,#38bdf8);
          display:flex; align-items:center; justify-content:center;
          font-size:13px; font-weight:800; color:#fff;
          box-shadow:0 2px 8px rgba(14,165,233,0.3);
        }
        .ul-user-name { font-size:13px; font-weight:700; color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .ul-user-role { font-size:11px; color:var(--accent); font-weight:600; }

        .ul-logout {
          display:flex; align-items:center; gap:12px;
          padding:10px 12px; border-radius:12px; border:1px solid transparent;
          background:none; color:var(--text2); font-size:13.5px; font-weight:600;
          cursor:pointer; width:100%; text-align:left; font-family:'Inter',sans-serif;
          transition:all 0.2s; white-space:nowrap; overflow:hidden;
        }
        .ul-logout:hover { background:rgba(239,68,68,0.08); color:#f87171; border-color:rgba(239,68,68,0.15); }

        .ul-switch-role {
          display:flex; align-items:center; gap:12px;
          padding:9px 12px; border-radius:12px;
          background:rgba(14,165,233,0.08); border:1px solid rgba(14,165,233,0.22);
          color:#0ea5e9; font-size:13px; font-weight:600;
          cursor:pointer; width:100%; text-align:left; font-family:'Inter',sans-serif;
          transition:all 0.2s; white-space:nowrap; overflow:hidden;
          margin-bottom:6px;
        }
        .ul-switch-role:hover { background:rgba(14,165,233,0.16); border-color:rgba(14,165,233,0.35); color:#38bdf8; }

        .ul-topbar-role-btn {
          display:inline-flex; align-items:center; gap:6px;
          padding:6px 12px; border-radius:20px;
          background:rgba(14,165,233,0.08); border:1px solid rgba(14,165,233,0.25);
          color:#0ea5e9; font-size:12px; font-weight:600;
          cursor:pointer; font-family:'Inter',sans-serif;
          transition:all 0.2s;
        }
        .ul-topbar-role-btn:hover { background:rgba(14,165,233,0.16); color:#38bdf8; }

        /* ── TOGGLE ── */
        .ul-toggle {
          position:fixed; top:22px; z-index:60;
          width:22px; height:22px; border-radius:6px;
          background:var(--sidebar); border:1px solid var(--border2);
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; font-size:11px; color:var(--text2);
          transition:left 0.3s cubic-bezier(.4,0,.2,1);
        }
        .ul-toggle:hover { background:var(--surface2); color:#fff; }

        /* ── MAIN ── */
        .ul-main {
          margin-left:var(--ul-w); flex:1; min-height:100vh;
          display:flex; flex-direction:column;
          transition:margin-left 0.3s cubic-bezier(.4,0,.2,1);
          background:var(--bg);
        }
        .ul-main.collapsed { margin-left:var(--ul-wc); }

        /* ── TOPBAR ── */
        .ul-topbar {
          position:sticky; top:0; z-index:40; height:70px;
          background:rgba(3,13,15,0.88); backdrop-filter:blur(24px);
          border-bottom:1px solid var(--border);
          display:flex; align-items:center; justify-content:space-between;
          padding:0 28px;
        }
        .ul-page-dot { width:8px; height:8px; border-radius:50%; background:var(--accent); box-shadow:0 0 12px rgba(14,165,233,0.7); }
        .ul-page-name { font-family:'Space Grotesk',sans-serif; font-size:16px; font-weight:800; color:#fff; }
        .ul-time-chip { font-size:12px; color:var(--text2); background:var(--surface); border:1px solid var(--border); padding:5px 14px; border-radius:20px; }
        .ul-topbar-avatar {
          width:36px; height:36px; border-radius:10px;
          background:linear-gradient(135deg,#0284c7,#38bdf8);
          display:flex; align-items:center; justify-content:center;
          font-size:13px; font-weight:800; color:#fff; cursor:pointer;
          box-shadow:0 4px 14px rgba(14,165,233,0.35);
        }

        .ul-content { flex:1; padding:28px 32px; }

        @media(max-width:768px){
          .ul-sidebar { width:var(--ul-wc) !important; }
          .ul-main { margin-left:var(--ul-wc) !important; }
          .ul-content { padding:20px 16px; }
        }
      `}</style>

      <div className="ul-wrap">
        <aside className={`ul-sidebar ${collapsed ? "collapsed" : ""}`}>
          <div className="ul-head">
            <div className="ul-logo">🛒</div>
            {!collapsed && (
              <div>
                <div className="ul-brand-name">AgroConnect 360</div>
                <span className="ul-brand-role">Buyer Portal</span>
              </div>
            )}
          </div>

          <nav className="ul-nav">
            {!collapsed && <div className="ul-divider">Main Menu</div>}
            {nav.map(n => (
              <NavLink key={n.path} to={n.path} className={({ isActive }) => `ul-link${isActive ? " active" : ""}`} title={collapsed ? n.name : undefined}>
                <span className="ul-emoji">{n.emoji}</span>
                {!collapsed && <span>{n.name}</span>}
              </NavLink>
            ))}
          </nav>

          <div className="ul-foot">
            <div className="ul-user">
              <div className="ul-avatar">{initials}</div>
              {!collapsed && (
                <div style={{ overflow: "hidden", flex: 1 }}>
                  <div className="ul-user-name">{user.name || "Buyer"}</div>
                  <div className="ul-user-role">🔵 Buyer</div>
                </div>
              )}
            </div>
            <button
              className="ul-switch-role"
              onClick={() => navigate("/select-role", { state: { isNewUser: false } })}
              title={collapsed ? "Switch Role" : undefined}
            >
              <span className="ul-emoji">🔄</span>
              {!collapsed && "Switch Role"}
            </button>
            <button className="ul-logout" onClick={handleLogout} title={collapsed ? "Logout" : undefined}>
              <span className="ul-emoji">🚪</span>
              {!collapsed && "Logout"}
            </button>
          </div>
        </aside>

        <button className="ul-toggle"
          style={{ left: collapsed ? "calc(var(--ul-wc) - 11px)" : "calc(var(--ul-w) - 11px)" }}
          onClick={() => setCollapsed(c => !c)}>
          {collapsed ? "›" : "‹"}
        </button>

        <div className={`ul-main ${collapsed ? "collapsed" : ""}`}>
          <header className="ul-topbar">
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div className="ul-page-dot" />
              <div className="ul-page-name">{currentPage}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="ul-time-chip">
                {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
              </div>
              <button
                className="ul-topbar-role-btn"
                onClick={() => navigate("/select-role", { state: { isNewUser: false } })}
                title="Switch Role"
              >
                🔄 Switch Role
              </button>
              {/* Cart badge */}
              <Link to="/user/cart" style={{ position: "relative", textDecoration: "none", width: 36, height: 36, borderRadius: 10, background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                🛒
                {cartCount > 0 && (
                  <span style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: "#0ea5e9", color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{cartCount}</span>
                )}
              </Link>
              <div className="ul-topbar-avatar" title={user.name} onClick={() => navigate("/user/profile")} style={{ cursor: "pointer" }}>{initials}</div>

            </div>
          </header>

          <main className="ul-content">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}
