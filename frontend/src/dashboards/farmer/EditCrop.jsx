import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_URL } from "../../config/api";
import { DS } from "../../styles/ds";

const CATEGORIES = ["Vegetables","Fruits","Grains","Pulses","Oilseeds","Spices","Flowers","Other"];
const UNITS = ["kg","quintal","ton"];
const STATUSES = ["growing","ready","listed","sold"];

export default function EditCrop() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState({ name:"", category:"", quantity:"", unit:"kg", price:"", location:"", sowingDate:"", harvestDate:"", description:"", status:"growing" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("agroconnect_token");
    fetch(`${API_URL}/api/crops/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (!d.crop) throw new Error(d.message || "Unable to load crop");
        const c = d.crop;
        setForm({ name:c.name||"", category:c.category||"", quantity:c.quantity??"", unit:c.unit||"kg", price:c.price??"", location:c.location||"", sowingDate:c.sowingDate?c.sowingDate.split("T")[0]:"", harvestDate:c.harvestDate?c.harvestDate.split("T")[0]:"", description:c.description||"", status:c.status||"growing" });
        if (c.image?.url) setImagePreview(c.image.url);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg","image/png","image/webp"].includes(file.type)) { setError("Please select a JPG, PNG or WEBP image."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Image must be smaller than 5 MB."); return; }
    setImage(file); setImagePreview(URL.createObjectURL(file)); setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const token = localStorage.getItem("agroconnect_token");
      const r = await fetch(`${API_URL}/api/crops/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, quantity: Number(form.quantity), price: Number(form.price) }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Unable to update crop");
      navigate("/farmer/crops", { replace: true });
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
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
          <h1 className="pg-title">✏️ Edit Crop Listing</h1>
          <p className="pg-sub">Update your crop details and pricing.</p>
        </div>
      </div>

      {error && <div className="alert-error">⚠️ {error}</div>}

      {loading ? (
        <div className="loading-wrap"><div className="spinner" /><span>Loading crop…</span></div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>
            {/* Fields */}
            <div className="card">
              <div className="card-title" style={{ marginBottom: 20 }}>📋 Crop Details</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="field-label">Crop Name *</label>
                  <input name="name" value={form.name} onChange={handleChange} required className="field-input" />
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
                  <input name="quantity" type="number" min="0" value={form.quantity} onChange={handleChange} required className="field-input" />
                </div>
                <div className="form-group">
                  <label className="field-label">Unit *</label>
                  <select name="unit" value={form.unit} onChange={handleChange} className="field-input field-select">
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="field-label">Price per Unit (₹) *</label>
                  <input name="price" type="number" min="0" value={form.price} onChange={handleChange} required className="field-input" />
                </div>
                <div className="form-group">
                  <label className="field-label">Status</label>
                  <select name="status" value={form.status} onChange={handleChange} className="field-input field-select">
                    {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="field-label">Location *</label>
                  <input name="location" value={form.location} onChange={handleChange} required className="field-input" />
                </div>
                <div className="form-group">
                  <label className="field-label">Sowing Date</label>
                  <input name="sowingDate" type="date" value={form.sowingDate} onChange={handleChange} className="field-input" />
                </div>
                <div className="form-group">
                  <label className="field-label">Harvest Date</label>
                  <input name="harvestDate" type="date" value={form.harvestDate} onChange={handleChange} className="field-input" />
                </div>
                <div className="form-group full">
                  <label className="field-label">Description</label>
                  <textarea name="description" rows={4} value={form.description} onChange={handleChange} className="field-input" style={{ resize: "vertical" }} />
                </div>
              </div>
            </div>

            {/* Image + save */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="card">
                <div className="card-title" style={{ marginBottom: 14 }}>📸 Crop Photo</div>
                {imagePreview ? (
                  <div style={{ position: "relative" }}>
                    <img src={imagePreview} alt="Preview" style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 10, border: "1px solid var(--border)" }} />
                    <button type="button" onClick={() => { setImage(null); setImagePreview(""); }} style={{ position: "absolute", top: 8, right: 8, background: "rgba(239,68,68,0.9)", border: "none", borderRadius: 8, padding: "4px 10px", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>✕</button>
                  </div>
                ) : (
                  <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "24px 12px", borderRadius: 10, border: "2px dashed var(--border2)", background: "var(--surface)", cursor: "pointer" }}>
                    <span style={{ fontSize: 36 }}>📷</span>
                    <span style={{ fontSize: 13, color: "var(--text2)", textAlign: "center" }}>Upload new photo</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} style={{ display: "none" }} />
                  </label>
                )}
              </div>

              <button type="submit" className="btn-green" disabled={saving} style={{ width: "100%", justifyContent: "center", padding: "16px" }}>
                {saving ? "💾 Saving…" : "💾 Save Changes"}
              </button>
              <button type="button" onClick={() => navigate("/farmer/crops")} className="btn-ghost" style={{ width: "100%", justifyContent: "center" }}>Cancel</button>
            </div>
          </div>
        </form>
      )}
    </>
  );
}