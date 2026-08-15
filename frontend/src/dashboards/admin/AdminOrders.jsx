import { useState, useEffect, useCallback, Fragment } from "react";
import { useSearchParams } from "react-router-dom";
import { API_URL } from "../../config/api";
import { DS_ADMIN, fmtINR, relativeTime } from "./adminStyles";

const ORDER_STATUSES = ["all", "pending", "accepted", "processing", "shipped", "delivered", "cancelled", "rejected"];

const STATUS_STYLE = {
  pending:    { bg: "rgba(251,191,36,0.12)",  color: "#fbbf24" },
  accepted:   { bg: "rgba(34,197,94,0.12)",   color: "#4ade80" },
  processing: { bg: "rgba(56,189,248,0.12)",  color: "#38bdf8" },
  shipped:    { bg: "rgba(167,139,250,0.12)", color: "#a78bfa" },
  delivered:  { bg: "rgba(34,197,94,0.15)",   color: "#4ade80" },
  cancelled:  { bg: "rgba(239,68,68,0.12)",   color: "#f87171" },
  rejected:   { bg: "rgba(239,68,68,0.12)",   color: "#f87171" },
};

function ConfirmModal({ order, newStatus, onConfirm, onCancel, loading }) {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-title">Update Order Status?</div>
        <div className="modal-body">
          Change order <strong style={{ color: "#818cf8", fontFamily: "monospace" }}>…{String(order._id).slice(-8)}</strong> status to{" "}
          <strong style={{ color: STATUS_STYLE[newStatus]?.color }}>{newStatus.toUpperCase()}</strong>?<br /><br />
          This action will be recorded in the audit log.
        </div>
        <div className="modal-actions">
          <button className="tab-btn" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="btn-indigo" onClick={onConfirm} disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrders() {
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [confirm, setConfirm] = useState(null); // { order, newStatus }
  const [updatingId, setUpdatingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
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
      const r = await fetch(`${API_URL}/api/admin/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (d.success) {
        setOrders(d.orders);
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

  const updateStatus = async () => {
    if (!confirm) return;
    setUpdatingId(confirm.order._id);
    try {
      const r = await fetch(`${API_URL}/api/admin/orders/${confirm.order._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: confirm.newStatus }),
      });
      const d = await r.json();
      if (d.success) {
        setOrders((prev) => prev.map((o) => o._id === confirm.order._id ? { ...o, status: confirm.newStatus } : o));
        showToast(`Order updated to ${confirm.newStatus}`);
      } else {
        showToast(d.message || "Update failed", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setUpdatingId(null);
      setConfirm(null);
    }
  };

  return (
    <>
      <style>{DS_ADMIN}</style>

      {confirm && (
        <ConfirmModal
          order={confirm.order}
          newStatus={confirm.newStatus}
          onConfirm={updateStatus}
          onCancel={() => setConfirm(null)}
          loading={!!updatingId}
        />
      )}

      <div className="pg-head">
        <div>
          <div className="eyebrow">Marketplace Order Management</div>
          <h1 className="pg-title">📦 All Orders</h1>
          <p className="pg-sub">View and manage every order on the platform. Status changes are recorded in the audit log.</p>
        </div>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: "#818cf8" }}>
          {pagination.total !== undefined ? `${pagination.total} Orders` : ""}
        </div>
      </div>

      {toast && <div className={toast.type === "error" ? "toast-error" : "toast-success"}>{toast.msg}</div>}

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {ORDER_STATUSES.map((s) => (
            <button key={s} className={`tab-btn ${statusFilter === s ? "active" : ""}`} onClick={() => setStatusFilter(s)}>
              {s === "all" ? "🌐 All" : s}
            </button>
          ))}
        </div>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          <input className="field-input" style={{ maxWidth: 220 }} placeholder="🔍 Search crop, buyer, city…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button type="submit" className="btn-indigo" style={{ padding: "10px 14px" }}>Go</button>
          <button type="button" className="tab-btn" onClick={() => load(page)}>🔄</button>
        </form>
      </div>

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 70, borderRadius: 12 }} />)}
        </div>
      )}

      {!loading && error && (
        <div className="card error-state">
          <div className="error-state-icon">⚠️</div>
          <div className="error-state-msg">Unable to load orders</div>
          <div className="error-state-sub">{error}</div>
          <button className="btn-indigo" onClick={() => load(page)}>Retry</button>
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="card empty-state">
          <div className="empty-state-icon">📦</div>
          <div className="empty-state-msg">No orders found</div>
          <div className="empty-state-sub">{statusFilter !== "all" ? `No ${statusFilter} orders.` : "No orders yet on the platform."}</div>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 20 }}>
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Buyer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Update Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const sc = STATUS_STYLE[o.status] || STATUS_STYLE.pending;
                  return (
                    <Fragment key={o._id}>
                      <tr style={{ cursor: "pointer" }} onClick={() => setExpandedId(expandedId === o._id ? null : o._id)}>
                        <td style={{ fontFamily: "monospace", fontSize: 12, color: "#818cf8" }}>…{String(o._id).slice(-8)}</td>
                        <td>
                          <div style={{ fontWeight: 700, color: "#fff", fontSize: 13 }}>{o.buyer?.name || "—"}</div>
                          <div style={{ fontSize: 11, color: "#a5b4fc" }}>{o.buyer?.email}</div>
                        </td>
                        <td style={{ fontSize: 13, color: "#a5b4fc" }}>
                          {o.items?.map((it) => it.cropName).join(", ") || "—"}
                        </td>
                        <td style={{ fontWeight: 800, color: "#4ade80", fontFamily: "'Space Grotesk',sans-serif" }}>
                          {fmtINR(o.totalAmount)}
                        </td>
                        <td style={{ fontSize: 12, color: "#a5b4fc" }}>{(o.paymentMethod || "cod").toUpperCase()}</td>
                        <td>
                          <span style={{ padding: "3px 9px", borderRadius: 7, background: sc.bg, color: sc.color, fontSize: 12, fontWeight: 800 }}>
                            {o.status}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: "#a5b4fc", whiteSpace: "nowrap" }}>{relativeTime(o.createdAt)}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <select
                            className="field-input"
                            style={{ padding: "6px 10px", fontSize: 12, width: "auto" }}
                            value={o.status}
                            disabled={updatingId === o._id}
                            onChange={(e) => setConfirm({ order: o, newStatus: e.target.value })}
                          >
                            {ORDER_STATUSES.filter((s) => s !== "all").map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                      {expandedId === o._id && (
                        <tr>
                          <td colSpan={8} style={{ background: "rgba(99,102,241,0.04)", padding: "12px 20px" }}>
                            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", fontSize: 13, color: "#a5b4fc" }}>
                              <div><strong style={{ color: "#c7d2fe" }}>Payment Status:</strong> {o.paymentStatus}</div>
                              <div><strong style={{ color: "#c7d2fe" }}>Notes:</strong> {o.notes || "None"}</div>
                              <div><strong style={{ color: "#c7d2fe" }}>Delivery:</strong> {o.deliveryAddress?.city}, {o.deliveryAddress?.state} - {o.deliveryAddress?.pincode}</div>
                            </div>
                            <div style={{ marginTop: 10, fontSize: 12, color: "#a5b4fc" }}>
                              <strong style={{ color: "#c7d2fe" }}>Farmers involved:</strong>{" "}
                              {[...new Set(o.items?.map((it) => it.farmer?.name).filter(Boolean))].join(", ") || "—"}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
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
