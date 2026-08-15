import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { API_URL } from "../../config/api";
import { DS_ADMIN, relativeTime } from "./adminStyles";

const CROP_STATUSES = ["all", "growing", "ready", "listed", "sold"];

const STATUS_STYLE = {
  growing:  { bg: "rgba(34,197,94,0.12)",  color: "#4ade80" },
  ready:    { bg: "rgba(251,191,36,0.12)", color: "#fbbf24" },
  listed:   { bg: "rgba(99,102,241,0.15)", color: "#818cf8" },
  sold:     { bg: "rgba(56,189,248,0.12)", color: "#38bdf8" },
};

function ConfirmDelete({ crop, onConfirm, onCancel, loading }) {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-title">🗑️ Delete Crop Listing?</div>
        <div className="modal-body">
          Permanently delete <strong style={{ color: "#fff" }}>"{crop.name}"</strong> listed by{" "}
          <strong style={{ color: "#c7d2fe" }}>{crop.farmerName}</strong>?<br /><br />
          <span style={{ color: "#f87171" }}>This action cannot be undone.</span> The deletion will be recorded in the audit log.
        </div>
        <div className="modal-actions">
          <button className="tab-btn" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : "🗑️ Delete Permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCrops() {
  const [searchParams] = useSearchParams();
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [confirm, setConfirm] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);
  const token = localStorage.getItem("agroconnect_token");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async (p = 1, currentStatus = statusFilter, currentSearch = search) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: p, limit: 20 });
      if (currentStatus !== "all") params.set("status", currentStatus);
      if (currentSearch) params.set("search", currentSearch);
      const r = await fetch(`${API_URL}/api/admin/crops?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (d.success) {
        setCrops(d.crops);
        setPagination({ total: d.total, totalPages: d.totalPages, page: d.page });
      } else throw new Error(d.message);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter, search]);

  // Synchronize when URL search parameters change
  useEffect(() => {
    const statusParam = searchParams.get("status") || "all";
    const searchParam = searchParams.get("search") || "";
    setStatusFilter(statusParam);
    setSearch(searchParam);
    setPage(1);
    load(1, statusParam, searchParam);
  }, [searchParams]);

  useEffect(() => {
    load(page);
  }, [page]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); load(1); };

  const deleteCrop = async () => {
    if (!confirm) return;
    setDeletingId(confirm._id);
    try {
      const r = await fetch(`${API_URL}/api/admin/crops/${confirm._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (d.success) {
        setCrops((prev) => prev.filter((c) => c._id !== confirm._id));
        setPagination((prev) => ({ ...prev, total: (prev.total || 1) - 1 }));
        showToast(`Crop "${confirm.name}" deleted`);
      } else {
        showToast(d.message || "Delete failed", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setDeletingId(null);
      setConfirm(null);
    }
  };

  return (
    <>
      <style>{DS_ADMIN}</style>

      {confirm && (
        <ConfirmDelete
          crop={confirm}
          onConfirm={deleteCrop}
          onCancel={() => setConfirm(null)}
          loading={!!deletingId}
        />
      )}

      <div className="pg-head">
        <div>
          <div className="eyebrow">Crop Listing Moderation</div>
          <h1 className="pg-title">🌾 Crop Management</h1>
          <p className="pg-sub">Review and moderate crop listings across all farmers. Deletion is audit-logged.</p>
        </div>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: "#818cf8" }}>
          {pagination.total !== undefined ? `${pagination.total} Crops` : ""}
        </div>
      </div>

      {toast && <div className={toast.type === "error" ? "toast-error" : "toast-success"}>{toast.msg}</div>}

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {CROP_STATUSES.map((s) => (
            <button key={s} className={`tab-btn ${statusFilter === s ? "active" : ""}`} onClick={() => setStatusFilter(s)}>
              {s === "all" ? "🌐 All" : s}
            </button>
          ))}
        </div>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          <input className="field-input" style={{ maxWidth: 220 }} placeholder="🔍 Search crop, category, location…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button type="submit" className="btn-indigo" style={{ padding: "10px 14px" }}>Go</button>
          <button type="button" className="tab-btn" onClick={() => load(page)}>🔄</button>
        </form>
      </div>

      {loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 16 }} />)}
        </div>
      )}

      {!loading && error && (
        <div className="card error-state">
          <div className="error-state-icon">⚠️</div>
          <div className="error-state-msg">Unable to load crops</div>
          <div className="error-state-sub">{error}</div>
          <button className="btn-indigo" onClick={() => load(page)}>Retry</button>
        </div>
      )}

      {!loading && !error && crops.length === 0 && (
        <div className="card empty-state">
          <div className="empty-state-icon">🌾</div>
          <div className="empty-state-msg">No crops found</div>
          <div className="empty-state-sub">{statusFilter !== "all" ? `No ${statusFilter} crops.` : "No crops listed yet."}</div>
        </div>
      )}

      {!loading && !error && crops.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14, marginBottom: 20 }}>
            {crops.map((c) => {
              const sc = STATUS_STYLE[c.status] || STATUS_STYLE.growing;
              const imgUrl = c.image?.url;
              return (
                <div key={c._id} className="card" style={{ padding: 0, overflow: "hidden" }}>
                  {/* Image thumbnail */}
                  <div style={{ height: 120, background: imgUrl ? "transparent" : "rgba(99,102,241,0.08)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    {imgUrl
                      ? <img src={imgUrl} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontSize: 42 }}>🌾</span>
                    }
                  </div>

                  <div style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div style={{ fontWeight: 800, color: "#fff", fontSize: 15 }}>{c.name}</div>
                      <span style={{ padding: "3px 9px", borderRadius: 7, background: sc.bg, color: sc.color, fontSize: 11, fontWeight: 800 }}>{c.status}</span>
                    </div>

                    <div style={{ fontSize: 12, color: "#a5b4fc", marginBottom: 10 }}>
                      <div>🏷️ {c.category} · 📦 {c.quantity} {c.unit}</div>
                      <div>💰 ₹{c.price}/{c.unit}</div>
                      <div style={{ marginTop: 4 }}>👨‍🌾 {c.farmerName || "—"} — {c.farmerLocation || c.location || "—"}</div>
                      <div>📅 Listed {relativeTime(c.createdAt)}</div>
                    </div>

                    {c.isExportListing && (
                      <div style={{ marginBottom: 10, padding: "4px 10px", background: "rgba(251,191,36,0.1)", borderRadius: 8, border: "1px solid rgba(251,191,36,0.2)", fontSize: 11, color: "#fbbf24", fontWeight: 700 }}>
                        🌍 Export Grade: {c.exportGrade || "—"}
                      </div>
                    )}

                    <button
                      className="btn-danger"
                      style={{ width: "100%", justifyContent: "center" }}
                      disabled={deletingId === c._id}
                      onClick={() => setConfirm(c)}
                    >
                      {deletingId === c._id ? <span className="spinner" style={{ width: 14, height: 14 }} /> : "🗑️ Remove Listing"}
                    </button>
                  </div>
                </div>
              );
            })}
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
