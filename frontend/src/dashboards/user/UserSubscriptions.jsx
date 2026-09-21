/**
 * UserSubscriptions.jsx
 *
 * Renders the AgroConnect 360 farm-box subscription page for buyers.
 *
 * Subscription flow:
 *   Subscribe Now → Confirmation modal → Confirm Subscription
 *   → RazorpaySubscriptionCheckout creates Razorpay Subscription on backend
 *   → Razorpay Checkout opens → user completes mandate authorisation
 *   → Backend verifies HMAC signature → subscription becomes ACTIVE
 *
 * Security notes:
 *  - Subscriptions are NEVER activated before backend verification.
 *  - Cancellation calls the backend (which cancels via Razorpay API) — not just local state.
 *  - No localStorage used for subscription state — all data from /api/subscriptions/my.
 *  - Duplicate-click protection is handled inside RazorpaySubscriptionCheckout.
 */

import { useState, useEffect, useCallback } from "react";
import { Leaf, Apple, Wheat, Package, X, Zap, Ban, ShoppingBag,
         CheckCircle2, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { API_URL } from "../../config/api";
import RazorpaySubscriptionCheckout from "../../components/RazorpaySubscriptionCheckout";

// ── Styles (unchanged from original design) ─────────────────────────────────
const DS_USER = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
  .pg-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:16px;flex-wrap:wrap;}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#0ea5e9;margin-bottom:6px;}
  .pg-title{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:800;color:#0f172a;line-height:1.2;}
  .pg-sub{font-size:14px;color:#475569;margin-top:6px;}
  .card{background:rgba(14,165,233,0.04);border:1px solid rgba(14,165,233,0.1);border-radius:18px;padding:24px;transition:all 0.2s;}
  .card:hover{border-color:rgba(14,165,233,0.25);transform:translateY(-2px);}
  .card-title{font-family:'Space Grotesk',sans-serif;font-size:18px;font-weight:800;color:#0f172a;}
  .btn-cyan{display:inline-flex;align-items:center;gap:8px;padding:12px 22px;border-radius:12px;background:linear-gradient(135deg,#0284c7,#0ea5e9);color:#0f172a;font-weight:700;font-size:14px;border:none;cursor:pointer;text-decoration:none;font-family:'Inter',sans-serif;transition:opacity 0.2s;}
  .btn-cyan:hover{opacity:0.88;}
  .btn-ghost{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border-radius:10px;border:1px solid rgba(14,165,233,0.2);background:rgba(14,165,233,0.06);color:#0284c7;font-weight:600;font-size:13px;cursor:pointer;text-decoration:none;font-family:'Inter',sans-serif;}
  .tag{padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.04em;}
  @keyframes spin { to { transform: rotate(360deg); } }
`;

// ── Available plan definitions (UI only — prices/amounts enforced by backend) ─
const BOXES = [
  {
    id: "sub-1",
    name: "Organic Veggie Basket",
    Icon: Leaf,
    iconColor: "#16a34a",
    price: 499,
    cycle: "Weekly",
    items: ["Tomatoes (2kg)", "Onions (2kg)", "Potatoes (2kg)", "Spinach (500g)", "Green Chillies (250g)"],
    farmer: "Nashik Organic Co-op",
    badge: "Most Popular",
    color: "#0ea5e9",
  },
  {
    id: "sub-2",
    name: "Seasonal Fruit Box",
    Icon: Apple,
    iconColor: "#f59e0b",
    price: 799,
    cycle: "Bi-Weekly",
    items: ["Alphonso Mangoes (1.5kg)", "Green Bananas (1kg)", "Pomegranate (1kg)", "Fresh Apples (1kg)"],
    farmer: "Ratnagiri Orchards",
    badge: "Fresh Pick",
    color: "#f59e0b",
  },
  {
    id: "sub-3",
    name: "Pure Grain & Pulses Pack",
    Icon: Wheat,
    iconColor: "#10b981",
    price: 1199,
    cycle: "Monthly",
    items: ["Basmati Rice (5kg)", "Sharbati Wheat (5kg)", "Turmeric Powder (500g)", "Coriander Seeds (250g)"],
    farmer: "Punjab Farmer Federation",
    badge: "Best Value",
    color: "#10b981",
  },
];

// Statuses that are considered "active" for UI display.
// "created" is intentionally excluded — it means the Razorpay subscription
// was initiated but the user has NOT yet completed payment/mandate authorisation.
// Those should not count as active or block the "Subscribe Now" button.
const ACTIVE_STATUSES = ["authenticated", "active", "pending", "halted"];

// ── Helpers ──────────────────────────────────────────────────────────────────
const statusLabel = (status) => {
  const map = {
    created:       { label: "Pending Payment", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
    authenticated: { label: "ACTIVE",          color: "#15803d", bg: "rgba(34,197,94,0.15)" },
    active:        { label: "ACTIVE",          color: "#15803d", bg: "rgba(34,197,94,0.15)" },
    pending:       { label: "Pending",         color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
    halted:        { label: "Halted",          color: "#dc2626", bg: "rgba(239,68,68,0.15)" },
    cancelled:     { label: "Cancelled",       color: "#64748b", bg: "rgba(100,116,139,0.15)" },
    completed:     { label: "Completed",       color: "#0284c7", bg: "rgba(2,132,199,0.15)" },
    failed:        { label: "Failed",          color: "#dc2626", bg: "rgba(239,68,68,0.15)" },
  };
  return map[status] || { label: status, color: "#64748b", bg: "#f1f5f9" };
};

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
  : "—";

export default function UserSubscriptions() {
  const token = localStorage.getItem("agroconnect_token");
  const user  = JSON.parse(localStorage.getItem("agroconnect_user") || "{}");

  // ── State ──────────────────────────────────────────────────────────────────
  const [subs,        setSubs]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [fetchError,  setFetchError]  = useState("");
  const [selectedBox, setSelectedBox] = useState(null);   // box being confirmed in modal
  const [payMsg,      setPayMsg]      = useState({ type: "", text: "" }); // success/error banner
  const [cancelling,  setCancelling]  = useState(null);   // subscriptionDbId being cancelled

  // ── Fetch subscriptions from API ──────────────────────────────────────────
  const fetchSubs = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      const res  = await fetch(`${API_URL}/api/subscriptions/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to load subscriptions");
      setSubs(data.subscriptions || []);
    } catch (err) {
      setFetchError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchSubs(); }, [fetchSubs]);

  // ── Compute active subscriptions ──────────────────────────────────────────
  const activeSubs = subs.filter(s => ACTIVE_STATUSES.includes(s.status));
  const activeIds  = new Set(activeSubs.map(s => s.planId));

  // ── Payment success callback — only fired after backend verification ──────
  const handleSuccess = () => {
    setSelectedBox(null);
    setPayMsg({ type: "success", text: "🎉 Subscription activated! First delivery is on its way." });
    setTimeout(() => setPayMsg({ type: "", text: "" }), 6000);
    fetchSubs(); // refresh list from backend
  };

  // ── Payment failure callback ───────────────────────────────────────────────
  const handleFailure = (errMsg) => {
    setPayMsg({ type: "error", text: `Payment failed: ${errMsg}` });
    setTimeout(() => setPayMsg({ type: "", text: "" }), 8000);
    // Do NOT close modal — user can retry
  };

  // ── Modal dismissed without payment ───────────────────────────────────────
  const handleDismiss = () => {
    setPayMsg({ type: "info", text: "Payment cancelled. Your subscription has not been activated." });
    setTimeout(() => setPayMsg({ type: "", text: "" }), 5000);
    // Don't close modal here — let user close it manually or retry
    fetchSubs(); // refresh to pick up any "created" status from backend
  };

  // ── Cancel subscription — calls backend (which cancels via Razorpay API) ──
  const cancelSub = async (subDbId, subName) => {
    if (!window.confirm(`Cancel your "${subName}" subscription?`)) return;
    setCancelling(subDbId);
    try {
      const res  = await fetch(`${API_URL}/api/subscriptions/cancel/${subDbId}`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Cancellation failed");
      setPayMsg({ type: "info", text: `"${subName}" subscription cancelled.` });
      setTimeout(() => setPayMsg({ type: "", text: "" }), 4000);
      fetchSubs();
    } catch (err) {
      setPayMsg({ type: "error", text: `Cancellation failed: ${err.message}` });
      setTimeout(() => setPayMsg({ type: "", text: "" }), 6000);
    } finally {
      setCancelling(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{DS_USER}</style>

      {/* Header */}
      <div className="pg-head">
        <div>
          <div className="eyebrow">Farm-to-Door Service</div>
          <h1 className="pg-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ShoppingBag size={26} color="#0ea5e9" /> Fresh Farm Subscriptions
          </h1>
          <p className="pg-sub">Subscribe to recurring fresh produce boxes straight from verified local farmers.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
            {activeSubs.length} Active Subscription{activeSubs.length !== 1 ? "s" : ""}
          </div>
          <button
            onClick={fetchSubs}
            disabled={loading}
            title="Refresh"
            style={{ background: "none", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "#0ea5e9", display: "flex", alignItems: "center" }}
          >
            <RefreshCw size={15} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          </button>
        </div>
      </div>

      {/* Message banner */}
      {payMsg.text && (
        <div style={{
          marginBottom: 20, padding: "12px 18px", borderRadius: 14, fontWeight: 700, fontSize: 14,
          display: "flex", alignItems: "center", gap: 8,
          background:   payMsg.type === "success" ? "rgba(34,197,94,0.12)"  : payMsg.type === "error" ? "rgba(239,68,68,0.10)" : "rgba(14,165,233,0.12)",
          border:       payMsg.type === "success" ? "1px solid rgba(34,197,94,0.3)" : payMsg.type === "error" ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(14,165,233,0.25)",
          color:        payMsg.type === "success" ? "#15803d" : payMsg.type === "error" ? "#dc2626" : "#0369a1",
        }}>
          {payMsg.type === "success" ? <CheckCircle2 size={16} /> : payMsg.type === "error" ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          {payMsg.text}
          <button onClick={() => setPayMsg({ type: "", text: "" })} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0 }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Loading / error state */}
      {loading && (
        <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
          <Loader2 size={24} style={{ animation: "spin 1s linear infinite", margin: "0 auto 8px", display: "block" }} />
          Loading your subscriptions…
        </div>
      )}
      {!loading && fetchError && (
        <div style={{ marginBottom: 20, padding: "12px 18px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 14, color: "#dc2626", fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={16} /> {fetchError}
          <button onClick={fetchSubs} style={{ marginLeft: 8, background: "none", border: "none", color: "#0369a1", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>Retry</button>
        </div>
      )}

      {/* ── Active Subscriptions ──────────────────────────────────────────── */}
      {!loading && activeSubs.length > 0 && (
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 14 }}>
            <Package size={16} strokeWidth={1.75} style={{ verticalAlign: "middle", marginRight: 6, color: "#0ea5e9" }} />
            My Active Subscriptions
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
            {activeSubs.map(s => {
              const box        = BOXES.find(b => b.id === s.planId) || {};
              const IconComp   = box.Icon;
              const statusInfo = statusLabel(s.status);
              const isCancelling = cancelling === String(s._id);
              return (
                <div key={String(s._id)} className="card" style={{ background: "rgba(14,165,233,0.06)", borderColor: "rgba(14,165,233,0.22)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 12, background: (box.iconColor || "#0ea5e9") + "18", color: box.iconColor || "#0ea5e9", flexShrink: 0 }}>
                        {IconComp && <IconComp size={22} strokeWidth={1.5} />}
                      </span>
                      <div>
                        <div className="card-title" style={{ fontSize: 16 }}>{s.planName}</div>
                        <div style={{ fontSize: 12, color: "var(--text2)" }}>
                          <Wheat size={11} strokeWidth={2} style={{ verticalAlign: "middle", marginRight: 4 }} />{s.farmer}
                        </div>
                      </div>
                    </div>
                    <span className="tag" style={{ background: statusInfo.bg, color: statusInfo.color, border: `1px solid ${statusInfo.color}40` }}>
                      ● {statusInfo.label}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", background: "#f1f5f9", padding: "10px 14px", borderRadius: 12, marginBottom: 14, fontSize: 13 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase" }}>Price & Frequency</div>
                      <div style={{ color: "#0f172a", fontWeight: 800 }}>₹{s.amount} / {s.frequency}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase" }}>Next Delivery</div>
                      <div style={{ color: "#0f172a", fontWeight: 700 }}>{fmtDate(s.nextDelivery)}</div>
                    </div>
                  </div>

                  <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 14 }}>
                    <strong style={{ color: "#0f172a" }}>Contents:</strong> {(s.items || []).join(", ")}
                  </div>

                  {/* Show cancel only for active/authenticated subscriptions */}
                  {["authenticated", "active"].includes(s.status) && (
                    <button
                      onClick={() => cancelSub(String(s._id), s.planName)}
                      disabled={isCancelling}
                      style={{ width: "100%", padding: "9px 0", borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)", background: "#fef2f2", color: "#dc2626", fontWeight: 700, fontSize: 13, cursor: isCancelling ? "not-allowed" : "pointer", fontFamily: "'Inter',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: isCancelling ? 0.6 : 1 }}
                    >
                      {isCancelling
                        ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Cancelling…</>
                        : <><Ban size={14} strokeWidth={2} /> Cancel Subscription</>
                      }
                    </button>
                  )}

                  {/* Pending payment — show retry button */}
                  {s.status === "created" && (
                    <div style={{ marginTop: 8, padding: "10px 14px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, fontSize: 12, color: "#92400e" }}>
                      ⏳ Payment pending. Click "Subscribe Now" below to complete payment.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Available Plans ───────────────────────────────────────────────── */}
      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
        <Leaf size={18} strokeWidth={1.75} style={{ color: "#0ea5e9" }} /> Available Farm Basket Plans
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20 }}>
        {BOXES.map(b => {
          const alreadyActive = activeIds.has(b.id);
          return (
            <div key={b.id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, background: b.color + "18", color: b.color, flexShrink: 0 }}>
                    {b.Icon && <b.Icon size={26} strokeWidth={1.5} />}
                  </span>
                  <span className="tag" style={{ background: `${b.color}20`, color: b.color, border: `1px solid ${b.color}40` }}>
                    {b.badge}
                  </span>
                </div>
                <div className="card-title" style={{ marginBottom: 4 }}>{b.name}</div>
                <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 14 }}>
                  <Wheat size={11} strokeWidth={2} style={{ verticalAlign: "middle", marginRight: 4 }} />Harvested by {b.farmer}
                </div>

                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 28, fontWeight: 800, color: "#0f172a", marginBottom: 16 }}>
                  ₹{b.price} <span style={{ fontSize: 13, color: "var(--text2)", fontWeight: 500 }}>/ {b.cycle.toLowerCase()}</span>
                </div>

                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Included Fresh Items:</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
                  {b.items.map((it, i) => (
                    <div key={i} style={{ fontSize: 13, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#0369a1" }}>✓</span> {it}
                    </div>
                  ))}
                </div>
              </div>

              {alreadyActive ? (
                <div style={{ width: "100%", padding: "12px 0", borderRadius: 12, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", color: "#15803d", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <CheckCircle2 size={16} /> Already Subscribed
                </div>
              ) : (
                <button
                  className="btn-cyan"
                  style={{ width: "100%", justifyContent: "center", display: "flex", alignItems: "center", gap: 8 }}
                  onClick={() => { setPayMsg({ type: "", text: "" }); setSelectedBox(b); }}
                >
                  <Zap size={14} strokeWidth={2} /> Subscribe Now · ₹{b.price}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Confirmation Modal ─────────────────────────────────────────────── */}
      {selectedBox && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="card" style={{ maxWidth: 460, width: "100%", background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 20px 40px rgba(0,0,0,0.12)" }}>
            {/* Modal header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 12, background: selectedBox.color + "18", color: selectedBox.color, flexShrink: 0 }}>
                  {selectedBox.Icon && <selectedBox.Icon size={22} strokeWidth={1.5} />}
                </span>
                <div className="card-title">{selectedBox.name}</div>
              </div>
              <button onClick={() => setSelectedBox(null)} style={{ background: "none", border: "none", color: "var(--text2)", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16 }}>
              Review your subscription details and proceed to secure payment:
            </div>

            {/* Plan summary */}
            <div style={{ background: "rgba(14,165,233,0.05)", padding: "14px 16px", borderRadius: 12, border: "1px solid #e2e8f0", marginBottom: 20, fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: "var(--text2)" }}>Plan:</span>
                <span style={{ color: "#0f172a", fontWeight: 700 }}>{selectedBox.name}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: "var(--text2)" }}>Frequency:</span>
                <span style={{ color: "#0f172a", fontWeight: 700 }}>{selectedBox.cycle}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: "var(--text2)" }}>Amount:</span>
                <span style={{ color: "#0f172a", fontWeight: 800 }}>₹{selectedBox.price} / {selectedBox.cycle}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text2)" }}>Source:</span>
                <span style={{ color: "#15803d", fontWeight: 700 }}>{selectedBox.farmer}</span>
              </div>
            </div>

            {/* Payment notice */}
            <div style={{ marginBottom: 16, padding: "10px 14px", background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.15)", borderRadius: 10, fontSize: 12, color: "#0369a1" }}>
              🔒 You will be redirected to Razorpay's secure payment gateway to authorise the recurring mandate. Your subscription activates only after successful payment verification.
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setSelectedBox(null)}>
                Cancel
              </button>
              {/* RazorpaySubscriptionCheckout replaces the old "Confirm Subscription" button */}
              <RazorpaySubscriptionCheckout
                planId={selectedBox.id}
                planName={selectedBox.name}
                userName={user.name  || ""}
                userEmail={user.email || ""}
                userPhone={user.phone || ""}
                onSuccess={handleSuccess}
                onFailure={handleFailure}
                onDismiss={handleDismiss}
                className="btn-cyan"
                style={{ flex: 2, justifyContent: "center" }}
              >
                <Zap size={14} strokeWidth={2} /> Pay & Confirm · ₹{selectedBox.price}
              </RazorpaySubscriptionCheckout>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
