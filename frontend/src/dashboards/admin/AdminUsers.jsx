import { useState, useEffect, useCallback, Fragment } from "react";
import { useSearchParams } from "react-router-dom";
import { API_URL } from "../../config/api";
import { DS_ADMIN, ROLE_COLOR, relativeTime } from "./adminStyles";

const ROLE_FILTERS = ["all", "farmer", "seller", "user", "exporter", "admin"];

function ConfirmModal({ user, onConfirm, onCancel, loading }) {
  const isSuspending = user.isActive;
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="users-modal-title">
      <div className="modal-box">
        <div className="modal-title" id="users-modal-title">
          {isSuspending ? "🚫 Suspend User?" : "✅ Activate User?"}
        </div>
        <div className="modal-body">
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: "#a5b4fc", fontWeight: 800, textTransform: "uppercase", marginBottom: 4 }}>User</div>
            <div style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>{user.name || user.email}</div>
            <div style={{ fontSize: 12, color: "#a5b4fc", marginTop: 3 }}>{user.email} · <span style={{ textTransform: "capitalize" }}>{user.role}</span></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div style={{ padding: "9px 12px", borderRadius: 10, background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.12)" }}>
              <div style={{ fontSize: 10, color: "#a5b4fc", fontWeight: 800, textTransform: "uppercase", marginBottom: 4 }}>Current</div>
              <div style={{ fontSize: 13, color: user.isActive ? "#4ade80" : "#f87171", fontWeight: 800 }}>{user.isActive ? "ACTIVE" : "SUSPENDED"}</div>
            </div>
            <div style={{ padding: "9px 12px", borderRadius: 10, background: isSuspending ? "rgba(239,68,68,0.07)" : "rgba(34,197,94,0.07)", border: `1px solid ${isSuspending ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}` }}>
              <div style={{ fontSize: 10, color: "#a5b4fc", fontWeight: 800, textTransform: "uppercase", marginBottom: 4 }}>New State</div>
              <div style={{ fontSize: 13, color: isSuspending ? "#f87171" : "#4ade80", fontWeight: 800 }}>{isSuspending ? "SUSPENDED" : "ACTIVE"}</div>
            </div>
          </div>
          <div style={{ padding: "9px 12px", borderRadius: 10, background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.2)", fontSize: 12, color: "#fbbf24", fontWeight: 600 }}>
            ⚠️ {isSuspending
              ? "Suspending will immediately block all active sessions for this user."
              : "Restoring access will allow this user to log in and use the platform again."}
          </div>
        </div>
        <div className="modal-actions">
          <button className="tab-btn" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className={isSuspending ? "btn-danger" : "btn-success"} onClick={onConfirm} disabled={loading} aria-disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : (isSuspending ? "🚫 Suspend" : "✅ Activate")}
          </button>
        </div>
      </div>
    </div>
  );
}


export default function AdminUsers() {
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState(searchParams.get("role") || "all");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [updatingId, setUpdatingId] = useState(null);
  const [confirmUser, setConfirmUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const token = localStorage.getItem("agroconnect_token");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async (p = 1, currentRole = roleFilter, currentStatus = statusFilter, currentSearch = search) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: p, limit: 20 });
      if (currentRole !== "all") params.set("role", currentRole);
      if (currentStatus !== "all") params.set("status", currentStatus);
      if (currentSearch) params.set("search", currentSearch);
      const r = await fetch(`${API_URL}/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (d.success) {
        setUsers(d.users);
        setPagination({ total: d.total, totalPages: d.totalPages, page: d.page });
      } else throw new Error(d.message);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token, roleFilter, statusFilter, search]);

  // Synchronize when URL search parameters change
  useEffect(() => {
    const roleParam = searchParams.get("role") || "all";
    const statusParam = searchParams.get("status") || "all";
    const searchParam = searchParams.get("search") || "";
    setRoleFilter(roleParam);
    setStatusFilter(statusParam);
    setSearch(searchParam);
    setPage(1);
    load(1, roleParam, statusParam, searchParam);
  }, [searchParams]);

  useEffect(() => {
    load(page);
  }, [page]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); load(1); };

  const toggleStatus = async () => {
    if (!confirmUser) return;
    setUpdatingId(confirmUser._id);
    try {
      const r = await fetch(`${API_URL}/api/admin/users/${confirmUser._id}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (d.success) {
        setUsers((prev) => prev.map((u) => u._id === confirmUser._id ? { ...u, isActive: d.isActive } : u));
        showToast(d.message);
      } else {
        showToast(d.message || "Failed", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setUpdatingId(null);
      setConfirmUser(null);
    }
  };

  return (
    <>
      <style>{DS_ADMIN}</style>

      {confirmUser && (
        <ConfirmModal
          user={confirmUser}
          onConfirm={toggleStatus}
          onCancel={() => setConfirmUser(null)}
          loading={!!updatingId}
        />
      )}

      <div className="pg-head">
        <div>
          <div className="eyebrow">Platform User Management</div>
          <h1 className="pg-title">👥 User Directory</h1>
          <p className="pg-sub">Manage all registered users. Suspend or activate accounts. All changes are persisted.</p>
        </div>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: "#818cf8" }}>
          {pagination.total !== undefined ? `${pagination.total} Users` : ""}
        </div>
      </div>

      {toast && <div className={toast.type === "error" ? "toast-error" : "toast-success"}>{toast.msg}</div>}

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {ROLE_FILTERS.map((r) => (
            <button key={r} className={`tab-btn ${roleFilter === r ? "active" : ""}`} onClick={() => setRoleFilter(r)}>
              {r === "all" ? "🌐 All" : r.charAt(0).toUpperCase() + r.slice(1) + "s"}
            </button>
          ))}
        </div>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          <input className="field-input" style={{ maxWidth: 220 }} placeholder="🔍 Search name, email, phone…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button type="submit" className="btn-indigo" style={{ padding: "10px 14px" }}>Go</button>
        </form>
      </div>

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 68, borderRadius: 12 }} />)}
        </div>
      )}

      {!loading && error && (
        <div className="card error-state">
          <div className="error-state-icon">⚠️</div>
          <div className="error-state-msg">Unable to load users</div>
          <div className="error-state-sub">{error}</div>
          <button className="btn-indigo" onClick={() => load(page)}>Retry</button>
        </div>
      )}

      {!loading && !error && users.length === 0 && (
        <div className="card empty-state">
          <div className="empty-state-icon">👥</div>
          <div className="empty-state-msg">No users found</div>
          <div className="empty-state-sub">Try adjusting filters or search terms.</div>
        </div>
      )}

      {!loading && !error && users.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 20 }}>
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Location</th>
                  <th>Joined</th>
                  <th>Last Login</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <Fragment key={u._id}>
                    <tr style={{ cursor: "pointer" }} onClick={() => setExpandedId(expandedId === u._id ? null : u._id)}>
                      <td>
                        <div style={{ fontWeight: 700, color: "#fff" }}>{u.name || "—"}</div>
                        <div style={{ fontSize: 12, color: "#a5b4fc" }}>{u.email}</div>
                        {u.phone && <div style={{ fontSize: 11, color: "#818cf8" }}>{u.phone}</div>}
                      </td>
                      <td>
                        <span style={{ padding: "3px 9px", borderRadius: 7, background: `${ROLE_COLOR[u.role] || "#818cf8"}20`, color: ROLE_COLOR[u.role] || "#818cf8", fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>
                          {u.role || "—"}
                        </span>
                      </td>
                      <td style={{ fontSize: 13, color: "#a5b4fc" }}>
                        {[u.district, u.state].filter(Boolean).join(", ") || u.location || "—"}
                      </td>
                      <td style={{ fontSize: 12, color: "#a5b4fc", whiteSpace: "nowrap" }}>{relativeTime(u.createdAt)}</td>
                      <td style={{ fontSize: 12, color: "#a5b4fc", whiteSpace: "nowrap" }}>{u.lastLogin ? relativeTime(u.lastLogin) : "Never"}</td>
                      <td>
                        <span className={`badge ${u.isActive ? "badge-active" : "badge-suspended"}`}>
                          {u.isActive ? "● Active" : "● Suspended"}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button
                          className={u.isActive ? "btn-danger" : "btn-success"}
                          style={{ fontSize: 12 }}
                          disabled={updatingId === u._id}
                          onClick={() => setConfirmUser(u)}
                        >
                          {updatingId === u._id ? <span className="spinner" style={{ width: 12, height: 12 }} /> : u.isActive ? "🚫 Suspend" : "✅ Activate"}
                        </button>
                      </td>
                    </tr>
                    {expandedId === u._id && (
                      <tr>
                        <td colSpan={7} style={{ background: "rgba(99,102,241,0.04)", padding: "12px 20px" }}>
                          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", fontSize: 13, color: "#a5b4fc" }}>
                            <div><strong style={{ color: "#c7d2fe" }}>Email Verified:</strong> {u.isEmailVerified ? "✅ Yes" : "❌ No"}</div>
                            <div><strong style={{ color: "#c7d2fe" }}>Profile Complete:</strong> {u.profileCompleted ? "✅ Yes" : "⚠️ No"}</div>
                            {u.district && <div><strong style={{ color: "#c7d2fe" }}>District:</strong> {u.district}</div>}
                            {u.state && <div><strong style={{ color: "#c7d2fe" }}>State:</strong> {u.state}</div>}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button className="page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>‹ Prev</button>
          <span style={{ fontSize: 13, color: "#a5b4fc", padding: "6px 12px" }}>Page {page} of {pagination.totalPages}</span>
          <button className="page-btn" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next ›</button>
        </div>
      )}
    </>
  );
}
