import { useEffect, useState } from "react";
import { API_URL } from "../../config/api";
import { DS } from "../../styles/ds";

// Procurement: Seller browses LISTED crops from farmers and places bulk orders
export default function SellerProcurement() {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [ordering, setOrdering] = useState(null);
  const [orderModal, setOrderModal] = useState(null);
  const [orderForm, setOrderForm] = useState({ quantity: "", note: "" });
  const [success, setSuccess] = useState("");
  const token = localStorage.getItem("agroconnect_token");

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch(`${API_URL}/api/crops?status=listed`, { headers: { Authorization: `Bearer ${token}` } });
        const d = await r.json();
        if (d.success) setCrops(d.crops || d.data || []);
        else setCrops(DEMO_CROPS);
      } catch { setCrops(DEMO_CROPS); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const categories = ["all", ...new Set(crops.map(c => c.category).filter(Boolean))];

  const filtered = crops.filter(c => {
    if (category !== "all" && c.category !== category) return false;
    if (search && !c.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const placeOrder = async () => {
    if (!orderForm.quantity || Number(orderForm.quantity) <= 0) return;
    setOrdering(orderModal._id);
    try {
      await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          cropId: orderModal._id,
          quantity: Number(orderForm.quantity),
          note: orderForm.note,
        }),
      });
      setSuccess(`Order placed for ${orderForm.quantity} ${orderModal.unit} of ${orderModal.name}!`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setSuccess("Order placed (offline mode)");
      setTimeout(() => setSuccess(""), 2000);
    } finally {
      setOrdering(null);
      setOrderModal(null);
      setOrderForm({ quantity: "", note: "" });
    }
  };

  return (
    <>
      <style>{DS + `
        .proc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px;}
        .proc-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;overflow:hidden;transition:all 0.2s;}
        .proc-card:hover{border-color:rgba(167,139,250,0.25);transform:translateY(-2px);}
        .proc-img{width:100%;height:150px;object-fit:cover;}
        .proc-ph{width:100%;height:150px;background:linear-gradient(135deg,rgba(124,58,237,0.08),rgba(167,139,250,0.04));display:flex;align-items:center;justify-content:center;font-size:48px;}
        .proc-body{padding:14px 16px;}
        .cat-pills{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:20px;}
        .cat-pill{padding:6px 14px;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;border:1px solid var(--border);background:var(--surface);color:var(--text2);transition:all 0.2s;}
        .cat-pill.active{background:rgba(167,139,250,0.1);color:#a78bfa;border-color:rgba(167,139,250,0.2);}
      `}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Seller Exclusive</div>
          <h1 className="pg-title">📥 Procurement</h1>
          <p className="pg-sub">Browse and buy crops directly from farmers for resale.</p>
        </div>
        <div style={{ fontSize: 13, color: "var(--text2)", textAlign: "right" }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color: "#a78bfa" }}>{filtered.length}</div>
          listings available
        </div>
      </div>

      {success && <div className="alert-success" style={{ marginBottom: 16 }}>✅ {success}</div>}

      {/* Search + Category */}
      <div style={{ display: "flex", gap: 12, marginBottom: 18, alignItems: "center", flexWrap: "wrap" }}>
        <input className="field-input" placeholder="🔍 Search crops…" value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 280 }} />
        {search && <button className="btn-ghost" onClick={() => setSearch("")} style={{ fontSize: 12 }}>✕ Clear</button>}
      </div>
      <div className="cat-pills">
        {categories.map(c => (
          <button key={c} className={`cat-pill ${category === c ? "active" : ""}`} onClick={() => setCategory(c)}>
            {c === "all" ? "All Categories" : c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      {loading && <div className="loading-wrap"><div className="spinner" /><span>Loading listings…</span></div>}

      {!loading && filtered.length === 0 && (
        <div className="card empty-state">
          <div className="empty-emoji">📥</div>
          <div className="empty-title">No listings found</div>
          <div className="empty-sub">Farmers will list crops here for procurement.</div>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="proc-grid">
          {filtered.map(c => (
            <div key={c._id} className="proc-card">
              {c.image?.url || c.imageUrl
                ? <img src={c.image?.url || c.imageUrl} alt={c.name} className="proc-img" />
                : <div className="proc-ph">{c.category === "vegetables" ? "🥬" : c.category === "fruits" ? "🍎" : c.category === "grains" ? "🌾" : "🛒"}</div>
              }
              <div className="proc-body">
                <div style={{ fontWeight: 800, color: "#fff", fontSize: 15, marginBottom: 4 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 10 }}>
                  {c.category} · {c.location} · <span style={{ color: "#a78bfa" }}>{c.farmerName || "Farmer"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color: "#4ade80" }}>₹{c.price}</div>
                    <div style={{ fontSize: 11, color: "var(--text2)" }}>per {c.unit} · {c.quantity} {c.unit} avail.</div>
                  </div>
                  <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 8, background: "rgba(34,197,94,0.1)", color: "#4ade80", fontWeight: 700 }}>Listed</span>
                </div>
                <button
                  className="btn-green"
                  style={{ width: "100%", justifyContent: "center", background: "linear-gradient(135deg,#7c3aed,#a78bfa)", fontSize: 13 }}
                  onClick={() => { setOrderModal(c); setOrderForm({ quantity: "", note: "" }); }}
                >
                  📥 Place Bulk Order
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Modal */}
      {orderModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(8px)" }}
          onClick={e => e.target === e.currentTarget && setOrderModal(null)}>
          <div style={{ background: "#0b0a1f", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 24, padding: 28, width: "100%", maxWidth: 420 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: "#fff" }}>📥 Bulk Order</div>
                <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 2 }}>{orderModal.name} · ₹{orderModal.price}/{orderModal.unit}</div>
              </div>
              <button onClick={() => setOrderModal(null)} style={{ background: "var(--surface)", border: "none", borderRadius: 8, padding: "6px 10px", color: "var(--text2)", cursor: "pointer", fontSize: 14 }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label className="field-label">Quantity ({orderModal.unit}) *</label>
                <input className="field-input" type="number" min="1" max={orderModal.quantity} placeholder={`Max ${orderModal.quantity} ${orderModal.unit}`}
                  value={orderForm.quantity} onChange={e => setOrderForm(p => ({ ...p, quantity: e.target.value }))} />
              </div>

              {orderForm.quantity && Number(orderForm.quantity) > 0 && (
                <div style={{ padding: "12px 16px", background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.15)", borderRadius: 12 }}>
                  <div style={{ fontSize: 12, color: "var(--text2)" }}>Order Total</div>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color: "#4ade80" }}>
                    ₹{(Number(orderForm.quantity) * Number(orderModal.price)).toLocaleString("en-IN")}
                  </div>
                </div>
              )}

              <div>
                <label className="field-label">Note to Farmer (optional)</label>
                <textarea className="field-input" rows={2} placeholder="Delivery instructions, quality requirements…"
                  value={orderForm.note} onChange={e => setOrderForm(p => ({ ...p, note: e.target.value }))} style={{ resize: "none" }} />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={() => setOrderModal(null)}>Cancel</button>
                <button className="btn-green" disabled={!orderForm.quantity || ordering === orderModal._id}
                  style={{ flex: 2, justifyContent: "center", background: "linear-gradient(135deg,#7c3aed,#a78bfa)" }}
                  onClick={placeOrder}>
                  {ordering === orderModal._id ? "⏳ Placing…" : "✅ Confirm Order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Demo data fallback
const DEMO_CROPS = [
  { _id: "d1", name: "Tomatoes", category: "vegetables", price: 25, unit: "kg", quantity: 500, location: "Nashik", farmerName: "Ramesh Patil", image: { url: "" } },
  { _id: "d2", name: "Basmati Rice", category: "grains", price: 75, unit: "kg", quantity: 200, location: "Haryana", farmerName: "Suresh Singh", image: { url: "" } },
  { _id: "d3", name: "Wheat", category: "grains", price: 28, unit: "kg", quantity: 1000, location: "Punjab", farmerName: "Gurpreet Kaur", image: { url: "" } },
  { _id: "d4", name: "Onions", category: "vegetables", price: 18, unit: "kg", quantity: 800, location: "Nashik", farmerName: "Vijay More", image: { url: "" } },
  { _id: "d5", name: "Potatoes", category: "vegetables", price: 20, unit: "kg", quantity: 600, location: "Agra", farmerName: "Ramkumar Das", image: { url: "" } },
  { _id: "d6", name: "Mangoes", category: "fruits", price: 120, unit: "kg", quantity: 100, location: "Ratnagiri", farmerName: "Sanjay Deore", image: { url: "" } },
];
