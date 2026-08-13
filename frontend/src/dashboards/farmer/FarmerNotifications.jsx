import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../config/api";
import { DS } from "../../styles/ds";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("agroconnect_token")}`,
  "Content-Type": "application/json",
});

const TYPE_STYLE = {
  order:     { icon: "📦", color: "#38bdf8",  bg: "rgba(56,189,248,0.08)"  },
  weather:   { icon: "🌧️", color: "#60a5fa",  bg: "rgba(96,165,250,0.08)"  },
  market:    { icon: "📈", color: "#fbbf24",  bg: "rgba(251,191,36,0.08)"  },
  harvest:   { icon: "🌱", color: "#4ade80",  bg: "rgba(34,197,94,0.08)"   },
  diagnosis: { icon: "🩺", color: "#a78bfa",  bg: "rgba(167,139,250,0.08)" },
  plan:      { icon: "🌾", color: "#22c55e",  bg: "rgba(34,197,94,0.08)"   },
  export:    { icon: "🌍", color: "#38bdf8",  bg: "rgba(56,189,248,0.08)"  },
  system:    { icon: "🔔", color: "#94a3b8",  bg: "rgba(148,163,184,0.06)" },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function FarmerNotifications() {
  const navigate = useNavigate();
  const [notifs, setNotifs]       = useState([]);
  const [unread, setUnread]       = useState(0);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${API_URL}/api/farmer/notifications`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => {
        if (d.success) { setNotifs(d.notifications); setUnread(d.unreadCount); }
        else setError(d.message || "Unable to load notifications");
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id) => {
    setNotifs(p => p.map(n => n._id === id ? { ...n, isRead: true } : n));
    setUnread(p => Math.max(0, p - 1));
    try {
      await fetch(`${API_URL}/api/farmer/notifications/${id}/read`, { method: "PUT", headers: authHeaders() });
    } catch { /* silent fail */ }
  };

  const markAll = async () => {
    setMarkingAll(true);
    try {
      await fetch(`${API_URL}/api/farmer/notifications/read-all`, { method: "PUT", headers: authHeaders() });
      setNotifs(p => p.map(n => ({ ...n, isRead: true })));
      setUnread(0);
    } catch { setError("Failed to mark all as read"); }
    finally { setMarkingAll(false); }
  };

  const handleClick = (notif) => {
    markRead(notif._id);
    if (notif.link) navigate(notif.link);
  };

  return (
    <>
      <style>{DS + `
        .notif-item { display:flex; gap:14px; padding:16px; border-radius:14px; border:1px solid var(--border); background:var(--surface); cursor:pointer; transition:background .15s,border-color .15s,transform .15s; }
        .notif-item:hover { background:var(--surface2); transform:translateX(2px); }
        .notif-item.unread { border-color:rgba(34,197,94,0.2); background:rgba(34,197,94,0.03); }
        .notif-icon { width:42px; height:42px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; }
        .notif-body { flex:1; min-width:0; }
        .notif-title { font-size:14px; font-weight:700; color:#fff; margin-bottom:3px; }
        .notif-msg { font-size:12px; color:var(--text2); line-height:1.6; }
        .notif-footer { display:flex; align-items:center; justify-content:space-between; margin-top:6px; }
        .notif-time { font-size:11px; color:var(--text2); }
        .notif-dot { width:8px; height:8px; border-radius:50%; background:var(--green); flex-shrink:0; margin-top:4px; }
      `}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Alerts & Updates</div>
          <h1 className="pg-title">🔔 Notifications</h1>
          <p className="pg-sub">Stay updated on orders, harvest alerts, and farm plans.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {unread > 0 && (
            <button className="btn-ghost" onClick={markAll} disabled={markingAll}>
              {markingAll ? "…" : "✅ Mark All Read"}
            </button>
          )}
          <button className="btn-ghost" onClick={load}>🔄 Refresh</button>
        </div>
      </div>

      {unread > 0 && (
        <div className="alert-warn" style={{ marginBottom: 20 }}>
          🔔 You have <strong>{unread}</strong> unread notification{unread > 1 ? "s" : ""}.
        </div>
      )}

      {error && <div className="alert-error">⚠️ {error}</div>}

      {loading ? (
        <div className="loading-wrap"><div className="spinner" /><span>Loading notifications…</span></div>
      ) : notifs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-emoji">🔔</div>
          <div className="empty-title">No notifications yet</div>
          <div className="empty-sub">Notifications appear when you save plans, receive orders, or crops approach harvest.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Unread first */}
          {["unread", "read"].map(group => {
            const items = notifs.filter(n => group === "unread" ? !n.isRead : n.isRead);
            if (items.length === 0) return null;
            return (
              <div key={group}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10, marginTop: group === "read" ? 20 : 0 }}>
                  {group === "unread" ? `🔴 Unread (${items.length})` : `✅ Read (${items.length})`}
                </div>
                {items.map(notif => {
                  const s = TYPE_STYLE[notif.type] || TYPE_STYLE.system;
                  return (
                    <div key={notif._id} className={`notif-item ${!notif.isRead ? "unread" : ""}`} onClick={() => handleClick(notif)}>
                      <div className="notif-icon" style={{ background: s.bg }}>{s.icon}</div>
                      <div className="notif-body">
                        <div className="notif-title">{notif.title}</div>
                        <div className="notif-msg">{notif.message}</div>
                        <div className="notif-footer">
                          <span className="notif-time">🕐 {timeAgo(notif.createdAt)}</span>
                          <span style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{notif.type.toUpperCase()}</span>
                        </div>
                      </div>
                      {!notif.isRead && <div className="notif-dot" />}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
