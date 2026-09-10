import { useState, useEffect, useCallback, Fragment } from "react";
import { useSearchParams } from "react-router-dom";
import { API_URL } from "../../config/api";
import { DS_ADMIN, fmtINR, relativeTime } from "./adminStyles";
import { Package } from "lucide-react";

const ORDER_STATUSES = ["all", "pending", "accepted", "processing", "shipped", "delivered", "cancelled", "rejected"];

const STATUS_STYLE = {
  pending:    { bg: "rgba(251,191,36,0.12)",  color: "#b45309" },
  accepted:   { bg: "rgba(34,197,94,0.12)",   color: "#15803d" },
  processing: { bg: "rgba(56,189,248,0.12)",  color: "#0369a1" },
  shipped:    { bg: "rgba(167,139,250,0.12)", color: "#7c3aed" },
  delivered:  { bg: "rgba(34,197,94,0.15)",   color: "#15803d" },
  cancelled:  { bg: "rgba(239,68,68,0.12)",   color: "#dc2626" },
  rejected:   { bg: "rgba(239,68,68,0.12)",   color: "#dc2626" },
};

// Payment status badges
const PAY_STATUS_STYLE = {
  paid:    { label: "✅ Paid",     bg: "rgba(34,197,94,0.12)",   color: "#15803d" },
  pending: { label: "⏳ Pending",  bg: "rgba(251,191,36,0.12)",  color: "#b45309" },
  failed:  { label: "❌ Failed",   bg: "rgba(239,68,68,0.12)",   color: "#dc2626" },
  refunded:{ label: "↩️ Refunded", bg: "rgba(167,139,250,0.12)", color: "#7c3aed" },
};

const PAY_METHOD_LABEL = {
  cod:        { label: "COD",    bg: "rgba(148,163,184,0.1)",   color: "#94a3b8" },
  razorpay:   { label: "ONLINE", bg: "rgba(14,165,233,0.1)",   color: "#0369a1" },
  upi:        { label: "UPI",    bg: "rgba(14,165,233,0.08)",  color: "#0369a1" },
  card:       { label: "CARD",   bg: "rgba(167,139,250,0.1)",  color: "#7c3aed" },
  netbanking: { label: "NBNK",   bg: "rgba(167,139,250,0.08)", color: "#7c3aed" },
};

function ConfirmModal({ order, newStatus, onConfirm, onCancel, loading }) {
  const current = order.status;
  const sc = STATUS_STYLE[newStatus] || STATUS_STYLE.pending;
  const cc = STATUS_STYLE[current] || STATUS_STYLE.pending;
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
      <div className="modal-box">
        <div className="modal-title" id="confirm-modal-title">Change Order Status</div>
        <div className="modal-body">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.12)" }}>
              <div style={{ fontSize: 10, color: "#a5b4fc", fontWeight: 800, textTransform: "uppercase", marginBottom: 4 }}>Order</div>
              <div style={{ fontFamily: "monospace", fontSize: 13, color: "#818cf8", fontWeight: 700 }}>…{String(order._id).slice(-10)}</div>
            </div>
            <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.12)" }}>
              <div style={{ fontSize: 10, color: "#a5b4fc", fontWeight: 800, textTransform: "uppercase", marginBottom: 4 }}>Buyer</div>
              <div style={{ fontSize: 13, color: "#c7d2fe", fontWeight: 600 }}>{order.buyer?.name || "—"}</div>
            </div>
            <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.12)" }}>
              <div style={{ fontSize: 10, color: "#a5b4fc", fontWeight: 800, textTransform: "uppercase", marginBottom: 4 }}>Current Status</div>
              <div style={{ fontSize: 13, color: cc.color, fontWeight: 800, textTransform: "uppercase" }}>{current}</div>
            </div>
            <div style={{ padding: "10px 14px", borderRadius: 10, background: `${sc.bg}`, border: `1px solid ${sc.color}44` }}>
              <div style={{ fontSize: 10, color: "#a5b4fc", fontWeight: 800, textTransform: "uppercase", marginBottom: 4 }}>New Status</div>
              <div style={{ fontSize: 13, color: sc.color, fontWeight: 800, textTransform: "uppercase" }}>{newStatus}</div>
            </div>
          </div>
          <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.2)", fontSize: 12, color: "#b45309", fontWeight: 600 }}>
            ⚠️ This change is shared — the Farmer and Buyer will both see the updated order status immediately.
          </div>
        </div>
        <div className="modal-actions">
          <button className="tab-btn" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="btn-indigo" onClick={onConfirm} disabled={loading} aria-disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : "Confirm Change"}
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
  const [statusFilter,        setStatusFilter]        = useState(searchParams.get("status")        || "all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState(searchParams.get("paymentStatus") || "all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState(searchParams.get("paymentMethod") || "all");
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

  const load = useCallback(async (p = 1, currentStatus = statusFilter, currentSearch = search, curPayStatus = paymentStatusFilter, curPayMethod = paymentMethodFilter) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: p, limit: 20 });
      if (currentStatus !== "all")  params.set("status",        currentStatus);
      if (currentSearch)            params.set("search",        currentSearch);
      if (curPayStatus !== "all")   params.set("paymentStatus", curPayStatus);
      if (curPayMethod !== "all")   params.set("paymentMethod", curPayMethod);
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
  }, [token, statusFilter, search, paymentStatusFilter, paymentMethodFilter]);

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
          <h1 className="pg-title"><Package size={22} strokeWidth={2} style={{ marginRight: 8, color: "#4f46e5", verticalAlign: "middle" }} />All Orders</h1>
          <p className="pg-sub">View and manage every order on the platform. Status changes are recorded in the audit log.</p>
        </div>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: "#818cf8" }}>
          {pagination.total !== undefined ? `${pagination.total} Orders` : ""}
        </div>
      </div>

      {toast && <div className={toast.type === "error" ? "toast-error" : "toast-success"}>{toast.msg}</div>}

      {/* Order status filter tabs */}
      <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {ORDER_STATUSES.map((s) => (
            <button key={s} className={`tab-btn ${statusFilter === s ? "active" : ""}`} onClick={() => { setStatusFilter(s); setPage(1); load(1, s); }}>
              {s === "all" ? "🌐 All" : s}
            </button>
          ))}
        </div>
      </div>

      {/* Payment filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Payment:</span>
        {/* Payment STATUS filter */}
        {[["all", "💳 All"], ["paid", "✅ Paid"], ["pending", "⏳ Pending"], ["failed", "❌ Failed"]].map(([val, lbl]) => (
          <button key={val} className={`tab-btn ${paymentStatusFilter === val ? "active" : ""}`}
            onClick={() => { setPaymentStatusFilter(val); setPage(1); load(1, statusFilter, search, val, paymentMethodFilter); }}>
            {lbl}
          </button>
        ))}
        <span style={{ width: 1, height: 20, background: "rgba(14,165,233,0.15)" }} />
        {/* COD filter — paymentMethod since COD is not a paymentStatus */}
        <button className={`tab-btn ${paymentMethodFilter === "cod" ? "active" : ""}`}
          onClick={() => { const v = paymentMethodFilter === "cod" ? "all" : "cod"; setPaymentMethodFilter(v); setPage(1); load(1, statusFilter, search, paymentStatusFilter, v); }}>
          💵 COD
        </button>
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
                          <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 13 }}>{o.buyer?.name || "—"}</div>
                          <div style={{ fontSize: 11, color: "#a5b4fc" }}>{o.buyer?.email}</div>
                        </td>
                        <td style={{ fontSize: 13, color: "#a5b4fc" }}>
                          {o.items?.map((it) => it.cropName).join(", ") || "—"}
                        </td>
                        <td style={{ fontWeight: 800, color: "#15803d", fontFamily: "'Space Grotesk',sans-serif" }}>
                          {fmtINR(o.totalAmount)}
                        </td>
                        <td style={{ fontSize: 12 }}>
                          {/* Payment method badge */}
                          {(() => {
                            const pm = PAY_METHOD_LABEL[o.paymentMethod] || PAY_METHOD_LABEL.cod;
                            const ps = PAY_STATUS_STYLE[o.paymentStatus] || PAY_STATUS_STYLE.pending;
                            return (
                              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <span style={{ padding: "2px 7px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: pm.bg, color: pm.color }}>
                                  {pm.label}
                                </span>
                                <span style={{ padding: "2px 7px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: ps.bg, color: ps.color }}>
                                  {ps.label}
                                </span>
                              </div>
                            );
                          })()}
                        </td>
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
                              <div><strong style={{ color: "#c7d2fe" }}>Payment Status:</strong> {o.paymentStatus || "pending"}</div>
                              {o.razorpayPaymentId && (
                                <div><strong style={{ color: "#c7d2fe" }}>Payment Reference:</strong>{" "}
                                  <span style={{ fontFamily: "monospace", fontSize: 12, color: "#818cf8" }}>{o.razorpayPaymentId}</span>
                                </div>
                              )}
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
