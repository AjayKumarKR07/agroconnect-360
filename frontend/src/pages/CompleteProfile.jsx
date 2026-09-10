import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { API_URL } from "../config/api";

const ROLES = [
  { id: "farmer",   emoji: "🌾", label: "Farmer",    desc: "Sell your crops directly to buyers and exporters" },
  { id: "user",     emoji: "🛒", label: "Consumer",  desc: "Buy fresh produce directly from local farmers" },
  { id: "seller",   emoji: "🏪", label: "Seller",    desc: "Operate as a local trader or APMC agent" },
  { id: "exporter", emoji: "🚢", label: "Exporter",  desc: "Export agricultural commodities internationally" },
];

export default function CompleteProfile() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";

  const [role, setRole] = useState("farmer");
  const [form, setForm] = useState({ name: "", phone: "", district: "", state: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    const sanitized = name === "phone" ? value.replace(/\D/g, "").slice(0, 10) : value;
    setForm((p) => ({ ...p, [name]: sanitized }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const token = localStorage.getItem("agroconnect_token");
      if (!token) { navigate("/login"); return; }
      const locationStr = [form.district, form.state].filter(Boolean).join(", ");
      const r = await fetch(`${API_URL}/api/profile/complete`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, location: locationStr, role }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Unable to complete profile");
      localStorage.setItem("agroconnect_user", JSON.stringify(d.user));
      switch (d.user.role) {
        case "farmer":   navigate("/farmer/dashboard",   { replace: true }); break;
        case "seller":   navigate("/seller/dashboard",   { replace: true }); break;
        case "exporter": navigate("/exporter/dashboard", { replace: true }); break;
        case "user":     navigate("/user/dashboard",     { replace: true }); break;
        default:         navigate("/",                   { replace: true });
      }
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .cp-page {
          min-height: 100vh; background: #050a0e;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Inter', sans-serif; padding: 32px 20px;
          position: relative; overflow: hidden;
        }
        .cp-bg-canvas {
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 70% 50% at 20% 20%, rgba(34,197,94,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 50% 60% at 80% 80%, rgba(56,189,248,0.05) 0%, transparent 60%);
        }
        .cp-bg-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg,rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 50px 50px;
        }

        .cp-card {
          position: relative; z-index: 1;
          width: 100%; max-width: 580px;
          background: #080c10; border: 1px solid rgba(255,255,255,0.07);
          border-radius: 24px; padding: 48px 44px;
          color: #f0f6ff;
        }

        .cp-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 36px; }
        .cp-brand-logo { width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg,#16a34a,#059669); display: flex; align-items: center; justify-content: center; font-size: 20px; }
        .cp-brand-name { font-family: 'Space Grotesk',sans-serif; font-size: 17px; font-weight: 800; color: #0f172a; }

        .cp-step { font-size: 11px; font-weight: 700; color: #16a34a; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
        .cp-title { font-family: 'Space Grotesk',sans-serif; font-size: 28px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; margin-bottom: 6px; }
        .cp-sub { font-size: 14px; color: #64748b; margin-bottom: 32px; }
        .cp-email { display: inline-block; background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2); padding: 4px 12px; border-radius: 8px; font-size: 13px; font-weight: 600; color: #15803d; margin-bottom: 32px; }

        .role-section-label { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px; }
        .role-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 28px; }
        .role-btn {
          display: flex; flex-direction: column; align-items: flex-start; gap: 4px;
          padding: 16px; border-radius: 14px; cursor: pointer; text-align: left;
          background: #ffffff; border: 1px solid #e2e8f0;
          transition: all 0.2s; color: #0f172a;
        }
        .role-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
        .role-btn.selected { background: #f0fdf4; border-color: #86efac; box-shadow: 0 0 0 2px rgba(22,163,74,0.15); }
        .role-emoji { font-size: 26px; margin-bottom: 6px; }
        .role-label { font-size: 14px; font-weight: 700; color: #0f172a; }
        .role-desc { font-size: 12px; color: #64748b; line-height: 1.5; }
        .role-btn.selected .role-label { color: #15803d; }

        .cp-fields { display: flex; flex-direction: column; gap: 18px; margin-bottom: 24px; }
        .cp-field-label { font-size: 12px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; display: block; }
        .cp-input {
          width: 100%; background: #ffffff; border: 1px solid #cbd5e1;
          border-radius: 12px; padding: 13px 16px; color: #0f172a; font-size: 15px;
          font-family: 'Inter',sans-serif; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .cp-input::placeholder { color: #94a3b8; }
        .cp-input:focus { border-color: #16a34a; box-shadow: 0 0 0 3px rgba(22,163,74,0.12); }

        .cp-error { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-radius: 12px; background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; font-size: 14px; margin-bottom: 16px; }

        .cp-submit {
          width: 100%; padding: 16px; border-radius: 14px; border: none; cursor: pointer;
          background: linear-gradient(135deg, #16a34a, #059669); color: #0f172a;
          font-size: 16px; font-weight: 700; font-family: 'Inter',sans-serif;
          box-shadow: 0 8px 28px rgba(34,197,94,0.25);
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
        }
        .cp-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 14px 40px rgba(34,197,94,0.35); }
        .cp-submit:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .cp-back { display: inline-flex; align-items: center; gap: 6px; margin-top: 20px; font-size: 13px; color: rgba(255,255,255,0.35); text-decoration: none; transition: color 0.2s; }
        .cp-back:hover { color: rgba(255,255,255,0.7); }
      `}</style>

      <div className="cp-page">
        <div className="cp-bg-canvas" />
        <div className="cp-bg-grid" />

        <div className="cp-card">
          <div className="cp-brand">
            <div className="cp-brand-logo">🌱</div>
            <div className="cp-brand-name">AgroConnect 360</div>
          </div>

          <div className="cp-step">Step 3 of 3 — Profile Setup</div>
          <h1 className="cp-title">Complete Your Profile</h1>
          <p className="cp-sub">Tell us how you'll be using AgroConnect 360.</p>
          {email && <div className="cp-email">✉️ {email}</div>}

          {/* Role selection */}
          <div className="role-section-label">Select Your Role</div>
          <div className="role-grid">
            {ROLES.map(({ id, emoji, label, desc }) => (
              <button key={id} type="button" className={`role-btn ${role === id ? "selected" : ""}`} onClick={() => setRole(id)}>
                <span className="role-emoji">{emoji}</span>
                <span className="role-label">{label}</span>
                <span className="role-desc">{desc}</span>
              </button>
            ))}
          </div>

          {/* Form fields */}
          <form onSubmit={handleSubmit}>
            <div className="cp-fields">
              <div>
                <label className="cp-field-label">Full Name *</label>
                <input name="name" required value={form.name} onChange={handleChange} placeholder="Enter your full name" className="cp-input" />
              </div>
              <div>
                <label className="cp-field-label">Mobile Number *</label>
                <input name="phone" type="tel" required value={form.phone} onChange={handleChange} placeholder="9876543210" maxLength={10} className="cp-input" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className="cp-field-label">District *</label>
                  <input name="district" required value={form.district} onChange={handleChange} placeholder="e.g. Bengaluru Urban" className="cp-input" />
                </div>
                <div>
                  <label className="cp-field-label">State *</label>
                  <input name="state" required value={form.state} onChange={handleChange} placeholder="e.g. Karnataka" className="cp-input" />
                </div>
              </div>
            </div>

            {error && <div className="cp-error">⚠️ {error}</div>}

            <button id="complete-profile-btn" type="submit" className="cp-submit" disabled={loading}>
              {loading ? "⏳ Setting up your account…" : `🚀 Enter as ${ROLES.find(r => r.id === role)?.label}`}
            </button>
          </form>

          <Link to="/" className="cp-back">← Back to Home</Link>
        </div>
      </div>
    </>
  );
}