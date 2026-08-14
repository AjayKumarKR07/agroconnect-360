import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../../config/api";
import { DS } from "../../styles/ds";

const Skel = () => (
  <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, overflow: "hidden" }}>
    <div style={{ height: 180, background: "linear-gradient(90deg,rgba(167,139,250,0.06) 25%,rgba(167,139,250,0.12) 50%,rgba(167,139,250,0.06) 75%)", backgroundSize: "200% 100%", animation: "sklShimmer 1.6s ease infinite" }} />
    <div style={{ padding: "16px 18px" }}>
      {["70%","50%","40%"].map((w,i) => <div key={i} style={{ height: 14, width: w, borderRadius: 6, background: "rgba(167,139,250,0.08)", marginBottom: 10 }} />)}
    </div>
  </div>
);

export default function SellerProducts() {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [search,   setSearch]   = useState("");
  const [deleting, setDeleting] = useState(null);
  const token = localStorage.getItem("agroconnect_token");
  const navigate = useNavigate();

  const fetchProducts = async () => {
    setLoading(true); setError(null);
    try {
      const r = await fetch(`${API_URL}/api/seller/products`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (d.success) setProducts(d.products || []);
      else setError(d.message || "Unable to load products");
    } catch { setError("Network error — could not reach the server"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, []);

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    setDeleting(id);
    try {
      const r = await fetch(`${API_URL}/api/seller/products/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) setProducts(prev => prev.filter(p => p._id !== id));
    } catch (e) { alert("Delete failed. Try again."); }
    finally { setDeleting(null); }
  };

  const filtered = products.filter(p => !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <style>{DS + `
        @keyframes sklShimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
        .prod-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px,1fr)); gap: 16px; }
        .prod-card { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; overflow: hidden; transition: transform 0.2s, border-color 0.2s; }
        .prod-card:hover { transform: translateY(-3px); border-color: rgba(167,139,250,0.25); }
        .prod-img { width: 100%; height: 180px; object-fit: cover; }
        .prod-img-placeholder { width: 100%; height: 180px; background: linear-gradient(135deg, rgba(124,58,237,0.1), rgba(167,139,250,0.05)); display: flex; align-items: center; justify-content: center; font-size: 52px; }
        .prod-body { padding: 16px 18px; }
        .prod-name { font-weight: 800; font-size: 16px; color: #fff; margin-bottom: 4px; }
        .prod-cat { font-size: 12px; color: var(--text2); margin-bottom: 10px; }
        .prod-price { font-family: 'Space Grotesk',sans-serif; font-size: 22px; font-weight: 800; color: #a78bfa; }
        .prod-unit { font-size: 11px; color: var(--text2); }
        .prod-actions { display: flex; gap: 8px; margin-top: 14px; }
      `}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Inventory</div>
          <h1 className="pg-title">🛍️ My Products</h1>
          <p className="pg-sub">Manage your listed products and inventory.</p>
        </div>
        <Link to="/seller/products/add" className="btn-green" style={{ background: "linear-gradient(135deg,#7c3aed,#a78bfa)", boxShadow: "0 4px 14px rgba(167,139,250,0.3)" }}>➕ Add Product</Link>
      </div>

      {/* Search + count */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, alignItems: "center" }}>
        <input className="field-input" placeholder="🔍 Search products…" value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 320 }} />
        {search && <button className="btn-ghost" onClick={() => setSearch("")}>✕ Clear</button>}
        <div style={{ marginLeft: "auto", fontSize: 13, color: "var(--text2)" }}>{filtered.length} products</div>
      </div>

      {loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
          {[1,2,3,4,5,6].map(i => <Skel key={i} />)}
        </div>
      )}

      {error && !loading && (
        <div className="card" style={{ marginBottom: 24, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <span style={{ color: "#f87171", fontWeight: 600, fontSize: 14 }}>Unable to load products — {error}</span>
            </div>
            <button onClick={fetchProducts} className="btn-ghost" style={{ fontSize: 13, padding: "8px 16px" }}>🔄 Retry</button>
          </div>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="card empty-state">
          <div className="empty-emoji">🛍️</div>
          <div className="empty-title">{search ? `No results for "${search}"` : "No products listed yet"}</div>
          <div className="empty-sub">Add your first product to start selling.</div>
          {!search && <Link to="/seller/products/add" className="btn-green">➕ Add First Product</Link>}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="prod-grid">
          {filtered.map(p => (
            <div key={p._id} className="prod-card">
              {p.imageUrl
                ? <img src={p.imageUrl} alt={p.name} className="prod-img" />
                : <div className="prod-img-placeholder">{p.category === "vegetables" ? "🥬" : p.category === "fruits" ? "🍎" : p.category === "grains" ? "🌾" : "🛍️"}</div>
              }
              <div className="prod-body">
                <div className="prod-name">{p.name}</div>
                <div className="prod-cat">{p.category} · {p.stock} {p.unit} in stock</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <div>
                    <div className="prod-price">₹{Number(p.price).toLocaleString("en-IN")}</div>
                    <div className="prod-unit">per {p.unit}</div>
                  </div>
                  <span style={{
                    fontSize: 11, padding: "4px 10px", borderRadius: 8, fontWeight: 700,
                    ...(p.status === "listed"  ? { background: "rgba(34,197,94,0.1)",   color: "#4ade80" } :
                        p.status === "ready"   ? { background: "rgba(56,189,248,0.1)",  color: "#38bdf8" } :
                        p.status === "growing" ? { background: "rgba(251,191,36,0.1)",  color: "#fbbf24" } :
                        p.status === "sold"    ? { background: "rgba(148,163,184,0.1)", color: "#94a3b8" } :
                                                 { background: "rgba(167,139,250,0.1)", color: "#a78bfa" }),
                  }}>
                    {p.status === "listed"  ? "✅ Listed"  :
                     p.status === "ready"   ? "🔵 Ready"   :
                     p.status === "growing" ? "🌱 Growing" :
                     p.status === "sold"    ? "📦 Sold"    :
                     p.status || "Unknown"}
                  </span>
                </div>
                <div className="prod-actions">
                  <button className="btn-ghost" style={{ flex: 1, justifyContent: "center", fontSize: 12 }} onClick={() => navigate(`/seller/products/${p._id}/edit`)}>✏️ Edit</button>
                  <button className="btn-del" disabled={deleting === p._id} style={{ flex: 1, justifyContent: "center", fontSize: 12, padding: "8px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.06)", color: "#f87171", cursor: "pointer", fontFamily: "'Inter',sans-serif", fontWeight: 700 }} onClick={() => deleteProduct(p._id)}>
                    {deleting === p._id ? "⏳" : "🗑️ Delete"}
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
