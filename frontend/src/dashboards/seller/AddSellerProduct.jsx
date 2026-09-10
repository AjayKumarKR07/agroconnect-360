import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../config/api";
import { DS } from "../../styles/ds";

const CATEGORIES = ["vegetables", "fruits", "grains", "spices", "dairy", "poultry", "other"];
const UNITS = ["kg", "quintal", "ton"];


export default function AddSellerProduct() {
  const navigate = useNavigate();
  const token = localStorage.getItem("agroconnect_token");
  const [form, setForm] = useState({ name: "", category: "vegetables", price: "", unit: "kg", stock: "", description: "", status: "active" });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name || !form.price || !form.stock) { setError("Name, price and stock are required."); return; }
    setSaving(true); setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (image) fd.append("image", image);
      const r = await fetch(`${API_URL}/api/seller/products`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Failed to add product");
      navigate("/seller/products");
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <>
      <style>{DS}</style>
      <div className="pg-head">
        <div>
          <div className="eyebrow">Inventory</div>
          <h1 className="pg-title">➕ Add New Product</h1>
          <p className="pg-sub">List a new product on the AgroConnect marketplace.</p>
        </div>
        <button className="btn-ghost" onClick={() => navigate("/seller/products")}>← Back</button>
      </div>

      <div style={{ maxWidth: 700 }}>
        <div className="card">
          {error && <div className="alert-error" style={{ marginBottom: 20 }}>⚠️ {error}</div>}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Image */}
            <div>
              <label className="field-label">Product Photo</label>
              {preview
                ? <div style={{ position: "relative" }}>
                    <img src={preview} alt="preview" style={{ width: "100%", height: 200, objectFit: "cover", borderRadius: 12, border: "1px solid var(--border)" }} />
                    <button type="button" onClick={() => { setImage(null); setPreview(""); }} style={{ position: "absolute", top: 8, right: 8, background: "rgba(239,68,68,0.85)", border: "none", borderRadius: 8, padding: "4px 10px", color: "#0f172a", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>✕ Remove</button>
                  </div>
                : <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "28px 16px", borderRadius: 12, border: "2px dashed var(--border2)", background: "var(--surface)", cursor: "pointer" }}>
                    <span style={{ fontSize: 40 }}>📸</span>
                    <span style={{ fontSize: 13, color: "var(--text2)" }}>Click to upload product image</span>
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) { setImage(f); setPreview(URL.createObjectURL(f)); } }} />
                  </label>
              }
            </div>

            {/* Name */}
            <div>
              <label className="field-label">Product Name *</label>
              <input name="name" className="field-input" required value={form.name} onChange={handleChange} placeholder="e.g. Fresh Tomatoes, Basmati Rice" />
            </div>

            {/* Category + Unit */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label className="field-label">Category *</label>
                <select name="category" className="field-input" value={form.category} onChange={handleChange} style={{ cursor: "pointer" }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Unit *</label>
                <select name="unit" className="field-input" value={form.unit} onChange={handleChange} style={{ cursor: "pointer" }}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            {/* Price + Stock */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label className="field-label">Price (₹ per {form.unit}) *</label>
                <input name="price" type="number" min="0" className="field-input" required value={form.price} onChange={handleChange} placeholder="e.g. 45" />
              </div>
              <div>
                <label className="field-label">Stock Available *</label>
                <input name="stock" type="number" min="0" className="field-input" required value={form.stock} onChange={handleChange} placeholder={`in ${form.unit}`} />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="field-label">Description</label>
              <textarea name="description" className="field-input" rows={3} value={form.description} onChange={handleChange} placeholder="Quality, origin, usage, certifications…" style={{ resize: "vertical" }} />
            </div>

            {/* Status */}
            <div>
              <label className="field-label">Listing Status</label>
              <div style={{ display: "flex", gap: 10 }}>
                {["active", "inactive"].map(s => (
                  <div key={s} onClick={() => setForm(p => ({ ...p, status: s }))} style={{ flex: 1, padding: "12px", borderRadius: 12, border: `1px solid ${form.status === s ? "rgba(167,139,250,0.3)" : "var(--border)"}`, background: form.status === s ? "rgba(167,139,250,0.08)" : "var(--surface)", cursor: "pointer", textAlign: "center", fontWeight: 700, fontSize: 14, color: form.status === s ? "#a78bfa" : "var(--text2)", transition: "all 0.2s" }}>
                    {s === "active" ? "✅ Active" : "⏸️ Inactive"}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, paddingTop: 8 }}>
              <button type="button" className="btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={() => navigate("/seller/products")}>Cancel</button>
              <button type="submit" className="btn-green" disabled={saving} style={{ flex: 2, justifyContent: "center", background: "linear-gradient(135deg,#7c3aed,#a78bfa)" }}>
                {saving ? "💾 Saving…" : "💾 Add Product"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
