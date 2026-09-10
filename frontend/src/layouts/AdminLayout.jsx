import { useState, useEffect, useCallback, useRef } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { API_URL } from "../config/api";
import { relativeTime } from "../dashboards/admin/adminStyles";
import {
  LayoutDashboard, Users, Package, ClipboardList, BarChart3,
  Settings, User, ShieldCheck, Bell, Repeat2, LogOut, ChevronLeft, ChevronRight,
  Flag, Ban, CheckCircle2, RefreshCw, AlertTriangle, Trash2, Zap
} from "lucide-react";

// Notification type icon + color helper
const NOTIF_CONFIG = {
  user_registered:   { Icon: User,          color: "#4f46e5" },
  listing_reported:  { Icon: Flag,          color: "#dc2626" },
  user_suspended:    { Icon: Ban,           color: "#dc2626" },
  user_activated:    { Icon: CheckCircle2,  color: "#16a34a" },
  role_changed:      { Icon: RefreshCw,     color: "#7c3aed" },
  listing_flagged:   { Icon: AlertTriangle, color: "#d97706" },
  listing_deleted:   { Icon: Trash2,        color: "#dc2626" },
  bulk_action:       { Icon: Zap,           color: "#0284c7" },
  system:            { Icon: Settings,      color: "#4f46e5" },
};

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("agroconnect_user") || "{}");
  const token = localStorage.getItem("agroconnect_token");

  const handleLogout = () => {
    localStorage.removeItem("agroconnect_token");
    localStorage.removeItem("agroconnect_user");
    navigate("/login", { replace: true });
  };

  const nav = [
    { icon: LayoutDashboard, name: "Overview",       path: "/admin/dashboard" },
    { icon: Users,           name: "Users",          path: "/admin/users" },
    { icon: Package,         name: "Listings",       path: "/admin/listings" },
    { icon: ClipboardList,   name: "Audit Logs",     path: "/admin/audit-logs" },
    { icon: BarChart3,       name: "Analytics",      path: "/admin/analytics" },
    { icon: Settings,        name: "Settings",       path: "/admin/settings" },
    { icon: User,            name: "Profile",        path: "/admin/profile" },
  ];

  // ── Poll unread notification count every 30s ───────────────────────────
  const fetchUnreadCount = useCallback(async () => {
    if (!token) return;
    try {
      const r = await fetch(`${API_URL}/api/admin/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (d.success) setUnreadCount(d.count || 0);
    } catch {
      // Silent fail
    }
  }, [token]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // ── Fetch full notification list (only when panel opens) ───────────────
  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    setNotifLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/admin/notifications?limit=15`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (d.success) setNotifications(d.notifications || []);
    } catch {
      // Silent
    } finally {
      setNotifLoading(false);
    }
  }, [token]);

  // ── Mark single notification as read ───────────────────────────────────
  const markRead = async (id) => {
    try {
      await fetch(`${API_URL}/api/admin/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // Silent
    }
  };

  // ── Mark all as read ───────────────────────────────────────────────────
  const markAllRead = async () => {
    try {
      await fetch(`${API_URL}/api/admin/notifications/mark-all-read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Silent
    }
  };

  // ── Click outside to close notification panel ──────────────────────────
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [notifOpen]);

  // ── Toggle notif panel ──────────────────────────────────────────────────
  const toggleNotifPanel = () => {
    if (!notifOpen) {
      fetchNotifications();
    }
    setNotifOpen((prev) => !prev);
  };

  // ── Handle notification item click: mark read and navigate if link ─────
  const handleNotifClick = (n) => {
    if (!n.isRead) markRead(n._id);
    if (n.link) {
      setNotifOpen(false);
      navigate(n.link);
    }
  };

  const initials = (user.name || "A").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const currentPage = nav.find((n) => location.pathname.startsWith(n.path))?.name || "Admin Portal";

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
          --accent:    #4f46e5;
          --accent2:   #4338ca;
          --accent-dim:#e0e7ff;
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
          background:#4f46e5;
          display:flex; align-items:center; justify-content:center;
          font-size:20px; color:#0f172a;
        }
        .ul-brand-name { font-family:'Space Grotesk',sans-serif; font-size:14px; font-weight:800; color:var(--text); white-space:nowrap; }
        .ul-brand-role {
          display:inline-block; margin-top:2px; font-size:10px; font-weight:700;
          letter-spacing:0.08em; color:#4338ca; text-transform:uppercase;
          background:#e0e7ff; border:1px solid #c7d2fe;
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
          background:#e0e7ff;
          color:#4338ca; border:1px solid #c7d2fe;
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
          background:#4f46e5;
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
          background:#e0e7ff; border:1px solid #c7d2fe;
          color:#4338ca; font-size:13px; font-weight:600;
          cursor:pointer; width:100%; text-align:left; font-family:'Inter',sans-serif;
          transition:all 0.15s; white-space:nowrap; overflow:hidden;
          margin-bottom:6px;
        }
        .ul-switch-role:hover { background:#c7d2fe; }

        .ul-topbar-role-btn {
          display:inline-flex; align-items:center; gap:6px;
          padding:6px 14px; border-radius:20px;
          background:#e0e7ff; border:1px solid #c7d2fe;
          color:#4338ca; font-size:12px; font-weight:600;
          cursor:pointer; font-family:'Inter',sans-serif;
          transition:all 0.15s;
        }
        .ul-topbar-role-btn:hover { background:#c7d2fe; }

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
        .ul-time-chip { font-size:12px; color:var(--text2); background:#f8fafc; border:1px solid var(--border); padding:5px 14px; border-radius:20px; font-weight:500; }
        .ul-topbar-avatar {
          width:36px; height:36px; border-radius:8px;
          background:#4f46e5;
          display:flex; align-items:center; justify-content:center;
          font-size:13px; font-weight:800; color:#0f172a; cursor:pointer;
        }

        /* ── NOTIFICATION BELL ── */
        .notif-bell-wrap { position:relative; }
        .notif-bell {
          width:36px; height:36px; border-radius:8px; cursor:pointer;
          background:#ffffff; border:1px solid var(--border);
          display:flex; align-items:center; justify-content:center;
          font-size:16px; transition:all 0.15s; flex-shrink:0;
          position:relative;
        }
        .notif-bell:hover { background:#f1f5f9; border-color:var(--border2); }
        .notif-bell.open { background:#e0e7ff; border-color:#c7d2fe; }
        .notif-badge {
          position:absolute; top:-4px; right:-4px;
          min-width:18px; height:18px; border-radius:9px;
          background:#ef4444; color:#0f172a;
          font-size:10px; font-weight:800;
          display:flex; align-items:center; justify-content:center;
          padding:0 4px; border:2px solid #ffffff;
        }

        /* ── NOTIFICATION DROPDOWN ── */
        .notif-panel {
          position:absolute; top:calc(100% + 12px); right:0;
          width:380px; max-height:520px;
          background:#ffffff;
          border:1px solid var(--border);
          border-radius:16px;
          box-shadow:0 16px 40px rgba(0,0,0,0.1);
          display:flex; flex-direction:column;
          overflow:hidden; z-index:200;
        }
        .notif-panel-head {
          display:flex; align-items:center; justify-content:space-between;
          padding:14px 18px 12px;
          border-bottom:1px solid var(--border);
          flex-shrink:0; background:#f8fafc;
        }
        .notif-panel-title {
          font-family:'Space Grotesk',sans-serif;
          font-size:14px; font-weight:800; color:#0f172a;
        }
        .notif-mark-all {
          font-size:12px; font-weight:700; color:#4f46e5;
          background:none; border:none; cursor:pointer;
          padding:4px 8px; border-radius:6px;
        }
        .notif-mark-all:hover { text-decoration:underline; }
        .notif-list { flex:1; overflow-y:auto; }
        .notif-list::-webkit-scrollbar { width:4px; }
        .notif-list::-webkit-scrollbar-thumb { background:#cbd5e1; border-radius:4px; }
        .notif-item {
          display:flex; gap:12px; align-items:flex-start;
          padding:13px 16px; cursor:pointer;
          border-bottom:1px solid #f1f5f9;
          transition:background 0.15s;
          text-align:left;
        }
        .notif-item:hover { background:#f8fafc; }
        .notif-item.unread { background:#f0fdf4; }
        .notif-item:last-child { border-bottom:none; }
        .notif-icon {
          width:32px; height:32px; border-radius:8px;
          display:flex; align-items:center; justify-content:center;
          font-size:15px; flex-shrink:0;
          background:#f1f5f9;
        }
        .notif-content { flex:1; min-width:0; }
        .notif-title-text {
          font-size:13px; font-weight:700; color:#0f172a;
          margin-bottom:2px; line-height:1.3;
          overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
        }
        .notif-msg {
          font-size:12px; color:#64748b; line-height:1.4;
          display:-webkit-box; -webkit-line-clamp:2;
          -webkit-box-orient:vertical; overflow:hidden;
        }
        .notif-time {
          font-size:11px; color:#4f46e5; margin-top:4px; font-weight:600;
        }
        .notif-unread-dot {
          width:6px; height:6px; border-radius:50%;
          background:#4f46e5; flex-shrink:0; margin-top:5px;
        }
        .notif-empty {
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          padding:40px 20px; color:#64748b;
        }
        .notif-empty-icon { font-size:30px; margin-bottom:8px; opacity:0.6; }
        .notif-empty-text { font-size:13px; font-weight:600; }
        .notif-footer {
          padding:10px 16px; border-top:1px solid var(--border);
          text-align:center; flex-shrink:0; background:#f8fafc;
        }

        .ul-content { flex:1; padding:28px 32px; }

        @media(max-width:768px){
          .ul-sidebar { width:var(--ul-wc) !important; }
          .ul-main { margin-left:var(--ul-wc) !important; }
          .ul-content { padding:20px 16px; }
          .notif-panel { width:calc(100vw - 32px); right:-16px; }
        }

        .notif-spinner {
          width:20px; height:20px; margin:30px auto; display:block;
          border:2px solid #e2e8f0; border-top-color:#4f46e5;
          border-radius:50%; animation:nspin 0.7s linear infinite;
        }
        @keyframes nspin { to { transform:rotate(360deg); } }
      `}</style>

      <div className="ul-wrap">
        <aside className={`ul-sidebar ${collapsed ? "collapsed" : ""}`}>
          <div className="ul-head">
            <div className="ul-logo"><ShieldCheck size={17} color="#ffffff" strokeWidth={2} /></div>
            {!collapsed && (
              <div>
                <div className="ul-brand-name">AgroConnect 360</div>
                <span className="ul-brand-role">Platform Admin</span>
              </div>
            )}
          </div>

          <nav className="ul-nav">
            {!collapsed && <div className="ul-divider">Super Admin Menu</div>}
            {nav.map((n) => (
              <NavLink
                key={n.path}
                to={n.path}
                className={({ isActive }) => `ul-link${isActive ? " active" : ""}`}
                title={collapsed ? n.name : undefined}
              >
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
                  <div className="ul-user-name">{user.name || "Administrator"}</div>
                  <div className="ul-user-role">System Admin</div>
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

        <button
          className="ul-toggle"
          style={{ left: collapsed ? "calc(var(--ul-wc) - 11px)" : "calc(var(--ul-w) - 11px)" }}
          onClick={() => setCollapsed((c) => !c)}
        >
          {collapsed ? <ChevronRight size={11} strokeWidth={2.5} /> : <ChevronLeft size={11} strokeWidth={2.5} />}
        </button>

        <div className={`ul-main ${collapsed ? "collapsed" : ""}`}>
          <header className="ul-topbar">
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div className="ul-page-dot" />
              <div className="ul-page-name">{currentPage}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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

              {/* ── Notification Bell ── */}
              <div className="notif-bell-wrap" ref={notifRef}>
                <button
                  id="admin-notif-bell"
                  className={`notif-bell ${notifOpen ? "open" : ""}`}
                  onClick={toggleNotifPanel}
                  title="Notifications"
                  aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
                >
                  <Bell size={17} strokeWidth={1.75} />
                  {unreadCount > 0 && (
                    <span className="notif-badge" aria-hidden="true">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="notif-panel" role="dialog" aria-label="Notifications panel">
                    <div className="notif-panel-head">
                      <div className="notif-panel-title">
                        <Bell size={14} strokeWidth={2} style={{ marginRight: 6 }} /> Notifications
                        {unreadCount > 0 && (
                          <span style={{
                            marginLeft: 8, fontSize: 11, background: "#fee2e2",
                            color: "#dc2626", padding: "2px 7px", borderRadius: 8, fontWeight: 700,
                          }}>
                            {unreadCount} unread
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button className="notif-mark-all" onClick={markAllRead}>
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="notif-list">
                      {notifLoading ? (
                        <div className="notif-spinner" />
                      ) : notifications.length === 0 ? (
                        <div className="notif-empty">
                          <div className="notif-empty-icon"><Bell size={28} strokeWidth={1.5} color="#94a3b8" /></div>
                          <div className="notif-empty-text">No notifications yet</div>
                        </div>
                      ) : (
                        notifications.map((n) => {
                          const cfg = NOTIF_CONFIG[n.type] || NOTIF_CONFIG.system;
                          const NotifIcon = cfg.Icon || Settings;
                          return (
                            <button
                              key={n._id}
                              className={`notif-item ${!n.isRead ? "unread" : ""}`}
                              onClick={() => handleNotifClick(n)}
                              style={{ width: "100%", background: "none", border: "none", font: "inherit" }}
                            >
                              <div className="notif-icon" style={{ background: `${cfg.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <NotifIcon size={16} strokeWidth={2} color={cfg.color} />
                              </div>
                              <div className="notif-content">
                                <div className="notif-title-text">{n.title}</div>
                                <div className="notif-msg">{n.message}</div>
                                <div className="notif-time">{relativeTime(n.createdAt)}</div>
                              </div>
                              {!n.isRead && <div className="notif-unread-dot" />}
                            </button>
                          );
                        })
                      )}
                    </div>

                    {notifications.length > 0 && (
                      <div className="notif-footer">
                        <button
                          style={{
                            fontSize: 12, fontWeight: 700, color: "#4f46e5",
                            background: "none", border: "none", cursor: "pointer",
                          }}
                          onClick={() => { setNotifOpen(false); navigate("/admin/audit-logs"); }}
                        >
                          View Audit Log →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* ── End Notification Bell ── */}

              <div
                className="ul-topbar-avatar"
                title={user.name}
                onClick={() => navigate("profile")}
                style={{ cursor: "pointer" }}
              >
                {initials}
              </div>
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
