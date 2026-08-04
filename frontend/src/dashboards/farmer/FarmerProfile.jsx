import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../config/api";
import { DS } from "../../styles/ds";

export default function FarmerProfile() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("agroconnect_user") || "{}");
  const [form, setForm] = useState({ name: user.name || "", phone: user.phone || "", location: user.location || "" });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(""); setSuccess("");
    try {
      const token = localStorage.getItem("agroconnect_token");
      const r = await fetch(`${API_URL}/api/profile/complete`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, role: user.role }),
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

  const initials = (user.name || "F").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const ROLE_COLORS = { farmer: "#22c55e", seller: "#a78bfa", exporter: "#fb923c", admin: "#f43f5e", user: "#38bdf8" };
  const roleColor = ROLE_COLORS[user.role] || "#22c55e";

  return (
    <>
      <style>{DS + `
        .pf-avatar { width: 88px; height: 88px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Space Grotesk',sans-serif; font-size: 32px; font-weight: 800; color: #fff; flex-shrink: 0; }
        .pf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        .pf-group { display: flex; flex-direction: column; gap: 6px; }
        .pf-group.full { grid-column: 1/-1; }
        @media(max-width:600px){ .pf-grid { grid-template-columns: 1fr; } .pf-group.full { grid-column: 1; } }
      `}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Account Settings</div>
          <h1 className="pg-title">👤 My Profile</h1>
          <p className="pg-sub">Manage your personal information and account preferences.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>
        {/* Profile Form */}
        <div className="card">
          {/* Avatar + Info */}
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28, padding: "20px 24px", background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)" }}>
            <div className="pf-avatar" style={{ background: `linear-gradient(135deg, ${roleColor}, ${roleColor}aa)`, boxShadow: `0 8px 24px ${roleColor}30` }}>
              {initials}
            </div>
            <div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color: "#fff" }}>{user.name || "Farmer"}</div>
              <div style={{ fontSize: 14, color: "var(--text2)", marginTop: 4 }}>{user.email}</div>
              <span className="badge" style={{ marginTop: 8, display: "inline-flex", background: `${roleColor}15`, color: roleColor, borderColor: `${roleColor}30` }}>
                ● {user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || "Farmer"}
              </span>
            </div>
          </div>

          <div className="card-title" style={{ marginBottom: 18 }}>✏️ Edit Information</div>

          {success && <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80", fontSize: 14, marginBottom: 16 }}>{success}</div>}
          {error && <div className="alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="pf-grid">
              <div className="pf-group full">
                <label className="field-label">Full Name</label>
                <input name="name" value={form.name} onChange={handleChange} required className="field-input" />
              </div>
              <div className="pf-group">
                <label className="field-label">Mobile Number</label>
                <input name="phone" type="tel" value={form.phone} onChange={handleChange} className="field-input" placeholder="+91 XXXXX XXXXX" />
              </div>
              <div className="pf-group">
                <label className="field-label">City / District</label>
                <input name="location" value={form.location} onChange={handleChange} className="field-input" placeholder="e.g. Bengaluru" />
              </div>
              <div className="pf-group full">
                <label className="field-label">Email Address</label>
                <input value={user.email || ""} disabled className="field-input" style={{ opacity: 0.5, cursor: "not-allowed" }} />
              </div>
            </div>
            <button type="submit" className="btn-green" disabled={saving} style={{ marginTop: 20, minWidth: 160 }}>
              {saving ? "💾 Saving…" : "💾 Save Changes"}
            </button>
          </form>
        </div>

        {/* Right panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Account info */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>📋 Account Info</div>
            {[
              ["🆔", "User ID", user.id || user._id || "—"],
              ["📧", "Email", user.email || "—"],
              ["🎭", "Role", user.role || "farmer"],
              ["✅", "Profile", user.profileCompleted ? "Complete" : "Incomplete"],
            ].map(([icon, label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                <span style={{ color: "var(--text2)" }}>{icon} {label}</span>
                <span style={{ fontWeight: 600, color: "#fff", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", textAlign: "right" }}>{val}</span>
              </div>
            ))}
          </div>

          {/* Change role */}
          <div className="card" style={{ borderColor: "rgba(56,189,248,0.15)" }}>
            <div className="card-title" style={{ marginBottom: 10 }}>🔄 Switch Role</div>
            <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 14, lineHeight: 1.6 }}>Want to use AgroConnect as a different user? Switch your role here.</p>
            <button className="btn-ghost" style={{ width: "100%", justifyContent: "center", color: "#38bdf8", borderColor: "rgba(56,189,248,0.2)" }} onClick={() => navigate("/select-role")}>
              🔄 Change My Role
            </button>
          </div>

          {/* Danger zone */}
          <div className="card" style={{ borderColor: "rgba(239,68,68,0.15)" }}>
            <div style={{ fontWeight: 700, color: "#f87171", marginBottom: 10 }}>⚠️ Danger Zone</div>
            <button onClick={handleLogout} style={{ width: "100%", justifyContent: "center", padding: "12px", borderRadius: 12, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.06)", color: "#f87171", cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "'Inter',sans-serif", transition: "background 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.12)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.06)"}
            >
              🚪 Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
