import { useEffect, useState } from "react";
import { API_URL } from "../../config/api";

const DS_USER = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
  .pg-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:16px;flex-wrap:wrap;}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#0ea5e9;margin-bottom:6px;}
  .pg-title{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:800;color:#fff;line-height:1.2;}
  .pg-sub{font-size:14px;color:var(--text2);margin-top:6px;}
  .loading-wrap{display:flex;align-items:center;justify-content:center;gap:12px;padding:60px 0;color:var(--text2);}
  .spinner{width:24px;height:24px;border:3px solid rgba(14,165,233,0.15);border-top-color:#0ea5e9;border-radius:50%;animation:spin 0.8s linear infinite;}
  @keyframes spin{to{transform:rotate(360deg)}}
  .btn-cyan{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:12px;background:linear-gradient(135deg,#0284c7,#0ea5e9);color:#fff;font-weight:700;font-size:14px;border:none;cursor:pointer;text-decoration:none;font-family:'Inter',sans-serif;transition:opacity 0.2s;}
  .btn-cyan:hover{opacity:0.88;}
  .btn-ghost{display:inline-flex;align-items:center;gap:8px;padding:9px 16px;border-radius:10px;border:1px solid rgba(14,165,233,0.2);background:rgba(14,165,233,0.06);color:#7dd3fc;font-weight:600;font-size:13px;cursor:pointer;text-decoration:none;font-family:'Inter',sans-serif;transition:all 0.2s;}
  .field-input{width:100%;padding:10px 14px;border-radius:11px;border:1px solid rgba(14,165,233,0.18);background:rgba(14,165,233,0.05);color:#fff;font-size:14px;font-family:'Inter',sans-serif;outline:none;transition:border-color 0.2s;}
  .field-input:focus{border-color:rgba(14,165,233,0.4);}
  .empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 24px;text-align:center;gap:12px;}
  .empty-emoji{font-size:48px;}
  .empty-title{font-size:18px;font-weight:700;color:#fff;}
  .empty-sub{font-size:14px;color:var(--text2);}
  .prod-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;}
  .prod-card{background:rgba(14,165,233,0.04);border:1px solid rgba(14,165,233,0.1);border-radius:18px;overflow:hidden;transition:all 0.2s;cursor:pointer;}
  .prod-card:hover{border-color:rgba(14,165,233,0.25);transform:translateY(-2px);}
  .prod-img{width:100%;height:160px;object-fit:cover;}
  .prod-ph{width:100%;height:160px;background:linear-gradient(135deg,rgba(14,165,233,0.1),rgba(56,189,248,0.04));display:flex;align-items:center;justify-content:center;font-size:48px;}
  .cat-pill{padding:7px 16px;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;border:1px solid rgba(14,165,233,0.12);background:rgba(14,165,233,0.04);color:var(--text2);transition:all 0.2s;font-family:'Inter',sans-serif;}
  .cat-pill.active{background:rgba(14,165,233,0.12);color:#38bdf8;border-color:rgba(14,165,233,0.25);}
`;

const CATS = ["all", "vegetables", "fruits", "grains", "spices", "dairy", "poultry", "other"];
const SORT_OPTIONS = ["Newest", "Price: Low to High", "Price: High to Low", "Most Available"];

export default function BrowseProducts() {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("Newest");
  const [cartMsg, setCartMsg] = useState("");
  const [wishlist, setWishlist] = useState(() => JSON.parse(localStorage.getItem("ac_wishlist") || "[]"));
  const token = localStorage.getItem("agroconnect_token");

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch(`${API_URL}/api/crops?status=listed`, { headers: { Authorization: `Bearer ${token}` } });
        const d = await r.json();
        setCrops(d.crops || d.data || DEMO_CROPS);
      } catch { setCrops(DEMO_CROPS); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const toggleWishlist = (id) => {
    const updated = wishlist.includes(id) ? wishlist.filter(x => x !== id) : [...wishlist, id];
    setWishlist(updated);
    localStorage.setItem("ac_wishlist", JSON.stringify(updated));
  };

  const addToCart = (crop) => {
    const cart = JSON.parse(localStorage.getItem("ac_cart") || "[]");
    const existing = cart.find(c => c._id === crop._id);
    let updated;
    if (existing) {
      updated = cart.map(c => c._id === crop._id ? { ...c, qty: (c.qty || 1) + 1 } : c);
    } else {
      updated = [...cart, { ...crop, qty: 1 }];
    }
    localStorage.setItem("ac_cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("ac_cart_update"));
    setCartMsg(`✅ ${crop.name} added to cart!`);
    setTimeout(() => setCartMsg(""), 2000);
  };


  let filtered = crops.filter(c => {
    if (category !== "all" && c.category !== category) return false;
    if (search && !c.name?.toLowerCase().includes(search.toLowerCase()) && !c.location?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (sort === "Price: Low to High") filtered = [...filtered].sort((a, b) => a.price - b.price);
  if (sort === "Price: High to Low") filtered = [...filtered].sort((a, b) => b.price - a.price);
  if (sort === "Most Available") filtered = [...filtered].sort((a, b) => (b.quantity || 0) - (a.quantity || 0));

  const catEmoji = (cat) => ({ vegetables: "🥬", fruits: "🍎", grains: "🌾", spices: "🌶️", dairy: "🥛", poultry: "🐔", other: "📦" })[cat] || "🛒";

  return (
    <>
      <style>{DS_USER}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Marketplace</div>
          <h1 className="pg-title">🛒 Browse Fresh Produce</h1>
          <p className="pg-sub">Directly from local farmers — fresh, fair-priced, traceable.</p>
        </div>
        <div style={{ fontSize: 13, color: "var(--text2)" }}>{filtered.length} listings found</div>
      </div>

      {cartMsg && (
        <div style={{ marginBottom: 16, padding: "10px 16px", background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 12, color: "#38bdf8", fontWeight: 600, fontSize: 14 }}>
          {cartMsg}
        </div>
      )}

      {/* Search + Sort */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input className="field-input" placeholder="🔍 Search products, location…" value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 300 }} />
        <select className="field-input" style={{ maxWidth: 200, cursor: "pointer" }} value={sort} onChange={e => setSort(e.target.value)}>
          {SORT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        {search && <button className="btn-ghost" onClick={() => setSearch("")} style={{ fontSize: 12 }}>✕ Clear</button>}
      </div>

      {/* Category pills */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
        {CATS.map(c => (
          <button key={c} className={`cat-pill ${category === c ? "active" : ""}`} onClick={() => setCategory(c)}>
            {c === "all" ? "🌍 All" : `${catEmoji(c)} ${c.charAt(0).toUpperCase() + c.slice(1)}`}
          </button>
        ))}
      </div>

      {loading && <div className="loading-wrap"><div className="spinner" /><span>Loading products…</span></div>}

      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-emoji">🔍</div>
          <div className="empty-title">No products found</div>
          <div className="empty-sub">Try a different category or search term.</div>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="prod-grid">
          {filtered.map(c => (
            <div key={c._id} className="prod-card">
              <div style={{ position: "relative" }}>
                {c.image?.url || c.imageUrl
                  ? <img src={c.image?.url || c.imageUrl} alt={c.name} className="prod-img" />
                  : <div className="prod-ph">{catEmoji(c.category)}</div>
                }
                {/* Wishlist heart */}
                <button onClick={() => toggleWishlist(c._id)} style={{ position: "absolute", top: 10, right: 10, width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "none", cursor: "pointer", fontSize: 16, backdropFilter: "blur(6px)" }}>
                  {wishlist.includes(c._id) ? "❤️" : "🤍"}
                </button>
                {/* Fresh tag */}
                <span style={{ position: "absolute", top: 10, left: 10, fontSize: 10, fontWeight: 700, background: "rgba(34,197,94,0.85)", color: "#fff", padding: "3px 8px", borderRadius: 6 }}>🌿 FRESH</span>
              </div>
              <div style={{ padding: "14px 16px" }}>
                <div style={{ fontWeight: 800, color: "#fff", fontSize: 15, marginBottom: 3 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 10 }}>
                  📍 {c.location} · {c.quantity} {c.unit} avail.
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color: "#0ea5e9" }}>₹{c.price}</div>
                    <div style={{ fontSize: 11, color: "var(--text2)" }}>per {c.unit}</div>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text2)", textAlign: "right" }}>
                    <div>🌾 {c.farmerName || "Farmer"}</div>
                  </div>
                </div>
                <button onClick={() => addToCart(c)} className="btn-cyan" style={{ width: "100%", justifyContent: "center", fontSize: 13 }}>
                  🛒 Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

const DEMO_CROPS = [
  { _id: "d1", name: "Fresh Tomatoes",  category: "vegetables", price: 28,  unit: "kg", quantity: 200, location: "Nashik",   farmerName: "Ramesh Patil",  image: { url: "" } },
  { _id: "d2", name: "Basmati Rice",    category: "grains",     price: 85,  unit: "kg", quantity: 150, location: "Haryana",  farmerName: "Suresh Singh",  image: { url: "" } },
  { _id: "d3", name: "Organic Spinach", category: "vegetables", price: 40,  unit: "kg", quantity: 80,  location: "Pune",     farmerName: "Meena Joshi",   image: { url: "" } },
  { _id: "d4", name: "Alphonso Mango",  category: "fruits",     price: 200, unit: "kg", quantity: 50,  location: "Ratnagiri",farmerName: "Sanjay Deore",  image: { url: "" } },
  { _id: "d5", name: "Red Onions",      category: "vegetables", price: 22,  unit: "kg", quantity: 400, location: "Nashik",   farmerName: "Vijay More",    image: { url: "" } },
  { _id: "d6", name: "Wheat (Gehun)",   category: "grains",     price: 30,  unit: "kg", quantity: 500, location: "Punjab",   farmerName: "Gurpreet Kaur", image: { url: "" } },
  { _id: "d7", name: "Turmeric",        category: "spices",     price: 180, unit: "kg", quantity: 60,  location: "Erode",    farmerName: "Murugan S.",    image: { url: "" } },
  { _id: "d8", name: "Green Bananas",   category: "fruits",     price: 35,  unit: "kg", quantity: 120, location: "Jalgaon",  farmerName: "Pradeep Borse", image: { url: "" } },
];
