import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_URL } from "../../config/api";
import RazorpayCheckout from "../../components/RazorpayCheckout";
import {
  ShoppingCart,
  Receipt,
  Trash2,
  MapPin,
  AlertTriangle,
  Banknote,
  CreditCard,
  Edit3,
  Loader2,
  CheckCircle2,
  Package,
  Carrot,
  Apple,
  Wheat,
  Flame,
  Milk,
} from "lucide-react";

const user = JSON.parse(localStorage.getItem("agroconnect_user") || "{}");

const INDIAN_STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Chandigarh","Jammu & Kashmir"];

export default function UserCart() {
  const navigate = useNavigate();
  const token = localStorage.getItem("agroconnect_token");

  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem("ac_cart") || "[]"));
  const [step, setStep] = useState(1); // 1=cart, 2=address, 3=payment, 4=success
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState("");

  const [addr, setAddr] = useState({
    name:    user.name || "",
    phone:   user.phone || "",
    address: "",
    city:    "",
    state:   "Maharashtra",
    pincode: "",
  });

  const [payment, setPayment] = useState("cod");
  const [pendingOrderId, setPendingOrderId] = useState(null); // DB order _id awaiting Razorpay
  const placingRef = useRef(false); // duplicate click guard

  // Sync cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("ac_cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("ac_cart_update"));
  }, [cart]);

  // Validate cart items against live DB crops on component mount
  useEffect(() => {
    const validateCart = async () => {
      try {
        const r = await fetch(`${API_URL}/api/crops?status=listed`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const d = await r.json();
        if (d.success && Array.isArray(d.crops)) {
          const liveIds = new Set(d.crops.map(c => c._id));
          const activeCart = cart.filter(item => liveIds.has(item._id));
          if (activeCart.length !== cart.length) {
            setCart(activeCart);
            setError(`Removed ${cart.length - activeCart.length} unavailable item(s) from your cart.`);
          }
        }
      } catch (e) {
        console.error("Cart validation error:", e);
      }
    };
    if (cart.length > 0) validateCart();
  }, []);

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(c => c._id === id
      ? { ...c, qty: Math.max(1, (c.qty || 1) + delta) }
      : c
    ));
  };

  const removeItem = (id) => setCart(prev => prev.filter(c => c._id !== id));
  const clearCart  = () => { setCart([]); localStorage.setItem("ac_cart", "[]"); };

  const total = cart.reduce((s, c) => s + (c.price * (c.qty || 1)), 0);
  const deliveryFee = total > 500 ? 0 : 49;
  const grandTotal = total + deliveryFee;

  // 24-char hex = valid MongoDB ObjectId
  const isValidId = (id) => /^[a-f\d]{24}$/i.test(id);

  // Shared function to create the DB order record
  const createDbOrder = async (paymentMethod) => {
    if (placingRef.current) return null;
    placingRef.current = true;
    setError(""); setPlacing(true);

    const invalidItems = cart.filter(c => !isValidId(c._id));
    if (invalidItems.length > 0) {
      const validCart = cart.filter(c => isValidId(c._id));
      setCart(validCart);
      setError(`Removed ${invalidItems.length} outdated item(s). Review and try again.`);
      setPlacing(false);
      placingRef.current = false;
      return null;
    }

    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items: cart.map(c => ({ _id: c._id, qty: c.qty || 1 })),
          deliveryAddress: addr,
          paymentMethod,
        }),
      });
      const d = await res.json();
      if (!res.ok || !d.success) {
        if (res.status === 404 || d.message?.includes("no longer available")) {
          const rC = await fetch(`${API_URL}/api/crops?status=listed`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const dC = await rC.json();
          if (dC.success && Array.isArray(dC.crops)) {
            const liveIds = new Set(dC.crops.map(c => c._id));
            setCart(cart.filter(item => liveIds.has(item._id)));
          }
        }
        throw new Error(d.message || "Failed to place order");
      }
      return d.order?._id || null;
    } catch (e) {
      setError(e.message);
      setPlacing(false);
      placingRef.current = false;
      return null;
    }
  };

  // COD: create order + go straight to success
  const placeOrder = async () => {
    const oid = await createDbOrder("cod");
    if (!oid) return;
    setOrderId(oid);
    clearCart();
    setStep(4);
    setPlacing(false);
    placingRef.current = false;
  };

  // Razorpay: create DB order first, then open Razorpay modal
  const initRazorpayOrder = async () => {
    if (pendingOrderId) return; // already created, just re-open
    const oid = await createDbOrder("razorpay");
    if (!oid) return;
    setPendingOrderId(oid);
    // placing stays true until RazorpayCheckout finishes
  };

  const onRazorpaySuccess = (oid) => {
    setOrderId(oid);
    clearCart();
    setPendingOrderId(null);
    setPlacing(false);
    placingRef.current = false;
    setStep(4);
  };

  const onRazorpayFailure = (msg) => {
    setError(msg || "Payment failed. You can retry.");
    setPlacing(false);
    placingRef.current = false;
    // pendingOrderId stays — user can retry without recreating the order
  };


  const renderCatIcon = (cat) => {
    const c = (cat || "").toLowerCase();
    if (c.includes("vegetable") || c.includes("veggie")) return <Carrot size={26} color="#0ea5e9" />;
    if (c.includes("fruit")) return <Apple size={26} color="#0ea5e9" />;
    if (c.includes("grain") || c.includes("cereal")) return <Wheat size={26} color="#0ea5e9" />;
    if (c.includes("spice")) return <Flame size={26} color="#0ea5e9" />;
    if (c.includes("dairy")) return <Milk size={26} color="#0ea5e9" />;
    return <Package size={26} color="#0ea5e9" />;
  };

  /* ─────────────── STYLES ─────────────── */
  const S = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
    .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#0ea5e9;margin-bottom:6px;}
    .pg-title{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:800;color:#0f172a;margin-bottom:20px;}
    .card{background:rgba(14,165,233,0.04);border:1px solid rgba(14,165,233,0.1);border-radius:18px;padding:20px 22px;}
    .field-label{display:block;font-size:12px;font-weight:700;color:var(--text2);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.04em;}
    .field-input{width:100%;padding:10px 14px;border-radius:11px;border:1px solid rgba(14,165,233,0.18);background:rgba(14,165,233,0.05);color:#0f172a;font-size:14px;font-family:'Inter',sans-serif;outline:none;transition:border-color 0.2s;box-sizing:border-box;}
    .field-input:focus{border-color:rgba(14,165,233,0.4);}
    .btn-cyan{display:inline-flex;align-items:center;gap:8px;padding:12px 24px;border-radius:12px;background:linear-gradient(135deg,#0284c7,#0ea5e9);color:#0f172a;font-weight:700;font-size:15px;border:none;cursor:pointer;text-decoration:none;font-family:'Inter',sans-serif;transition:opacity 0.2s;justify-content:center;}
    .btn-cyan:hover{opacity:0.88;}
    .btn-cyan:disabled{opacity:0.5;cursor:not-allowed;}
    .btn-ghost{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border-radius:10px;border:1px solid rgba(14,165,233,0.2);background:transparent;color:#7dd3fc;font-weight:600;font-size:14px;cursor:pointer;text-decoration:none;font-family:'Inter',sans-serif;transition:all 0.2s;}
    .pay-opt{padding:14px 18px;border-radius:14px;border:2px solid rgba(14,165,233,0.12);background:rgba(14,165,233,0.03);cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:12px;}
    .pay-opt.sel{border-color:#0ea5e9;background:rgba(14,165,233,0.1);}
    .step-bar{display:flex;gap:0;margin-bottom:28px;}
    .step{display:flex;align-items:center;flex:1;}
    .step-dot{width:28px;height:28px;border-radius:50%;border:2px solid rgba(14,165,233,0.2);background:rgba(14,165,233,0.05);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:var(--text2);flex-shrink:0;}
    .step-dot.done{background:linear-gradient(135deg,#0284c7,#38bdf8);border-color:#0369a1;color:#0f172a;}
    .step-dot.active{border-color:#0ea5e9;color:#0ea5e9;background:rgba(14,165,233,0.1);}
    .step-label{font-size:11px;color:var(--text2);margin-left:8px;white-space:nowrap;}
    .step-label.active{color:#0369a1;font-weight:700;}
    .step-line{flex:1;height:2px;background:rgba(14,165,233,0.12);margin:0 8px;}
    .step-line.done{background:linear-gradient(90deg,#0284c7,#38bdf8);}
  `;

  /* ─────────────── STEP COMPONENTS ─────────────── */
  const Steps = () => (
    <div className="step-bar">
      {["Cart", "Address", "Payment"].map((label, i) => {
        const idx = i + 1;
        const done = step > idx;
        const active = step === idx;
        return (
          <div key={label} className="step">
            <div className={`step-dot ${done ? "done" : active ? "active" : ""}`}>{done ? "✓" : idx}</div>
            <span className={`step-label ${active ? "active" : ""}`}>{label}</span>
            {i < 2 && <div className={`step-line ${done ? "done" : ""}`} />}
          </div>
        );
      })}
    </div>
  );

  /* ─────────────── ORDER SUMMARY SIDEBAR ─────────────── */
  const Summary = () => (
    <div className="card" style={{ position: "sticky", top: 80, flexShrink: 0, width: 280 }}>
      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, color: "#0f172a", fontSize: 15, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
        <Receipt size={16} color="#0ea5e9" /> Order Summary
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {cart.map(c => (
          <div key={c._id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: "var(--text2)" }}>{c.name} × {c.qty || 1}</span>
            <span style={{ color: "#0f172a", fontWeight: 600 }}>₹{((c.price || 0) * (c.qty || 1)).toLocaleString("en-IN")}</span>
          </div>
        ))}
      </div>
      <div style={{ borderTop: "1px solid rgba(14,165,233,0.1)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text2)" }}>
          <span>Subtotal</span><span style={{ color: "#0f172a" }}>₹{total.toLocaleString("en-IN")}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text2)" }}>
          <span>Delivery</span>
          <span style={{ color: deliveryFee === 0 ? "#4ade80" : "#0f172a" }}>{deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}</span>
        </div>
        {deliveryFee > 0 && <div style={{ fontSize: 11, color: "var(--text2)" }}>Add ₹{500 - total} more for free delivery</div>}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, marginTop: 6, paddingTop: 10, borderTop: "1px solid rgba(14,165,233,0.1)" }}>
          <span style={{ color: "#0f172a" }}>Total</span>
          <span style={{ color: "#0ea5e9", fontFamily: "'Space Grotesk',sans-serif" }}>₹{grandTotal.toLocaleString("en-IN")}</span>
        </div>
      </div>
    </div>
  );

  /* ─────────────── STEP 1: CART ─────────────── */
  if (step === 1) return (
    <>
      <style>{S}</style>
      <div className="eyebrow">Buyer Portal</div>
      <div className="pg-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <ShoppingCart size={24} color="#0ea5e9" /> Your Cart ({cart.length})
      </div>
      <Steps />

      {cart.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(14,165,233,0.08)", display: "inline-flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <ShoppingCart size={32} color="#0ea5e9" />
          </div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: "#0f172a", margin: "16px 0 8px" }}>Cart is empty</div>
          <div style={{ color: "var(--text2)", marginBottom: 20 }}>Add products from the Browse page.</div>
          <Link to="/user/browse" className="btn-cyan" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <ShoppingCart size={15} /> Browse Products
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {cart.map(c => (
                <div key={c._id} className="card" style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <div style={{ width: 56, height: 56, borderRadius: 12, background: "rgba(14,165,233,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>
                    {c.image?.url ? <img src={c.image.url} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }} alt={c.name} /> : renderCatIcon(c.category)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 15 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text2)" }}>₹{c.price}/{c.unit} · {c.location}</div>
                  </div>
                  {/* Qty control */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button onClick={() => updateQty(c._id, -1)} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid rgba(14,165,233,0.2)", background: "rgba(14,165,233,0.06)", color: "#0369a1", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                    <span style={{ color: "#0f172a", fontWeight: 800, fontSize: 15, minWidth: 24, textAlign: "center" }}>{c.qty || 1}</span>
                    <button onClick={() => updateQty(c._id, 1)} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid rgba(14,165,233,0.2)", background: "rgba(14,165,233,0.06)", color: "#0369a1", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                  </div>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, color: "#0ea5e9", fontSize: 16, minWidth: 80, textAlign: "right" }}>₹{((c.price || 0) * (c.qty || 1)).toLocaleString("en-IN")}</div>
                  <button onClick={() => removeItem(c._id)} style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "6px 10px", color: "#dc2626", cursor: "pointer", fontSize: 14, flexShrink: 0, display: "flex", alignItems: "center" }}><Trash2 size={15} /></button>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <Link to="/user/browse" className="btn-ghost">← Continue Shopping</Link>
              <button onClick={clearCart} style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)", background: "#fef2f2", color: "#dc2626", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'Inter',sans-serif", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Trash2 size={14} /> Clear Cart
              </button>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 280, flexShrink: 0 }}>
            <Summary />
            <button className="btn-cyan" style={{ width: "100%" }} onClick={() => setStep(2)}>Proceed to Address →</button>
          </div>
        </div>
      )}
    </>
  );

  /* ─────────────── STEP 2: DELIVERY ADDRESS ─────────────── */
  if (step === 2) {
    const valid = addr.name && addr.phone.length === 10 && addr.address && addr.city && addr.state && addr.pincode;
    return (
      <>
        <style>{S}</style>
        <div className="eyebrow">Buyer Portal</div>
        <div className="pg-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <MapPin size={24} color="#0ea5e9" /> Delivery Address
        </div>
        <Steps />
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div className="card" style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { label: "Full Name *",    key: "name",    placeholder: "Ajay Kumar",     type: "text",   cols: 1 },
                { label: "Phone Number * (10 digits)", key: "phone", placeholder: "9876543210", type: "tel", cols: 1, maxLength: 10 },
                { label: "Address *",      key: "address", placeholder: "House No., Street, Area", type: "text", cols: 2 },
                { label: "City *",         key: "city",    placeholder: "Mumbai",          type: "text",   cols: 1 },
                { label: "Pincode *",      key: "pincode", placeholder: "400001",          type: "text",   cols: 1 },
              ].map(f => (
                <div key={f.key} style={{ gridColumn: f.cols === 2 ? "span 2" : "span 1" }}>
                  <label className="field-label">{f.label}</label>
                  <input
                    className="field-input"
                    type={f.type}
                    placeholder={f.placeholder}
                    value={addr[f.key]}
                    maxLength={f.maxLength}
                    onChange={e => {
                      const val = f.key === "phone"
                        ? e.target.value.replace(/\D/g, "").slice(0, 10)
                        : e.target.value;
                      setAddr(p => ({ ...p, [f.key]: val }));
                    }}
                    style={f.key === "phone" && addr.phone.length > 0 && addr.phone.length !== 10
                      ? { borderColor: "rgba(239,68,68,0.5)", boxShadow: "0 0 0 3px rgba(239,68,68,0.08)" }
                      : {}}
                  />
                  {f.key === "phone" && addr.phone.length > 0 && addr.phone.length !== 10 && (
                    <div style={{ fontSize: 11, color: "#dc2626", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                      <AlertTriangle size={12} /> Enter exactly 10 digits ({addr.phone.length}/10)
                    </div>
                  )}
                </div>
              ))}
              <div style={{ gridColumn: "span 2" }}>
                <label className="field-label">State *</label>
                <select className="field-input" value={addr.state} onChange={e => setAddr(p => ({ ...p, state: e.target.value }))}>
                  {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button className="btn-ghost" onClick={() => setStep(1)}>← Back</button>
              <button className="btn-cyan" style={{ flex: 1 }} disabled={!valid} onClick={() => setStep(3)}>Continue to Payment →</button>
            </div>
          </div>
          <Summary />
        </div>
      </>
    );
  }

  /* ─────────────── STEP 3: PAYMENT ─────────────── */
  if (step === 3) {
    const user = JSON.parse(localStorage.getItem("agroconnect_user") || "{}");
    const METHODS = [
      { key: "cod",      Icon: Banknote,   label: "Cash on Delivery", sub: "Pay when your order arrives" },
      { key: "razorpay", Icon: CreditCard, label: "Pay Online",        sub: "UPI · Card · Net Banking · Wallets via Razorpay" },
    ];
    return (
      <>
        <style>{S}</style>
        <div className="eyebrow">Buyer Portal</div>
        <div className="pg-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CreditCard size={24} color="#0ea5e9" /> Payment
        </div>
        <Steps />
        {error && (
          <div style={{ marginBottom: 16, padding: "12px 16px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, color: "#dc2626", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={16} /> {error}
          </div>
        )}
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 15, marginBottom: 14 }}>Select Payment Method</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {METHODS.map(m => {
                  const MethodIcon = m.Icon;
                  return (
                    <div key={m.key} className={`pay-opt ${payment === m.key ? "sel" : ""}`} onClick={() => { setPayment(m.key); setPendingOrderId(null); setError(""); }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${payment === m.key ? "#0ea5e9" : "rgba(14,165,233,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {payment === m.key && <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#0ea5e9" }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                          <MethodIcon size={16} color="#0ea5e9" /> {m.label}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>{m.sub}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery summary */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 14, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <MapPin size={15} color="#0ea5e9" /> Delivering to
              </div>
              <div style={{ fontSize: 13, color: "var(--text2)" }}>
                <div style={{ color: "#0f172a", fontWeight: 600, marginBottom: 2 }}>{addr.name} · {addr.phone}</div>
                {addr.address}, {addr.city}, {addr.state} – {addr.pincode}
              </div>
              <button onClick={() => setStep(2)} style={{ marginTop: 10, fontSize: 12, color: "#0369a1", background: "none", border: "none", cursor: "pointer", fontFamily: "'Inter',sans-serif", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Edit3 size={13} /> Change
              </button>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-ghost" onClick={() => setStep(2)} disabled={placing}>← Back</button>

              {payment === "cod" ? (
                <button className="btn-cyan" style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }} disabled={placing} onClick={placeOrder}>
                  {placing ? (
                    <><Loader2 size={15} className="animate-spin" /> Placing Order…</>
                  ) : (
                    <><CheckCircle2 size={15} /> Place Order · ₹{grandTotal.toLocaleString("en-IN")}</>
                  )}
                </button>
              ) : (
                // Razorpay: two-step — create DB order then open payment modal
                !pendingOrderId ? (
                  <button className="btn-cyan" style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }} disabled={placing} onClick={initRazorpayOrder}>
                    {placing ? (
                      <><Loader2 size={15} className="animate-spin" /> Preparing Payment…</>
                    ) : (
                      <><CreditCard size={15} /> Pay ₹{grandTotal.toLocaleString("en-IN")} Online</>
                    )}
                  </button>
                ) : (
                  <RazorpayCheckout
                    orderId={pendingOrderId}
                    amount={grandTotal}
                    orderDesc={`AgroConnect 360 Order — ${cart.length} item(s)`}
                    userName={user.name || addr.name}
                    userEmail={user.email || ""}
                    userPhone={addr.phone}
                    onSuccess={onRazorpaySuccess}
                    onFailure={onRazorpayFailure}
                  >
                    <span className="btn-cyan" style={{ display: "inline-flex", width: "100%", justifyContent: "center", alignItems: "center", gap: 6 }}>
                      <CreditCard size={15} /> Complete Payment · ₹{grandTotal.toLocaleString("en-IN")}
                    </span>
                  </RazorpayCheckout>
                )
              )}
            </div>
          </div>
          <Summary />
        </div>
      </>
    );
  }

  /* ─────────────── STEP 4: SUCCESS ─────────────── */
  return (
    <>
      <style>{S}</style>
      <div style={{ textAlign: "center", padding: "48px 24px", maxWidth: 480, margin: "0 auto" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(34,197,94,0.12)", color: "#16a34a", display: "inline-flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <CheckCircle2 size={44} />
        </div>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 28, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Order Placed!</div>
        <div style={{ fontSize: 14, color: "var(--text2)", marginBottom: 24 }}>
          Your order has been confirmed and will be delivered to <strong style={{ color: "#0f172a" }}>{addr.city}, {addr.state}</strong>.
        </div>
        {orderId && <div style={{ fontSize: 12, color: "#0ea5e9", marginBottom: 24, fontFamily: "monospace", background: "rgba(14,165,233,0.06)", padding: "8px 16px", borderRadius: 10, border: "1px solid #e2e8f0", display: "inline-block" }}>Order ID: {orderId}</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/user/orders" className="btn-cyan" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Package size={15} /> Track My Order
          </Link>
          <Link to="/user/browse" className="btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <ShoppingCart size={15} /> Shop More
          </Link>
        </div>
      </div>
    </>
  );
}
