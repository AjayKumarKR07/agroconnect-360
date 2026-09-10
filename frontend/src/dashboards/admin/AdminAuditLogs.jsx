import { useState, useEffect, useCallback } from "react";
import { API_URL } from "../../config/api";
import { DS_ADMIN, relativeTime } from "./adminStyles";
import { ScrollText, RefreshCw, AlertTriangle, Globe, Search, Ban, CheckCircle2, Trash2, Package, Ship, Anchor, XCircle, FileSearch, FolderOpen, Megaphone, Settings } from "lucide-react";

const ENTITY_TYPES = ["all", "user", "order", "crop", "rfq", "shipment", "dispute", "broadcast", "system"];

const ACTION_ICONS = {
  user_suspended:          { icon: <Ban          size={18} strokeWidth={2} />, color: "#dc2626" },
  user_activated:          { icon: <CheckCircle2 size={18} strokeWidth={2} />, color: "#15803d" },
  crop_deleted:            { icon: <Trash2       size={18} strokeWidth={2} />, color: "#dc2626" },
  order_status_changed:    { icon: <Package      size={18} strokeWidth={2} />, color: "#818cf8" },
  rfq_status_changed:      { icon: <Ship         size={18} strokeWidth={2} />, color: "#b45309" },
  shipment_status_changed: { icon: <Anchor       size={18} strokeWidth={2} />, color: "#0369a1" },
  dispute_resolved:        { icon: <CheckCircle2 size={18} strokeWidth={2} />, color: "#15803d" },
  dispute_rejected:        { icon: <XCircle      size={18} strokeWidth={2} />, color: "#dc2626" },
  dispute_under_review:    { icon: <FileSearch   size={18} strokeWidth={2} />, color: "#b45309" },
  dispute_open:            { icon: <FolderOpen   size={18} strokeWidth={2} />, color: "#0369a1" },
  broadcast_sent:          { icon: <Megaphone    size={18} strokeWidth={2} />, color: "#7c3aed" },
};

const LEVEL_STYLE = (action) => {
  if (action.includes("delete") || action.includes("suspend") || action.includes("reject")) {
    return { bg: "rgba(239,68,68,0.12)", color: "#dc2626", label: "DESTRUCTIVE" };
  }
  if (action.includes("broadcast")) {
    return { bg: "rgba(167,139,250,0.12)", color: "#7c3aed", label: "BROADCAST" };
  }
  return { bg: "rgba(99,102,241,0.12)", color: "#c7d2fe", label: "INFO" };
};

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [entityFilter, setEntityFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const token = localStorage.getItem("agroconnect_token");

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: 25, page: p });
      if (entityFilter !== "all") params.set("entityType", entityFilter);
      if (search) params.set("action", search);
      const r = await fetch(`${API_URL}/api/admin/audit-logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (d.success) {
        setLogs(d.logs || []);
        setPagination({ total: d.total, totalPages: d.totalPages, page: d.page });
        setLastUpdated(new Date());
      } else {
        throw new Error(d.message);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token, entityFilter, search]);

  useEffect(() => { setPage(1); load(1); }, [entityFilter]);
  useEffect(() => { load(page); }, [page]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); load(1); };

  return (
    <>
      <style>{DS_ADMIN}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Security &amp; System Activity Stream</div>
          <h1 className="pg-title"><ScrollText size={22} strokeWidth={2} style={{ marginRight: 8, color: "#4f46e5", verticalAlign: "middle" }} />Audit Logs & Admin Activity</h1>
          <p className="pg-sub">Persistent, real-time record of all administrative actions across the platform.</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {lastUpdated && <span style={{ fontSize: 12, color: "#a5b4fc" }}>Updated {relativeTime(lastUpdated)}</span>}
          <button className="btn-indigo" onClick={() => load(page)} disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <RefreshCw size={13} strokeWidth={2} />} Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {ENTITY_TYPES.map((et) => (
            <button key={et} className={`tab-btn ${entityFilter === et ? "active" : ""}`} onClick={() => setEntityFilter(et)}>
              {et === "all" ? <><Globe size={12} strokeWidth={2} style={{ marginRight: 4, verticalAlign: "middle" }} />All Types</> : et}
            </button>
          ))}
        </div>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          <input
            className="field-input"
            style={{ maxWidth: 200 }}
            placeholder="Search action…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn-indigo" style={{ padding: "10px 14px", fontSize: 13 }}>Search</button>
        </form>
      </div>

      {/* Stats bar */}
      {pagination.total !== undefined && (
        <div style={{ marginBottom: 16, fontSize: 13, color: "#a5b4fc" }}>
          Showing {logs.length} of <strong style={{ color: "#0f172a" }}>{pagination.total}</strong> audit events
        </div>
      )}

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 12 }} />)}
        </div>
      )}

      {!loading && error && (
        <div className="card error-state">
          <div className="error-state-icon"><AlertTriangle size={40} strokeWidth={1.5} color="#ef4444" /></div>
          <div className="error-state-msg">Unable to load audit logs</div>
          <div className="error-state-sub">{error}</div>
          <button className="btn-indigo" onClick={() => load(page)}>Retry</button>
        </div>
      )}

      {!loading && !error && logs.length === 0 && (
        <div className="card empty-state">
          <div className="empty-state-icon"><ScrollText size={40} strokeWidth={1.5} color="#c7d2fe" /></div>
          <div className="empty-state-msg">No audit logs found</div>
          <div className="empty-state-sub">Admin actions will appear here as they happen.</div>
        </div>
      )}

      {!loading && !error && logs.length > 0 && (
        <>
          <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 20 }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {logs.map((log, idx) => {
                const icon = ACTION_ICONS[log.action] || { icon: <Settings size={18} strokeWidth={2} />, color: "#a5b4fc" };
                const level = LEVEL_STYLE(log.action);
                return (
                  <div key={log._id} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                    padding: "14px 18px", gap: 14, flexWrap: "wrap",
                    borderBottom: idx < logs.length - 1 ? "1px solid rgba(99,102,241,0.07)" : "none"
                  }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flex: 1 }}>
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, background: icon.color + "18", color: icon.color, flexShrink: 0, marginTop: 2 }}>{icon.icon}</span>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>{log.description}</span>
                          <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 6, background: level.bg, color: level.color, fontWeight: 800 }}>
                            {level.label}
                          </span>
                          <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 6, background: "rgba(99,102,241,0.1)", color: "#a5b4fc", fontWeight: 700 }}>
                            {log.entityType}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: "#a5b4fc" }}>
                          By: <strong style={{ color: "#0f172a" }}>{log.admin?.name || "Admin"}</strong>
                          {log.entityId && <> · ID: <span style={{ fontFamily: "monospace", color: "#818cf8" }}>{log.entityId.slice(-8)}</span></>}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: "#a5b4fc", flexShrink: 0, textAlign: "right" }}>
                      {new Date(log.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button className="page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>‹ Prev</button>
              <span style={{ fontSize: 13, color: "#a5b4fc", padding: "6px 12px" }}>Page {page} of {pagination.totalPages}</span>
              <button className="page-btn" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next ›</button>
            </div>
          )}
        </>
      )}
    </>
  );
}
