import { useState, useEffect, useCallback } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";

export default function FarmerLayout() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const user = JSON.parse(localStorage.getItem("agroconnect_user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("agroconnect_token");
    localStorage.removeItem("agroconnect_user");
    navigate("/login", { replace: true });
  };

  const fetchUnread = useCallback(() => {
    const token = localStorage.getItem("agroconnect_token");
    if (!token) return;
    fetch(`${API_URL}/api/farmer/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.unreadCount !== undefined) setUnreadCount(d.unreadCount); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchUnread();
    const id = setInterval(fetchUnread, 60000);
    return () => clearInterval(id);
  }, [fetchUnread]);

  const navGroups = [
    {
      label: "Overview",
      items: [
        { emoji: "🏠", name: "Dashboard",      path: "/farmer/dashboard" },
        { emoji: "🌾", name: "My Farm",         path: "/farmer/my-farm" },
        { emoji: "📊", name: "Farm Analytics",  path: "/farmer/farm-analytics" },
      ],
    },
    {
      label: "Crops",
      items: [
        { emoji: "🌿", name: "My Crops",          path: "/farmer/crops" },
        { emoji: "🩺", name: "Health History",    path: "/farmer/crop-health-history" },
        { emoji: "🔬", name: "Disease Detection", path: "/farmer/disease-detection" },
      ],
    },
    {
      label: "Market",
      items: [
        { emoji: "📈", name: "Price Prediction",   path: "/farmer/price-prediction" },
        { emoji: "📊", name: "Market Trends",      path: "/farmer/market-trends" },
        { emoji: "🏪", name: "Market Comparison",  path: "/farmer/market-comparison" },
      ],
    },
    {
      label: "Planning",
      items: [
        { emoji: "🌾", name: "Smart Farm Planner", path: "/farmer/smart-farm-planner" },
        { emoji: "💾", name: "Saved Plans",         path: "/farmer/saved-plans" },
        { emoji: "🤖", name: "AI Assistant",        path: "/farmer/assistant" },
      ],
    },
    {
      label: "Business",
      items: [
        { emoji: "📦", name: "Orders",     path: "/farmer/orders" },
        { emoji: "💰", name: "Income",     path: "/farmer/income" },
        { emoji: "🛒", name: "Buy Inputs", path: "/farmer/inputs" },
        { emoji: "🚢", name: "Export",     path: "/farmer/export" },
      ],
    },
    {
      label: "Tools",
      items: [
        { emoji: "🌦️", name: "Weather",  path: "/farmer/weather" },
        { emoji: "👤", name: "Profile",   path: "/farmer/profile" },
      ],
    },
  ];

  const initials = (user.name || "F").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:      #050a0e;
          --bg2:     #080d12;
          --sidebar: #07111a;
          --surface: rgba(255,255,255,0.04);
          --surface2:rgba(255,255,255,0.07);
          --border:  rgba(255,255,255,0.07);
          --border2: rgba(255,255,255,0.12);
          --text:    #f0f6ff;
          --text2:   #7a8fa6;
          --green:   #22c55e;
          --green-dim:rgba(34,197,94,0.12);
          --sidebar-w: 240px;
          --sidebar-w-c: 64px;
        }

        body { font-family:'Inter',sans-serif; background:var(--bg); color:var(--text); }

        .fl-wrap { display:flex; min-height:100vh; background:var(--bg); }

        .fl-sidebar {
          position:fixed; top:0; left:0; bottom:0; z-index:50;
          width:var(--sidebar-w);
          background:var(--sidebar);
          border-right:1px solid var(--border);
          display:flex; flex-direction:column;
          transition:width 0.25s ease;
          overflow:hidden;
        }
        .fl-sidebar.collapsed { width:var(--sidebar-w-c); }

        .fl-sidebar-head {
          display:flex; align-items:center; gap:10px;
          padding:18px 16px; border-bottom:1px solid var(--border);
          height:66px; flex-shrink:0; overflow:hidden;
        }
        .fl-logo-icon {
          width:36px; height:36px; border-radius:10px; flex-shrink:0;
          background:linear-gradient(135deg,#16a34a,#059669);
          display:flex; align-items:center; justify-content:center;
          font-size:18px; box-shadow:0 4px 14px rgba(34,197,94,0.3);
        }
        .fl-logo-text { overflow:hidden; white-space:nowrap; }
        .fl-logo-name { font-family:'Space Grotesk',sans-serif; font-size:15px; font-weight:800; color:#fff; }
        .fl-logo-sub { font-size:10px; color:var(--text2); }

        .fl-nav { flex:1; overflow-y:auto; padding:10px 8px; }
        .fl-nav::-webkit-scrollbar { width:3px; }
        .fl-nav::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:3px; }

        .fl-nav-group { margin-bottom:14px; }
        .fl-nav-group-label {
          font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.08em;
          color:var(--text2); padding:4px 12px 6px; white-space:nowrap; overflow:hidden;
        }

        .fl-nav-item {
          display:flex; align-items:center; gap:10px;
          padding:9px 12px; border-radius:10px; margin-bottom:2px;
          text-decoration:none; color:var(--text2);
          font-size:13px; font-weight:500;
          transition:background 0.15s, color 0.15s;
          white-space:nowrap; overflow:hidden;
          position:relative;
        }
        .fl-nav-item:hover { background:var(--surface2); color:var(--text); }
        .fl-nav-item.active {
          background:var(--green-dim);
          color:#4ade80;
          border:1px solid rgba(34,197,94,0.15);
        }
        .fl-nav-item.active::before {
          content:''; position:absolute; left:0; top:20%; bottom:20%;
          width:3px; border-radius:0 2px 2px 0;
          background:var(--green);
        }
        .fl-nav-emoji { font-size:17px; flex-shrink:0; }
        .fl-nav-label { overflow:hidden; white-space:nowrap; flex:1; }

        .fl-sidebar-foot { border-top:1px solid var(--border); padding:12px 8px; flex-shrink:0; }
        .fl-user-row {
          display:flex; align-items:center; gap:10px;
          padding:10px 12px; border-radius:10px; margin-bottom:4px; overflow:hidden;
        }
        .fl-avatar {
          width:32px; height:32px; border-radius:8px; flex-shrink:0;
          background:linear-gradient(135deg,#16a34a,#059669);
          display:flex; align-items:center; justify-content:center;
          font-size:13px; font-weight:800; color:#fff;
        }
        .fl-user-name { font-size:13px; font-weight:600; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .fl-user-role { font-size:11px; color:var(--text2); }

        .fl-logout {
          display:flex; align-items:center; gap:10px;
          padding:10px 12px; border-radius:10px; width:100%;
          background:none; border:none; cursor:pointer;
          color:var(--text2); font-size:13px; font-weight:500;
          font-family:'Inter',sans-serif;
          transition:background 0.15s, color 0.15s;
          text-align:left; white-space:nowrap; overflow:hidden;
        }
        .fl-logout:hover { background:rgba(239,68,68,0.1); color:#f87171; }

        .fl-switch-role {
          display:flex; align-items:center; gap:10px;
          padding:9px 12px; border-radius:10px; width:100%;
          background:rgba(56,189,248,0.08); border:1px solid rgba(56,189,248,0.2);
          cursor:pointer; color:#38bdf8; font-size:13px; font-weight:600;
          font-family:'Inter',sans-serif;
          transition:all 0.15s;
          text-align:left; white-space:nowrap; overflow:hidden;
          margin-bottom:6px;
        }
        .fl-switch-role:hover { background:rgba(56,189,248,0.16); border-color:rgba(56,189,248,0.35); color:#7dd3fc; }

        .fl-topbar-role-btn {
          display:inline-flex; align-items:center; gap:6px;
          padding:6px 12px; border-radius:20px;
          background:rgba(56,189,248,0.08); border:1px solid rgba(56,189,248,0.25);
          color:#38bdf8; font-size:12px; font-weight:600;
          cursor:pointer; font-family:'Inter',sans-serif;
          transition:all 0.2s;
        }
        .fl-topbar-role-btn:hover { background:rgba(56,189,248,0.16); color:#7dd3fc; }

        .fl-toggle {
          position:fixed; top:20px; z-index:51;
          width:24px; height:24px; border-radius:6px;
          background:var(--sidebar); border:1px solid var(--border2);
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; font-size:12px; color:var(--text2);
          transition:left 0.25s ease, color 0.2s;
        }
        .fl-toggle:hover { color:#fff; }

        .fl-main {
          flex:1;
          margin-left:var(--sidebar-w);
          transition:margin-left 0.25s ease;
          min-height:100vh;
          display:flex; flex-direction:column;
        }
        .fl-main.collapsed { margin-left:var(--sidebar-w-c); }

        .fl-topbar {
          position:sticky; top:0; z-index:30; height:66px;
          background:rgba(5,10,14,0.85); backdrop-filter:blur(20px);
          border-bottom:1px solid var(--border);
          display:flex; align-items:center; justify-content:space-between;
          padding:0 28px;
        }
        .fl-topbar-left { display:flex; align-items:center; gap:12px; }
        .fl-breadcrumb { font-size:14px; color:var(--text2); }
        .fl-breadcrumb-cur { color:var(--text); font-weight:600; }

        .fl-topbar-right { display:flex; align-items:center; gap:12px; }
        .fl-topbar-time {
          font-size:13px; color:var(--text2);
          background:var(--surface); padding:5px 12px; border-radius:8px;
          border:1px solid var(--border);
        }
        .fl-notif-btn {
          position:relative; width:36px; height:36px; border-radius:10px;
          background:var(--surface); border:1px solid var(--border);
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; font-size:16px; transition:background .2s;
        }
        .fl-notif-btn:hover { background:var(--surface2); }
        .fl-notif-badge {
          position:absolute; top:-4px; right:-4px;
          width:18px; height:18px; border-radius:50%;
          background:#ef4444; color:#fff; font-size:10px; font-weight:800;
          display:flex; align-items:center; justify-content:center;
          border:2px solid var(--sidebar);
        }
        .fl-topbar-avatar {
          width:36px; height:36px; border-radius:10px;
          background:linear-gradient(135deg,#16a34a,#059669);
          display:flex; align-items:center; justify-content:center;
          font-size:14px; font-weight:800; color:#fff;
          cursor:pointer;
          box-shadow:0 4px 12px rgba(34,197,94,0.25);
        }

        .fl-content { flex:1; padding:28px 32px; }

        @media(max-width:768px){
          .fl-sidebar { width:var(--sidebar-w-c) !important; }
          .fl-nav-group-label,.fl-nav-label,.fl-user-name,.fl-user-role { display:none; }
          .fl-main { margin-left:var(--sidebar-w-c) !important; }
          .fl-content { padding:20px 16px; }
        }
      `}</style>

      <div className="fl-wrap">
        {/* SIDEBAR */}
        <aside className={`fl-sidebar ${collapsed ? "collapsed" : ""}`}>
          <div className="fl-sidebar-head">
            <div className="fl-logo-icon">🌱</div>
            {!collapsed && (
              <div className="fl-logo-text">
                <div className="fl-logo-name">AgroConnect 360</div>
                <div className="fl-logo-sub">Farmer Portal</div>
              </div>
            )}
          </div>

          <nav className="fl-nav">
            {navGroups.map((group) => (
              <div key={group.label} className="fl-nav-group">
                {!collapsed && <div className="fl-nav-group-label">{group.label}</div>}
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `fl-nav-item ${isActive ? "active" : ""}`}
                    title={collapsed ? item.name : undefined}
                  >
                    <span className="fl-nav-emoji">{item.emoji}</span>
                    {!collapsed && <span className="fl-nav-label">{item.name}</span>}
                    {item.path === "/farmer/notifications" && unreadCount > 0 && !collapsed && (
                      <span style={{ marginLeft: "auto", background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 10 }}>
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>

          <div className="fl-sidebar-foot">
            <div className="fl-user-row">
              <div className="fl-avatar">{initials}</div>
              {!collapsed && (
                <div>
                  <div className="fl-user-name">{user.name || "Farmer"}</div>
                  <div className="fl-user-role">Farmer</div>
                </div>
              )}
            </div>
            <button
              className="fl-switch-role"
              onClick={() => navigate("/select-role", { state: { isNewUser: false } })}
              title={collapsed ? "Switch Role" : undefined}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>🔄</span>
              {!collapsed && <span>Switch Role</span>}
            </button>
            <button className="fl-logout" onClick={handleLogout} title={collapsed ? "Logout" : undefined}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>🚪</span>
              {!collapsed && <span>Logout</span>}
            </button>
          </div>
        </aside>

        {/* TOGGLE */}
        <button
          className="fl-toggle"
          style={{ left: collapsed ? "calc(var(--sidebar-w-c) - 12px)" : "calc(var(--sidebar-w) - 12px)" }}
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? "›" : "‹"}
        </button>

        {/* MAIN */}
        <div className={`fl-main ${collapsed ? "collapsed" : ""}`}>
          <header className="fl-topbar">
            <div className="fl-topbar-left">
              <span className="fl-breadcrumb">
                 Farmer Portal / <span className="fl-breadcrumb-cur">{user.name || "Dashboard"}</span>
              </span>
            </div>
            <div className="fl-topbar-right">
              <div className="fl-topbar-time">
                {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
              </div>

              {/* Quick Switch Role */}
              <button
                className="fl-topbar-role-btn"
                onClick={() => navigate("/select-role", { state: { isNewUser: false } })}
                title="Switch Role"
              >
                🔄 Switch Role
              </button>

              {/* Notification Bell */}
              <div
                className="fl-notif-btn"
                onClick={() => navigate("/farmer/notifications")}
                title={unreadCount > 0 ? `${unreadCount} unread` : "Notifications"}
              >
                🔔
                {unreadCount > 0 && (
                  <div className="fl-notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</div>
                )}
              </div>

              <div
                className="fl-topbar-avatar"
                title={user.name}
                onClick={() => navigate("/farmer/profile")}
              >
                {initials}
              </div>
            </div>
          </header>

          <main className="fl-content">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}