import { useEffect, useState } from "react";
import { API_URL } from "../../config/api";
import { RefreshCw, AlertTriangle, Sprout, Search } from "lucide-react";

const DS_USER = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
  .pg-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:16px;flex-wrap:wrap;}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#0ea5e9;margin-bottom:6px;}
  .pg-title{font-family:'Space Grotesk',sans-serif;font-size:clamp(22px,3vw,28px);font-weight:800;color:#0f172a;line-height:1.2;}
  .pg-sub{font-size:14px;color:var(--text2);margin-top:6px;}
  .loading-wrap{display:flex;align-items:center;justify-content:center;gap:12px;padding:60px 0;color:var(--text2);}
  .spinner{width:24px;height:24px;border:3px solid rgba(14,165,233,0.15);border-top-color:#0ea5e9;border-radius:50%;animation:spin 0.8s linear infinite;}
  @keyframes spin{to{transform:rotate(360deg)}}
  .btn-cyan{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:12px;background:linear-gradient(135deg,#0284c7,#0ea5e9);color:#0f172a;font-weight:700;font-size:14px;border:none;cursor:pointer;text-decoration:none;font-family:'Inter',sans-serif;transition:opacity 0.2s;}
  .btn-cyan:hover{opacity:0.88;}
  .btn-ghost{display:inline-flex;align-items:center;gap:8px;padding:9px 16px;border-radius:10px;border:1px solid rgba(14,165,233,0.2);background:rgba(14,165,233,0.06);color:#7dd3fc;font-weight:600;font-size:13px;cursor:pointer;text-decoration:none;font-family:'Inter',sans-serif;transition:all 0.2s;}
  .field-input{width:100%;padding:10px 14px;border-radius:11px;border:1px solid rgba(14,165,233,0.18);background:rgba(14,165,233,0.05);color:#0f172a;font-size:14px;font-family:'Inter',sans-serif;outline:none;transition:border-color 0.2s;}
  .field-input:focus{border-color:rgba(14,165,233,0.4);}
  .empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 24px;text-align:center;gap:12px;}
  .empty-emoji{font-size:48px;} .empty-title{font-size:18px;font-weight:700;color:#0f172a;} .empty-sub{font-size:14px;color:var(--text2);}
  .prod-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px;}
  .prod-card{background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;transition:all 0.25s;display:flex;flex-direction:column;}
  .prod-card:hover{border-color:#bae6fd;transform:translateY(-2px);box-shadow:0 8px 20px rgba(0,0,0,0.08);}
  .prod-img{width:100%;height:165px;object-fit:cover;}
  .prod-ph{width:100%;height:165px;background:#f0f9ff;display:flex;align-items:center;justify-content:center;font-size:52px;}
  .cat-pill{padding:7px 16px;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;border:1px solid rgba(14,165,233,0.12);background:rgba(14,165,233,0.04);color:var(--text2);transition:all 0.2s;font-family:'Inter',sans-serif;white-space:nowrap;}
  .cat-pill.active{background:rgba(14,165,233,0.14);color:#0369a1;border-color:rgba(14,165,233,0.3);}
  .qty-ctrl{display:flex;align-items:center;gap:6px;background:rgba(14,165,233,0.06);border:1px solid rgba(14,165,233,0.15);border-radius:10px;padding:4px 8px;}
  .qty-btn{width:26px;height:26px;border-radius:7px;border:none;background:rgba(14,165,233,0.12);color:#0369a1;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:800;transition:background 0.15s;}
  .qty-btn:hover{background:rgba(14,165,233,0.22);}
  .stock-ok{background:rgba(34,197,94,0.1);color:#15803d;border:1px solid rgba(34,197,94,0.2);}
  .stock-low{background:rgba(251,191,36,0.1);color:#b45309;border:1px solid rgba(251,191,36,0.2);}
  .stock-out{background:rgba(239,68,68,0.1);color:#dc2626;border:1px solid rgba(239,68,68,0.2);}
  .cart-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:rgba(14,165,233,0.18);border:1px solid rgba(14,165,233,0.35);color:#0369a1;font-weight:700;font-size:14px;padding:12px 24px;border-radius:14px;backdrop-filter:blur(12px);z-index:200;animation:fadeup 0.3s ease;pointer-events:none;}
  @keyframes fadeup{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
`;

const CATS = ["all", "vegetables", "fruits", "grains", "spices", "dairy", "poultry", "other"];
const SORT_OPTIONS = ["Newest", "Price: Low to High", "Price: High to Low", "Most Available"];

// No demo/fake crops — always use real MongoDB data

export default function BrowseProducts() {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("Newest");
  const [toast, setToast] = useState("");
  const [wishlist, setWishlist] = useState(() => JSON.parse(localStorage.getItem("ac_wishlist") || "[]"));
  const [qtys, setQtys] = useState({}); // per-product quantity selector
  const token = localStorage.getItem("agroconnect_token");

  const loadCrops = async () => {
    setLoading(true); setApiError(false);
    try {
      const r = await fetch(`${API_URL}/api/crops?status=listed`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (d.success) {
        setCrops(d.crops || []);
      } else {
        setCrops([]); setApiError(true);
      }
    } catch {
      setCrops([]); setApiError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCrops(); }, []);

  const getQty = (id) => qtys[id] || 1;

  // Cap at available stock — buyer cannot select more than what exists
  const setQty = (id, delta, maxQty) => setQtys(prev => ({
    ...prev,
    [id]: Math.min(maxQty, Math.max(1, (prev[id] || 1) + delta)),
  }));

  const toggleWishlist = (id) => {
    const updated = wishlist.includes(id) ? wishlist.filter(x => x !== id) : [...wishlist, id];
    setWishlist(updated);
    localStorage.setItem("ac_wishlist", JSON.stringify(updated));
  };

  const addToCart = (crop) => {
    const qty = getQty(crop._id);
    if (qty > crop.quantity) return; // safety guard
    const cart = JSON.parse(localStorage.getItem("ac_cart") || "[]");
    const existing = cart.find(c => c._id === crop._id);
    const cartItem = {
      _id:      crop._id,   // MongoDB ObjectId — used by checkout
      cropId:   crop._id,   // explicit alias for clarity
      name:     crop.name,
      category: crop.category,
      price:    crop.price, // snapshot for display only; backend re-fetches from DB
      unit:     crop.unit,
      quantity: crop.quantity,
      image:    crop.image,
      farmerName: crop.farmerName || crop.farmer?.name || "Local Farmer",
      location: crop.location,
    };
    let updated;
    if (existing) {
      const newQty = Math.min(crop.quantity, (existing.qty || 1) + qty);
      updated = cart.map(c => c._id === crop._id ? { ...c, qty: newQty } : c);
    } else {
      updated = [...cart, { ...cartItem, qty }];
    }
    localStorage.setItem("ac_cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("ac_cart_update"));
    setToast(`✅ ${qty} × ${crop.name} added to cart!`);
    setTimeout(() => setToast(""), 2200);
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

  // Stock indicator
  const stockBadge = (qty) => {
    if (!qty || qty === 0) return <span className="cat-pill stock-out" style={{ fontSize: 10, padding: "2px 7px" }}>Out of Stock</span>;
    if (qty <= 50) return <span className="cat-pill stock-low" style={{ fontSize: 10, padding: "2px 7px" }}>⚠️ Low Stock</span>;
    return <span className="cat-pill stock-ok" style={{ fontSize: 10, padding: "2px 7px" }}>✓ In Stock</span>;
  };

  // Farmer name — handles both flat field and nested object
  const farmerName = (c) => c.farmerName || c.farmer?.name || "Local Farmer";

  return (
    <>
      <style>{DS_USER}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Marketplace</div>
          <h1 className="pg-title">🛒 Browse Fresh Produce</h1>
          <p className="pg-sub">Directly from local farmers — fresh, fair-priced, traceable.</p>
        </div>
        <div style={{ fontSize: 13, color: "var(--text2)", fontWeight: 600, background: "rgba(14,165,233,0.07)", border: "1px solid #e2e8f0", padding: "6px 14px", borderRadius: 10 }}>
          {filtered.length} listing{filtered.length !== 1 ? "s" : ""} found
        </div>
      </div>

      {/* Toast notification */}
      {toast && <div className="cart-toast">{toast}</div>}

      {/* Search + Sort */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <input
          className="field-input"
          placeholder="🔍 Search products or location…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        <select className="field-input" style={{ maxWidth: 210, cursor: "pointer" }} value={sort} onChange={e => setSort(e.target.value)}>
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

      {loading && <div className="loading-wrap"><div className="spinner" /><span>Loading fresh produce…</span></div>}

      {/* API error state */}
      {!loading && apiError && (
        <div className="empty-state">
          <div className="empty-emoji"><AlertTriangle size={40} strokeWidth={1.5} color="#fde68a" /></div>
          <div className="empty-title">Could not load marketplace</div>
          <div className="empty-sub">Check your connection or try again.</div>
          <button className="btn-cyan" onClick={loadCrops} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><RefreshCw size={13} strokeWidth={2} /> Retry</button>
        </div>
      )}

      {!loading && !apiError && filtered.length === 0 && crops.length === 0 && (
        <div className="empty-state">
          <div className="empty-emoji"><Sprout size={40} strokeWidth={1.5} color="#bae6fd" /></div>
          <div className="empty-title">No products listed yet</div>
          <div className="empty-sub">Farmers haven't listed any crops yet. Check back soon!</div>
        </div>
      )}

      {!loading && !apiError && filtered.length === 0 && crops.length > 0 && (
        <div className="empty-state">
          <div className="empty-emoji"><Search size={40} strokeWidth={1.5} color="#bae6fd" /></div>
          <div className="empty-title">No products found</div>
          <div className="empty-sub">Try a different category or search term.</div>
          <button className="btn-ghost" onClick={() => { setSearch(""); setCategory("all"); }}>Reset Filters</button>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="prod-grid">
          {filtered.map(c => (
            <div key={c._id} className="prod-card">
              {/* Image area */}
              <div style={{ position: "relative" }}>
                {c.image?.url || c.imageUrl
                  ? <img src={c.image?.url || c.imageUrl} alt={c.name} className="prod-img" />
                  : <div className="prod-ph">{catEmoji(c.category)}</div>
                }
                {/* Wishlist */}
                <button
                  onClick={() => toggleWishlist(c._id)}
                  style={{ position: "absolute", top: 10, right: 10, width: 34, height: 34, borderRadius: "50%", background: "rgba(0,0,0,0.55)", border: "none", cursor: "pointer", fontSize: 16, backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center" }}
                  title={wishlist.includes(c._id) ? "Remove from wishlist" : "Save to wishlist"}
                >
                  {wishlist.includes(c._id) ? "❤️" : "🤍"}
                </button>
                {/* Fresh badge */}
                <span style={{ position: "absolute", top: 10, left: 10, fontSize: 10, fontWeight: 700, background: "rgba(34,197,94,0.88)", color: "#0f172a", padding: "3px 8px", borderRadius: 6 }}>🌿 FRESH</span>
              </div>

              {/* Card body */}
              <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                  <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 15 }}>{c.name}</div>
                  {stockBadge(c.quantity)}
                </div>

                <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 10 }}>
                  📍 {c.location} &nbsp;·&nbsp; 🌾 {farmerName(c)}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12, marginTop: "auto" }}>
                  <div>
                    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color: "#0ea5e9" }}>₹{c.price}</div>
                    <div style={{ fontSize: 11, color: "var(--text2)" }}>per {c.unit} · {c.quantity} {c.unit} avail.</div>
                  </div>
                </div>

                {/* Quantity selector + Add to Cart */}
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div className="qty-ctrl">
                    <button className="qty-btn" onClick={() => setQty(c._id, -1, c.quantity)}>−</button>
                    <span style={{ color: "#0f172a", fontWeight: 800, fontSize: 14, minWidth: 24, textAlign: "center" }}>{getQty(c._id)}</span>
                    <button className="qty-btn" onClick={() => setQty(c._id, 1, c.quantity)} disabled={getQty(c._id) >= c.quantity}>+</button>
                    <span style={{ fontSize: 11, color: "var(--text2)", marginLeft: 2 }}>{c.unit}</span>
                  </div>
                  <button
                    onClick={() => addToCart(c)}
                    className="btn-cyan"
                    style={{ flex: 1, justifyContent: "center", fontSize: 13, padding: "9px 12px" }}
                    disabled={!c.quantity || c.quantity === 0}
                  >
                    🛒 Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
