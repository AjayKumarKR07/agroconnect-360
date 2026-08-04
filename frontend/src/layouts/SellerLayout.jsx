import { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";

export default function SellerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const user = JSON.parse(localStorage.getItem("agroconnect_user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("agroconnect_token");
    localStorage.removeItem("agroconnect_user");
    navigate("/login", { replace: true });
  };

  const nav = [
    { emoji: "🏠", name: "Dashboard",    path: "/seller/dashboard",      tag: null },
    { emoji: "🛍️", name: "My Products",  path: "/seller/products",       tag: null },
    { emoji: "📦", name: "Orders",        path: "/seller/orders",         tag: "live" },
    { emoji: "📥", name: "Procurement",   path: "/seller/procurement",    tag: "new" },
    { emoji: "💰", name: "Revenue",       path: "/seller/revenue",        tag: null },
    { emoji: "📈", name: "Analytics",     path: "/seller/analytics",      tag: null },
    { emoji: "🚚", name: "Logistics",     path: "/seller/logistics",      tag: null },
    { emoji: "📊", name: "Market Trends", path: "/seller/market-trends",  tag: null },
    { emoji: "🤖", name: "AI Assistant",  path: "/seller/assistant",      tag: null },
    { emoji: "👤", name: "Profile",       path: "/seller/profile",        tag: null },
  ];

  const initials = (user.name || "S").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  // Get current page name for topbar
  const currentPage = nav.find(n => location.pathname.startsWith(n.path))?.name || "Seller Portal";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:        #06050f;
          --bg2:       #09081a;
          --sidebar:   #0b0a1f;
          --surface:   rgba(167,139,250,0.04);
          --surface2:  rgba(167,139,250,0.08);
          --border:    rgba(167,139,250,0.1);
          --border2:   rgba(167,139,250,0.2);
          --text:      #f0eeff;
          --text2:     #7a72a6;
          --accent:    #a78bfa;
          --accent2:   #7c3aed;
          --accent-dim: rgba(167,139,250,0.12);
          --sl-w:      248px;
          --sl-wc:     68px;
        }

        body { font-family:'Inter',sans-serif; background:var(--bg); color:var(--text); }

        /* ── WRAP ── */
        .sl-wrap { display:flex; min-height:100vh; }

        /* ── SIDEBAR ── */
        .sl-sidebar {
          position:fixed; top:0; left:0; bottom:0; z-index:50;
          width:var(--sl-w);
          background:var(--sidebar);
          border-right:1px solid var(--border);
          display:flex; flex-direction:column;
          transition:width 0.3s cubic-bezier(.4,0,.2,1);
          overflow:hidden;
        }
        .sl-sidebar.collapsed { width:var(--sl-wc); }

        /* Gradient glow at top of sidebar */
        .sl-sidebar::before {
          content:'';
          position:absolute; top:0; left:0; right:0; height:200px;
          background:radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.18) 0%, transparent 70%);
          pointer-events:none;
        }

        /* ── SIDEBAR HEADER ── */
        .sl-head {
          display:flex; align-items:center; gap:12px;
          padding:20px 16px; height:70px; flex-shrink:0;
          border-bottom:1px solid var(--border); overflow:hidden;
          position:relative;
        }
        .sl-logo-wrap {
          width:38px; height:38px; border-radius:12px; flex-shrink:0;
          background:linear-gradient(135deg,#7c3aed,#a78bfa);
          display:flex; align-items:center; justify-content:center;
          font-size:20px;
          box-shadow:0 4px 20px rgba(124,58,237,0.45);
        }
        .sl-brand-text { overflow:hidden; }
        .sl-brand-name {
          font-family:'Space Grotesk',sans-serif;
          font-size:14px; font-weight:800; color:#fff;
          white-space:nowrap; letter-spacing:-0.02em;
        }
        .sl-brand-role {
          display:inline-block; margin-top:2px;
          font-size:10px; font-weight:700; letter-spacing:0.08em;
          color:#a78bfa; text-transform:uppercase;
          background:rgba(167,139,250,0.12);
          border:1px solid rgba(167,139,250,0.2);
          padding:1px 7px; border-radius:20px;
        }

        /* ── NAV ── */
        .sl-nav { flex:1; overflow-y:auto; padding:16px 10px; display:flex; flex-direction:column; gap:3px; }
        .sl-nav::-webkit-scrollbar { width:0; }

        .sl-divider { font-size:10px; font-weight:700; color:var(--text2); text-transform:uppercase; letter-spacing:0.08em; padding:10px 12px 6px; white-space:nowrap; opacity:0.6; }

        .sl-link {
          display:flex; align-items:center; gap:12px;
          padding:11px 12px; border-radius:12px;
          text-decoration:none; color:var(--text2);
          font-size:13.5px; font-weight:500;
          transition:all 0.2s; white-space:nowrap; overflow:hidden;
          position:relative;
        }
        .sl-link:hover { background:var(--surface2); color:var(--text); }
        .sl-link.active {
          background:linear-gradient(135deg, rgba(124,58,237,0.18), rgba(167,139,250,0.08));
          color:#c4b5fd;
          border:1px solid rgba(167,139,250,0.2);
          font-weight:700;
          box-shadow:0 2px 12px rgba(124,58,237,0.15);
        }
        .sl-link.active::after {
          content:'';
          position:absolute; right:10px; top:50%; transform:translateY(-50%);
          width:6px; height:6px; border-radius:50%;
          background:var(--accent);
          box-shadow:0 0 8px rgba(167,139,250,0.8);
        }
        .sl-emoji { font-size:17px; flex-shrink:0; width:20px; text-align:center; }
        .sl-tag {
          margin-left:auto; font-size:9px; font-weight:800; letter-spacing:0.06em;
          background:rgba(167,139,250,0.15); color:#a78bfa;
          border:1px solid rgba(167,139,250,0.25);
          padding:2px 6px; border-radius:6px; text-transform:uppercase;
          animation:pulse 2s ease infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }

        /* ── FOOTER ── */
        .sl-foot {
          padding:12px 10px; border-top:1px solid var(--border); flex-shrink:0;
        }
        .sl-user {
          display:flex; align-items:center; gap:10px;
          padding:10px 12px; border-radius:12px; overflow:hidden;
          background:var(--surface); border:1px solid var(--border);
          margin-bottom:8px; cursor:default;
        }
        .sl-avatar {
          width:34px; height:34px; border-radius:10px; flex-shrink:0;
          background:linear-gradient(135deg,#7c3aed,#a78bfa);
          display:flex; align-items:center; justify-content:center;
          font-size:13px; font-weight:800; color:#fff;
          box-shadow:0 2px 8px rgba(124,58,237,0.3);
        }
        .sl-user-name { font-size:13px; font-weight:700; color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .sl-user-role { font-size:11px; color:var(--accent); font-weight:600; }
        .sl-logout {
          display:flex; align-items:center; gap:12px;
          padding:10px 12px; border-radius:12px; border:1px solid transparent;
          background:none; color:var(--text2); font-size:13.5px; font-weight:600;
          cursor:pointer; width:100%; text-align:left; font-family:'Inter',sans-serif;
          transition:all 0.2s; white-space:nowrap; overflow:hidden;
        }
        .sl-logout:hover { background:rgba(239,68,68,0.08); color:#f87171; border-color:rgba(239,68,68,0.15); }

        /* ── TOGGLE ── */
        .sl-toggle {
          position:fixed; top:22px; z-index:60;
          width:22px; height:22px; border-radius:6px;
          background:var(--sidebar); border:1px solid var(--border2);
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; font-size:11px; color:var(--text2);
          transition:left 0.3s cubic-bezier(.4,0,.2,1), background 0.2s;
        }
        .sl-toggle:hover { background:var(--surface2); color:#fff; }

        /* ── MAIN ── */
        .sl-main {
          margin-left:var(--sl-w);
          flex:1; min-height:100vh;
          display:flex; flex-direction:column;
          transition:margin-left 0.3s cubic-bezier(.4,0,.2,1);
          background:var(--bg);
        }
        .sl-main.collapsed { margin-left:var(--sl-wc); }

        /* ── TOPBAR ── */
        .sl-topbar {
          position:sticky; top:0; z-index:40; height:70px;
          background:rgba(6,5,15,0.85); backdrop-filter:blur(24px);
          border-bottom:1px solid var(--border);
          display:flex; align-items:center; justify-content:space-between;
          padding:0 28px;
        }
        .sl-topbar-left { display:flex; align-items:center; gap:16px; }
        .sl-page-name {
          font-family:'Space Grotesk',sans-serif;
          font-size:16px; font-weight:800; color:#fff; letter-spacing:-0.01em;
        }
        .sl-page-dot {
          width:8px; height:8px; border-radius:50%;
          background:var(--accent);
          box-shadow:0 0 12px rgba(167,139,250,0.7);
          animation:pulse 2s ease infinite;
        }
        .sl-topbar-right { display:flex; align-items:center; gap:12px; }
        .sl-time-chip {
          font-size:12px; color:var(--text2); font-weight:500;
          background:var(--surface); border:1px solid var(--border);
          padding:5px 14px; border-radius:20px;
        }
        .sl-topbar-avatar {
          width:36px; height:36px; border-radius:10px;
          background:linear-gradient(135deg,#7c3aed,#a78bfa);
          display:flex; align-items:center; justify-content:center;
          font-size:13px; font-weight:800; color:#fff; cursor:pointer;
          box-shadow:0 4px 14px rgba(124,58,237,0.35);
          transition:transform 0.2s;
        }
        .sl-topbar-avatar:hover { transform:scale(1.06); }

        /* ── CONTENT ── */
        .sl-content { flex:1; padding:28px 32px; }

        @media(max-width:768px){
          .sl-sidebar { width:var(--sl-wc) !important; }
          .sl-main { margin-left:var(--sl-wc) !important; }
          .sl-content { padding:20px 16px; }
        }
      `}</style>

      <div className="sl-wrap">
        {/* ── SIDEBAR ── */}
        <aside className={`sl-sidebar ${collapsed ? "collapsed" : ""}`}>
          <div className="sl-head">
            <div className="sl-logo-wrap">🛍️</div>
            {!collapsed && (
              <div className="sl-brand-text">
                <div className="sl-brand-name">AgroConnect 360</div>
                <span className="sl-brand-role">Seller Portal</span>
              </div>
            )}
          </div>

          <nav className="sl-nav">
            {!collapsed && <div className="sl-divider">Main Menu</div>}
            {nav.map(n => (
              <NavLink key={n.path} to={n.path} className={({ isActive }) => `sl-link${isActive ? " active" : ""}`} title={collapsed ? n.name : undefined}>
                <span className="sl-emoji">{n.emoji}</span>
                {!collapsed && <span>{n.name}</span>}
                {!collapsed && n.tag && <span className="sl-tag">{n.tag}</span>}
              </NavLink>
            ))}
          </nav>

          <div className="sl-foot">
            <div className="sl-user">
              <div className="sl-avatar">{initials}</div>
              {!collapsed && (
                <div style={{ overflow: "hidden", flex: 1 }}>
                  <div className="sl-user-name">{user.name || "Seller"}</div>
                  <div className="sl-user-role">🟣 Seller</div>
                </div>
              )}
            </div>
            <button className="sl-logout" onClick={handleLogout} title={collapsed ? "Logout" : undefined}>
              <span className="sl-emoji">🚪</span>
              {!collapsed && "Logout"}
            </button>
          </div>
        </aside>

        {/* ── TOGGLE ── */}
        <button
          className="sl-toggle"
          style={{ left: collapsed ? "calc(var(--sl-wc) - 11px)" : "calc(var(--sl-w) - 11px)" }}
          onClick={() => setCollapsed(c => !c)}
        >
          {collapsed ? "›" : "‹"}
        </button>

        {/* ── MAIN ── */}
        <div className={`sl-main ${collapsed ? "collapsed" : ""}`}>
          <header className="sl-topbar">
            <div className="sl-topbar-left">
              <div className="sl-page-dot" />
              <div className="sl-page-name">{currentPage}</div>
            </div>
            <div className="sl-topbar-right">
              <div className="sl-time-chip">
                {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
              </div>
              <div className="sl-topbar-avatar" title={user.name} onClick={() => navigate("/seller/profile")} style={{ cursor: "pointer" }}>{initials}</div>

            </div>
          </header>

          <main className="sl-content">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}
