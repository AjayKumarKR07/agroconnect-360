import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../config/api";
import { DS } from "../../styles/ds";

const CATEGORIES = ["Vegetables","Fruits","Grains","Pulses","Oilseeds","Spices","Flowers","Other"];
const UNITS = ["kg","quintal","ton"];

export default function AddCrop() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:"", category:"", quantity:"", unit:"kg", price:"", location:"", sowingDate:"", harvestDate:"", description:"", status:"listed" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg","image/png","image/webp"].includes(file.type)) { setError("Please select a JPG, PNG or WEBP image."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Image must be smaller than 5 MB."); return; }
    setError("");
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => { if (imagePreview) URL.revokeObjectURL(imagePreview); setImage(null); setImagePreview(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const token = localStorage.getItem("agroconnect_token");
      if (!token) { navigate("/login", { replace: true }); return; }
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (image) fd.append("image", image);
      const r = await fetch(`${API_URL}/api/crops`, { method:"POST", headers:{ Authorization:`Bearer ${token}` }, body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Unable to add crop");
      navigate("/farmer/crops", { replace: true });
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <>
      <style>{DS + `
        .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
        .form-group{display:flex;flex-direction:column;gap:6px;}
        .form-group.full{grid-column:1/-1;}
        @media(max-width:640px){.form-grid{grid-template-columns:1fr;}}
      `}</style>

      <button onClick={() => navigate("/farmer/crops")} className="btn-ghost" style={{ marginBottom: 24, fontSize: 13 }}>← Back to My Crops</button>

      <div className="pg-head" style={{ marginBottom: 28 }}>
        <div>
          <div className="eyebrow">Farm Management</div>
          <h1 className="pg-title">🌱 Add New Crop</h1>
          <p className="pg-sub">List your agricultural produce for direct sale to buyers.</p>
        </div>
      </div>

      {error && <div className="alert-error">⚠️ {error}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>
          {/* Left — form fields */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 20 }}>📋 Crop Details</div>
            <div className="form-grid">
              <div className="form-group">
                <label className="field-label">Crop Name *</label>
                <input name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Tomato, Wheat, Onion" className="field-input" />
              </div>
              <div className="form-group">
                <label className="field-label">Category *</label>
                <select name="category" value={form.category} onChange={handleChange} required className="field-input field-select">
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="field-label">Quantity *</label>
                <input name="quantity" type="number" min="0" value={form.quantity} onChange={handleChange} required placeholder="e.g. 500" className="field-input" />
              </div>
              <div className="form-group">
                <label className="field-label">Unit *</label>
                <select name="unit" value={form.unit} onChange={handleChange} required className="field-input field-select">
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="field-label">Price per Unit (₹) *</label>
                <input name="price" type="number" min="0" value={form.price} onChange={handleChange} required placeholder="e.g. 25" className="field-input" />
              </div>
              <div className="form-group">
                <label className="field-label">Location / Mandi *</label>
                <input name="location" value={form.location} onChange={handleChange} required placeholder="e.g. Bangarpet, Karnataka" className="field-input" />
              </div>
              <div className="form-group">
                <label className="field-label">Sowing Date</label>
                <input name="sowingDate" type="date" value={form.sowingDate} onChange={handleChange} className="field-input" />
              </div>
              <div className="form-group">
                <label className="field-label">Expected Harvest Date</label>
                <input name="harvestDate" type="date" value={form.harvestDate} onChange={handleChange} className="field-input" />
              </div>
              <div className="form-group">
                <label className="field-label">Listing Status *</label>
                <select name="status" value={form.status} onChange={handleChange} required className="field-input field-select">
                  <option value="listed">🟢 Listed — Visible to buyers now</option>
                  <option value="growing">🌱 Growing — Not yet ready</option>
                  <option value="ready">⚡ Ready — Harvested, listing soon</option>
                </select>
              </div>
              <div className="form-group full">
                <label className="field-label">Description</label>
                <textarea name="description" rows={4} value={form.description} onChange={handleChange} placeholder="Describe quality, variety, growing conditions…" className="field-input" style={{ resize: "vertical" }} />
              </div>
            </div>
          </div>

          {/* Right — image + submit */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card">
              <div className="card-title" style={{ marginBottom: 16 }}>📸 Crop Photo</div>
              {imagePreview ? (
                <div style={{ position: "relative" }}>
                  <img src={imagePreview} alt="Preview" style={{ width: "100%", height: 200, objectFit: "cover", borderRadius: 12, border: "1px solid var(--border)" }} />
                  <button type="button" onClick={removeImage} style={{ position: "absolute", top: 8, right: 8, background: "rgba(239,68,68,0.9)", border: "none", borderRadius: 8, padding: "4px 10px", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>✕ Remove</button>
                </div>
              ) : (
                <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "32px 16px", borderRadius: 12, border: "2px dashed var(--border2)", background: "var(--surface)", cursor: "pointer", transition: "border-color 0.2s" }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(34,197,94,0.35)"}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border2)"}
                >
                  <span style={{ fontSize: 40 }}>📷</span>
                  <span style={{ fontSize: 14, color: "var(--text2)", textAlign: "center" }}>Click to upload crop photo<br /><span style={{ fontSize: 12 }}>JPG, PNG, WEBP — max 5MB</span></span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} style={{ display: "none" }} />
                </label>
              )}
            </div>

            <div className="card" style={{ background: "rgba(34,197,94,0.04)", borderColor: "rgba(34,197,94,0.15)" }}>
              <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7 }}>
                <strong style={{ color: "#4ade80" }}>💡 Tips for better listings:</strong><br />
                • Use clear, daylight photos<br />
                • Set competitive prices using the Price Prediction tool<br />
                • Add accurate location for local buyers to find you
              </div>
            </div>

            <button type="submit" className="btn-green" disabled={loading} style={{ width: "100%", justifyContent: "center", padding: "16px" }}>
              {loading ? <><span style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} /> Publishing…</> : "🌱 Publish Crop Listing"}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
