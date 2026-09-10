import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../config/api";
import { DS } from "../../styles/ds";
import { RefreshCw, Bell, Package, CloudRain, TrendingUp, Sprout, Stethoscope, Wheat, Globe, CheckCheck, Clock, AlertTriangle } from "lucide-react";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("agroconnect_token")}`,
  "Content-Type": "application/json",
});

const TYPE_STYLE = {
  order:     { Icon: Package,     color: "#0369a1",  bg: "rgba(56,189,248,0.08)"  },
  weather:   { Icon: CloudRain,   color: "#60a5fa",  bg: "rgba(96,165,250,0.08)"  },
  market:    { Icon: TrendingUp,  color: "#b45309",  bg: "rgba(251,191,36,0.08)"  },
  harvest:   { Icon: Sprout,      color: "#15803d",  bg: "rgba(34,197,94,0.08)"   },
  diagnosis: { Icon: Stethoscope, color: "#7c3aed",  bg: "rgba(167,139,250,0.08)" },
  plan:      { Icon: Wheat,       color: "#16a34a",  bg: "rgba(34,197,94,0.08)"   },
  export:    { Icon: Globe,       color: "#0369a1",  bg: "rgba(56,189,248,0.08)"  },
  system:    { Icon: Bell,        color: "#94a3b8",  bg: "rgba(148,163,184,0.06)" },
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
        .notif-title { font-size:14px; font-weight:700; color:#0f172a; margin-bottom:3px; }
        .notif-msg { font-size:12px; color:var(--text2); line-height:1.6; }
        .notif-footer { display:flex; align-items:center; justify-content:space-between; margin-top:6px; }
        .notif-time { font-size:11px; color:var(--text2); }
        .notif-dot { width:8px; height:8px; border-radius:50%; background:var(--green); flex-shrink:0; margin-top:4px; }
      `}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Alerts & Updates</div>
          <h1 className="pg-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Bell size={24} color="#16a34a" /> Notifications
          </h1>
          <p className="pg-sub">Stay updated on orders, harvest alerts, and farm plans.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {unread > 0 && (
            <button className="btn-ghost" onClick={markAll} disabled={markingAll} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              {markingAll ? "…" : <><CheckCheck size={14} /> Mark All Read</>}
            </button>
          )}
          <button className="btn-ghost" onClick={load} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><RefreshCw size={13} strokeWidth={2} />Refresh</button>
        </div>
      </div>

      {unread > 0 && (
        <div className="alert-warn" style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
          <Bell size={16} color="#b45309" /> You have <strong>{unread}</strong> unread notification{unread > 1 ? "s" : ""}.
        </div>
      )}

      {error && <div className="alert-error" style={{ display: "flex", alignItems: "center", gap: 8 }}><AlertTriangle size={16} /> {error}</div>}

      {loading ? (
        <div className="loading-wrap"><div className="spinner" /><span>Loading notifications…</span></div>
      ) : notifs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-emoji"><Bell size={40} strokeWidth={1.5} color="#bbf7d0" /></div>
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
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10, marginTop: group === "read" ? 20 : 0 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: group === "unread" ? "#ef4444" : "#16a34a", display: "inline-block" }} />
                  {group === "unread" ? `Unread (${items.length})` : `Read (${items.length})`}
                </div>
                {items.map(notif => {
                  const s = TYPE_STYLE[notif.type] || TYPE_STYLE.system;
                  const IconComp = s.Icon;
                  return (
                    <div key={notif._id} className={`notif-item ${!notif.isRead ? "unread" : ""}`} onClick={() => handleClick(notif)}>
                      <div className="notif-icon" style={{ background: s.bg }}><IconComp size={20} color={s.color} /></div>
                      <div className="notif-body">
                        <div className="notif-title">{notif.title}</div>
                        <div className="notif-msg">{notif.message}</div>
                        <div className="notif-footer">
                          <span className="notif-time" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <Clock size={11} /> {timeAgo(notif.createdAt)}
                          </span>
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
