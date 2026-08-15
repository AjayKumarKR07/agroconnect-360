import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { API_URL } from "../../config/api";
import { DS_ADMIN, relativeTime } from "./adminStyles";

const STATUS_COLORS = {
  open:         { bg: "rgba(56,189,248,0.12)",  color: "#38bdf8",  label: "🔵 Open" },
  under_review: { bg: "rgba(251,191,36,0.12)",  color: "#fbbf24",  label: "🔍 Under Review" },
  resolved:     { bg: "rgba(34,197,94,0.12)",   color: "#4ade80",  label: "✅ Resolved" },
  rejected:     { bg: "rgba(239,68,68,0.12)",   color: "#f87171",  label: "❌ Rejected" },
};

const PRIORITY_COLORS = {
  low:    { color: "#4ade80", label: "Low" },
  medium: { color: "#fbbf24", label: "Medium" },
  high:   { color: "#f87171", label: "High" },
};

function ConfirmModal({ dispute, targetStatus, adminNotes, resolution, onConfirm, onCancel, updating }) {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-title">Confirm Dispute Decision</div>
        <div className="modal-body">
          Mark <strong style={{ color: "#fff" }}>"{dispute.subject}"</strong> as{" "}
          <strong style={{ color: STATUS_COLORS[targetStatus]?.color }}>{targetStatus.replace("_", " ").toUpperCase()}</strong>?<br /><br />
          This decision will be saved permanently in the database.
        </div>
        <div className="modal-actions">
          <button className="btn-danger" onClick={onCancel} disabled={updating}>Cancel</button>
          <button className="btn-success" onClick={onConfirm} disabled={updating}>
            {updating ? <span className="spinner" style={{ width: 14, height: 14 }} /> : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DisputeCard({ dispute, onAction, updating }) {
  const [expanded, setExpanded] = useState(false);
  const [adminNotes, setAdminNotes] = useState(dispute.adminNotes || "");
  const [resolution, setResolution] = useState(dispute.resolution || "");
  const [confirm, setConfirm] = useState(null);
  const [valError, setValError] = useState(null);

  const sc = STATUS_COLORS[dispute.status] || STATUS_COLORS.open;
  const pc = PRIORITY_COLORS[dispute.priority] || PRIORITY_COLORS.medium;
  const canAct = dispute.status === "open" || dispute.status === "under_review";

  const handleDecisionClick = (targetStatus) => {
    setValError(null);
    if (targetStatus === "resolved" || targetStatus === "rejected") {
      const trimmed = resolution.trim();
      if (!trimmed || trimmed.length < 10) {
        setValError("Please provide a resolution explanation of at least 10 characters before resolving or rejecting.");
        return;
      }
    }
    setConfirm(targetStatus);
  };

  const handleConfirmAction = () => {
    if (confirm === "resolved" || confirm === "rejected") {
      const trimmed = resolution.trim();
      if (!trimmed || trimmed.length < 10) {
        setValError("Please provide a resolution explanation of at least 10 characters.");
        setConfirm(null);
        return;
      }
      onAction(dispute._id, confirm, adminNotes, trimmed);
    } else {
      onAction(dispute._id, confirm, adminNotes, resolution);
    }
    setConfirm(null);
  };

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div
        style={{ padding: "16px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}
        onClick={() => setExpanded((e) => !e)}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 800, color: "#fff", fontSize: 15 }}>{dispute.subject}</span>
            <span style={{ padding: "2px 9px", borderRadius: 7, background: sc.bg, color: sc.color, fontSize: 11, fontWeight: 700 }}>{sc.label}</span>
            <span style={{ padding: "2px 9px", borderRadius: 7, background: `${pc.color}15`, color: pc.color, fontSize: 11, fontWeight: 700 }}>{pc.label} Priority</span>
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: "#a5b4fc" }}>
            <span>👤 {dispute.raisedBy?.name || "Unknown"} ({dispute.raisedBy?.role || "user"})</span>
            <span>📧 {dispute.raisedBy?.email || "—"}</span>
            <span>🏷️ {dispute.category}</span>
            <span>📅 {relativeTime(dispute.createdAt)}</span>
            {dispute.order && <span>📦 Order: {fmtAmount(dispute.order?.totalAmount)}</span>}
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#a5b4fc", flexShrink: 0 }}>{expanded ? "▲ Hide" : "▼ Details"}</div>
      </div>

      {expanded && (
        <div style={{ padding: "0 20px 20px", borderTop: "1px solid rgba(99,102,241,0.1)" }}>
          <div style={{ margin: "14px 0", fontSize: 14, color: "#c7d2fe", lineHeight: 1.7, background: "rgba(99,102,241,0.04)", padding: "12px 16px", borderRadius: 12 }}>
            {dispute.description}
          </div>

          {dispute.resolution && (
            <div style={{ marginBottom: 14, padding: "10px 14px", background: "rgba(34,197,94,0.06)", borderRadius: 12, border: "1px solid rgba(34,197,94,0.15)" }}>
              <div style={{ fontSize: 11, color: "#a5b4fc", textTransform: "uppercase", marginBottom: 4 }}>Admin Resolution</div>
              <div style={{ fontSize: 14, color: "#4ade80" }}>{dispute.resolution}</div>
              {dispute.resolvedBy && (
                <div style={{ fontSize: 11, color: "#a5b4fc", marginTop: 4 }}>
                  Resolved by {dispute.resolvedBy.name} · {relativeTime(dispute.resolvedAt)}
                </div>
              )}
            </div>
          )}

          {canAct && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label className="field-label">Admin Notes</label>
                <textarea
                  className="field-input"
                  rows={2}
                  style={{ resize: "vertical" }}
                  placeholder="Internal notes (optional)"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>
              <div>
                <label className="field-label">Resolution (required to resolve / reject) <span style={{ color: "#f87171" }}>*</span></label>
                <textarea
                  className="field-input"
                  rows={2}
                  style={{
                    resize: "vertical",
                    borderColor: valError ? "#f87171" : undefined,
                  }}
                  placeholder="Explain the final decision to the user (minimum 10 characters)…"
                  value={resolution}
                  onChange={(e) => {
                    setResolution(e.target.value);
                    if (valError && e.target.value.trim().length >= 10) setValError(null);
                  }}
                />
                {valError && (
                  <div style={{ color: "#f87171", fontSize: 12, marginTop: 4, fontWeight: 600 }}>
                    ⚠️ {valError}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {dispute.status === "open" && (
                  <button className="tab-btn" onClick={() => onAction(dispute._id, "under_review", adminNotes, resolution)}>
                    🔍 Mark Under Review
                  </button>
                )}
                <button className="btn-success" onClick={() => handleDecisionClick("resolved")}>✅ Resolve</button>
                <button className="btn-danger" onClick={() => handleDecisionClick("rejected")}>❌ Reject</button>
              </div>
            </div>
          )}
        </div>
      )}

      {confirm && (
        <ConfirmModal
          dispute={dispute}
          targetStatus={confirm}
          adminNotes={adminNotes}
          resolution={resolution}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirm(null)}
          updating={updating}
        />
      )}
    </div>
  );
}

const fmtAmount = (n) => n ? `₹${Number(n).toLocaleString("en-IN")}` : "—";

const STATUS_FILTERS = ["all", "open", "under_review", "resolved", "rejected"];

export default function AdminDisputes() {
  const [searchParams] = useSearchParams();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [updating, setUpdating] = useState(null);
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const token = localStorage.getItem("agroconnect_token");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async (p = 1, currentStatus = statusFilter) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: 15, page: p });
      if (currentStatus !== "all") params.set("status", currentStatus);
      const r = await fetch(`${API_URL}/api/admin/disputes?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (d.success) {
        setDisputes(d.disputes || []);
        setPagination({ total: d.total, totalPages: d.totalPages, page: d.page });
      } else {
        throw new Error(d.message);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter]);

  // Synchronize when URL search parameters change
  useEffect(() => {
    const statusParam = searchParams.get("status") || "all";
    setStatusFilter(statusParam);
    setPage(1);
    load(1, statusParam);
  }, [searchParams]);

  useEffect(() => {
    load(page);
  }, [page]);

  const handleAction = async (id, status, adminNotes, resolution) => {
    setUpdating(id);
    try {
      const r = await fetch(`${API_URL}/api/admin/disputes/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, adminNotes, resolution }),
      });
      const d = await r.json();
      if (d.success) {
        setDisputes((prev) => prev.map((dp) => dp._id === id ? { ...dp, ...d.dispute } : dp));
        showToast(`Dispute marked as ${status}`);
      } else {
        showToast(d.message || "Update failed", "error");
      }
    } catch {
      showToast("Network error — update failed", "error");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <>
      <style>{DS_ADMIN}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Platform Mediation</div>
          <h1 className="pg-title">⚖️ Dispute Resolution Center</h1>
          <p className="pg-sub">Review and resolve disputes raised by platform users. All decisions persist in MongoDB.</p>
        </div>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: "#818cf8" }}>
          {pagination.total || 0} Disputes
        </div>
      </div>

      {toast && <div className={toast.type === "error" ? "toast-error" : "toast-success"}>{toast.msg}</div>}

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
        {STATUS_FILTERS.map((f) => (
          <button key={f} className={`tab-btn ${statusFilter === f ? "active" : ""}`} onClick={() => setStatusFilter(f)}>
            {f === "all" ? "🌐 All" : STATUS_COLORS[f]?.label || f}
          </button>
        ))}
        <button className="tab-btn" style={{ marginLeft: "auto" }} onClick={() => load(page)}>🔄 Refresh</button>
      </div>

      {loading && <div className="loading-wrap"><span className="spinner" /><span>Loading disputes…</span></div>}

      {!loading && error && (
        <div className="card error-state">
          <div className="error-state-icon">⚠️</div>
          <div className="error-state-msg">Unable to load disputes</div>
          <div className="error-state-sub">{error}</div>
          <button className="btn-indigo" onClick={() => load(page)}>Retry</button>
        </div>
      )}

      {!loading && !error && disputes.length === 0 && (
        <div className="card empty-state">
          <div className="empty-state-icon">⚖️</div>
          <div className="empty-state-msg">No disputes found</div>
          <div className="empty-state-sub">{statusFilter !== "all" ? `No ${statusFilter.replace("_"," ")} disputes.` : "No disputes have been raised yet."}</div>
        </div>
      )}

      {!loading && !error && disputes.length > 0 && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {disputes.map((d) => (
              <DisputeCard key={d._id} dispute={d} onAction={handleAction} updating={updating === d._id} />
            ))}
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
