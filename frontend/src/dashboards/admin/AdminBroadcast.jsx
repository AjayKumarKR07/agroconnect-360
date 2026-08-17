import { useState, useEffect, useCallback } from "react";
import { API_URL } from "../../config/api";
import { DS_ADMIN, relativeTime } from "./adminStyles";

const ROLE_OPTIONS = ["all", "farmer", "seller", "user", "exporter"];

function ConfirmBroadcast({ title, message, targetRole, count, countLoading, onConfirm, onCancel, sending }) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="broadcast-modal-title">
      <div className="modal-box">
        <div className="modal-title" id="broadcast-modal-title">📢 Confirm Broadcast</div>
        <div className="modal-body">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div style={{ padding: "9px 12px", borderRadius: 10, background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.12)" }}>
              <div style={{ fontSize: 10, color: "#a5b4fc", fontWeight: 800, textTransform: "uppercase", marginBottom: 4 }}>Audience</div>
              <div style={{ fontSize: 13, color: "#c7d2fe", fontWeight: 700 }}>{targetRole === "all" ? "All Active Users" : `${targetRole.charAt(0).toUpperCase() + targetRole.slice(1)}s`}</div>
            </div>
            <div style={{ padding: "9px 12px", borderRadius: 10, background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.12)" }}>
              <div style={{ fontSize: 10, color: "#a5b4fc", fontWeight: 800, textTransform: "uppercase", marginBottom: 4 }}>Recipients</div>
              <div style={{ fontSize: 13, color: countLoading ? "#a5b4fc" : "#4ade80", fontWeight: 800 }}>
                {countLoading ? "Counting…" : `${(count || 0).toLocaleString()} users`}
              </div>
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: "#a5b4fc", fontWeight: 800, textTransform: "uppercase", marginBottom: 4 }}>Title</div>
            <div style={{ fontSize: 13, color: "#fff", fontWeight: 700 }}>📢 {title}</div>
          </div>
          <div style={{ padding: "9px 12px", borderRadius: 10, background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.12)", fontSize: 12, color: "#a5b4fc", marginBottom: 14, maxHeight: 80, overflow: "hidden", textOverflow: "ellipsis" }}>
            {message}
          </div>
          <div style={{ padding: "9px 12px", borderRadius: 10, background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.2)", fontSize: 12, color: "#fbbf24", fontWeight: 600 }}>
            ⚠️ This broadcast will be stored in the database and cannot be undone. It will be recorded in the audit log.
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-danger" onClick={onCancel} disabled={sending}>Cancel</button>
          <button className="btn-indigo" onClick={onConfirm} disabled={sending || countLoading} aria-disabled={sending || countLoading}>
            {sending ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Sending…</> : "📤 Send Broadcast"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminBroadcast() {
  const [form, setForm] = useState({ title: "", message: "", targetRole: "all" });
  const [showConfirm, setShowConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [recipientCount, setRecipientCount] = useState(null);
  const [countLoading, setCountLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [history, setHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(true);
  const [histError, setHistError] = useState(null);
  const token = localStorage.getItem("agroconnect_token");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadHistory = useCallback(async () => {
    setHistLoading(true);
    setHistError(null);
    try {
      const r = await fetch(`${API_URL}/api/admin/broadcast/history?limit=15`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (d.success) setHistory(d.history || []);
      else throw new Error(d.message);
    } catch (e) {
      setHistError(e.message);
    } finally {
      setHistLoading(false);
    }
  }, [token]);

  useEffect(() => { loadHistory(); }, [loadHistory]);
  const handlePreviewClick = async () => {
    if (!isValid) return;
    setCountLoading(true);
    setRecipientCount(null);
    setShowConfirm(true);
    try {
      const params = new URLSearchParams({ limit: 1, status: "active" });
      if (form.targetRole !== "all") params.set("role", form.targetRole);
      const r = await fetch(`${API_URL}/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (d.success) setRecipientCount(d.total || 0);
    } catch {
      setRecipientCount(0);
    } finally {
      setCountLoading(false);
    }
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const r = await fetch(`${API_URL}/api/admin/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      setShowConfirm(false);
      if (d.success) {
        showToast(`✅ Broadcast sent to ${d.count} user${d.count !== 1 ? "s" : ""}`);
        setForm({ title: "", message: "", targetRole: "all" });
        setRecipientCount(null);
        loadHistory();
      } else {
        showToast(d.message || "Broadcast failed", "error");
      }
    } catch {
      setShowConfirm(false);
      showToast("Network error — broadcast failed", "error");
    } finally {
      setSending(false);
    }
  };

  const isValid = form.title.trim().length >= 3 && form.message.trim().length >= 10;

  return (
    <>
      <style>{DS_ADMIN}</style>

      {showConfirm && (
        <ConfirmBroadcast
          title={form.title}
          message={form.message}
          targetRole={form.targetRole}
          count={recipientCount}
          countLoading={countLoading}
          onConfirm={handleSend}
          onCancel={() => setShowConfirm(false)}
          sending={sending}
        />
      )}

      <div className="pg-head">
        <div>
          <div className="eyebrow">Platform-Wide Communication</div>
          <h1 className="pg-title">📢 Broadcast Notifications</h1>
          <p className="pg-sub">Send persistent notifications to users by role. All broadcasts stored in the database and recorded in the audit log.</p>
        </div>
      </div>

      {toast && <div className={toast.type === "error" ? "toast-error" : "toast-success"}>{toast.msg}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Compose Form */}
        <div className="card" style={{ alignSelf: "start" }}>
          <div className="card-title" style={{ marginBottom: 20 }}>✏️ Compose Broadcast</div>

          <div style={{ marginBottom: 16 }}>
            <label className="field-label">Target Audience</label>
            <select
              className="field-input"
              value={form.targetRole}
              onChange={(e) => setForm((f) => ({ ...f, targetRole: e.target.value }))}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{r === "all" ? "🌐 All Active Users" : `${r.charAt(0).toUpperCase() + r.slice(1)}s only`}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="field-label">Notification Title <span style={{ color: "#f87171" }}>*</span></label>
            <input
              className="field-input"
              placeholder="e.g. Scheduled Maintenance on Aug 20"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              maxLength={100}
            />
            <div style={{ fontSize: 11, color: "#a5b4fc", marginTop: 4 }}>{form.title.length}/100</div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="field-label">Message Body <span style={{ color: "#f87171" }}>*</span></label>
            <textarea
              className="field-input"
              rows={5}
              style={{ resize: "vertical" }}
              placeholder="Full notification message shown to recipients…"
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              maxLength={1000}
            />
            <div style={{ fontSize: 11, color: "#a5b4fc", marginTop: 4 }}>{form.message.length}/1000</div>
          </div>

          <div style={{ padding: "12px 16px", background: "rgba(99,102,241,0.06)", borderRadius: 12, border: "1px solid rgba(99,102,241,0.15)", marginBottom: 20, fontSize: 13, color: "#a5b4fc" }}>
            💡 Notifications are saved to the database. Recipients will see them on next login/refresh. No push delivery — in-app only.
          </div>

          <button
            className="btn-indigo"
            disabled={!isValid || sending}
            style={{ width: "100%", justifyContent: "center", opacity: !isValid ? 0.5 : 1 }}
            onClick={handlePreviewClick}
          >
            📤 Preview &amp; Send Broadcast
          </button>
        </div>

        {/* Broadcast History */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div className="card-title">📋 Broadcast History</div>
            <button className="tab-btn" onClick={loadHistory} disabled={histLoading}>🔄</button>
          </div>

          {histLoading && <div className="loading-wrap"><span className="spinner" /><span>Loading…</span></div>}

          {!histLoading && histError && (
            <div className="error-state">
              <div className="error-state-msg">Unable to load history</div>
              <div className="error-state-sub">{histError}</div>
            </div>
          )}

          {!histLoading && !histError && history.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">📢</div>
              <div className="empty-state-msg">No broadcasts sent yet</div>
              <div className="empty-state-sub">Your first broadcast will appear here.</div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {history.map((entry) => {
              const meta = entry.metadata || {};
              return (
                <div key={entry._id} style={{ padding: "14px 16px", background: "rgba(99,102,241,0.04)", borderRadius: 14, border: "1px solid rgba(99,102,241,0.1)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>📢 {meta.title || entry.description}</div>
                    <div style={{ fontSize: 11, color: "#a5b4fc", flexShrink: 0 }}>{relativeTime(entry.createdAt)}</div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: 12, color: "#a5b4fc" }}>
                    <span>👤 {entry.admin?.name || "Admin"}</span>
                    <span>🎯 {meta.targetRole === "all" ? "All Users" : `${meta.targetRole}s`}</span>
                    <span>✉️ {meta.recipientCount?.toLocaleString() || 0} recipients</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
