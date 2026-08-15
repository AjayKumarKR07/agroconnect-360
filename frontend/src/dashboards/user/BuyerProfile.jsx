import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../config/api";

const S = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@700;800&display=swap');
  *{box-sizing:border-box;}
  .bp-card{background:rgba(14,165,233,0.04);border:1px solid rgba(14,165,233,0.12);border-radius:20px;padding:28px;}
  .bp-label{display:block;font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);margin-bottom:7px;text-transform:uppercase;letter-spacing:0.07em;}
  .bp-input{width:100%;padding:12px 15px;border-radius:12px;border:1px solid rgba(14,165,233,0.15);background:rgba(14,165,233,0.04);color:#fff;font-size:14px;font-family:'Inter',sans-serif;outline:none;transition:border-color 0.2s,box-shadow 0.2s;}
  .bp-input:focus{border-color:rgba(14,165,233,0.4);box-shadow:0 0 0 4px rgba(14,165,233,0.07);}
  .bp-input:disabled{opacity:0.4;cursor:not-allowed;}
  .bp-select{width:100%;padding:12px 15px;border-radius:12px;border:1px solid rgba(14,165,233,0.15);background:rgba(14,165,233,0.04);color:#fff;font-size:14px;font-family:'Inter',sans-serif;outline:none;appearance:none;transition:border-color 0.2s;}
  .bp-select:focus{border-color:rgba(14,165,233,0.4);}
  .bp-select option{background:#071c24;color:#fff;}
  .btn-save{padding:12px 28px;border-radius:12px;background:linear-gradient(135deg,#0284c7,#0ea5e9);color:#fff;font-weight:700;font-size:14px;border:none;cursor:pointer;font-family:'Inter',sans-serif;transition:all 0.2s;box-shadow:0 6px 18px rgba(14,165,233,0.28);}
  .btn-save:hover{transform:translateY(-1px);box-shadow:0 10px 26px rgba(14,165,233,0.38);}
  .btn-save:disabled{opacity:0.5;cursor:not-allowed;transform:none;box-shadow:none;}
  .btn-out{padding:10px 20px;border-radius:11px;border:1px solid rgba(239,68,68,0.2);background:rgba(239,68,68,0.05);color:#f87171;font-weight:700;font-size:13px;cursor:pointer;font-family:'Inter',sans-serif;transition:all 0.2s;}
  .btn-out:hover{background:rgba(239,68,68,0.1);border-color:rgba(239,68,68,0.35);}
`;

import { ALL_INDIA_STATES, getDistrictsForState } from "../../utils/indiaData";

export default function BuyerProfile() {
  const navigate = useNavigate();
  const token    = localStorage.getItem("agroconnect_token");

  const [user,    setUser]    = useState(() => JSON.parse(localStorage.getItem("agroconnect_user") || "{}"));
  const [form,    setForm]    = useState({ name: "", phone: "", state: "", district: "" });
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState({ type: "", text: "" });

  const availableDistricts = getDistrictsForState(form.state);

  useEffect(() => {
    fetch(`${API_URL}/api/profile/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.user) {
          const u = { ...user, ...d.user };
          localStorage.setItem("agroconnect_user", JSON.stringify(u));
          setUser(u);
          setForm({ name: u.name || "", phone: u.phone || "", state: u.state || "", district: u.district || "" });
        }
      })
      .catch(() => {
        const u = JSON.parse(localStorage.getItem("agroconnect_user") || "{}");
        setForm({ name: u.name || "", phone: u.phone || "", state: u.state || "", district: u.district || "" });
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const sanitized = name === "phone" ? value.replace(/\D/g, "").slice(0, 10) : value;
    setForm((p) => {
      const updated = { ...p, [name]: sanitized };
      if (name === "state") {
        const validDistricts = getDistrictsForState(sanitized);
        if (!validDistricts.includes(p.district)) {
          updated.district = "";
        }
      }
      return updated;
    });
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setMsg({ type: "err", text: "Name is required." }); return; }
    setSaving(true); setMsg({ type: "", text: "" });
    try {
      const r = await fetch(`${API_URL}/api/profile/complete`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name:     form.name.trim(),
          phone:    form.phone,
          state:    form.state,
          district: form.district.trim(),
          location: [form.district.trim(), form.state].filter(Boolean).join(", "),
          role:     user.role || "user",
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Save failed");
      const merged = { ...user, ...d.user };
      localStorage.setItem("agroconnect_user", JSON.stringify(merged));
      window.dispatchEvent(new Event("ac_user_update")); // → sidebar updates instantly
      setUser(merged);
      setForm({ name: merged.name || "", phone: merged.phone || "", state: merged.state || "", district: merged.district || "" });
      setMsg({ type: "ok", text: "✅ Profile saved!" });
    } catch (err) {
      setMsg({ type: "err", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const logout = () => {
    ["agroconnect_token", "agroconnect_user"].forEach(k => localStorage.removeItem(k));
    navigate("/login", { replace: true });
  };

  const initials = (user.name || "B").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
      <style>{S}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#0ea5e9", marginBottom: 4 }}>Buyer Account</div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 800, color: "#fff", margin: 0 }}>👤 My Profile</h1>
        </div>
        <button className="btn-out" onClick={logout}>🚪 Sign Out</button>
      </div>

      <div className="bp-card">

        {/* Avatar + info row */}
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 28, paddingBottom: 24, borderBottom: "1px solid rgba(14,165,233,0.08)" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#0284c7,#38bdf8)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Grotesk',sans-serif", fontSize: 24, fontWeight: 800, color: "#fff", flexShrink: 0, boxShadow: "0 6px 20px rgba(14,165,233,0.35)" }}>
            {initials}
          </div>
          <div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 19, fontWeight: 800, color: "#fff" }}>{user.name || "—"}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>{user.email || "—"}</div>
            <span style={{ marginTop: 7, display: "inline-block", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "rgba(14,165,233,0.12)", color: "#38bdf8", border: "1px solid rgba(14,165,233,0.25)" }}>🛒 Consumer</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={save}>
          {/* Success / error message */}
          {msg.text && (
            <div style={{ marginBottom: 18, padding: "11px 16px", borderRadius: 11, fontSize: 13, fontWeight: 600,
              background: msg.type === "ok" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
              border:     `1px solid ${msg.type === "ok" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
              color:      msg.type === "ok" ? "#4ade80" : "#f87171",
            }}>
              {msg.text}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Full Name — full width */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="bp-label">Full Name *</label>
              <input className="bp-input" name="name" value={form.name} onChange={handleChange} placeholder="Your full name" required />
            </div>

            {/* Phone */}
            <div>
              <label className="bp-label">Mobile Number</label>
              <input className="bp-input" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="9876543210" maxLength={10} />
            </div>

            {/* Email — read only */}
            <div>
              <label className="bp-label">Email Address</label>
              <input className="bp-input" value={user.email || ""} disabled />
            </div>

            {/* State */}
            <div>
              <label className="bp-label">State / UT (36)</label>
              <select className="bp-select" name="state" value={form.state} onChange={handleChange}>
                <option value="">— Select State / UT —</option>
                {ALL_INDIA_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* District */}
            <div>
              <label className="bp-label">
                District {availableDistricts.length > 0 && `(${availableDistricts.length})`}
              </label>
              <select
                className="bp-select"
                name="district"
                value={form.district}
                onChange={handleChange}
                disabled={!form.state}
              >
                <option value="">
                  {form.state ? "— Select District —" : "— Select State First —"}
                </option>
                {availableDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: 22 }}>
            <button className="btn-save" type="submit" disabled={saving}>
              {saving ? "⏳ Saving…" : "💾 Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
