import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../../config/api";

const DS_USER = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
  .pg-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:16px;flex-wrap:wrap;}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#0ea5e9;margin-bottom:6px;}
  .pg-title{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:800;color:#fff;line-height:1.2;}
  .pg-sub{font-size:14px;color:var(--text2);margin-top:6px;}
  .btn-cyan{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:12px;background:linear-gradient(135deg,#0284c7,#0ea5e9);color:#fff;font-weight:700;font-size:14px;border:none;cursor:pointer;text-decoration:none;font-family:'Inter',sans-serif;}
  .empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:64px 24px;text-align:center;gap:12px;}
  .empty-emoji{font-size:56px;} .empty-title{font-size:18px;font-weight:700;color:#fff;} .empty-sub{font-size:14px;color:var(--text2);}
  .wl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;}
  .wl-card{background:rgba(14,165,233,0.04);border:1px solid rgba(14,165,233,0.1);border-radius:18px;overflow:hidden;transition:all 0.2s;}
  .wl-card:hover{border-color:rgba(14,165,233,0.25);transform:translateY(-2px);}
  .wl-img{width:100%;height:150px;object-fit:cover;}
  .wl-ph{width:100%;height:150px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(56,189,248,0.04));display:flex;align-items:center;justify-content:center;font-size:44px;}
`;

const DEMO_CROPS = [
  { _id: "d1", name: "Fresh Tomatoes",  category: "vegetables", price: 28,  unit: "kg", quantity: 200, location: "Nashik",    image: { url: "" } },
  { _id: "d2", name: "Basmati Rice",    category: "grains",     price: 85,  unit: "kg", quantity: 150, location: "Haryana",   image: { url: "" } },
  { _id: "d4", name: "Alphonso Mango",  category: "fruits",     price: 200, unit: "kg", quantity: 50,  location: "Ratnagiri", image: { url: "" } },
  { _id: "d7", name: "Turmeric",        category: "spices",     price: 180, unit: "kg", quantity: 60,  location: "Erode",     image: { url: "" } },
];

const catEmoji = (cat) => ({ vegetables: "🥬", fruits: "🍎", grains: "🌾", spices: "🌶️", dairy: "🥛", poultry: "🐔" })[cat] || "📦";

export default function UserWishlist() {
  const [wishlistIds, setWishlistIds] = useState(() => JSON.parse(localStorage.getItem("ac_wishlist") || "[]"));
  const [allCrops, setAllCrops] = useState([]);
  const [cartMsg, setCartMsg] = useState("");
  const token = localStorage.getItem("agroconnect_token");

  useEffect(() => {
    fetch(`${API_URL}/api/crops?status=listed`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setAllCrops(d.crops || d.data || DEMO_CROPS))
      .catch(() => setAllCrops(DEMO_CROPS));
  }, []);

  const items = allCrops.filter(c => wishlistIds.includes(c._id));

  const removeFromWishlist = (id) => {
    const updated = wishlistIds.filter(x => x !== id);
    setWishlistIds(updated);
    localStorage.setItem("ac_wishlist", JSON.stringify(updated));
  };

  const addToCart = (crop) => {
    const cart = JSON.parse(localStorage.getItem("ac_cart") || "[]");
    const existing = cart.find(c => c._id === crop._id);
    const updated = existing
      ? cart.map(c => c._id === crop._id ? { ...c, qty: (c.qty || 1) + 1 } : c)
      : [...cart, { ...crop, qty: 1 }];
    localStorage.setItem("ac_cart", JSON.stringify(updated));
    setCartMsg(`✅ ${crop.name} added to cart!`);
    setTimeout(() => setCartMsg(""), 2000);
  };

  const clearWishlist = () => {
    if (!window.confirm("Clear your entire wishlist?")) return;
    setWishlistIds([]);
    localStorage.setItem("ac_wishlist", "[]");
  };

  return (
    <>
      <style>{DS_USER}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Saved Items</div>
          <h1 className="pg-title">❤️ My Wishlist</h1>
          <p className="pg-sub">Products you've saved for later.</p>
        </div>
        {items.length > 0 && (
          <button onClick={clearWishlist} style={{ padding: "9px 16px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.06)", color: "#f87171", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
            🗑️ Clear All
          </button>
        )}
      </div>

      {cartMsg && (
        <div style={{ marginBottom: 16, padding: "10px 16px", background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 12, color: "#38bdf8", fontWeight: 600, fontSize: 14 }}>{cartMsg}</div>
      )}

      {wishlistIds.length === 0 || items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-emoji">❤️</div>
          <div className="empty-title">Your wishlist is empty</div>
          <div className="empty-sub">Click the ❤️ button on any product to save it here.</div>
          <Link to="/user/browse" className="btn-cyan">🛒 Browse Products</Link>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 18 }}>{items.length} saved item{items.length !== 1 ? "s" : ""}</div>
          <div className="wl-grid">
            {items.map(c => (
              <div key={c._id} className="wl-card">
                <div style={{ position: "relative" }}>
                  {c.image?.url || c.imageUrl
                    ? <img src={c.image?.url || c.imageUrl} alt={c.name} className="wl-img" />
                    : <div className="wl-ph">{catEmoji(c.category)}</div>
                  }
                  <button onClick={() => removeFromWishlist(c._id)}
                    style={{ position: "absolute", top: 8, right: 8, width: 30, height: 30, borderRadius: "50%", background: "rgba(239,68,68,0.8)", border: "none", cursor: "pointer", fontSize: 14, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}
                    title="Remove from wishlist">✕</button>
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ fontWeight: 800, color: "#fff", fontSize: 14, marginBottom: 4 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 10 }}>📍 {c.location} · {c.quantity} {c.unit} avail.</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: "#0ea5e9" }}>₹{c.price}<span style={{ fontSize: 11, color: "var(--text2)", fontWeight: 400 }}>/{c.unit}</span></div>
                    <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "rgba(34,197,94,0.1)", color: "#4ade80", fontWeight: 700 }}>🌿 Fresh</span>
                  </div>
                  <button onClick={() => addToCart(c)} className="btn-cyan" style={{ width: "100%", justifyContent: "center", fontSize: 13 }}>🛒 Add to Cart</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
