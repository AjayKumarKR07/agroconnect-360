import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../config/api";
import { DS } from "../../styles/ds";

const token = () => localStorage.getItem("agroconnect_token");
const authH = () => ({ Authorization: `Bearer ${token()}`, "Content-Type": "application/json" });

const AMBER = "#f59e0b";
const AMBER_DARK = "#b45309";
const AMBER_LIGHT = "#fbbf24";

const EXTRA_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');

  .pf-avatar {
    width: 88px; height: 88px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 32px; font-weight: 800; color: #fff; flex-shrink: 0;
  }

  .pf-grid   { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  .pf-group  { display: flex; flex-direction: column; gap: 6px; }
  .pf-group.full { grid-column: 1 / -1; }

  /* amber-themed select */
  .pf-select {
    width: 100%;
    background: var(--surface);
    border: 1px solid rgba(245,158,11,0.2);
    border-radius: 12px;
    padding: 12px 16px;
    color: var(--text);
    font-size: 14px;
    font-family: 'Inter', sans-serif;
    outline: none;
    appearance: none;
    transition: border-color .2s, box-shadow .2s;
  }
  .pf-select:focus {
    border-color: rgba(245,158,11,0.5);
    box-shadow: 0 0 0 4px rgba(245,158,11,0.08);
  }
  .pf-select option { background: #0d1f2d; color: #f0f6ff; }

  /* amber-themed text inputs override */
  .ep-input {
    width: 100%;
    box-sizing: border-box;
    background: var(--surface);
    border: 1px solid rgba(245,158,11,0.2);
    border-radius: 12px;
    padding: 12px 16px;
    color: var(--text);
    font-size: 14px;
    font-family: 'Inter', sans-serif;
    outline: none;
    transition: border-color .2s, box-shadow .2s;
  }
  .ep-input:focus {
    border-color: rgba(245,158,11,0.5);
    box-shadow: 0 0 0 4px rgba(245,158,11,0.08);
  }
  .ep-input:disabled { opacity: 0.45; cursor: not-allowed; }
  .ep-input::placeholder { color: rgba(255,255,255,0.22); }

  /* amber save button */
  .btn-amber {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 13px 28px; border-radius: 14px; border: none; cursor: pointer;
    font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 700;
    color: #fff;
    background: linear-gradient(135deg, ${AMBER_DARK}, ${AMBER});
    box-shadow: 0 6px 20px rgba(245,158,11,0.35);
    transition: all 0.2s;
  }
  .btn-amber:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 12px 32px rgba(245,158,11,0.45);
  }
  .btn-amber:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

  /* amber switch-role button */
  .btn-amber-ghost {
    width: 100%; display: flex; justify-content: center; align-items: center; gap: 8px;
    padding: 12px; border-radius: 12px; cursor: pointer;
    border: 1px solid rgba(245,158,11,0.25);
    background: rgba(245,158,11,0.06);
    color: ${AMBER_LIGHT};
    font-size: 14px; font-weight: 700;
    font-family: 'Inter', sans-serif;
    transition: all 0.2s;
  }
  .btn-amber-ghost:hover {
    background: rgba(245,158,11,0.12);
    border-color: rgba(245,158,11,0.4);
  }

  /* amber card accent */
  .card-amber { border-color: rgba(245,158,11,0.18) !important; }

  /* info row divider */
  .info-row {
    display: flex; justify-content: space-between;
    padding: 10px 0; border-bottom: 1px solid var(--border); font-size: 13px;
  }

  /* amber stat pill */
  .stat-pill {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 700;
    background: rgba(245,158,11,0.1);
    border: 1px solid rgba(245,158,11,0.2);
    color: ${AMBER_LIGHT};
  }

  @media(max-width:600px) {
    .pf-grid { grid-template-columns: 1fr; }
    .pf-group.full { grid-column: 1; }
  }
`;

export default function ExporterProfile() {
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

  useEffect(() => {
    if (!form.state) { setDistricts([]); return; }
    setLoadingD(true);
    setDistricts([]);
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
      setSuccess("✅ Profile updated successfully!");
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem("agroconnect_token");
    localStorage.removeItem("agroconnect_user");
    navigate("/login", { replace: true });
  };

  const initials = (user.name || "E").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
      <style>{DS + EXTRA_STYLES}</style>

      {/* Page header */}
      <div className="pg-head">
        <div>
          <div className="eyebrow" style={{ color: AMBER }}>Account Settings</div>
          <h1 className="pg-title" style={{ color: "#fff" }}>👤 My Profile</h1>
          <p className="pg-sub">Manage your personal information and export account preferences.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>

        {/* ── Left: Profile Form ── */}
        <div className="card card-amber">

          {/* Avatar row */}
          <div style={{
            display: "flex", alignItems: "center", gap: 20, marginBottom: 28,
            padding: "20px 24px",
            background: "rgba(245,158,11,0.04)",
            borderRadius: 16,
            border: `1px solid rgba(245,158,11,0.15)`,
          }}>
            <div
              className="pf-avatar"
              style={{
                background: `linear-gradient(135deg, ${AMBER_DARK}, ${AMBER})`,
                boxShadow: `0 8px 28px rgba(245,158,11,0.35)`,
              }}
            >
              {initials}
            </div>
            <div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color: "#fff" }}>
                {user.name || "Exporter"}
              </div>
              <div style={{ fontSize: 14, color: "var(--text2)", marginTop: 4 }}>{user.email}</div>
              <span style={{
                marginTop: 8, display: "inline-flex", alignItems: "center", gap: 5,
                padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                background: "rgba(245,158,11,0.12)",
                color: AMBER_LIGHT,
                border: `1px solid rgba(245,158,11,0.25)`,
              }}>
                🌍 {user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || "Exporter"}
              </span>
            </div>
          </div>

          <div className="card-title" style={{ marginBottom: 18, color: AMBER_LIGHT }}>✏️ Edit Information</div>

          {success && (
            <div style={{
              padding: "12px 16px", borderRadius: 12, marginBottom: 16,
              background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.25)",
              color: AMBER_LIGHT, fontSize: 14,
            }}>
              {success}
            </div>
          )}
          {error && <div className="alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="pf-grid">
              {/* Full Name */}
              <div className="pf-group full">
                <label className="field-label">Full Name</label>
                <input name="name" value={form.name} onChange={handleChange} required className="ep-input" />
              </div>

              {/* Phone */}
              <div className="pf-group">
                <label className="field-label">Mobile Number</label>
                <input name="phone" type="tel" value={form.phone} onChange={handleChange}
                  className="ep-input" placeholder="9876543210" maxLength={10} />
              </div>

              {/* State */}
              <div className="pf-group">
                <label className="field-label">
                  State <span style={{ color: AMBER }}>*</span>
                  {loadingS && <span style={{ color: "var(--text2)", fontWeight: 400, marginLeft: 6 }}>loading…</span>}
                </label>
                <select name="state" value={form.state} onChange={handleChange} className="pf-select" required>
                  <option value="">— Select State —</option>
                  {states.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* District */}
              <div className="pf-group">
                <label className="field-label">
                  District <span style={{ color: AMBER }}>*</span>
                  {loadingD && <span style={{ color: "var(--text2)", fontWeight: 400, marginLeft: 6 }}>loading…</span>}
                </label>
                {districts.length > 0 ? (
                  <select name="district" value={form.district} onChange={handleChange} className="pf-select" required>
                    <option value="">— Select District —</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                ) : (
                  <input
                    name="district" value={form.district} onChange={handleChange}
                    className="ep-input"
                    placeholder={form.state ? (loadingD ? "Loading districts…" : "Type district name") : "Select a state first"}
                    required
                  />
                )}
              </div>

              {/* Email (read-only) */}
              <div className="pf-group full">
                <label className="field-label">Email Address</label>
                <input value={user.email || ""} disabled className="ep-input" />
              </div>
            </div>

            <button type="submit" className="btn-amber" disabled={saving} style={{ marginTop: 20, minWidth: 160 }}>
              {saving ? "💾 Saving…" : "💾 Save Changes"}
            </button>
          </form>
        </div>

        {/* ── Right panel ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Account info card */}
          <div className="card card-amber">
            <div className="card-title" style={{ marginBottom: 16, color: AMBER_LIGHT }}>📋 Account Info</div>
            {[
              ["🆔", "User ID",  user.id || user._id || "—"],
              ["📧", "Email",    user.email    || "—"],
              ["📍", "District", user.district || "—"],
              ["🗺️", "State",    user.state    || "—"],
              ["🎭", "Role",     user.role     || "exporter"],
              ["✅", "Profile",  user.profileCompleted ? "Complete" : "Incomplete"],
            ].map(([icon, label, val]) => (
              <div key={label} className="info-row">
                <span style={{ color: "var(--text2)" }}>{icon} {label}</span>
                <span style={{
                  fontWeight: 600, color: label === "Role" ? AMBER_LIGHT : "#fff",
                  maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", textAlign: "right",
                }}>
                  {val}
                </span>
              </div>
            ))}
          </div>

          {/* Export stats pill row */}
          <div className="card card-amber">
            <div className="card-title" style={{ marginBottom: 14, color: AMBER_LIGHT }}>🌍 Export Account</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <span className="stat-pill">🌐 Global Exporter</span>
              <span className="stat-pill">📦 Active</span>
              <span className="stat-pill">✅ Verified</span>
            </div>
            <p style={{ fontSize: 12, color: "var(--text2)", marginTop: 12, lineHeight: 1.6 }}>
              Your account is verified and enabled for international agricultural export operations.
            </p>
          </div>

          {/* Switch role */}
          <div className="card card-amber">
            <div className="card-title" style={{ marginBottom: 10 }}>🔄 Switch Role</div>
            <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 14, lineHeight: 1.6 }}>
              Want to use AgroConnect as a different user? Switch your role here.
            </p>
            <button className="btn-amber-ghost" onClick={() => navigate("/select-role", { state: { isNewUser: false } })}>
              🔄 Change My Role
            </button>
          </div>

          {/* Danger zone */}
          <div className="card" style={{ borderColor: "rgba(239,68,68,0.15)" }}>
            <div style={{ fontWeight: 700, color: "#f87171", marginBottom: 10 }}>⚠️ Danger Zone</div>
            <button
              onClick={handleLogout}
              style={{
                width: "100%", justifyContent: "center", padding: "12px",
                borderRadius: 12, border: "1px solid rgba(239,68,68,0.2)",
                background: "rgba(239,68,68,0.06)", color: "#f87171",
                cursor: "pointer", fontWeight: 700, fontSize: 14,
                fontFamily: "'Inter',sans-serif", transition: "background 0.2s",
                display: "flex", alignItems: "center", gap: 8,
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.12)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.06)"}
            >
              🚪 Sign Out
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
