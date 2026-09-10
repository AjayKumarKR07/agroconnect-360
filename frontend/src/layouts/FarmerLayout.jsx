import { useState, useEffect, useCallback } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";
import {
  LayoutDashboard, Tractor, BarChart3, Sprout, HeartPulse, Microscope,
  TrendingUp, LineChart, GitCompare, CalendarDays, Bookmark, Bot,
  Package, IndianRupee, ShoppingCart, Ship, CloudSun, User, Bell,
  Repeat2, LogOut, Leaf, ChevronLeft, ChevronRight
} from "lucide-react";

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
        { icon: LayoutDashboard, name: "Dashboard",      path: "/farmer/dashboard" },
        { icon: Tractor,         name: "My Farm",         path: "/farmer/my-farm" },
        { icon: BarChart3,       name: "Farm Analytics",  path: "/farmer/farm-analytics" },
      ],
    },
    {
      label: "Crops",
      items: [
        { icon: Sprout,      name: "My Crops",          path: "/farmer/crops" },
        { icon: HeartPulse,  name: "Health History",    path: "/farmer/crop-health-history" },
        { icon: Microscope,  name: "Disease Detection", path: "/farmer/disease-detection" },
      ],
    },
    {
      label: "Market",
      items: [
        { icon: TrendingUp,  name: "Price Prediction",   path: "/farmer/price-prediction" },
        { icon: LineChart,   name: "Market Trends",      path: "/farmer/market-trends" },
        { icon: GitCompare,  name: "Market Comparison",  path: "/farmer/market-comparison" },
      ],
    },
    {
      label: "Planning",
      items: [
        { icon: CalendarDays, name: "Smart Farm Planner", path: "/farmer/smart-farm-planner" },
        { icon: Bookmark,     name: "Saved Plans",         path: "/farmer/saved-plans" },
        { icon: Bot,          name: "AI Assistant",        path: "/farmer/assistant" },
      ],
    },
    {
      label: "Business",
      items: [
        { icon: Package,       name: "Orders",     path: "/farmer/orders" },
        { icon: IndianRupee,   name: "Income",     path: "/farmer/income" },
        { icon: ShoppingCart,  name: "Buy Inputs", path: "/farmer/inputs" },
        { icon: Ship,          name: "Export",     path: "/farmer/export" },
      ],
    },
    {
      label: "Tools",
      items: [
        { icon: CloudSun, name: "Weather",  path: "/farmer/weather" },
        { icon: User,     name: "Profile",   path: "/farmer/profile" },
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
          --bg:      #f8fafc;
          --bg2:     #f1f5f9;
          --sidebar: #ffffff;
          --surface: #ffffff;
          --surface2:#f8fafc;
          --border:  #e2e8f0;
          --border2: #cbd5e1;
          --text:    #0f172a;
          --text2:   #64748b;
          --green:   #16a34a;
          --green-dim:#f0fdf4;
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
          box-shadow: 1px 0 3px rgba(0, 0, 0, 0.02);
        }
        .fl-sidebar.collapsed { width:var(--sidebar-w-c); }

        .fl-sidebar-head {
          display:flex; align-items:center; gap:10px;
          padding:18px 16px; border-bottom:1px solid var(--border);
          height:66px; flex-shrink:0; overflow:hidden;
        }
        .fl-logo-icon {
          width:36px; height:36px; border-radius:10px; flex-shrink:0;
          background:#16a34a;
          display:flex; align-items:center; justify-content:center;
          font-size:18px; color:#0f172a;
        }
        .fl-logo-text { overflow:hidden; white-space:nowrap; }
        .fl-logo-name { font-family:'Space Grotesk',sans-serif; font-size:15px; font-weight:800; color:var(--text); }
        .fl-logo-sub { font-size:11px; color:var(--text2); font-weight:500; }

        .fl-nav { flex:1; overflow-y:auto; padding:12px 10px; }
        .fl-nav::-webkit-scrollbar { width:4px; }
        .fl-nav::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:3px; }

        .fl-nav-group { margin-bottom:14px; }
        .fl-nav-group-label {
          font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.06em;
          color:#94a3b8; padding:4px 10px 6px; white-space:nowrap; overflow:hidden;
        }

        .fl-nav-item {
          display:flex; align-items:center; gap:10px;
          padding:8px 12px; border-radius:8px; margin-bottom:2px;
          text-decoration:none; color:#475569;
          font-size:13px; font-weight:500;
          transition:all 0.15s ease;
          white-space:nowrap; overflow:hidden;
          position:relative;
        }
        .fl-nav-item:hover { background:#f1f5f9; color:#0f172a; }
        .fl-nav-item.active {
          background:#f0fdf4;
          color:#15803d;
          font-weight:600;
          border:1px solid #bbf7d0;
        }
        .fl-nav-item.active::before {
          content:''; position:absolute; left:0; top:20%; bottom:20%;
          width:3px; border-radius:0 2px 2px 0;
          background:#16a34a;
        }
        .fl-nav-icon { display:flex; align-items:center; justify-content:center; flex-shrink:0; color:inherit; width:18px; }
        .fl-nav-label { overflow:hidden; white-space:nowrap; flex:1; }

        .fl-sidebar-foot { border-top:1px solid var(--border); padding:12px 10px; flex-shrink:0; background:#f8fafc; }
        .fl-user-row {
          display:flex; align-items:center; gap:10px;
          padding:8px 10px; border-radius:8px; margin-bottom:6px; overflow:hidden;
        }
        .fl-avatar {
          width:32px; height:32px; border-radius:8px; flex-shrink:0;
          background:#16a34a;
          display:flex; align-items:center; justify-content:center;
          font-size:12px; font-weight:800; color:#0f172a;
        }
        .fl-user-name { font-size:13px; font-weight:600; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .fl-user-role { font-size:11px; color:#16a34a; font-weight:600; }

        .fl-logout {
          display:flex; align-items:center; gap:8px;
          padding:8px 10px; border-radius:8px; width:100%;
          background:none; border:none; cursor:pointer;
          color:#64748b; font-size:13px; font-weight:500;
          font-family:'Inter',sans-serif;
          transition:background 0.15s, color 0.15s;
          text-align:left; white-space:nowrap; overflow:hidden;
        }
        .fl-logout:hover { background:#fee2e2; color:#dc2626; }

        .fl-switch-role {
          display:flex; align-items:center; gap:8px;
          padding:8px 10px; border-radius:8px; width:100%;
          background:#f0fdf4; border:1px solid #bbf7d0;
          cursor:pointer; color:#15803d; font-size:13px; font-weight:600;
          font-family:'Inter',sans-serif;
          transition:all 0.15s;
          text-align:left; white-space:nowrap; overflow:hidden;
          margin-bottom:6px;
        }
        .fl-switch-role:hover { background:#dcfce7; }

        .fl-topbar-role-btn {
          display:inline-flex; align-items:center; gap:6px;
          padding:6px 14px; border-radius:20px;
          background:#f0fdf4; border:1px solid #bbf7d0;
          color:#15803d; font-size:12px; font-weight:600;
          cursor:pointer; font-family:'Inter',sans-serif;
          transition:all 0.15s;
        }
        .fl-topbar-role-btn:hover { background:#dcfce7; }

        .fl-toggle {
          position:fixed; top:20px; z-index:51;
          width:24px; height:24px; border-radius:6px;
          background:#ffffff; border:1px solid #cbd5e1;
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; font-size:12px; color:#475569;
          transition:left 0.25s ease, color 0.15s;
          box-shadow:0 1px 3px rgba(0,0,0,0.08);
        }
        .fl-toggle:hover { color:#0f172a; border-color:#94a3b8; }

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
          background:#ffffff;
          border-bottom:1px solid var(--border);
          display:flex; align-items:center; justify-content:space-between;
          padding:0 28px;
        }
        .fl-topbar-left { display:flex; align-items:center; gap:12px; }
        .fl-breadcrumb { font-size:13px; color:var(--text2); }
        .fl-breadcrumb-cur { color:var(--text); font-weight:600; }

        .fl-topbar-right { display:flex; align-items:center; gap:12px; }
        .fl-topbar-time {
          font-size:13px; color:var(--text2);
          background:#f8fafc; padding:5px 12px; border-radius:8px;
          border:1px solid var(--border); font-weight:500;
        }
        .fl-notif-btn {
          position:relative; width:36px; height:36px; border-radius:8px;
          background:#ffffff; border:1px solid var(--border);
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; font-size:16px; transition:background .15s;
        }
        .fl-notif-btn:hover { background:#f1f5f9; }
        .fl-notif-badge {
          position:absolute; top:-4px; right:-4px;
          width:18px; height:18px; border-radius:50%;
          background:#ef4444; color:#0f172a; font-size:10px; font-weight:800;
          display:flex; align-items:center; justify-content:center;
          border:2px solid #fff;
        }
        .fl-topbar-avatar {
          width:36px; height:36px; border-radius:8px;
          background:#16a34a;
          display:flex; align-items:center; justify-content:center;
          font-size:13px; font-weight:800; color:#0f172a;
          cursor:pointer;
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
            <div className="fl-logo-icon"><Leaf size={18} color="#ffffff" strokeWidth={2} /></div>
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
                    <span className="fl-nav-icon">{(() => { const Icon = item.icon; return <Icon size={17} strokeWidth={1.75} />; })()}</span>
                    {!collapsed && <span className="fl-nav-label">{item.name}</span>}
                    {item.path === "/farmer/notifications" && unreadCount > 0 && !collapsed && (
                      <span style={{ marginLeft: "auto", background: "#ef4444", color: "#0f172a", fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 10 }}>
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
              <Repeat2 size={15} strokeWidth={2} style={{ flexShrink: 0 }} />
              {!collapsed && <span>Switch Role</span>}
            </button>
            <button className="fl-logout" onClick={handleLogout} title={collapsed ? "Logout" : undefined}>
              <LogOut size={15} strokeWidth={2} style={{ flexShrink: 0 }} />
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
          {collapsed ? <ChevronRight size={12} strokeWidth={2.5} /> : <ChevronLeft size={12} strokeWidth={2.5} />}
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
                <Repeat2 size={13} strokeWidth={2} /> Switch Role
              </button>

              {/* Notification Bell */}
              <div
                className="fl-notif-btn"
                onClick={() => navigate("/farmer/notifications")}
                title={unreadCount > 0 ? `${unreadCount} unread` : "Notifications"}
              >
                <Bell size={17} strokeWidth={1.75} />
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