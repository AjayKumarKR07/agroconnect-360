import { useEffect, useState, useCallback } from "react";
import { API_URL } from "../../config/api";
import { DS } from "../../styles/ds";
import { Tractor, Tag, User, MapPin, Landmark, Globe, Maximize2, Layers, Droplets, Droplet, Wheat, RotateCcw, Calendar, Edit3, Save, CheckCircle2, AlertTriangle, Lightbulb, RefreshCw } from "lucide-react";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("agroconnect_token")}`,
  "Content-Type": "application/json",
});

const SOIL_TYPES   = ["Loamy", "Clay", "Sandy", "Black Soil", "Red Soil", "Other"];
const IRRIGATION   = ["Available", "Limited", "Rainfed"];
const WATER_SOURCE = ["Borewell", "Canal", "Rainwater", "Other"];
const SEASONS      = ["Current Season", "Kharif", "Rabi", "Zaid"];
const AREA_UNITS   = ["Acre", "Hectare"];

export default function MyFarm() {
  const user     = JSON.parse(localStorage.getItem("agroconnect_user") || "{}");
  const [farm, setFarm]       = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({});
  const [saving, setSaving]   = useState(false);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");
  const [error, setError]     = useState("");

  const loadFarm = useCallback(() => {
    fetch(`${API_URL}/api/profile/farm`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => {
        if (d.farm) { setFarm(d.farm); setForm(d.farm); }
        else setError(d.message || "Unable to load farm details");
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadFarm(); }, [loadFarm]);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async e => {
    e.preventDefault();
    setSaving(true); setError(""); setSuccess("");
    try {
      const r = await fetch(`${API_URL}/api/profile/farm`, {
        method: "PUT", headers: authHeaders(), body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Save failed");
      setFarm(d.farm);
      setSuccess("Farm details saved successfully!");
      setEditing(false);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const farmComplete = farm && farm.farmArea && farm.soilType && farm.district;

  return (
    <>
      <style>{DS + `
        .mf-hero { background:linear-gradient(135deg,rgba(22,163,74,0.12),rgba(5,150,105,0.06)); border:1px solid rgba(34,197,94,0.15); border-radius:20px; padding:28px 32px; margin-bottom:24px; display:flex; align-items:center; gap:24px; }
        .mf-farm-icon { width:80px; height:80px; border-radius:20px; background:linear-gradient(135deg,#16a34a,#059669); display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 8px 24px rgba(34,197,94,0.3); }
        .mf-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:14px; }
        .mf-field-card { background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:16px; }
        .mf-field-lbl { font-size:10px; font-weight:700; color:var(--text2); text-transform:uppercase; letter-spacing:.06em; margin-bottom:6px; }
        .mf-field-val { font-size:15px; font-weight:700; color:#0f172a; }
        .mf-field-val.empty { color:var(--text2); font-weight:400; font-style:italic; }
        .mf-form-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:16px; }
        .mf-completion { display:flex; align-items:center; gap:12px; padding:12px 16px; border-radius:12px; margin-bottom:20px; }
      `}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Farm Management</div>
          <h1 className="pg-title"><Tractor size={22} strokeWidth={2} style={{ marginRight: 8, color: "#16a34a", verticalAlign: "middle" }} />My Farm</h1>
          <p className="pg-sub">Manage your farm profile. This information is used across Smart Farm Planner and other tools.</p>
        </div>
        {!editing && farm && (
          <button className="btn-green" onClick={() => { setEditing(true); setSuccess(""); setError(""); }} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Edit3 size={14} /> Edit Farm Details
          </button>
        )}
      </div>

      {success && <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#15803d", fontSize: 14, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}><CheckCircle2 size={16} color="#15803d" /> {success}</div>}
      {error   && <div className="alert-error" style={{ display: "flex", alignItems: "center", gap: 8 }}><AlertTriangle size={16} /> {error}</div>}

      {loading ? (
        <div className="loading-wrap"><div className="spinner" /><span>Loading farm details…</span></div>
      ) : editing ? (
        /* ── EDIT FORM ── */
        <div className="card">
          <div className="card-title" style={{ marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
            <Edit3 size={16} color="#16a34a" /> Edit Farm Details
          </div>
          <p className="card-sub" style={{ marginBottom: 24 }}>All fields are optional. Saved data auto-fills the Smart Farm Planner.</p>
          <form onSubmit={handleSave}>
            <div className="mf-form-grid">
              <div>
                <label className="field-label">Farm Name</label>
                <input name="farmName" value={form.farmName || ""} onChange={handleChange} className="field-input" placeholder="e.g. Green Valley Farm" />
              </div>
              <div>
                <label className="field-label">Farm Area</label>
                <input name="farmArea" type="number" step="0.1" min="0.1" value={form.farmArea || ""} onChange={handleChange} className="field-input" placeholder="e.g. 2.5" />
              </div>
              <div>
                <label className="field-label">Area Unit</label>
                <select name="areaUnit" value={form.areaUnit || "Acre"} onChange={handleChange} className="field-input field-select">
                  {AREA_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Soil Type</label>
                <select name="soilType" value={form.soilType || ""} onChange={handleChange} className="field-input field-select">
                  <option value="">Select soil type</option>
                  {SOIL_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Irrigation Availability</label>
                <select name="irrigation" value={form.irrigation || ""} onChange={handleChange} className="field-input field-select">
                  <option value="">Select irrigation</option>
                  {IRRIGATION.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Water Source</label>
                <select name="waterSource" value={form.waterSource || ""} onChange={handleChange} className="field-input field-select">
                  <option value="">Select water source</option>
                  {WATER_SOURCE.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Current Season</label>
                <select name="season" value={form.season || ""} onChange={handleChange} className="field-input field-select">
                  <option value="">Select season</option>
                  {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Previous Crop</label>
                <input name="previousCrop" value={form.previousCrop || ""} onChange={handleChange} className="field-input" placeholder="e.g. Tomato" />
              </div>
              <div>
                <label className="field-label">Farming Experience (years)</label>
                <input name="farmingExperience" type="number" min="0" value={form.farmingExperience || ""} onChange={handleChange} className="field-input" placeholder="e.g. 10" />
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button type="submit" className="btn-green" disabled={saving} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                {saving ? <><RefreshCw size={14} className="animate-spin" /> Saving…</> : <><Save size={14} /> Save Farm Details</>}
              </button>
              <button type="button" className="btn-ghost" onClick={() => { setEditing(false); setForm(farm); setError(""); }}>Cancel</button>
            </div>
          </form>
        </div>
      ) : (
        /* ── VIEW MODE ── */
        <>
          {/* Hero */}
          <div className="mf-hero">
            <div className="mf-farm-icon">
              <Tractor size={38} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 800, color: "#0f172a" }}>
                {farm?.farmName || `${user.name || "My"}'s Farm`}
              </div>
              <div style={{ color: "var(--text2)", marginTop: 4, fontSize: 14 }}>
                {[farm?.district, farm?.state].filter(Boolean).join(", ") || "Location not set"}
                {farm?.farmArea ? ` · ${farm.farmArea} ${farm.areaUnit}` : ""}
              </div>
              {farmComplete ? (
                <span className="badge badge-green" style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <CheckCircle2 size={13} /> Farm Profile Complete
                </span>
              ) : (
                <span className="badge badge-amber" style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <AlertTriangle size={13} /> Complete your farm profile for better recommendations
                </span>
              )}
            </div>
          </div>

          {/* Field grid */}
          <div className="mf-grid">
            {[
              { Icon: Tag,       label: "Farm Name",          value: farm?.farmName          || null,  placeholder: "e.g. Green Valley Farm" },
              { Icon: User,      label: "Farmer Name",        value: farm?.name              || null,  placeholder: "Set in Profile" },
              { Icon: MapPin,    label: "Location",           value: farm?.location          || null,  placeholder: "Set in Profile" },
              { Icon: Landmark,  label: "State",              value: farm?.state             || null,  placeholder: "Set in Profile" },
              { Icon: Globe,     label: "District",           value: farm?.district          || null,  placeholder: "Set in Profile" },
              { Icon: Maximize2, label: "Farm Area",          value: farm?.farmArea ? `${farm.farmArea} ${farm.areaUnit}` : null, placeholder: "Not set" },
              { Icon: Layers,    label: "Soil Type",          value: farm?.soilType          || null,  placeholder: "Not set" },
              { Icon: Droplets,  label: "Irrigation",         value: farm?.irrigation        || null,  placeholder: "Not set" },
              { Icon: Droplet,   label: "Water Source",       value: farm?.waterSource       || null,  placeholder: "Not set" },
              { Icon: Wheat,     label: "Current Season",     value: farm?.season            || null,  placeholder: "Not set" },
              { Icon: RotateCcw, label: "Previous Crop",      value: farm?.previousCrop      || null,  placeholder: "Not set" },
              { Icon: Calendar,  label: "Farming Experience", value: farm?.farmingExperience != null ? `${farm.farmingExperience} years` : null, placeholder: "Not set" },
            ].map(({ Icon, label, value, placeholder }) => (
              <div key={label} className="mf-field-card">
                <div className="mf-field-lbl" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Icon size={12} color="#16a34a" /> {label}
                </div>
                <div className={`mf-field-val ${!value ? "empty" : ""}`}>{value || placeholder}</div>
              </div>
            ))}
          </div>

          {/* Tip */}
          <div style={{ marginTop: 24, padding: "16px 20px", background: "#f0f9ff", border: "1px solid rgba(56,189,248,0.15)", borderRadius: 14, fontSize: 13, color: "var(--text2)", lineHeight: 1.7, display: "flex", alignItems: "flex-start", gap: 8 }}>
            <Lightbulb size={16} color="#0369a1" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong style={{ color: "#0369a1" }}>Tip:</strong> Once your farm details are saved, the Smart Farm Planner can auto-fill your location, soil type, irrigation, and more with a single click — saving you time every session.
            </div>
          </div>
        </>
      )}
    </>
  );
}
