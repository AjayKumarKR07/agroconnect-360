import { useEffect, useState, useCallback } from "react";
import { API_URL } from "../../config/api";
import { DS } from "../../styles/ds";

/* ── Skeleton card ─────────────────────────────────────────────────── */
const SkCard = () => (
  <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
    <div style={{ height: 150, background: "linear-gradient(90deg,rgba(167,139,250,0.06) 25%,rgba(167,139,250,0.12) 50%,rgba(167,139,250,0.06) 75%)", backgroundSize: "200% 100%", animation: "sklShimmer 1.6s ease infinite" }} />
    <div style={{ padding: "14px 16px" }}>
      {["70%","50%","35%"].map((w,i) => <div key={i} style={{ height: 13, width: w, borderRadius: 6, background: "rgba(167,139,250,0.08)", marginBottom: 10 }} />)}
    </div>
  </div>
);

const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("agroconnect_token")}` });

/* Seller browses LISTED crops from farmers and places bulk orders */
export default function SellerProcurement() {
  const [crops,      setCrops]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [search,     setSearch]     = useState("");
  const [category,   setCategory]   = useState("all");
  const [ordering,   setOrdering]   = useState(false);
  const [orderModal, setOrderModal] = useState(null);
  const [orderForm,  setOrderForm]  = useState({ quantity: "", note: "" });
  const [success,    setSuccess]    = useState("");
  const [orderError, setOrderError] = useState("");

  // Seller's own profile for delivery address fallback
  const sellerUser = JSON.parse(localStorage.getItem("agroconnect_user") || "{}");

  const fetchCrops = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const r = await fetch(`${API_URL}/api/crops?status=listed`, { headers: authH() });
      const d = await r.json();
      if (d.success) {
        setCrops(d.crops || d.data || []);
      } else {
        setError(d.message || "Unable to load farmer produce");
      }
    } catch {
      setError("Network error — could not reach the server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCrops(); }, [fetchCrops]);

  /* Unique categories from real data — lowercased before dedup */
  const categories = ["all", ...new Set(crops.map(c => c.category?.toLowerCase?.()).filter(Boolean))];

  const filtered = crops.filter(c => {
    if (category !== "all" && c.category?.toLowerCase() !== category) return false;
    if (search && !c.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  /* ─── Place Order ──────────────────────────────────────────────────
     createOrder expects:
       { items: [{ cropId, qty }], deliveryAddress: {...}, paymentMethod, notes }
     The seller acts as the "buyer" — their ID is set by the backend from req.user._id
  ─────────────────────────────────────────────────────────────────── */
  const placeOrder = async () => {
    const qty = Number(orderForm.quantity);
    if (!qty || qty <= 0) {
      setOrderError("Please enter a valid quantity.");
      return;
    }
    if (!orderModal?._id) return;

    if (qty > Number(orderModal.quantity)) {
      setOrderError(`Only ${orderModal.quantity} ${orderModal.unit} available.`);
      return;
    }

    setOrdering(true);
    setOrderError("");

    // Build the request body the backend createOrder expects
    const body = {
      items: [
        {
          cropId:   orderModal._id,   // real MongoDB crop ObjectId
          qty:      qty,              // backend reads: item.qty || item.quantity
        },
      ],
      // deliveryAddress is required by the Order model.
      // For seller bulk procurement we use the seller's own details.
      // Name & phone come from the stored user profile if available.
      deliveryAddress: {
        name:    sellerUser.name    || "Seller",
        phone:   sellerUser.phone   || "0000000000",
        address: sellerUser.address || "Bulk Procurement",
        city:    sellerUser.city    || "India",
        state:   sellerUser.state   || "India",
        pincode: sellerUser.pincode || "000000",
      },
      paymentMethod: "cod",
      notes: orderForm.note || "",
    };

    try {
      const r = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authH() },
        body: JSON.stringify(body),
      });

      const d = await r.json();

      if (r.ok && d.success !== false) {
        // Success — close modal, show banner, refresh crop list
        setSuccess(`✅ Order placed for ${qty} ${orderModal.unit} of ${orderModal.name}! The farmer has been notified.`);
        setTimeout(() => setSuccess(""), 5000);
        setOrderModal(null);
        setOrderForm({ quantity: "", note: "" });
        fetchCrops(); // refresh stock quantities
      } else {
        // Keep modal open — show real backend error
        setOrderError(d.message || "Order placement failed. Please try again.");
      }
    } catch {
      setOrderError("Network error — order could not be placed. Check your connection.");
    } finally {
      setOrdering(false);
    }
  };

  /* Category pill emoji */
  const catEmoji = (cat) => {
    if (!cat) return "🛒";
    const c = cat.toLowerCase();
    if (c.includes("vegetable") || c.includes("veggie")) return "🥬";
    if (c.includes("fruit")) return "🍎";
    if (c.includes("grain") || c.includes("cereal")) return "🌾";
    if (c.includes("spice")) return "🌶️";
    if (c.includes("pulse") || c.includes("legume")) return "🫘";
    return "🛒";
  };

  return (
    <>
      <style>{DS + `
        @keyframes sklShimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
        .proc-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:14px; }
        .proc-card { background:var(--surface); border:1px solid var(--border); border-radius:16px; overflow:hidden; transition:all 0.2s; }
        .proc-card:hover { border-color:rgba(167,139,250,0.25); transform:translateY(-2px); }
        .proc-img  { width:100%; height:150px; object-fit:cover; }
        .proc-ph   { width:100%; height:150px; background:linear-gradient(135deg,rgba(124,58,237,0.08),rgba(167,139,250,0.04)); display:flex; align-items:center; justify-content:center; font-size:48px; }
        .proc-body { padding:14px 16px; }
        .cat-pills { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:20px; }
        .cat-pill  { padding:6px 14px; border-radius:20px; font-size:12px; font-weight:700; cursor:pointer; border:1px solid var(--border); background:var(--surface); color:var(--text2); transition:all 0.2s; }
        .cat-pill.active { background:rgba(167,139,250,0.1); color:#a78bfa; border-color:rgba(167,139,250,0.2); }
      `}</style>

      {/* Header */}
      <div className="pg-head">
        <div>
          <div className="eyebrow">Seller Exclusive</div>
          <h1 className="pg-title">📥 Procurement</h1>
          <p className="pg-sub">Browse and buy crops directly from farmers for resale.</p>
        </div>
        <div style={{ fontSize: 13, color: "var(--text2)", textAlign: "right" }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color: "#a78bfa" }}>
            {loading ? "—" : filtered.length}
          </div>
          listings available
        </div>
      </div>

      {/* Success banner */}
      {success && (
        <div className="alert-success" style={{ marginBottom: 16, padding: "14px 18px", borderRadius: 12, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80", fontWeight: 600, fontSize: 14 }}>
          {success}
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="card" style={{ marginBottom: 24, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <span style={{ color: "#f87171", fontWeight: 600, fontSize: 14 }}>Unable to load farmer produce — {error}</span>
            </div>
            <button onClick={fetchCrops} className="btn-ghost" style={{ fontSize: 13, padding: "8px 16px" }}>🔄 Retry</button>
          </div>
        </div>
      )}

      {/* Search */}
      {!error && (
        <div style={{ display: "flex", gap: 12, marginBottom: 18, alignItems: "center", flexWrap: "wrap" }}>
          <input
            className="field-input"
            placeholder="🔍 Search crops…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 280 }}
          />
          {search && <button className="btn-ghost" onClick={() => setSearch("")} style={{ fontSize: 12 }}>✕ Clear</button>}
        </div>
      )}

      {/* Category pills */}
      {!error && !loading && categories.length > 1 && (
        <div className="cat-pills">
          {categories.map(c => (
            <button key={c} className={`cat-pill ${category === c ? "active" : ""}`} onClick={() => setCategory(c)}>
              {c === "all" ? "All Categories" : c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Skeleton */}
      {loading && (
        <div className="proc-grid">
          {[1,2,3,4,5,6].map(i => <SkCard key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <div className="card empty-state">
          <div className="empty-emoji">📥</div>
          <div className="empty-title">
            {crops.length === 0 ? "No farmer produce available" : `No results for "${search}"`}
          </div>
          <div className="empty-sub">
            {crops.length === 0
              ? "Farmers have not listed any crops for procurement yet."
              : "Try a different search or category."}
          </div>
        </div>
      )}

      {/* Crop grid */}
      {!loading && !error && filtered.length > 0 && (
        <div className="proc-grid">
          {filtered.map(c => (
            <div key={c._id} className="proc-card">
              {c.image?.url || c.imageUrl
                ? <img src={c.image?.url || c.imageUrl} alt={c.name} className="proc-img" />
                : <div className="proc-ph">{catEmoji(c.category)}</div>
              }
              <div className="proc-body">
                <div style={{ fontWeight: 800, color: "#fff", fontSize: 15, marginBottom: 4 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 10 }}>
                  {c.category && <span>{c.category} · </span>}
                  {c.location && <span>{c.location} · </span>}
                  <span style={{ color: "#a78bfa" }}>
                    {c.farmerName || c.farmer?.name || "Farmer"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color: "#4ade80" }}>₹{Number(c.price).toLocaleString("en-IN")}</div>
                    <div style={{ fontSize: 11, color: "var(--text2)" }}>per {c.unit} · {c.quantity} {c.unit} avail.</div>
                  </div>
                  <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 8, background: "rgba(34,197,94,0.1)", color: "#4ade80", fontWeight: 700 }}>
                    {c.status === "ready" ? "🔵 Ready" : "✅ Listed"}
                  </span>
                </div>
                <button
                  className="btn-green"
                  style={{ width: "100%", justifyContent: "center", background: "linear-gradient(135deg,#7c3aed,#a78bfa)", fontSize: 13 }}
                  onClick={() => {
                    setOrderModal(c);
                    setOrderForm({ quantity: "", note: "" });
                    setOrderError("");
                  }}
                >
                  📥 Place Bulk Order
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Order Modal ──────────────────────────────────────────────── */}
      {orderModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(8px)" }}
          onClick={e => { if (!ordering && e.target === e.currentTarget) setOrderModal(null); }}
        >
          <div style={{ background: "#0b0a1f", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 24, padding: 28, width: "100%", maxWidth: 440 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: "#fff" }}>📥 Bulk Order</div>
                <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 2 }}>
                  {orderModal.name} · ₹{Number(orderModal.price).toLocaleString("en-IN")}/{orderModal.unit}
                </div>
                <div style={{ fontSize: 12, color: "#a78bfa", marginTop: 2 }}>
                  From: {orderModal.farmerName || orderModal.farmer?.name || "Farmer"}
                </div>
              </div>
              <button
                onClick={() => { if (!ordering) { setOrderModal(null); setOrderError(""); }}}
                style={{ background: "var(--surface)", border: "none", borderRadius: 8, padding: "6px 10px", color: "var(--text2)", cursor: ordering ? "not-allowed" : "pointer", fontSize: 14 }}
              >✕</button>
            </div>

            {/* Real backend error */}
            {orderError && (
              <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
                ⚠️ {orderError}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label className="field-label" style={{ marginBottom: 0 }}>Quantity ({orderModal.unit}) *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setOrderForm(p => ({ ...p, quantity: String(orderModal.quantity) }));
                      setOrderError("");
                    }}
                    style={{
                      background: "rgba(167,139,250,0.12)",
                      border: "1px solid rgba(167,139,250,0.3)",
                      color: "#a78bfa",
                      borderRadius: 6,
                      padding: "2px 8px",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Max ({orderModal.quantity} {orderModal.unit})
                  </button>
                </div>
                <input
                  className="field-input"
                  type="number"
                  min="1"
                  max={orderModal.quantity}
                  placeholder={`Enter 1 – ${orderModal.quantity} ${orderModal.unit}`}
                  value={orderForm.quantity}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === "") {
                      setOrderForm(p => ({ ...p, quantity: "" }));
                      setOrderError("");
                      return;
                    }
                    // Limit max length to avoid absurd numbers
                    if (val.length > 8) return;

                    const num = Number(val);
                    if (num < 0) return;

                    setOrderForm(p => ({ ...p, quantity: val }));
                    if (num > Number(orderModal.quantity)) {
                      setOrderError(`Quantity cannot exceed available stock (${orderModal.quantity} ${orderModal.unit}).`);
                    } else {
                      setOrderError("");
                    }
                  }}
                  disabled={ordering}
                />
              </div>

              {/* Live total preview or warning */}
              {orderForm.quantity && Number(orderForm.quantity) > 0 && (
                Number(orderForm.quantity) > Number(orderModal.quantity) ? (
                  <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12 }}>
                    <div style={{ fontSize: 13, color: "#f87171", fontWeight: 600 }}>
                      ⚠️ Quantity exceeds available stock of {orderModal.quantity} {orderModal.unit}.
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: "12px 16px", background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.15)", borderRadius: 12, overflow: "hidden" }}>
                    <div style={{ fontSize: 12, color: "var(--text2)" }}>Order Total (at current price)</div>
                    <div style={{
                      fontFamily: "'Space Grotesk',sans-serif",
                      fontSize: 22,
                      fontWeight: 800,
                      color: "#4ade80",
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                      marginTop: 4,
                      lineHeight: 1.2
                    }}>
                      ₹{(Number(orderForm.quantity) * Number(orderModal.price)).toLocaleString("en-IN")}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 4 }}>
                      Final price confirmed by backend using live crop price.
                    </div>
                  </div>
                )
              )}

              <div>
                <label className="field-label">Note to Farmer (optional)</label>
                <textarea
                  className="field-input"
                  rows={2}
                  placeholder="Delivery instructions, quality requirements…"
                  value={orderForm.note}
                  onChange={e => setOrderForm(p => ({ ...p, note: e.target.value }))}
                  style={{ resize: "none" }}
                  disabled={ordering}
                />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  className="btn-ghost"
                  style={{ flex: 1, justifyContent: "center" }}
                  onClick={() => { if (!ordering) { setOrderModal(null); setOrderError(""); }}}
                  disabled={ordering}
                >
                  Cancel
                </button>
                <button
                  className="btn-green"
                  disabled={
                    !orderForm.quantity ||
                    Number(orderForm.quantity) <= 0 ||
                    Number(orderForm.quantity) > Number(orderModal.quantity) ||
                    ordering
                  }
                  style={{
                    flex: 2,
                    justifyContent: "center",
                    background: "linear-gradient(135deg,#7c3aed,#a78bfa)",
                    opacity: (!orderForm.quantity || Number(orderForm.quantity) <= 0 || Number(orderForm.quantity) > Number(orderModal.quantity) || ordering) ? 0.5 : 1,
                    cursor: (!orderForm.quantity || Number(orderForm.quantity) <= 0 || Number(orderForm.quantity) > Number(orderModal.quantity) || ordering) ? "not-allowed" : "pointer"
                  }}
                  onClick={placeOrder}
                >
                  {ordering ? "⏳ Placing Order…" : "✅ Confirm Order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
