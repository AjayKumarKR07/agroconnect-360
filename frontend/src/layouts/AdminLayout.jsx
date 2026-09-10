import { useState, useEffect, useRef, useCallback } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { API_URL } from "../config/api";

// ── Notification type → icon + navigation target ──────────────────────────
const NOTIF_CONFIG = {
  system:    { emoji: "⚙️",  color: "#818cf8" },
  order:     { emoji: "📦",  color: "#4ade80" },
  export:    { emoji: "🚢",  color: "#fbbf24" },
  broadcast: { emoji: "📢",  color: "#a78bfa" },
  dispute:   { emoji: "⚖️",  color: "#f87171" },
  weather:   { emoji: "🌤️",  color: "#38bdf8" },
  market:    { emoji: "📈",  color: "#4ade80" },
  harvest:   { emoji: "🌾",  color: "#4ade80" },
  diagnosis: { emoji: "🔬",  color: "#a78bfa" },
  plan:      { emoji: "📋",  color: "#818cf8" },
};

const relativeTime = (dateStr) => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const user = JSON.parse(localStorage.getItem("agroconnect_user") || "{}");
  const token = localStorage.getItem("agroconnect_token");

  // ── Notification state ──────────────────────────────────────────────────
  const [unreadCount, setUnreadCount]     = useState(0);
  const [notifOpen, setNotifOpen]         = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading]   = useState(false);
  const notifRef                          = useRef(null);
  const pollRef                           = useRef(null);

  const handleLogout = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    localStorage.removeItem("agroconnect_token");
    localStorage.removeItem("agroconnect_user");
    navigate("/login", { replace: true });
  };

  // ── Fetch unread count (lightweight) ───────────────────────────────────
  const fetchUnreadCount = useCallback(async () => {
    if (!token) return;
    try {
      const r = await fetch(`${API_URL}/api/admin/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (d.success) setUnreadCount(d.count || 0);
    } catch {
      // Silent — badge just shows stale count
    }
  }, [token]);

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

  // ── Handle notification click: mark read + navigate ────────────────────
  const handleNotifClick = (notif) => {
    if (!notif.isRead) markRead(notif._id);
    setNotifOpen(false);
    if (notif.link) navigate(notif.link);
  };

  // ── Toggle panel ───────────────────────────────────────────────────────
  const toggleNotifPanel = () => {
    if (!notifOpen) {
      fetchNotifications();
    }
    setNotifOpen((v) => !v);
  };

  // ── Close panel on outside click ───────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Poll unread count every 60s ────────────────────────────────────────
  useEffect(() => {
    fetchUnreadCount();
    pollRef.current = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(pollRef.current);
  }, [fetchUnreadCount]);

  const nav = [
    { emoji: "🏠", name: "Overview",        path: "/admin/dashboard" },
    { emoji: "👥", name: "User Management", path: "/admin/users" },
    { emoji: "🌾", name: "Crop Moderation", path: "/admin/crops" },
    { emoji: "📦", name: "Orders",          path: "/admin/orders" },
    { emoji: "🚢", name: "Exports",         path: "/admin/exports" },
    { emoji: "📢", name: "Broadcasts",      path: "/admin/broadcast" },
    { emoji: "📜", name: "Audit Logs",      path: "/admin/audit-logs" },
    { emoji: "💰", name: "Finance",         path: "/admin/finance" },
    { emoji: "⚖️", name: "Disputes",        path: "/admin/disputes" },
    { emoji: "⚡", name: "System Health",   path: "/admin/system" },
    { emoji: "🤖", name: "AI Models",       path: "/admin/ai-models" },
    { emoji: "👤", name: "Profile",         path: "/admin/profile" },
  ];

  const initials = (user.name || "A").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const currentPage = nav.find((n) => location.pathname.startsWith(n.path))?.name || "Admin Portal";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:        #060814;
          --bg2:       #0c0f24;
          --sidebar:   #090c1e;
          --surface:   rgba(99,102,241,0.05);
          --surface2:  rgba(99,102,241,0.09);
          --border:    rgba(99,102,241,0.14);
          --border2:   rgba(99,102,241,0.25);
          --text:      #eef2ff;
          --text2:     #6366f1;
          --accent:    #6366f1;
          --accent2:   #4f46e5;
          --accent-dim:rgba(99,102,241,0.12);
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
          background:radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 70%);
          pointer-events:none;
        }

        .ul-head {
          display:flex; align-items:center; gap:12px;
          padding:20px 16px; height:70px; flex-shrink:0;
          border-bottom:1px solid var(--border); overflow:hidden; position:relative;
        }
        .ul-logo {
          width:38px; height:38px; border-radius:12px; flex-shrink:0;
          background:linear-gradient(135deg,#4f46e5,#6366f1);
          display:flex; align-items:center; justify-content:center;
          font-size:20px; box-shadow:0 4px 20px rgba(99,102,241,0.45);
        }
        .ul-brand-name { font-family:'Space Grotesk',sans-serif; font-size:14px; font-weight:800; color:#fff; white-space:nowrap; }
        .ul-brand-role {
          display:inline-block; margin-top:2px; font-size:10px; font-weight:700;
          letter-spacing:0.08em; color:#a5b4fc; text-transform:uppercase;
          background:rgba(99,102,241,0.12); border:1px solid rgba(99,102,241,0.2);
          padding:1px 7px; border-radius:20px;
        }

        .ul-nav { flex:1; overflow-y:auto; padding:16px 10px; display:flex; flex-direction:column; gap:3px; }
        .ul-nav::-webkit-scrollbar { width:0; }
        .ul-divider { font-size:10px; font-weight:700; color:#818cf8; text-transform:uppercase; letter-spacing:0.08em; padding:10px 12px 6px; opacity:0.7; white-space:nowrap; }

        .ul-link {
          display:flex; align-items:center; gap:12px;
          padding:11px 12px; border-radius:12px;
          text-decoration:none; color:#a5b4fc;
          font-size:13.5px; font-weight:500;
          transition:all 0.2s; white-space:nowrap; overflow:hidden; position:relative;
        }
        .ul-link:hover { background:var(--surface2); color:#fff; }
        .ul-link.active {
          background:linear-gradient(135deg,rgba(79,70,229,0.25),rgba(99,102,241,0.08));
          color:#c7d2fe; border:1px solid rgba(99,102,241,0.25);
          font-weight:700; box-shadow:0 2px 12px rgba(99,102,241,0.15);
        }
        .ul-link.active::after {
          content:''; position:absolute; right:10px; top:50%; transform:translateY(-50%);
          width:6px; height:6px; border-radius:50%;
          background:var(--accent); box-shadow:0 0 8px rgba(99,102,241,0.8);
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
          background:linear-gradient(135deg,#4f46e5,#6366f1);
          display:flex; align-items:center; justify-content:center;
          font-size:13px; font-weight:800; color:#fff;
          box-shadow:0 2px 8px rgba(99,102,241,0.3);
        }
        .ul-user-name { font-size:13px; font-weight:700; color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .ul-user-role { font-size:11px; color:var(--accent); font-weight:600; }

        .ul-logout {
          display:flex; align-items:center; gap:12px;
          padding:10px 12px; border-radius:12px; border:1px solid transparent;
          background:none; color:#a5b4fc; font-size:13.5px; font-weight:600;
          cursor:pointer; width:100%; text-align:left; font-family:'Inter',sans-serif;
          transition:all 0.2s; white-space:nowrap; overflow:hidden;
        }
        .ul-logout:hover { background:rgba(239,68,68,0.08); color:#f87171; border-color:rgba(239,68,68,0.15); }

        .ul-switch-role {
          display:flex; align-items:center; gap:12px;
          padding:9px 12px; border-radius:12px;
          background:rgba(99,102,241,0.08); border:1px solid rgba(99,102,241,0.22);
          color:#a5b4fc; font-size:13px; font-weight:600;
          cursor:pointer; width:100%; text-align:left; font-family:'Inter',sans-serif;
          transition:all 0.2s; white-space:nowrap; overflow:hidden;
          margin-bottom:6px;
        }
        .ul-switch-role:hover { background:rgba(99,102,241,0.16); border-color:rgba(99,102,241,0.35); color:#c7d2fe; }

        .ul-topbar-role-btn {
          display:inline-flex; align-items:center; gap:6px;
          padding:6px 12px; border-radius:20px;
          background:rgba(99,102,241,0.08); border:1px solid rgba(99,102,241,0.25);
          color:#a5b4fc; font-size:12px; font-weight:600;
          cursor:pointer; font-family:'Inter',sans-serif;
          transition:all 0.2s;
        }
        .ul-topbar-role-btn:hover { background:rgba(99,102,241,0.16); color:#c7d2fe; }

        /* ── TOGGLE ── */
        .ul-toggle {
          position:fixed; top:22px; z-index:60;
          width:22px; height:22px; border-radius:6px;
          background:var(--sidebar); border:1px solid var(--border2);
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; font-size:11px; color:#a5b4fc;
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
          background:rgba(6,8,20,0.88); backdrop-filter:blur(24px);
          border-bottom:1px solid var(--border);
          display:flex; align-items:center; justify-content:space-between;
          padding:0 28px;
        }
        .ul-page-dot { width:8px; height:8px; border-radius:50%; background:var(--accent); box-shadow:0 0 12px rgba(99,102,241,0.7); }
        .ul-page-name { font-family:'Space Grotesk',sans-serif; font-size:16px; font-weight:800; color:#fff; }
        .ul-time-chip { font-size:12px; color:#a5b4fc; background:var(--surface); border:1px solid var(--border); padding:5px 14px; border-radius:20px; }
        .ul-topbar-avatar {
          width:36px; height:36px; border-radius:10px;
          background:linear-gradient(135deg,#4f46e5,#6366f1);
          display:flex; align-items:center; justify-content:center;
          font-size:13px; font-weight:800; color:#fff; cursor:pointer;
          box-shadow:0 4px 14px rgba(99,102,241,0.35);
        }

        /* ── NOTIFICATION BELL ── */
        .notif-bell-wrap {
          position:relative;
        }
        .notif-bell {
          width:36px; height:36px; border-radius:10px; cursor:pointer;
          background:var(--surface); border:1px solid var(--border);
          display:flex; align-items:center; justify-content:center;
          font-size:17px; transition:all 0.2s; flex-shrink:0;
          position:relative;
        }
        .notif-bell:hover { background:var(--surface2); border-color:var(--border2); }
        .notif-bell.open { background:rgba(99,102,241,0.15); border-color:#6366f1; }
        .notif-badge {
          position:absolute; top:-5px; right:-5px;
          min-width:18px; height:18px; border-radius:9px;
          background:#ef4444; color:#fff;
          font-size:10px; font-weight:800;
          display:flex; align-items:center; justify-content:center;
          padding:0 4px; border:2px solid #060814;
          animation: notif-pop 0.3s cubic-bezier(.36,.07,.19,.97);
        }
        @keyframes notif-pop {
          0% { transform:scale(0); }
          70% { transform:scale(1.2); }
          100% { transform:scale(1); }
        }

        /* ── NOTIFICATION DROPDOWN ── */
        .notif-panel {
          position:absolute; top:calc(100% + 12px); right:0;
          width:380px; max-height:520px;
          background:#0c0f24;
          border:1px solid rgba(99,102,241,0.25);
          border-radius:18px;
          box-shadow:0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.06);
          display:flex; flex-direction:column;
          overflow:hidden; z-index:200;
          animation: panel-in 0.2s cubic-bezier(.4,0,.2,1);
        }
        @keyframes panel-in {
          from { opacity:0; transform:translateY(-8px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        .notif-panel-head {
          display:flex; align-items:center; justify-content:space-between;
          padding:16px 18px 12px;
          border-bottom:1px solid rgba(99,102,241,0.1);
          flex-shrink:0;
        }
        .notif-panel-title {
          font-family:'Space Grotesk',sans-serif;
          font-size:15px; font-weight:800; color:#fff;
        }
        .notif-mark-all {
          font-size:12px; font-weight:700; color:#818cf8;
          background:none; border:none; cursor:pointer;
          padding:4px 10px; border-radius:8px;
          transition:background 0.15s;
        }
        .notif-mark-all:hover { background:rgba(99,102,241,0.1); color:#c7d2fe; }
        .notif-list {
          flex:1; overflow-y:auto;
        }
        .notif-list::-webkit-scrollbar { width:4px; }
        .notif-list::-webkit-scrollbar-track { background:transparent; }
        .notif-list::-webkit-scrollbar-thumb { background:rgba(99,102,241,0.2); border-radius:4px; }
        .notif-item {
          display:flex; gap:12px; align-items:flex-start;
          padding:13px 16px; cursor:pointer;
          border-bottom:1px solid rgba(99,102,241,0.06);
          transition:background 0.15s;
          text-align:left;
        }
        .notif-item:hover { background:rgba(99,102,241,0.06); }
        .notif-item.unread { background:rgba(99,102,241,0.04); }
        .notif-item:last-child { border-bottom:none; }
        .notif-icon {
          width:34px; height:34px; border-radius:10px;
          display:flex; align-items:center; justify-content:center;
          font-size:16px; flex-shrink:0;
          background:rgba(99,102,241,0.1);
        }
        .notif-content { flex:1; min-width:0; }
        .notif-title-text {
          font-size:13px; font-weight:700; color:#fff;
          margin-bottom:3px; line-height:1.3;
          overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
        }
        .notif-msg {
          font-size:12px; color:#a5b4fc; line-height:1.4;
          display:-webkit-box; -webkit-line-clamp:2;
          -webkit-box-orient:vertical; overflow:hidden;
        }
        .notif-time {
          font-size:11px; color:#6366f1; margin-top:4px; font-weight:600;
        }
        .notif-unread-dot {
          width:7px; height:7px; border-radius:50%;
          background:#6366f1; flex-shrink:0; margin-top:4px;
          box-shadow:0 0 6px rgba(99,102,241,0.7);
        }
        .notif-empty {
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          padding:40px 20px; color:#a5b4fc;
        }
        .notif-empty-icon { font-size:32px; margin-bottom:10px; opacity:0.5; }
        .notif-empty-text { font-size:13px; font-weight:600; }
        .notif-footer {
          padding:10px 16px; border-top:1px solid rgba(99,102,241,0.1);
          text-align:center; flex-shrink:0;
        }

        .ul-content { flex:1; padding:28px 32px; }

        @media(max-width:768px){
          .ul-sidebar { width:var(--ul-wc) !important; }
          .ul-main { margin-left:var(--ul-wc) !important; }
          .ul-content { padding:20px 16px; }
          .notif-panel { width:calc(100vw - 32px); right:-16px; }
        }

        /* ── Spinner for notif panel ── */
        .notif-spinner {
          width:20px; height:20px; margin:30px auto; display:block;
          border:2px solid rgba(99,102,241,0.15); border-top-color:#818cf8;
          border-radius:50%; animation:nspin 0.7s linear infinite;
        }
        @keyframes nspin { to { transform:rotate(360deg); } }
      `}</style>

      <div className="ul-wrap">
        <aside className={`ul-sidebar ${collapsed ? "collapsed" : ""}`}>
          <div className="ul-head">
            <div className="ul-logo">⚙️</div>
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
                  <div className="ul-user-name">{user.name || "Administrator"}</div>
                  <div className="ul-user-role">⚙️ System Admin</div>
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

        <button
          className="ul-toggle"
          style={{ left: collapsed ? "calc(var(--ul-wc) - 11px)" : "calc(var(--ul-w) - 11px)" }}
          onClick={() => setCollapsed((c) => !c)}
        >
          {collapsed ? "›" : "‹"}
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
                🔄 Switch Role
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
                  🔔
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
                        🔔 Notifications
                        {unreadCount > 0 && (
                          <span style={{
                            marginLeft: 8, fontSize: 11, background: "rgba(239,68,68,0.15)",
                            color: "#f87171", padding: "2px 7px", borderRadius: 8, fontWeight: 800,
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
                          <div className="notif-empty-icon">🔔</div>
                          <div className="notif-empty-text">No notifications yet</div>
                        </div>
                      ) : (
                        notifications.map((n) => {
                          const cfg = NOTIF_CONFIG[n.type] || NOTIF_CONFIG.system;
                          return (
                            <button
                              key={n._id}
                              className={`notif-item ${!n.isRead ? "unread" : ""}`}
                              onClick={() => handleNotifClick(n)}
                              style={{ width: "100%", background: "none", border: "none", font: "inherit" }}
                            >
                              <div className="notif-icon" style={{ background: `${cfg.color}18` }}>
                                <span style={{ filter: "grayscale(0)" }}>{cfg.emoji}</span>
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
                            fontSize: 12, fontWeight: 700, color: "#818cf8",
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
