import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { API_URL } from "../../config/api";
import { DS } from "../../styles/ds";
import { ClipboardList, Clock, CheckCircle2, Truck, Package, XCircle, Ban, Settings, Inbox, User, CalendarDays, MapPin, RefreshCw, AlertTriangle, Sprout, PackageCheck } from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────
   CONSTANTS — derived from actual Order model enum values
   Order.js status enum: pending | accepted | processing | shipped |
                         delivered | rejected | cancelled
───────────────────────────────────────────────────────────────────── */
const STATUS_META = {
  pending:    { label: "Pending",    badge: "badge-amber",  Icon: Clock,         iconColor: "#b45309" },
  accepted:   { label: "Accepted",   badge: "badge-blue",   Icon: CheckCircle2,  iconColor: "#0369a1" },
  processing: { label: "Processing", badge: "badge-blue",   Icon: Settings,      iconColor: "#7c3aed" },
  shipped:    { label: "Shipped",    badge: "badge-purple", Icon: Truck,         iconColor: "#7c3aed" },
  delivered:  { label: "Delivered",  badge: "badge-green",  Icon: Package,       iconColor: "#15803d" },
  rejected:   { label: "Rejected",   badge: "badge-red",    Icon: XCircle,       iconColor: "#dc2626" },
  cancelled:  { label: "Cancelled",  badge: "badge-red",    Icon: Ban,           iconColor: "#dc2626" },
};

const PAYMENT_LABELS = {
  cod:        "Cash on Delivery",
  upi:        "UPI",
  card:       "Card",
  netbanking: "Net Banking",
};

// Main workflow timeline (positive path)
const TIMELINE_STEPS   = ["pending", "accepted", "shipped", "delivered"];
const TERMINAL_NEGATIVE = ["rejected", "cancelled"];

/* ─────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────── */
// Safe display: never show undefined / null / "" / [object Object]
const na = (v) => {
  if (v === undefined || v === null || v === "") return "Not available";
  if (typeof v === "object") return "Not available"; // guard against [object Object]
  return String(v);
};

// Format currency
const inr = (n) =>
  n != null && !isNaN(Number(n))
    ? `₹${Number(n).toLocaleString("en-IN")}`
    : "Not available";

// Format deliveryAddress — the controller returns a string already,
// but handle both string and object shapes defensively.
const fmtAddress = (addr) => {
  if (!addr) return "Not available";
  if (typeof addr === "string") return addr.trim() || "Not available";
  // object shape: { name, phone, address, city, state, pincode }
  const parts = [addr.address, addr.city, addr.state, addr.pincode].filter(Boolean);
  return parts.length ? parts.join(", ") : "Not available";
};

// Format a date nicely
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleString("en-IN", {
        day: "numeric", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "Not available";

/* ─────────────────────────────────────────────────────────────────────
   ORDER DETAILS MODAL
   Uses ReactDOM.createPortal to mount at document.body so it is never
   clipped by the layout's overflow, transform, or z-index context.
───────────────────────────────────────────────────────────────────── */
function OrderDetailsModal({ order, onClose, updatingId, onUpdateStatus }) {
  // Escape key + body scroll-lock
  useEffect(() => {
    if (!order) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [order, onClose]);

  if (!order) return null;

  const meta       = STATUS_META[order.status] || STATUS_META.pending;
  const isNegative = TERMINAL_NEGATIVE.includes(order.status);
  const tlIdx      = TIMELINE_STEPS.indexOf(order.status);

  // Build timeline steps
  const timelineSteps = isNegative
    ? [TIMELINE_STEPS[0], order.status]   // pending → rejected/cancelled
    : TIMELINE_STEPS;

  // The controller flattens the order per-item, so these exist at root level:
  //   cropName, quantity, unit, pricePerUnit, totalAmount
  //   buyerName, buyerPhone, deliveryAddress (string)
  //   buyer: { name, email, phone }  (populated)
  //   items: [{ cropName, quantity, unit, price, subtotal }]
  //
  // We show the flat root fields as the "primary item" and also render
  // the full items[] if it has more than one entry.

  const primaryTotal = order.totalAmount ?? (order.pricePerUnit * order.quantity) ?? 0;

  // items[] from the API — may contain multiple crops from the same order
  const items = Array.isArray(order.items) ? order.items : [];

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  // ── JSX ──────────────────────────────────────────────────────────
  return createPortal(
    <div
      onClick={handleBackdrop}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.80)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
        overflowY: "auto",
      }}
    >
      {/* Modal panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0d1117",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 20,
          width: "100%", maxWidth: 640,
          maxHeight: "90vh", overflowY: "auto",
          boxShadow: "0 32px 80px rgba(0,0,0,0.80)",
          animation: "od-slideUp 0.22s ease",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)",
          position: "sticky", top: 0, background: "#0d1117", zIndex: 2,
          borderRadius: "20px 20px 0 0",
        }}>
          <div>
            <div style={{
              fontSize: 10, fontWeight: 700, color: "#16a34a",
              textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4,
            }}>
              Order Details
            </div>
            <div style={{
              fontSize: 18, fontWeight: 800, color: "#0f172a",
              fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.2,
            }}>
              {na(order.cropName)}
            </div>
            <div style={{ fontSize: 12, color: "#7a8fa6", marginTop: 3 }}>
              #{String(order._id).slice(-8).toUpperCase()}
            </div>
          </div>
          <button
            onClick={onClose}
            title="Close (Esc)"
            style={{
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)",
              color: "#7a8fa6", borderRadius: 10, width: 36, height: 36,
              cursor: "pointer", fontSize: 20,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.2s, color 0.2s", flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#7a8fa6"; }}
          >×</button>
        </div>

        {/* ── Body ───────────────────────────────────────────────── */}
        <div style={{ padding: "24px" }}>

          {/* STATUS BADGE */}
          <div style={{ marginBottom: 20 }}>
            <span className={`od-badge od-badge-${order.status === "pending" ? "amber" : order.status === "delivered" ? "green" : order.status === "rejected" || order.status === "cancelled" ? "red" : order.status === "shipped" ? "purple" : "blue"}`}>
                {meta.Icon ? <span style={{ display: "inline-flex", verticalAlign: "middle", marginRight: 4 }}><meta.Icon size={12} strokeWidth={2} /></span> : null}{meta.label}
            </span>
          </div>

          {/* ── ORDER INFORMATION ── */}
          <OdSection title="Order Information">
            <OdRow label="Order ID"     value={`#${order._id}`} mono />
            <OdRow label="Order Date"   value={fmtDate(order.createdAt)} />
            <OdRow label="Last Updated" value={fmtDate(order.updatedAt)} />
            <OdRow label="Status"       value={<span className={`od-badge od-badge-${order.status === "pending" ? "amber" : order.status === "delivered" ? "green" : order.status === "rejected" || order.status === "cancelled" ? "red" : order.status === "shipped" ? "purple" : "blue"}`}>{meta.Icon && <meta.Icon size={11} strokeWidth={2} style={{ verticalAlign: "middle", marginRight: 3 }} />}{meta.label}</span>} />
          </OdSection>

          {/* ── BUYER INFORMATION ── */}
          <OdSection title="Buyer Information">
            <OdRow label="Buyer Name"      value={na(order.buyerName || order.buyer?.name)} />
            <OdRow label="Email"           value={na(order.buyer?.email)} />
            <OdRow label="Phone"           value={na(order.buyerPhone || order.buyer?.phone || order.deliveryAddress?.phone)} />
            <OdRow label="Delivery Address" value={fmtAddress(order.deliveryAddress)} />
          </OdSection>

          {/* ── CROP / ORDER ITEMS ── */}
          {/* If items[] has data, render each item; otherwise show flat fields */}
          {items.length > 0 ? (
            <OdSection title={`Order Items (${items.length})`}>
              {items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 12, padding: "14px 16px",
                    marginBottom: idx < items.length - 1 ? 10 : 0,
                  }}
                >
                  <div style={{
                    fontSize: 14, fontWeight: 700, color: "#0f172a",
                    marginBottom: 8, fontFamily: "'Space Grotesk', sans-serif",
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <Sprout size={14} color="#16a34a" /> {na(item.cropName)}
                  </div>
                  <OdRow label="Quantity"     value={`${na(item.quantity)} ${na(item.unit)}`} />
                  <OdRow label="Price / Unit" value={inr(item.price)} />
                  <OdRow label="Subtotal"     value={inr(item.subtotal ?? (item.quantity * item.price))} highlight />
                </div>
              ))}
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <OdRow label="Order Total" value={inr(order.totalAmount)} highlight />
              </div>
            </OdSection>
          ) : (
            // Fallback: show flattened fields
            <OdSection title="Crop Information">
              <OdRow label="Crop Name"    value={na(order.cropName)} />
              <OdRow label="Quantity"     value={na(order.quantity)} />
              <OdRow label="Unit"         value={na(order.unit)} />
              <OdRow label="Price / Unit" value={inr(order.pricePerUnit)} />
              <OdRow label="Subtotal"     value={inr(primaryTotal)} highlight />
            </OdSection>
          )}

          {/* ── PAYMENT ── */}
          <OdSection title="Payment">
            <OdRow label="Payment Method" value={na(PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod)} />
            <OdRow label="Total Amount"   value={inr(order.totalAmount ?? primaryTotal)} highlight />
            <OdRow label="Payment Status" value={
              order.paymentStatus
                ? <span className={`od-badge ${order.paymentStatus === "paid" ? "od-badge-green" : order.paymentStatus === "failed" ? "od-badge-red" : "od-badge-amber"}`}>
                    {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                  </span>
                : "Not available"
            } />
          </OdSection>

          {/* ── ORDER PROGRESS TIMELINE ── */}
          <OdSection title="Order Progress">
            <div style={{ paddingTop: 6 }}>
              {timelineSteps.map((step, i) => {
                const sm = STATUS_META[step] || {};
                let state;
                if (isNegative) {
                  state = i === 0 ? "done" : "negative";
                } else {
                  state = i < tlIdx ? "done" : i === tlIdx ? "active" : "future";
                }
                const isLast = i === timelineSteps.length - 1;
                const dotColor =
                  state === "done"     ? { bg: "rgba(34,197,94,0.18)",   border: "rgba(34,197,94,0.5)",   text: "#4ade80" } :
                  state === "active"   ? { bg: "rgba(34,197,94,0.30)",   border: "#22c55e",               text: "#fff"    } :
                  state === "negative" ? { bg: "rgba(239,68,68,0.18)",   border: "rgba(239,68,68,0.5)",   text: "#f87171" } :
                                         { bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.10)", text: "#7a8fa6" };
                return (
                  <div key={step} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    {/* Dot + connector */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: 700,
                        background: dotColor.bg,
                        border: `2px solid ${dotColor.border}`,
                        color: dotColor.text,
                        boxShadow: state === "active" ? "0 0 16px rgba(34,197,94,0.4)" : "none",
                        transition: "all 0.2s",
                      }}>
                        {state === "done" ? <CheckCircle2 size={13} strokeWidth={2.5} /> : state === "negative" ? <XCircle size={13} strokeWidth={2.5} /> : (sm.Icon ? <sm.Icon size={13} strokeWidth={2} /> : null)}
                      </div>
                      {!isLast && (
                        <div style={{
                          width: 2, height: 28, marginTop: 2,
                          background: state === "done" ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.06)",
                        }} />
                      )}
                    </div>
                    {/* Label */}
                    <div style={{ paddingTop: 5, paddingBottom: isLast ? 0 : 22 }}>
                      <div style={{
                        fontSize: 14,
                        fontWeight: (state === "active" || state === "negative") ? 700 : 500,
                        color: state === "done" ? "#4ade80" : state === "active" ? "#fff" : state === "negative" ? "#f87171" : "#7a8fa6",
                      }}>
                        {sm.Icon && <sm.Icon size={13} strokeWidth={2} style={{ verticalAlign: "middle", marginRight: 4 }} />}{sm.label}
                        {(state === "active" || state === "negative") && (
                          <span style={{ fontSize: 11, marginLeft: 8, opacity: 0.55 }}>← current</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </OdSection>

          {/* ── ACTION BUTTONS INSIDE MODAL ── */}
          {(order.status === "pending" || order.status === "accepted" ||
            order.status === "processing" || order.status === "shipped") && (
            <div style={{
              borderTop: "1px solid rgba(255,255,255,0.07)",
              paddingTop: 20, marginTop: 4,
              display: "flex", gap: 10, flexWrap: "wrap",
            }}>
              {order.status === "pending" && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); onUpdateStatus(order._id, "accepted"); }}
                    disabled={updatingId === order._id}
                    className="od-btn-green"
                    style={{ flex: 1, minWidth: 140 }}
                  ><CheckCircle2 size={15} /> Accept Order</button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onUpdateStatus(order._id, "rejected"); }}
                    disabled={updatingId === order._id}
                    className="od-btn-danger"
                    style={{ flex: 1, minWidth: 140 }}
                  ><XCircle size={15} /> Reject</button>
                </>
              )}
              {(order.status === "accepted" || order.status === "processing") && (
                <button
                  onClick={(e) => { e.stopPropagation(); onUpdateStatus(order._id, "shipped"); }}
                  disabled={updatingId === order._id}
                  className="od-btn-ghost"
                  style={{ flex: 1, minWidth: 160, color: "#c4b5fd", borderColor: "rgba(167,139,250,0.25)" }}
                ><Truck size={15} /> Mark as Shipped</button>
              )}
              {order.status === "shipped" && (
                <button
                  onClick={(e) => { e.stopPropagation(); onUpdateStatus(order._id, "delivered"); }}
                  disabled={updatingId === order._id}
                  className="od-btn-green"
                  style={{ flex: 1, minWidth: 160 }}
                ><PackageCheck size={15} /> Mark as Delivered</button>
              )}
            </div>
          )}
        </div>{/* /body */}
      </div>{/* /panel */}

      {/* Scoped modal styles — injected at document.body via portal */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
        @keyframes od-slideUp {
          from { opacity: 0; transform: translateY(28px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        .od-section { margin-bottom: 22px; }
        .od-section-title {
          font-size: 10px; font-weight: 700; color: #16a34a;
          text-transform: uppercase; letter-spacing: 0.12em;
          margin-bottom: 10px;
          display: flex; align-items: center; gap: 8px;
          font-family: 'Inter', sans-serif;
        }
        .od-section-title::after {
          content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.06);
        }
        .od-row {
          display: flex; justify-content: space-between; align-items: flex-start;
          gap: 12px; padding: 8px 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          font-family: 'Inter', sans-serif;
        }
        .od-row:last-child { border-bottom: none; }
        .od-label  { font-size: 12px; color: #7a8fa6; font-weight: 500; white-space: nowrap; flex-shrink: 0; }
        .od-value  { font-size: 13px; color: #f0f6ff; font-weight: 500; text-align: right; word-break: break-all; max-width: 65%; }
        .od-value-hl { font-size: 15px; color: #15803d; font-weight: 800; text-align: right; }
        .od-mono   { font-family: 'Courier New', monospace; font-size: 11px; color: #7a8fa6 !important; word-break: break-all; }
        /* Scoped badges (prefixed od- to avoid conflict) */
        .od-badge { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:6px; font-size:12px; font-weight:600; font-family:'Inter',sans-serif; }
        .od-badge-green  { background:rgba(34,197,94,0.12);  color:#15803d; border:1px solid rgba(34,197,94,0.2);  }
        .od-badge-amber  { background:rgba(251,191,36,0.12); color:#fde68a; border:1px solid rgba(251,191,36,0.2); }
        .od-badge-red    { background:rgba(239,68,68,0.12);  color:#dc2626; border:1px solid rgba(239,68,68,0.2);  }
        .od-badge-blue   { background:rgba(56,189,248,0.12); color:#7dd3fc; border:1px solid rgba(56,189,248,0.2); }
        .od-badge-purple { background:rgba(167,139,250,0.12);color:#c4b5fd; border:1px solid rgba(167,139,250,0.2);}
        /* Scoped action buttons inside modal */
        .od-btn-green {
          display:inline-flex; align-items:center; justify-content:center; gap:8px;
          background:linear-gradient(135deg,#16a34a,#059669);
          color:#0f172a; font-weight:700; font-size:14px;
          padding:11px 20px; border-radius:12px; border:none; cursor:pointer;
          box-shadow:0 6px 18px rgba(34,197,94,0.25);
          transition:transform 0.15s, box-shadow 0.15s;
          font-family:'Inter',sans-serif;
        }
        .od-btn-green:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 10px 28px rgba(34,197,94,0.35); }
        .od-btn-green:disabled { opacity:0.5; cursor:not-allowed; }
        .od-btn-ghost {
          display:inline-flex; align-items:center; justify-content:center; gap:8px;
          background:#f8fafc; border:1px solid rgba(255,255,255,0.12);
          color:#f0f6ff; font-weight:600; font-size:14px;
          padding:10px 18px; border-radius:12px;
          cursor:pointer; transition:background 0.15s;
          font-family:'Inter',sans-serif;
        }
        .od-btn-ghost:hover:not(:disabled) { background:rgba(255,255,255,0.08); }
        .od-btn-ghost:disabled { opacity:0.5; cursor:not-allowed; }
        .od-btn-danger {
          display:inline-flex; align-items:center; justify-content:center; gap:8px;
          background:rgba(239,68,68,0.10); border:1px solid rgba(239,68,68,0.20);
          color:#dc2626; font-weight:600; font-size:14px;
          padding:10px 18px; border-radius:12px;
          cursor:pointer; transition:background 0.15s;
          font-family:'Inter',sans-serif;
        }
        .od-btn-danger:hover:not(:disabled) { background:rgba(239,68,68,0.18); }
        .od-btn-danger:disabled { opacity:0.5; cursor:not-allowed; }
      `}</style>
    </div>,
    document.body
  );
}

/* ── Sub-components ──────────────────────────────────────────────── */
function OdSection({ title, children }) {
  return (
    <div className="od-section">
      <div className="od-section-title">{title}</div>
      {children}
    </div>
  );
}

function OdRow({ label, value, highlight, mono }) {
  return (
    <div className="od-row">
      <span className="od-label">{label}</span>
      <span className={`${highlight ? "od-value-hl" : "od-value"}${mono ? " od-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   MAIN ORDERS PAGE
───────────────────────────────────────────────────────────────────── */
export default function Orders() {
  const [orders, setOrders]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState("");
  const [updatingId, setUpdatingId]       = useState(null);
  const [filter, setFilter]               = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowDetails]= useState(false);

  /* ── Fetch ─────────────────────────────────────────────────────── */
  const fetchOrders = async () => {
    try {
      setError("");
      const token = localStorage.getItem("agroconnect_token");
      const r = await fetch(`${API_URL}/api/orders/farmer`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Unable to load orders");
      const fresh = d.orders || [];
      setOrders(fresh);
      // Keep the open modal in sync during auto-refresh
      setSelectedOrder((prev) => {
        if (!prev) return null;
        return fresh.find((o) => o._id === prev._id) || prev;
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Auto-refresh every 30 s so new buyer orders appear without manual reload
    const interval = setInterval(fetchOrders, 30_000);
    return () => clearInterval(interval);
  }, []);

  /* ── Status update ─────────────────────────────────────────────── */
  const updateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const token = localStorage.getItem("agroconnect_token");
      const r = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Failed to update status");
      // Optimistic update — keep the UI responsive
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
      );
      // Sync the open modal if it's showing this order
      setSelectedOrder((prev) =>
        prev && prev._id === orderId ? { ...prev, status: newStatus } : prev
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setUpdatingId(null);
    }
  };

  /* ── Modal open / close ────────────────────────────────────────── */
  const openOrder  = (order) => { setSelectedOrder(order); setShowDetails(true); };
  const closeOrder = ()      => { setSelectedOrder(null);  setShowDetails(false); };

  /* ── Filter / counts ───────────────────────────────────────────── */
  const TABS = ["all", "pending", "accepted", "shipped", "delivered", "rejected", "cancelled"];
  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const counts = TABS.reduce((acc, t) => {
    acc[t] = t === "all" ? orders.length : orders.filter((o) => o.status === t).length;
    return acc;
  }, {});

  /* ── Render ────────────────────────────────────────────────────── */
  return (
    <>
      <style>{DS + `
        /* ── Tab row ── */
        .tab-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:24px;}
        .tab-btn{
          padding:7px 16px;border-radius:10px;font-size:13px;font-weight:600;
          cursor:pointer;border:1px solid var(--border);
          background:var(--surface);color:var(--text2);
          transition:all 0.2s;font-family:'Inter',sans-serif;
        }
        .tab-btn:hover{background:var(--surface2);color:var(--text);}
        .tab-btn.active{background:var(--green-dim);border-color:rgba(34,197,94,0.25);color:#15803d;}
        .tab-count{
          display:inline-block;margin-left:6px;
          background:rgba(255,255,255,0.10);padding:1px 7px;border-radius:10px;font-size:11px;
        }

        /* ── Order card ── */
        .order-card{
          background:var(--surface);border:1px solid var(--border);
          border-radius:18px;padding:20px 24px;
          cursor:pointer;
          transition:transform 0.18s,border-color 0.18s,box-shadow 0.18s,background 0.18s;
          position:relative;outline:none;
          -webkit-user-select:none;user-select:none;
        }
        .order-card:hover{
          transform:translateY(-2px);
          border-color:rgba(34,197,94,0.25);
          box-shadow:0 12px 40px rgba(0,0,0,0.50);
          background:rgba(255,255,255,0.055);
        }
        .order-card:focus-visible{
          border-color:rgba(34,197,94,0.55);
          box-shadow:0 0 0 3px rgba(34,197,94,0.15);
        }
        .order-card:active{ transform:translateY(0); }

        /* Chevron hint */
        .order-card-chevron{
          position:absolute;top:50%;right:22px;
          transform:translateY(-50%);
          font-size:22px;color:rgba(255,255,255,0.12);
          transition:color 0.2s,transform 0.2s;
          pointer-events:none;line-height:1;
        }
        .order-card:hover .order-card-chevron{
          color:rgba(34,197,94,0.60);
          transform:translateY(-50%) translateX(4px);
        }

        /* Scoped card badges */
        .badge{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:6px;font-size:12px;font-weight:600;}
        .badge-green{background:rgba(34,197,94,0.12);color:#15803d;border:1px solid rgba(34,197,94,0.2);}
        .badge-amber{background:rgba(251,191,36,0.12);color:#fde68a;border:1px solid rgba(251,191,36,0.2);}
        .badge-red{background:rgba(239,68,68,0.12);color:#dc2626;border:1px solid rgba(239,68,68,0.2);}
        .badge-blue{background:rgba(56,189,248,0.12);color:#7dd3fc;border:1px solid rgba(56,189,248,0.2);}
        .badge-purple{background:rgba(167,139,250,0.12);color:#c4b5fd;border:1px solid rgba(167,139,250,0.2);}

        /* Card action buttons */
        .card-btn-green{
          display:inline-flex;align-items:center;gap:7px;
          background:linear-gradient(135deg,#16a34a,#059669);
          color:#0f172a;font-weight:700;font-size:13px;
          padding:9px 18px;border-radius:10px;border:none;cursor:pointer;
          transition:transform 0.15s,box-shadow 0.15s;font-family:'Inter',sans-serif;
          box-shadow:0 4px 14px rgba(34,197,94,0.22);
        }
        .card-btn-green:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 24px rgba(34,197,94,0.30);}
        .card-btn-green:disabled{opacity:0.5;cursor:not-allowed;}
        .card-btn-ghost{
          display:inline-flex;align-items:center;gap:7px;
          background:var(--surface);border:1px solid var(--border2);
          color:var(--text);font-weight:600;font-size:13px;
          padding:9px 18px;border-radius:10px;cursor:pointer;
          transition:background 0.15s;font-family:'Inter',sans-serif;
        }
        .card-btn-ghost:hover:not(:disabled){background:var(--surface2);}
        .card-btn-ghost:disabled{opacity:0.5;cursor:not-allowed;}
        .card-btn-danger{
          display:inline-flex;align-items:center;gap:7px;
          background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.18);
          color:#dc2626;font-weight:600;font-size:13px;
          padding:9px 18px;border-radius:10px;cursor:pointer;
          transition:background 0.15s;font-family:'Inter',sans-serif;
        }
        .card-btn-danger:hover:not(:disabled){background:rgba(239,68,68,0.16);}
        .card-btn-danger:disabled{opacity:0.5;cursor:not-allowed;}
      `}</style>

      {/* ── Page header ── */}
      <div className="pg-head">
        <div>
          <div className="eyebrow">Farm Sales</div>
          <h1 className="pg-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Package size={24} color="#16a34a" /> Incoming Orders
          </h1>
          <p className="pg-sub">Manage orders for your crops — auto-refreshes every 30 s.</p>
        </div>
        <button className="btn-ghost" onClick={fetchOrders} style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ── Error banner ── */}
      {error && <div className="alert-error" style={{ display: "flex", alignItems: "center", gap: 8 }}><AlertTriangle size={16} /> {error}</div>}

      {/* ── Stats row ── */}
      {!loading && (
        <div className="stat-grid" style={{ marginBottom: 24 }}>
          {[
            { Icon: ClipboardList, label: "Total",    value: orders.length,                                   color: "#0369a1" },
            { Icon: Clock,         label: "Pending",  value: counts.pending,                                  color: "#b45309" },
            { Icon: CheckCircle2,  label: "Accepted", value: (counts.accepted || 0) + (counts.processing || 0), color: "#15803d" },
            { Icon: Truck,         label: "Shipped",  value: (counts.shipped  || 0) + (counts.delivered  || 0), color: "#7c3aed" },
            { Icon: XCircle,       label: "Rejected", value: (counts.rejected || 0) + (counts.cancelled  || 0), color: "#dc2626" },
          ].map(({ Icon, label, value, color }) => (
            <div key={label} className="stat-card">
              <div className="stat-glow" style={{ background: color }} />
              <div className="stat-icon" style={{ color }}><Icon size={20} strokeWidth={1.75} /></div>
              <div className="stat-val">{value}</div>
              <div className="stat-lbl">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Filter tabs ── */}
      <div className="tab-row">
        {TABS.map((t) => (
          <button
            key={t}
            className={`tab-btn ${filter === t ? "active" : ""}`}
            onClick={() => setFilter(t)}
          >
            {(() => { const TabIcon = STATUS_META[t]?.Icon; return TabIcon ? <span style={{ display: "inline-flex", verticalAlign: "middle", marginRight: 4 }}><TabIcon size={12} strokeWidth={2} /></span> : null; })()}{t.charAt(0).toUpperCase() + t.slice(1)}
            <span className="tab-count">{counts[t]}</span>
          </button>
        ))}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="loading-wrap">
          <div className="spinner" />
          <span>Loading orders…</span>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && filtered.length === 0 && (
        <div className="card empty-state">
          <div className="empty-emoji"><Inbox size={40} strokeWidth={1.5} color="#bbf7d0" /></div>
          <div className="empty-title">
            No {filter === "all" ? "" : filter} orders yet
          </div>
          <div className="empty-sub">Orders placed for your crops will appear here.</div>
        </div>
      )}

      {/* ── Order cards ── */}
      {!loading && filtered.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map((order) => {
            const meta  = STATUS_META[order.status] || STATUS_META.pending;
            const total = order.totalAmount ?? (order.pricePerUnit * order.quantity) ?? 0;
            return (
              <div
                key={`${order._id}-${order.cropName}`}
                className="order-card"
                role="button"
                tabIndex={0}
                aria-label={`View details for ${order.cropName || "order"}`}
                // ── CLICK OPENS MODAL ──────────────────────────────
                onClick={() => openOrder(order)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openOrder(order);
                  }
                }}
              >
                {/* Chevron hint */}
                <span className="order-card-chevron" aria-hidden="true">›</span>

                {/* Card content */}
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "flex-start", flexWrap: "wrap",
                  gap: 12, paddingRight: 28,
                }}>
                  <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div style={{
                      padding: "10px",
                      background: "var(--surface)", borderRadius: 12,
                      border: "1px solid var(--border)", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: meta.iconColor || "#64748b", width: 52, height: 52,
                    }}>
                      {meta.Icon ? <meta.Icon size={26} strokeWidth={1.75} /> : null}
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                        {order.cropName || "Crop Order"}
                      </div>
                        <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 3 }}>
                          <User size={11} strokeWidth={2} style={{ verticalAlign: "middle", marginRight: 4 }} />{order.buyerName || order.buyer?.name || "Buyer"}
                          &nbsp;·&nbsp;
                          <CalendarDays size={11} strokeWidth={2} style={{ verticalAlign: "middle", marginRight: 4 }} />{new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </div>
                      {order.deliveryAddress && (
                        <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 3 }}>
                          <MapPin size={11} strokeWidth={2} style={{ verticalAlign: "middle", marginRight: 4 }} />{typeof order.deliveryAddress === "string"
                            ? order.deliveryAddress
                            : fmtAddress(order.deliveryAddress)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                    <span className={`badge ${meta.badge}`}>{meta.Icon && <meta.Icon size={11} strokeWidth={2} style={{ verticalAlign: "middle", marginRight: 3 }} />}{meta.label}</span>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
                      ₹{Number(total).toLocaleString("en-IN")}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text2)" }}>
                      {order.quantity} {order.unit || "kg"}
                    </div>
                  </div>
                </div>

                {/* ── ACTION BUTTONS — stopPropagation prevents card click ── */}
                {order.status === "pending" && (
                  <div style={{
                    display: "flex", gap: 10,
                    marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)",
                  }}>
                    <button
                      className="card-btn-green"
                      style={{ flex: 1, justifyContent: "center" }}
                      disabled={updatingId === order._id}
                      onClick={(e) => { e.stopPropagation(); updateStatus(order._id, "accepted"); }}
                    ><CheckCircle2 size={14} /> Accept Order</button>
                    <button
                      className="card-btn-danger"
                      style={{ flex: 1, justifyContent: "center" }}
                      disabled={updatingId === order._id}
                      onClick={(e) => { e.stopPropagation(); updateStatus(order._id, "rejected"); }}
                    ><XCircle size={14} /> Reject</button>
                  </div>
                )}

                {(order.status === "accepted" || order.status === "processing") && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                    <button
                      className="card-btn-ghost"
                      style={{ color: "#c4b5fd", borderColor: "rgba(167,139,250,0.22)", justifyContent: "center", width: "100%" }}
                      disabled={updatingId === order._id}
                      onClick={(e) => { e.stopPropagation(); updateStatus(order._id, "shipped"); }}
                    ><Truck size={14} /> Mark as Shipped</button>
                  </div>
                )}

                {order.status === "shipped" && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                    <button
                      className="card-btn-green"
                      style={{ justifyContent: "center", width: "100%" }}
                      disabled={updatingId === order._id}
                      onClick={(e) => { e.stopPropagation(); updateStatus(order._id, "delivered"); }}
                    ><PackageCheck size={14} /> Mark as Delivered</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── ORDER DETAILS MODAL (portal → document.body) ── */}
      {showOrderDetails && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={closeOrder}
          updatingId={updatingId}
          onUpdateStatus={updateStatus}
        />
      )}
    </>
  );
}