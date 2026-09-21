import { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Globe2, Inbox, Ship, FileText, FileCheck,
  Calculator, DollarSign, Bot, User,
  Repeat2, LogOut, ChevronLeft, ChevronRight
} from "lucide-react";

export default function ExporterLayout() {
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
    { icon: LayoutDashboard, name: "Overview",        path: "/exporter/dashboard" },
    { icon: Globe2,          name: "Global Sourcing",  path: "/exporter/sourcing" },
    { icon: Inbox,           name: "My Interests",     path: "/exporter/my-interests" },
    { icon: Ship,            name: "Shipments & Port", path: "/exporter/logistics" },
    { icon: FileText,        name: "Contracts & LC",   path: "/exporter/contracts" },
    { icon: FileCheck,       name: "Customs & Docs",   path: "/exporter/compliance" },
    { icon: Calculator,      name: "Margin Calc",      path: "/exporter/calculator" },
    { icon: DollarSign,      name: "FX & Markets",     path: "/exporter/markets" },
    { icon: Bot,             name: "AI Assistant",     path: "/exporter/assistant" },
    { icon: User,            name: "Profile",          path: "/exporter/profile" },
  ];

  const initials = (user.name || "E").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const currentPage = nav.find(n => location.pathname.startsWith(n.path))?.name || "Exporter Portal";

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
          --accent:    #d97706;
          --accent2:   #b45309;
          --accent-dim:#fef3c7;
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
          transition:width 0.25s ease;
          overflow:hidden;
          box-shadow: 1px 0 3px rgba(0, 0, 0, 0.02);
        }
        .ul-sidebar.collapsed { width:var(--ul-wc); }

        .ul-head {
          display:flex; align-items:center; gap:12px;
          padding:20px 16px; height:66px; flex-shrink:0;
          border-bottom:1px solid var(--border); overflow:hidden; position:relative;
        }
        .ul-logo {
          width:38px; height:38px; border-radius:10px; flex-shrink:0;
          background:#d97706;
          display:flex; align-items:center; justify-content:center;
          font-size:20px; color:#0f172a;
        }
        .ul-brand-name { font-family:'Space Grotesk',sans-serif; font-size:14px; font-weight:800; color:var(--text); white-space:nowrap; }
        .ul-brand-role {
          display:inline-block; margin-top:2px; font-size:10px; font-weight:700;
          letter-spacing:0.08em; color:#b45309; text-transform:uppercase;
          background:#fef3c7; border:1px solid #fde68a;
          padding:1px 7px; border-radius:20px;
        }

        .ul-nav { flex:1; overflow-y:auto; padding:16px 10px; display:flex; flex-direction:column; gap:3px; }
        .ul-nav::-webkit-scrollbar { width:4px; }
        .ul-nav::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:3px; }
        .ul-divider { font-size:10px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.08em; padding:10px 12px 6px; white-space:nowrap; }

        .ul-link {
          display:flex; align-items:center; gap:12px;
          padding:10px 12px; border-radius:10px;
          text-decoration:none; color:#475569;
          font-size:13.5px; font-weight:500;
          transition:all 0.15s ease; white-space:nowrap; overflow:hidden; position:relative;
        }
        .ul-link:hover { background:#f1f5f9; color:#0f172a; }
        .ul-link.active {
          background:#fef3c7;
          color:#92400e; border:1px solid #fde68a;
          font-weight:600;
        }
        .ul-link.active::after {
          content:''; position:absolute; right:10px; top:50%; transform:translateY(-50%);
          width:6px; height:6px; border-radius:50%;
          background:var(--accent);
        }
        .ul-emoji { font-size:16px; flex-shrink:0; width:20px; text-align:center; }

        .ul-foot { padding:12px 10px; border-top:1px solid var(--border); flex-shrink:0; background:#f8fafc; }
        .ul-user {
          display:flex; align-items:center; gap:10px;
          padding:8px 10px; border-radius:8px; overflow:hidden;
          background:#ffffff; border:1px solid var(--border);
          margin-bottom:8px;
        }
        .ul-avatar {
          width:32px; height:32px; border-radius:8px; flex-shrink:0;
          background:#d97706;
          display:flex; align-items:center; justify-content:center;
          font-size:12px; font-weight:800; color:#0f172a;
        }
        .ul-user-name { font-size:13px; font-weight:700; color:var(--text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .ul-user-role { font-size:11px; color:var(--accent); font-weight:600; }

        .ul-logout {
          display:flex; align-items:center; gap:10px;
          padding:8px 10px; border-radius:8px; border:none;
          background:none; color:#64748b; font-size:13px; font-weight:500;
          cursor:pointer; width:100%; text-align:left; font-family:'Inter',sans-serif;
          transition:all 0.15s; white-space:nowrap; overflow:hidden;
        }
        .ul-logout:hover { background:#fee2e2; color:#dc2626; }

        .ul-switch-role {
          display:flex; align-items:center; gap:10px;
          padding:8px 10px; border-radius:8px;
          background:#fef3c7; border:1px solid #fde68a;
          color:#b45309; font-size:13px; font-weight:600;
          cursor:pointer; width:100%; text-align:left; font-family:'Inter',sans-serif;
          transition:all 0.15s; white-space:nowrap; overflow:hidden;
          margin-bottom:6px;
        }
        .ul-switch-role:hover { background:#fde68a; }

        .ul-topbar-role-btn {
          display:inline-flex; align-items:center; gap:6px;
          padding:6px 14px; border-radius:20px;
          background:#fef3c7; border:1px solid #fde68a;
          color:#b45309; font-size:12px; font-weight:600;
          cursor:pointer; font-family:'Inter',sans-serif;
          transition:all 0.15s;
        }
        .ul-topbar-role-btn:hover { background:#fde68a; }

        /* ── TOGGLE ── */
        .ul-toggle {
          position:fixed; top:22px; z-index:60;
          width:22px; height:22px; border-radius:6px;
          background:#ffffff; border:1px solid #cbd5e1;
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; font-size:11px; color:#475569;
          transition:left 0.25s ease;
          box-shadow:0 1px 3px rgba(0,0,0,0.08);
        }
        .ul-toggle:hover { color:#0f172a; border-color:#94a3b8; }

        /* ── MAIN ── */
        .ul-main {
          margin-left:var(--ul-w); flex:1; min-height:100vh;
          display:flex; flex-direction:column;
          transition:margin-left 0.25s ease;
          background:var(--bg);
        }
        .ul-main.collapsed { margin-left:var(--ul-wc); }

        /* ── TOPBAR ── */
        .ul-topbar {
          position:sticky; top:0; z-index:40; height:66px;
          background:#ffffff;
          border-bottom:1px solid var(--border);
          display:flex; align-items:center; justify-content:space-between;
          padding:0 28px;
        }
        .ul-page-dot { width:8px; height:8px; border-radius:50%; background:var(--accent); }
        .ul-page-name { font-family:'Space Grotesk',sans-serif; font-size:16px; font-weight:800; color:var(--text); }
        .ul-time-chip { font-size:12px; color:#475569; background:#f8fafc; border:1px solid var(--border); padding:5px 14px; border-radius:20px; font-weight:500; }
        .ul-topbar-avatar {
          width:36px; height:36px; border-radius:8px;
          background:#d97706;
          display:flex; align-items:center; justify-content:center;
          font-size:13px; font-weight:800; color:#0f172a; cursor:pointer;
        }

        .ul-content { flex:1; padding:28px 32px; }

        @media(max-width:768px){
          .ul-sidebar { width:var(--ul-wc) !important; }
          .ul-main { margin-left:var(--ul-wc) !important; }
          .ul-content { padding:20px 16px; }
        }

        /* ══════════════════════════════════════════════════════════════════
           GLOBAL EXPORTER DARK AMBER THEME — applies to ALL sub-pages.
           The sidebar (.ul-*) uses hardcoded classes and is unaffected.
        ══════════════════════════════════════════════════════════════════ */

        /* CSS variable override — dark amber content area */
        :root {
          --bg:       #f8fafc;
          --bg2:      #f1f5f9;
          --surface:  #ffffff;
          --surface2: #f8fafc;
          --border:   #e2e8f0;
          --border2:  #cbd5e1;
          --text:     #0f172a;
          --text2:    #475569;
          --text3:    #64748b;
          --accent:   #f59e0b;
          --accent2:  #d97706;
        }

        /* Main content area gets dark background */
        body { background:#f8fafc; color:#0f172a; }

        /* ── Page-level typography ── */
        .pg-title  { color:#0f172a !important; }
        .pg-sub    { color:#64748b !important; }
        .eyebrow   { color:#f59e0b !important; }
        .card-title{ color:#0f172a !important; }
        .card-sub  { color:#64748b !important; }

        /* ── Cards ── */
        .card {
          background:#ffffff !important;
          border:1px solid #e2e8f0 !important;
        }
        .stat-card {
          background:#ffffff !important;
          border:1px solid #e2e8f0 !important;
        }
        .stat-val { color:#0f172a !important; }
        .stat-lbl { color:#475569 !important; }

        /* ── Form inputs ── */
        .field-input {
          color:#0f172a !important;
          background:#ffffff !important;
          border:1px solid #e2e8f0 !important;
        }
        .field-input::placeholder { color:#64748b !important; }
        .field-input:focus {
          border-color:rgba(245,158,11,0.5) !important;
          box-shadow:0 0 0 3px rgba(245,158,11,0.1) !important;
        }
        select.field-input option { background:#ffffff; color:#0f172a; }
        .field-label { color:#64748b !important; }

        /* ── Badges — light enough to read on #0f0b05 ── */
        .badge-green  { background:rgba(34,197,94,0.1);   color:#15803d; border:1px solid rgba(34,197,94,0.25);  }
        .badge-amber  { background:rgba(245,158,11,0.1);  color:#d97706; border:1px solid #e2e8f0; }
        .badge-red    { background:rgba(239,68,68,0.1);   color:#dc2626; border:1px solid rgba(239,68,68,0.25);  }
        .badge-blue   { background:rgba(56,189,248,0.1);  color:#0284c7; border:1px solid rgba(56,189,248,0.25); }
        .badge-purple { background:rgba(139,92,246,0.1);  color:#7c3aed; border:1px solid rgba(139,92,246,0.25); }
        .badge-grey   { background:rgba(100,116,139,0.1); color:#64748b; border:1px solid rgba(100,116,139,0.2); }
        .badge-gold   { background:rgba(245,158,11,0.1);  color:#d97706; border:1px solid #e2e8f0; }

        /* ── Amber + ghost buttons ── */
        .btn-amber, .btn-gold {
          display:inline-flex; align-items:center; gap:8px;
          background:linear-gradient(135deg,#d97706,#f59e0b);
          color:#0f172a !important; font-weight:700; font-size:14px;
          padding:10px 20px; border-radius:12px; border:none;
          cursor:pointer; font-family:'Inter',sans-serif;
          box-shadow:0 4px 14px rgba(245,158,11,0.2);
          transition:opacity 0.18s,transform 0.18s; text-decoration:none;
        }
        .btn-amber:hover, .btn-gold:hover { opacity:0.88; transform:translateY(-1px); }
        .btn-ghost {
          color:#0f172a !important;
          border-color:#e2e8f0 !important;
          background:#ffffff !important;
        }
        .btn-ghost:hover {
          background:#f8fafc !important;
          border-color:#cbd5e1 !important;
        }

        /* ── Tables ── */
        .data-table th {
          color:#64748b !important;
          border-bottom-color:#e2e8f0 !important;
          background:#f8fafc !important;
        }
        .data-table td {
          color:#0f172a !important;
          border-bottom-color:#f1f5f9 !important;
        }
        .data-table tr:hover td { background:rgba(245,158,11,0.04) !important; }

        /* ── Spinner ── */
        .spinner { border-top-color:#f59e0b !important; }
        .section-error { background:rgba(239,68,68,0.08) !important; border-color:rgba(239,68,68,0.2) !important; }
      `}</style>

      <div className="ul-wrap">
        <aside className={`ul-sidebar ${collapsed ? "collapsed" : ""}`}>
          <div className="ul-head">
            <div className="ul-logo"><Globe2 size={17} color="#ffffff" strokeWidth={2} /></div>
            {!collapsed && (
              <div>
                <div className="ul-brand-name">AgroConnect 360</div>
                <span className="ul-brand-role">Global Exporter</span>
              </div>
            )}
          </div>

          <nav className="ul-nav">
            {!collapsed && <div className="ul-divider">Global Navigation</div>}
            {nav.map(n => (
              <NavLink key={n.path} to={n.path} className={({ isActive }) => `ul-link${isActive ? " active" : ""}`} title={collapsed ? n.name : undefined}>
                {(() => { const Icon = n.icon; return <Icon size={17} strokeWidth={1.75} />; })()}
                {!collapsed && <span>{n.name}</span>}
              </NavLink>
            ))}
          </nav>

          <div className="ul-foot">
            <div className="ul-user">
              <div className="ul-avatar">{initials}</div>
              {!collapsed && (
                <div style={{ overflow: "hidden", flex: 1 }}>
                  <div className="ul-user-name">{user.name || "Exporter"}</div>
                  <div className="ul-user-role">Exporter</div>
                </div>
              )}
            </div>
            <button
              className="ul-switch-role"
              onClick={() => navigate("/select-role", { state: { isNewUser: false } })}
              title={collapsed ? "Switch Role" : undefined}
            >
              <Repeat2 size={15} strokeWidth={2} style={{ flexShrink: 0 }} />
              {!collapsed && "Switch Role"}
            </button>
            <button className="ul-logout" onClick={handleLogout} title={collapsed ? "Logout" : undefined}>
              <LogOut size={15} strokeWidth={2} style={{ flexShrink: 0 }} />
              {!collapsed && "Logout"}
            </button>
          </div>
        </aside>

        <button className="ul-toggle"
          style={{ left: collapsed ? "calc(var(--ul-wc) - 11px)" : "calc(var(--ul-w) - 11px)" }}
          onClick={() => setCollapsed(c => !c)}>
          {collapsed ? <ChevronRight size={11} strokeWidth={2.5} /> : <ChevronLeft size={11} strokeWidth={2.5} />}
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
                <Repeat2 size={13} strokeWidth={2} /> Switch Role
              </button>
              <div className="ul-topbar-avatar" title={user.name} onClick={() => navigate("profile")} style={{ cursor: "pointer" }}>{initials}</div>
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
