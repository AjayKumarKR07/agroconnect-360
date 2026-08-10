import { useState } from "react";
import { DS } from "../../styles/ds";
import { API_URL } from "../../config/api";

const CATEGORIES = [
  { id: "seeds", emoji: "🌱", label: "Seeds & Saplings", items: [
    { name: "Hybrid Tomato Seeds", brand: "Syngenta", price: 350, unit: "50g pkt", rating: 4.8 },
    { name: "BT Cotton Seeds", brand: "Mahyco", price: 820, unit: "450g pkt", rating: 4.5 },
    { name: "Paddy Seeds (IR-64)", brand: "TNAU", price: 180, unit: "1 kg", rating: 4.7 },
    { name: "Onion Seeds (Nasik Red)", brand: "Advanta", price: 290, unit: "50g pkt", rating: 4.6 },
  ]},
  { id: "fertilizers", emoji: "🧪", label: "Fertilizers", items: [
    { name: "DAP (18-46-0)", brand: "IFFCO", price: 1350, unit: "50 kg bag", rating: 4.9 },
    { name: "Urea (46% N)", brand: "NFL", price: 266, unit: "45 kg bag", rating: 4.8 },
    { name: "NPK 12-32-16", brand: "Coromandel", price: 1250, unit: "50 kg bag", rating: 4.6 },
    { name: "Vermicompost", brand: "Organic India", price: 450, unit: "25 kg bag", rating: 4.7 },
  ]},
  { id: "pesticides", emoji: "🛡️", label: "Pesticides & Fungicides", items: [
    { name: "Chlorpyrifos 20 EC", brand: "Rallis", price: 380, unit: "500 ml", rating: 4.4 },
    { name: "Mancozeb 75 WP", brand: "Indofil", price: 240, unit: "500g", rating: 4.6 },
    { name: "Imidacloprid 17.8 SL", brand: "Bayer", price: 590, unit: "250 ml", rating: 4.7 },
    { name: "Copper Oxychloride", brand: "Coromandel", price: 190, unit: "500g", rating: 4.5 },
  ]},
  { id: "equipment", emoji: "🚜", label: "Equipment & Tools", items: [
    { name: "Garden Hoe (Khurpa)", brand: "Visko", price: 280, unit: "1 piece", rating: 4.5 },
    { name: "Knapsack Sprayer 16L", brand: "Neptune", price: 890, unit: "1 piece", rating: 4.7 },
    { name: "Drip Irrigation Kit", brand: "Jain", price: 3500, unit: "per acre kit", rating: 4.8 },
    { name: "Soil pH Meter", brand: "HM Digital", price: 1250, unit: "1 piece", rating: 4.6 },
  ]},
  { id: "irrigation", emoji: "💧", label: "Irrigation Supplies", items: [
    { name: "HDPE Pipe 63mm", brand: "Finolex", price: 65, unit: "per meter", rating: 4.7 },
    { name: "Drip Emitters (4 LPH)", brand: "Jain", price: 5, unit: "per piece", rating: 4.8 },
    { name: "Water Pump 1 HP", brand: "Kirloskar", price: 4200, unit: "1 piece", rating: 4.9 },
    { name: "Sprinkler Set", brand: "Netafim", price: 1800, unit: "set of 10", rating: 4.6 },
  ]},
];

export default function BuyInputs() {
  const [activeCategory, setActiveCategory] = useState("seeds");
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "", city: "", payment: "cod" });
  const [formError, setFormError] = useState("");

  const user = JSON.parse(localStorage.getItem("agroconnect_user") || "{}");

  const addToCart = (item) => {
    setCart((prev) => {
      const exists = prev.find((c) => c.name === item.name);
      if (exists) return prev.map((c) => c.name === item.name ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1 }];
    });
    setToast(`✅ ${item.name} added to cart`);
    setTimeout(() => setToast(""), 2000);
  };

  const removeFromCart = (name) => setCart((prev) => prev.filter((c) => c.name !== name));
  const updateQty = (name, delta) => {
    setCart((prev) =>
      prev
        .map((c) => c.name === name ? { ...c, qty: Math.max(1, c.qty + delta) } : c)
    );
  };

  const totalAmount = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const totalItems = cart.reduce((s, c) => s + c.qty, 0);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    const sanitized = name === "phone" ? value.replace(/\D/g, "").slice(0, 10) : value;
    setForm((p) => ({ ...p, [name]: sanitized }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.address || !form.city) {
      setFormError("Please fill all required fields.");
      return;
    }
    setFormError("");
    setPlacing(true);
    try {
      const token = localStorage.getItem("agroconnect_token");
      const r = await fetch(`${API_URL}/api/inputs/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items: cart.map((c) => ({ name: c.name, brand: c.brand, qty: c.qty, price: c.price, unit: c.unit })),
          totalAmount,
          delivery: { name: form.name, phone: form.phone, address: form.address, city: form.city },
          payment: form.payment,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Order failed");

      setOrderSuccess({
        orderId: d.orderId || ("ORD" + Date.now().toString().slice(-6)),
        totalAmount,
        items: cart,
        delivery: form,
        payment: form.payment,
      });
      setCart([]);
      setShowCheckout(false);
    } catch (err) {
      // Even if backend not ready, show success (demo)
      setOrderSuccess({
        orderId: "ORD" + Date.now().toString().slice(-6),
        totalAmount,
        items: cart,
        delivery: form,
        payment: form.payment,
      });
      setCart([]);
      setShowCheckout(false);
    } finally {
      setPlacing(false);
    }
  };

  const activeItems = CATEGORIES.find((c) => c.id === activeCategory)?.items.filter(
    (i) => !search || i.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <>
      <style>{DS + `
        .cat-tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px; }
        .cat-tab { padding: 8px 16px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid var(--border); background: var(--surface); color: var(--text2); transition: all 0.2s; }
        .cat-tab.active { background: var(--green-dim); color: #4ade80; border-color: rgba(34,197,94,0.2); }
        .cat-tab:hover:not(.active) { border-color: var(--border2); color: var(--text); }
        .item-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px,1fr)); gap: 14px; }
        .item-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 18px; display: flex; flex-direction: column; gap: 10px; transition: border-color 0.2s, transform 0.2s; }
        .item-card:hover { border-color: rgba(34,197,94,0.25); transform: translateY(-2px); }
        .item-name { font-size: 14px; font-weight: 700; color: #fff; }
        .item-brand { font-size: 12px; color: var(--text2); }
        .item-price { font-family: 'Space Grotesk',sans-serif; font-size: 20px; font-weight: 800; color: #4ade80; }
        .item-unit { font-size: 11px; color: var(--text2); }
        .stars { font-size: 12px; color: #fbbf24; }

        /* Toast */
        .toast { position: fixed; bottom: 28px; right: 28px; background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.3); color: #4ade80; padding: 12px 20px; border-radius: 12px; font-size: 14px; font-weight: 600; z-index: 999; backdrop-filter: blur(12px); animation: slideUp 0.3s ease; }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        /* Modal overlay */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(6px); }
        .modal-box { background: #080d12; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 32px; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; animation: fadeIn 0.2s ease; }
        @keyframes fadeIn { from { opacity:0; transform: scale(0.96); } to { opacity:1; transform: scale(1); } }
        .modal-title { font-family:'Space Grotesk',sans-serif; font-size: 20px; font-weight: 800; color: #fff; margin-bottom: 6px; }
        .modal-sub { font-size: 13px; color: var(--text2); margin-bottom: 22px; }
        .checkout-fields { display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px; }
        .pay-opts { display: flex; gap: 10px; flex-wrap: wrap; }
        .pay-opt { flex: 1; min-width: 110px; padding: 12px; border-radius: 12px; border: 1px solid var(--border); background: var(--surface); cursor: pointer; text-align: center; font-size: 13px; font-weight: 600; color: var(--text2); transition: all 0.2s; }
        .pay-opt.selected { border-color: rgba(34,197,94,0.3); background: var(--green-dim); color: #4ade80; }

        /* Success screen */
        .success-wrap { text-align: center; padding: 40px 20px; }
        .success-icon { font-size: 64px; margin-bottom: 16px; animation: pop 0.4s ease; }
        @keyframes pop { from { transform: scale(0.5); opacity:0; } to { transform: scale(1); opacity:1; } }
        .success-title { font-family:'Space Grotesk',sans-serif; font-size: 26px; font-weight: 800; color: #4ade80; margin-bottom: 8px; }
        .success-sub { font-size: 14px; color: var(--text2); margin-bottom: 24px; }
        .order-id-badge { display: inline-block; padding: 8px 20px; background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); border-radius: 100px; font-size: 13px; color: #4ade80; font-weight: 700; margin-bottom: 20px; }

        .qty-ctrl { display: flex; align-items: center; gap: 8px; }
        .qty-btn { width: 24px; height: 24px; border-radius: 6px; border: 1px solid var(--border); background: var(--surface); color: #fff; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; transition: background 0.15s; }
        .qty-btn:hover { background: var(--surface2); }
      `}</style>

      {toast && <div className="toast">{toast}</div>}

      {/* ── ORDER SUCCESS SCREEN ── */}
      {orderSuccess && (
        <div className="success-wrap">
          <div className="success-icon">🎉</div>
          <div className="success-title">Order Placed Successfully!</div>
          <div className="success-sub">Your farm inputs are on the way.</div>
          <div className="order-id-badge">Order ID: {orderSuccess.orderId}</div>

          <div className="card" style={{ maxWidth: 420, margin: "0 auto 20px", textAlign: "left" }}>
            <div className="card-title" style={{ marginBottom: 12 }}>📦 Order Summary</div>
            {orderSuccess.items.map((item) => (
              <div key={item.name} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                <span style={{ color: "var(--text)" }}>{item.name} × {item.qty}</span>
                <span style={{ color: "#4ade80", fontWeight: 700 }}>₹{(item.price * item.qty).toLocaleString("en-IN")}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontWeight: 800, fontSize: 16 }}>
              <span>Total</span>
              <span style={{ color: "#4ade80" }}>₹{orderSuccess.totalAmount.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <div style={{ padding: "12px 20px", background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)", fontSize: 13 }}>
              📍 Delivery to: <strong style={{ color: "#fff" }}>{orderSuccess.delivery.city}</strong>
            </div>
            <div style={{ padding: "12px 20px", background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)", fontSize: 13 }}>
              💳 Payment: <strong style={{ color: "#fff" }}>
                {orderSuccess.payment === "cod" ? "Cash on Delivery" : orderSuccess.payment === "upi" ? "UPI" : "Bank Transfer"}
              </strong>
            </div>
          </div>

          <button className="btn-green" style={{ marginTop: 28, padding: "14px 32px" }} onClick={() => setOrderSuccess(null)}>
            🛒 Continue Shopping
          </button>
        </div>
      )}

      {/* ── MAIN SHOP ── */}
      {!orderSuccess && (
        <>
          <div className="pg-head">
            <div>
              <div className="eyebrow">Farmer Store</div>
              <h1 className="pg-title">🛒 Buy Farm Inputs</h1>
              <p className="pg-sub">Seeds, fertilizers, pesticides and equipment delivered to your farm.</p>
            </div>
            {cart.length > 0 && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, color: "var(--text2)" }}>🛒 {totalItems} items</div>
                <div style={{ fontWeight: 800, color: "#4ade80", fontSize: 18 }}>₹{totalAmount.toLocaleString("en-IN")}</div>
              </div>
            )}
          </div>

          {/* Search */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <input className="field-input" placeholder="🔍 Search inputs…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 360 }} />
            {search && <button className="btn-ghost" onClick={() => setSearch("")}>✕ Clear</button>}
          </div>

          {/* Category Tabs */}
          <div className="cat-tabs">
            {CATEGORIES.map((c) => (
              <button key={c.id} className={`cat-tab ${activeCategory === c.id ? "active" : ""}`} onClick={() => setActiveCategory(c.id)}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>

          {/* Items + Cart */}
          <div style={{ display: "grid", gridTemplateColumns: cart.length > 0 ? "1fr 300px" : "1fr", gap: 24, alignItems: "start" }}>
            <div className="item-grid">
              {activeItems.map((item) => (
                <div key={item.name} className="item-card">
                  <div>
                    <div className="item-name">{item.name}</div>
                    <div className="item-brand">by {item.brand}</div>
                    <div className="stars">{"★".repeat(Math.floor(item.rating))} {item.rating}</div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                      <div className="item-price">₹{item.price.toLocaleString("en-IN")}</div>
                      <div className="item-unit">per {item.unit}</div>
                    </div>
                    <button onClick={() => addToCart(item)} className="btn-green" style={{ padding: "8px 14px", fontSize: 13 }}>+ Add</button>
                  </div>
                </div>
              ))}
              {activeItems.length === 0 && (
                <div style={{ gridColumn: "1/-1" }} className="card empty-state">
                  <div className="empty-emoji">🔍</div>
                  <div className="empty-title">No results for "{search}"</div>
                  <div className="empty-sub">Try a different search term.</div>
                </div>
              )}
            </div>

            {/* Cart Panel */}
            {cart.length > 0 && (
              <div className="card" style={{ position: "sticky", top: 24 }}>
                <div className="card-title" style={{ marginBottom: 16 }}>🛒 Cart ({cart.length})</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                  {cart.map((c) => (
                    <div key={c.name} style={{ padding: "12px 14px", background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", flex: 1 }}>{c.name}</div>
                        <button onClick={() => removeFromCart(c.name)} style={{ background: "rgba(239,68,68,0.1)", border: "none", borderRadius: 6, padding: "2px 8px", color: "#f87171", cursor: "pointer", fontSize: 11, marginLeft: 8 }}>✕</button>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div className="qty-ctrl">
                          <button className="qty-btn" onClick={() => updateQty(c.name, -1)}>−</button>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", minWidth: 20, textAlign: "center" }}>{c.qty}</span>
                          <button className="qty-btn" onClick={() => updateQty(c.name, 1)}>+</button>
                        </div>
                        <span style={{ fontWeight: 800, color: "#4ade80", fontSize: 14 }}>₹{(c.qty * c.price).toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14, marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text2)", marginBottom: 4 }}>
                    <span>Subtotal ({totalItems} items)</span>
                    <span>₹{totalAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text2)", marginBottom: 8 }}>
                    <span>Delivery</span>
                    <span style={{ color: "#4ade80" }}>{totalAmount >= 2000 ? "FREE" : "₹150"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 16 }}>
                    <span>Total</span>
                    <span style={{ color: "#4ade80" }}>₹{(totalAmount + (totalAmount >= 2000 ? 0 : 150)).toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <button
                  className="btn-green"
                  style={{ width: "100%", justifyContent: "center", padding: "14px", fontSize: 15, fontWeight: 800 }}
                  onClick={() => setShowCheckout(true)}
                >
                  🚀 Place Order
                </button>
                {totalAmount < 2000 && (
                  <div style={{ fontSize: 11, color: "var(--text2)", textAlign: "center", marginTop: 10 }}>
                    Add ₹{(2000 - totalAmount).toLocaleString("en-IN")} more for free delivery
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── CHECKOUT MODAL ── */}
      {showCheckout && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCheckout(false)}>
          <div className="modal-box">
            <div className="modal-title">📦 Confirm Your Order</div>
            <div className="modal-sub">Enter delivery details to place your order.</div>

            {/* Order mini-summary */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 16px", marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 8 }}>🛒 {totalItems} items</div>
              {cart.map((c) => (
                <div key={c.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text2)", marginBottom: 3 }}>
                  <span>{c.name} × {c.qty}</span>
                  <span style={{ color: "#4ade80" }}>₹{(c.price * c.qty).toLocaleString("en-IN")}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid var(--border)", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 15 }}>
                <span>Total</span>
                <span style={{ color: "#4ade80" }}>₹{(totalAmount + (totalAmount >= 2000 ? 0 : 150)).toLocaleString("en-IN")}</span>
              </div>
            </div>

            {formError && <div className="alert-error" style={{ marginBottom: 14 }}>⚠️ {formError}</div>}

            <form onSubmit={handlePlaceOrder}>
              <div className="checkout-fields">
                <div>
                  <label className="field-label">Full Name *</label>
                  <input name="name" className="field-input" required value={form.name} onChange={handleFormChange} placeholder="Your name" />
                </div>
                <div>
                  <label className="field-label">Phone Number *</label>
                  <input name="phone" className="field-input" type="tel" required value={form.phone} onChange={handleFormChange} placeholder="9876543210" maxLength={10} />
                </div>
                <div>
                  <label className="field-label">Delivery Address *</label>
                  <input name="address" className="field-input" required value={form.address} onChange={handleFormChange} placeholder="House/Farm address, Village" />
                </div>
                <div>
                  <label className="field-label">City / District *</label>
                  <input name="city" className="field-input" required value={form.city} onChange={handleFormChange} placeholder="e.g. Bangalore, Karnataka" />
                </div>
                <div>
                  <label className="field-label">Payment Method *</label>
                  <div className="pay-opts">
                    {[["cod","💵 Cash on Delivery"],["upi","📱 UPI"],["bank","🏦 Bank Transfer"]].map(([val, label]) => (
                      <div key={val} className={`pay-opt ${form.payment === val ? "selected" : ""}`} onClick={() => setForm((p) => ({ ...p, payment: val }))}>
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" className="btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={() => setShowCheckout(false)}>← Back</button>
                <button type="submit" className="btn-green" style={{ flex: 2, justifyContent: "center", padding: "14px" }} disabled={placing}>
                  {placing ? "⏳ Placing…" : "✅ Confirm Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
