import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../config/api";
import { DS } from "../../styles/ds";
import { ClipboardList, RefreshCw, User, Edit3, Save, CheckCircle2, AlertTriangle, LogOut, Mail, MapPin, Globe, Shield, Hash } from "lucide-react";

const token = () => localStorage.getItem("agroconnect_token");
const authH = () => ({ Authorization: `Bearer ${token()}`, "Content-Type": "application/json" });

export default function FarmerProfile() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("agroconnect_user") || "{}");

  const [form, setForm] = useState({
    name:     user.name     || "",
    phone:    user.phone    || "",
    district: user.district || "",
    state:    user.state    || "",
    location: user.location || "",
  });
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState("");
  const [error,   setError]   = useState("");

  // ── Dynamic state / district lists from APMC catalog ──────
  const [states,    setStates]    = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loadingS,  setLoadingS]  = useState(true);
  const [loadingD,  setLoadingD]  = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/prices/catalog/states`, { headers: authH() })
      .then(r => r.json())
      .then(d => { if (d.states?.length) setStates(d.states); })
      .catch(() => {})
      .finally(() => setLoadingS(false));
  }, []);

  // When state changes → load districts
  useEffect(() => {
    if (!form.state) { setDistricts([]); return; }
    setLoadingD(true);
    setDistricts([]);
    // Reset district only if user actively changes state (not on first load if district is pre-filled)
    fetch(`${API_URL}/api/prices/catalog/districts?state=${encodeURIComponent(form.state)}`, { headers: authH() })
      .then(r => r.json())
      .then(d => { if (d.districts?.length) setDistricts(d.districts); })
      .catch(() => {})
      .finally(() => setLoadingD(false));
  }, [form.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const sanitized = name === "phone"
      ? value.replace(/\D/g, "").slice(0, 10)
      : value;
    setForm(p => ({
      ...p,
      [name]: sanitized,
      // clear district when state changes
      ...(name === "state" ? { district: "" } : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(""); setSuccess("");
    try {
      const location = form.location?.trim()
        || [form.district?.trim(), form.state?.trim()].filter(Boolean).join(", ");
      const r = await fetch(`${API_URL}/api/profile/complete`, {
        method: "PUT",
        headers: authH(),
        body: JSON.stringify({ ...form, location, role: user.role }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Update failed");
      localStorage.setItem("agroconnect_user", JSON.stringify(d.user));
      setSuccess("Profile updated! District and state saved.");
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem("agroconnect_token");
    localStorage.removeItem("agroconnect_user");
    navigate("/login", { replace: true });
  };

  const initials  = (user.name || "F").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const ROLE_COLORS = { farmer: "#22c55e", seller: "#a78bfa", exporter: "#fb923c", admin: "#f43f5e", user: "#38bdf8" };
  const roleColor = ROLE_COLORS[user.role] || "#22c55e";

  return (
    <>
      <style>{DS + `
        .pf-avatar { width:88px; height:88px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-family:'Space Grotesk',sans-serif; font-size:32px; font-weight:800; color:#0f172a; flex-shrink:0; }
        .pf-grid   { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
        .pf-group  { display:flex; flex-direction:column; gap:6px; }
        .pf-group.full { grid-column:1/-1; }
        .pf-select { width:100%; background:var(--surface); border:1px solid var(--border2); border-radius:12px; padding:12px 16px; color:var(--text); font-size:14px; font-family:'Inter',sans-serif; outline:none; appearance:none; transition:border-color .2s,box-shadow .2s; }
        .pf-select:focus { border-color:rgba(34,197,94,.4); box-shadow:0 0 0 4px rgba(34,197,94,.07); }
        .pf-select option { background:#0d1f2d; color:#f0f6ff; }
        @media(max-width:600px){ .pf-grid{grid-template-columns:1fr;} .pf-group.full{grid-column:1;} }
      `}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Account Settings</div>
          <h1 className="pg-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <User size={24} color="#16a34a" /> My Profile
          </h1>
          <p className="pg-sub">Manage your personal information and account preferences.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>
        {/* Profile Form */}
        <div className="card">
          {/* Avatar row */}
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28, padding: "20px 24px", background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)" }}>
            <div className="pf-avatar" style={{ background: `linear-gradient(135deg,${roleColor},${roleColor}aa)`, boxShadow: `0 8px 24px ${roleColor}30` }}>
              {initials}
            </div>
            <div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color: "#0f172a" }}>{user.name || "Farmer"}</div>
              <div style={{ fontSize: 14, color: "var(--text2)", marginTop: 4 }}>{user.email}</div>
              <span className="badge" style={{ marginTop: 8, display: "inline-flex", background: `${roleColor}15`, color: roleColor, borderColor: `${roleColor}30` }}>
                ● {user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || "Farmer"}
              </span>
            </div>
          </div>

          <div className="card-title" style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
            <Edit3 size={16} color="#16a34a" /> Edit Information
          </div>

          {success && <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#15803d", fontSize: 14, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}><CheckCircle2 size={16} color="#15803d" /> {success}</div>}
          {error   && <div className="alert-error" style={{ display: "flex", alignItems: "center", gap: 8 }}><AlertTriangle size={16} /> {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="pf-grid">
              {/* Full Name */}
              <div className="pf-group full">
                <label className="field-label">Full Name</label>
                <input name="name" value={form.name} onChange={handleChange} required className="field-input" />
              </div>

              {/* Phone */}
              <div className="pf-group">
                <label className="field-label">Mobile Number</label>
                <input name="phone" type="tel" value={form.phone} onChange={handleChange} className="field-input" placeholder="9876543210" maxLength={10} />
              </div>

              {/* State — dynamic from APMC catalog */}
              <div className="pf-group">
                <label className="field-label">
                  State <span style={{ color: "#15803d" }}>*</span>
                  {loadingS && <span style={{ color: "var(--text2)", fontWeight: 400, marginLeft: 6 }}>loading…</span>}
                </label>
                <select
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  className="pf-select"
                  required
                >
                  <option value="">— Select State —</option>
                  {states.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* District — dynamic based on selected state */}
              <div className="pf-group">
                <label className="field-label">
                  District <span style={{ color: "#15803d" }}>*</span>
                  {loadingD && <span style={{ color: "var(--text2)", fontWeight: 400, marginLeft: 6 }}>loading…</span>}
                </label>
                {districts.length > 0 ? (
                  <select name="district" value={form.district} onChange={handleChange} className="pf-select" required>
                    <option value="">— Select District —</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                ) : (
                  <input
                    name="district"
                    value={form.district}
                    onChange={handleChange}
                    className="field-input"
                    placeholder={form.state ? (loadingD ? "Loading districts…" : "Type district name") : "Select a state first"}
                    required
                  />
                )}
              </div>

              {/* Email (read-only) */}
              <div className="pf-group full">
                <label className="field-label">Email Address</label>
                <input value={user.email || ""} disabled className="field-input" style={{ opacity: 0.5, cursor: "not-allowed" }} />
              </div>
            </div>

            <button type="submit" className="btn-green" disabled={saving} style={{ marginTop: 20, minWidth: 160, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {saving ? <><RefreshCw size={15} /> Saving…</> : <><Save size={15} /> Save Changes</>}
            </button>
          </form>
        </div>

        {/* Right panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Account info */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}><ClipboardList size={15} strokeWidth={1.75} style={{ marginRight: 6, color: "#16a34a", verticalAlign: "middle" }} />Account Info</div>
            {[
              { Icon: Hash, label: "User ID",  val: user.id || user._id || "—" },
              { Icon: Mail, label: "Email",    val: user.email    || "—" },
              { Icon: MapPin, label: "District", val: user.district || "—" },
              { Icon: Globe, label: "State",    val: user.state    || "—" },
              { Icon: Shield, label: "Role",     val: user.role     || "farmer" },
              { Icon: CheckCircle2, label: "Profile",  val: user.profileCompleted ? "Complete" : "Incomplete" },
            ].map(({ Icon, label, val }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                <span style={{ color: "var(--text2)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Icon size={14} color="#16a34a" /> {label}
                </span>
                <span style={{ fontWeight: 600, color: "#0f172a", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", textAlign: "right" }}>{val}</span>
              </div>
            ))}
          </div>

          {/* Change role */}
          <div className="card" style={{ borderColor: "rgba(56,189,248,0.15)" }}>
            <div className="card-title" style={{ marginBottom: 10 }}><RefreshCw size={15} strokeWidth={1.75} style={{ marginRight: 6, color: "#16a34a", verticalAlign: "middle" }} />Switch Role</div>
            <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 14, lineHeight: 1.6 }}>Want to use AgroConnect as a different user? Switch your role here.</p>
            <button className="btn-ghost" style={{ width: "100%", justifyContent: "center", display: "inline-flex", alignItems: "center", gap: 8, color: "#0369a1", borderColor: "rgba(56,189,248,0.2)" }} onClick={() => navigate("/select-role", { state: { isNewUser: false } })}>
              <RefreshCw size={14} /> Change My Role
            </button>
          </div>

          {/* Danger zone */}
          <div className="card" style={{ borderColor: "rgba(239,68,68,0.15)" }}>
            <div style={{ fontWeight: 700, color: "#dc2626", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={16} color="#dc2626" /> Danger Zone
            </div>
            <button
              onClick={handleLogout}
              style={{ width: "100%", justifyContent: "center", display: "inline-flex", alignItems: "center", gap: 8, padding: "12px", borderRadius: 12, border: "1px solid rgba(239,68,68,0.2)", background: "#fef2f2", color: "#dc2626", cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "'Inter',sans-serif", transition: "background 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.12)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.06)"}
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
