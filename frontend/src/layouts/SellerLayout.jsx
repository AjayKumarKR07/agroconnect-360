import { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Boxes, Package, ClipboardList, IndianRupee,
  BarChart3, Truck, TrendingUp, Bot, User, Store,
  Repeat2, LogOut, ChevronLeft, ChevronRight
} from "lucide-react";

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
    { icon: LayoutDashboard, name: "Dashboard",    path: "/seller/dashboard",      tag: null },
    { icon: Boxes,           name: "My Products",  path: "/seller/products",       tag: null },
    { icon: Package,         name: "Orders",        path: "/seller/orders",         tag: "live" },
    { icon: ClipboardList,   name: "Procurement",   path: "/seller/procurement",    tag: "new" },
    { icon: IndianRupee,     name: "Revenue",       path: "/seller/revenue",        tag: null },
    { icon: BarChart3,       name: "Analytics",     path: "/seller/analytics",      tag: null },
    { icon: Truck,           name: "Logistics",     path: "/seller/logistics",      tag: null },
    { icon: TrendingUp,      name: "Market Trends", path: "/seller/market-trends",  tag: null },
    { icon: Bot,             name: "AI Assistant",  path: "/seller/assistant",      tag: null },
    { icon: User,            name: "Profile",       path: "/seller/profile",        tag: null },
  ];

  const initials = (user.name || "S").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const currentPage = nav.find(n => location.pathname.startsWith(n.path))?.name || "Seller Portal";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:        #f8fafc;
          --bg2:       #f1f5f9;
          --sidebar:   #ffffff;
          --surface:   #ffffff;
          --surface2:  #f8fafc;
          --border:    #e2e8f0;
          --border2:   #cbd5e1;
          --text:      #0f172a;
          --text2:     #64748b;
          --accent:    #7c3aed;
          --accent2:   #6d28d9;
          --accent-dim:#f3e8ff;
          --sl-w:      248px;
          --sl-wc:     68px;
        }

        body { font-family:'Inter',sans-serif; background:var(--bg); color:var(--text); }

        .sl-wrap { display:flex; min-height:100vh; }

        /* ── SIDEBAR ── */
        .sl-sidebar {
          position:fixed; top:0; left:0; bottom:0; z-index:50;
          width:var(--sl-w);
          background:var(--sidebar);
          border-right:1px solid var(--border);
          display:flex; flex-direction:column;
          transition:width 0.25s ease;
          overflow:hidden;
          box-shadow: 1px 0 3px rgba(0, 0, 0, 0.02);
        }
        .sl-sidebar.collapsed { width:var(--sl-wc); }

        .sl-head {
          display:flex; align-items:center; gap:12px;
          padding:20px 16px; height:66px; flex-shrink:0;
          border-bottom:1px solid var(--border); overflow:hidden;
          position:relative;
        }
        .sl-logo-wrap {
          width:38px; height:38px; border-radius:10px; flex-shrink:0;
          background:#7c3aed;
          display:flex; align-items:center; justify-content:center;
          font-size:20px; color:#0f172a;
        }
        .sl-brand-text { overflow:hidden; }
        .sl-brand-name {
          font-family:'Space Grotesk',sans-serif;
          font-size:14px; font-weight:800; color:var(--text);
          white-space:nowrap; letter-spacing:-0.02em;
        }
        .sl-brand-role {
          display:inline-block; margin-top:2px;
          font-size:10px; font-weight:700; letter-spacing:0.08em;
          color:#6d28d9; text-transform:uppercase;
          background:#f3e8ff;
          border:1px solid #ddd6fe;
          padding:1px 7px; border-radius:20px;
        }

        .sl-nav { flex:1; overflow-y:auto; padding:16px 10px; display:flex; flex-direction:column; gap:3px; }
        .sl-nav::-webkit-scrollbar { width:4px; }
        .sl-nav::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:3px; }
        .sl-divider { font-size:10px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.08em; padding:10px 12px 6px; white-space:nowrap; }

        .sl-link {
          display:flex; align-items:center; gap:12px;
          padding:10px 12px; border-radius:10px;
          text-decoration:none; color:#475569;
          font-size:13.5px; font-weight:500;
          transition:all 0.15s ease; white-space:nowrap; overflow:hidden; position:relative;
        }
        .sl-link:hover { background:#f1f5f9; color:#0f172a; }
        .sl-link.active {
          background:#f3e8ff;
          color:#6d28d9; border:1px solid #ddd6fe;
          font-weight:600;
        }
        .sl-link.active::after {
          content:''; position:absolute; right:10px; top:50%; transform:translateY(-50%);
          width:6px; height:6px; border-radius:50%;
          background:var(--accent);
        }
        .sl-emoji { font-size:16px; flex-shrink:0; width:20px; text-align:center; }

        .sl-tag {
          margin-left:auto; font-size:10px; font-weight:700;
          padding:2px 7px; border-radius:6px; text-transform:uppercase; letter-spacing:0.04em;
          background:#f3e8ff; color:#6d28d9; border:1px solid #ddd6fe;
        }

        .sl-foot { padding:12px 10px; border-top:1px solid var(--border); flex-shrink:0; background:#f8fafc; }
        .sl-user {
          display:flex; align-items:center; gap:10px;
          padding:8px 10px; border-radius:8px; overflow:hidden;
          background:#ffffff; border:1px solid var(--border);
          margin-bottom:8px;
        }
        .sl-avatar {
          width:32px; height:32px; border-radius:8px; flex-shrink:0;
          background:#7c3aed;
          display:flex; align-items:center; justify-content:center;
          font-size:12px; font-weight:800; color:#0f172a;
        }
        .sl-user-name { font-size:13px; font-weight:700; color:var(--text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .sl-user-role { font-size:11px; color:var(--accent); font-weight:600; }

        .sl-logout {
          display:flex; align-items:center; gap:10px;
          padding:8px 10px; border-radius:8px; border:none;
          background:none; color:#64748b; font-size:13px; font-weight:500;
          cursor:pointer; width:100%; text-align:left; font-family:'Inter',sans-serif;
          transition:all 0.15s; white-space:nowrap; overflow:hidden;
        }
        .sl-logout:hover { background:#fee2e2; color:#dc2626; }

        .sl-switch-role {
          display:flex; align-items:center; gap:10px;
          padding:8px 10px; border-radius:8px;
          background:#f3e8ff; border:1px solid #ddd6fe;
          color:#6d28d9; font-size:13px; font-weight:600;
          cursor:pointer; width:100%; text-align:left; font-family:'Inter',sans-serif;
          transition:all 0.15s; white-space:nowrap; overflow:hidden;
          margin-bottom:6px;
        }
        .sl-switch-role:hover { background:#ede9fe; }

        .sl-topbar-role-btn {
          display:inline-flex; align-items:center; gap:6px;
          padding:6px 14px; border-radius:20px;
          background:#f3e8ff; border:1px solid #ddd6fe;
          color:#6d28d9; font-size:12px; font-weight:600;
          cursor:pointer; font-family:'Inter',sans-serif;
          transition:all 0.15s;
        }
        .sl-topbar-role-btn:hover { background:#ede9fe; }

        .sl-toggle {
          position:fixed; top:22px; z-index:60;
          width:22px; height:22px; border-radius:6px;
          background:#ffffff; border:1px solid #cbd5e1;
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; font-size:11px; color:#475569;
          transition:left 0.25s ease;
          box-shadow:0 1px 3px rgba(0,0,0,0.08);
        }
        .sl-toggle:hover { color:#0f172a; border-color:#94a3b8; }

        .sl-main {
          margin-left:var(--sl-w); flex:1; min-height:100vh;
          display:flex; flex-direction:column;
          transition:margin-left 0.25s ease;
          background:var(--bg);
        }
        .sl-main.collapsed { margin-left:var(--sl-wc); }

        .sl-topbar {
          position:sticky; top:0; z-index:40; height:66px;
          background:#ffffff;
          border-bottom:1px solid var(--border);
          display:flex; align-items:center; justify-content:space-between;
          padding:0 28px;
        }
        .sl-topbar-left { display:flex; align-items:center; gap:14px; }
        .sl-page-dot { width:8px; height:8px; border-radius:50%; background:var(--accent); }
        .sl-page-name { font-family:'Space Grotesk',sans-serif; font-size:16px; font-weight:800; color:var(--text); }
        .sl-topbar-right { display:flex; align-items:center; gap:12px; }
        .sl-time-chip { font-size:12px; color:var(--text2); background:#f8fafc; border:1px solid var(--border); padding:5px 14px; border-radius:20px; font-weight:500; }
        .sl-topbar-avatar {
          width:36px; height:36px; border-radius:8px;
          background:#7c3aed;
          display:flex; align-items:center; justify-content:center;
          font-size:13px; font-weight:800; color:#0f172a; cursor:pointer;
        }

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
            <div className="sl-logo-wrap"><Store size={17} color="#ffffff" strokeWidth={2} /></div>
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
                {(() => { const Icon = n.icon; return <Icon size={17} strokeWidth={1.75} />; })()}
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
                  <div className="sl-user-role">Seller / Trader</div>
                </div>
              )}
            </div>
            <button
              className="sl-switch-role"
              onClick={() => navigate("/select-role", { state: { isNewUser: false } })}
              title={collapsed ? "Switch Role" : undefined}
            >
              <Repeat2 size={15} strokeWidth={2} style={{ flexShrink: 0 }} />
              {!collapsed && "Switch Role"}
            </button>
            <button className="sl-logout" onClick={handleLogout} title={collapsed ? "Logout" : undefined}>
              <LogOut size={15} strokeWidth={2} style={{ flexShrink: 0 }} />
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
          {collapsed ? <ChevronRight size={11} strokeWidth={2.5} /> : <ChevronLeft size={11} strokeWidth={2.5} />}
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
              <button
                className="sl-topbar-role-btn"
                onClick={() => navigate("/select-role", { state: { isNewUser: false } })}
                title="Switch Role"
              >
                <Repeat2 size={13} strokeWidth={2} /> Switch Role
              </button>
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
