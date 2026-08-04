import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { API_URL } from "../config/api";

const ROLES = [
  {
    id: "farmer",
    emoji: "🌾",
    label: "Farmer",
    color: "#22c55e",
    glow: "rgba(34,197,94,0.15)",
    border: "rgba(34,197,94,0.3)",
    desc: "Sell crops directly to buyers, track income, get AI disease diagnosis and weather forecasts.",
    features: ["List & Sell Crops", "AI Crop Diagnosis", "Weather Advisory", "Income Tracking"],
  },
  {
    id: "user",
    emoji: "🛒",
    label: "Consumer / Buyer",
    color: "#38bdf8",
    glow: "rgba(56,189,248,0.15)",
    border: "rgba(56,189,248,0.3)",
    desc: "Browse and buy fresh produce directly from local farmers at market prices.",
    features: ["Browse Fresh Produce", "Direct from Farmers", "Order Tracking", "Market Prices"],
  },
  {
    id: "seller",
    emoji: "🏪",
    label: "Seller / Agent",
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.15)",
    border: "rgba(167,139,250,0.3)",
    desc: "Operate as a local trader, APMC agent or aggregator between farmers and buyers.",
    features: ["Bulk Trading", "APMC Mandi Prices", "Manage Inventory", "Price Analytics"],
  },
  {
    id: "exporter",
    emoji: "🚢",
    label: "Exporter",
    color: "#fb923c",
    glow: "rgba(251,146,60,0.15)",
    border: "rgba(251,146,60,0.3)",
    desc: "Export Indian agricultural commodities internationally with compliance tools.",
    features: ["Export Management", "Global Market Prices", "Compliance Tools", "Bulk Orders"],
  },
  {
    id: "admin",
    emoji: "⚙️",
    label: "Admin",
    color: "#f43f5e",
    glow: "rgba(244,63,94,0.15)",
    border: "rgba(244,63,94,0.3)",
    desc: "Manage the AgroConnect 360 platform — users, listings, orders and system settings.",
    features: ["User Management", "Platform Analytics", "Moderate Listings", "System Settings"],
  },
];

export default function RoleSelection() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";
  const isNewUser = location.state?.isNewUser ?? true;

  // Read existing user data (for returning users)
  const savedUser = (() => {
    try { return JSON.parse(localStorage.getItem("agroconnect_user") || "{}"); }
    catch { return {}; }
  })();

  const [selectedRole, setSelectedRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState("role"); // "role" | "profile"

  // Profile fields (only for new users)
  const [form, setForm] = useState({
    name: savedUser.name || "",
    phone: savedUser.phone || "",
    location: savedUser.location || "",
  });

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  // Navigate to the right dashboard for a given role
  const goToDashboard = (role) => {
    switch (role) {
      case "farmer":   navigate("/farmer/dashboard",   { replace: true }); break;
      case "seller":   navigate("/seller/dashboard",   { replace: true }); break;
      case "exporter": navigate("/exporter/dashboard", { replace: true }); break;
      case "admin":    navigate("/admin/dashboard",    { replace: true }); break;
      case "user":     navigate("/user/dashboard",     { replace: true }); break;
      default:         navigate("/",                   { replace: true });
    }
  };

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    setError("");

    if (!isNewUser) {
      // Existing user — update role in backend using their saved profile data
      handleRoleSave(roleId, {
        name: savedUser.name || "User",
        phone: savedUser.phone || "",
        location: savedUser.location || "India",
      });
    } else {
      // New user → show profile form
      setStep("profile");
    }
  };

  const handleRoleSave = async (roleId, profileOverride) => {
    const role = roleId || selectedRole;
    if (!role) { setError("Please select a role to continue."); return; }

    const payload = profileOverride || form;

    setLoading(true); setError("");
    try {
      const token = localStorage.getItem("agroconnect_token");
      if (!token) { navigate("/login"); return; }

      const r = await fetch(`${API_URL}/api/profile/complete`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: payload.name || savedUser.name || "User",
          phone: payload.phone || savedUser.phone || "",
          location: payload.location || savedUser.location || "India",
          role,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Unable to save profile");

      localStorage.setItem("agroconnect_user", JSON.stringify(d.user));
      goToDashboard(d.user.role);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };


  const selectedRoleData = ROLES.find((r) => r.id === selectedRole);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .rs-page {
          min-height: 100vh; background: #050a0e;
          font-family: 'Inter', sans-serif; padding: 40px 24px 60px;
          position: relative; overflow-x: hidden;
        }
        .rs-bg {
          position: fixed; inset: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 80% 60% at 10% -10%, rgba(34,197,94,0.07) 0%, transparent 55%),
            radial-gradient(ellipse 60% 50% at 90% 110%, rgba(56,189,248,0.05) 0%, transparent 55%),
            radial-gradient(ellipse 50% 40% at 50% 50%, rgba(167,139,250,0.03) 0%, transparent 60%);
        }
        .rs-grid-bg {
          position: fixed; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 48px 48px;
        }

        .rs-wrap { position: relative; z-index: 1; max-width: 1080px; margin: 0 auto; }

        /* ── Header ── */
        .rs-header { text-align: center; margin-bottom: 52px; }
        .rs-brand { display: inline-flex; align-items: center; gap: 10px; margin-bottom: 32px; }
        .rs-brand-logo { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg,#16a34a,#059669); display: flex; align-items: center; justify-content: center; font-size: 22px; box-shadow: 0 8px 24px rgba(34,197,94,0.25); }
        .rs-brand-name { font-family: 'Space Grotesk',sans-serif; font-size: 18px; font-weight: 800; color: #fff; }
        .rs-eyebrow { font-size: 12px; font-weight: 700; color: #22c55e; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 16px; }
        .rs-title { font-family: 'Space Grotesk',sans-serif; font-size: clamp(28px,4vw,44px); font-weight: 800; color: #fff; letter-spacing: -0.03em; line-height: 1.1; margin-bottom: 14px; }
        .rs-title span { background: linear-gradient(135deg, #22c55e, #38bdf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .rs-sub { font-size: 16px; color: rgba(255,255,255,0.45); max-width: 520px; margin: 0 auto; line-height: 1.7; }
        .rs-email { display: inline-flex; align-items: center; gap: 8px; margin-top: 16px; padding: 6px 16px; background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); border-radius: 100px; font-size: 13px; color: #4ade80; font-weight: 600; }

        /* ── Role Grid ── */
        .rs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 18px; margin-bottom: 36px; }

        .rs-card {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px; padding: 28px 24px; cursor: pointer;
          transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
          position: relative; overflow: hidden;
        }
        .rs-card::before {
          content: ''; position: absolute; inset: 0; opacity: 0;
          transition: opacity 0.25s;
          background: radial-gradient(ellipse 100% 100% at 50% 0%, var(--glow) 0%, transparent 70%);
        }
        .rs-card:hover { transform: translateY(-4px); border-color: var(--border); box-shadow: 0 20px 40px -10px var(--glow); }
        .rs-card:hover::before { opacity: 1; }
        .rs-card.selected { border-color: var(--border); box-shadow: 0 0 0 2px var(--border), 0 20px 60px -10px var(--glow); background: rgba(255,255,255,0.05); transform: translateY(-4px); }
        .rs-card.selected::before { opacity: 1; }

        .rs-card-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
        .rs-card-emoji { font-size: 40px; line-height: 1; }
        .rs-card-check { width: 22px; height: 22px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; }
        .rs-card.selected .rs-card-check { background: var(--color); border-color: var(--color); }
        .rs-card-label { font-family: 'Space Grotesk',sans-serif; font-size: 18px; font-weight: 800; color: #fff; margin-bottom: 8px; }
        .rs-card-desc { font-size: 13px; color: rgba(255,255,255,0.45); line-height: 1.65; margin-bottom: 18px; }
        .rs-card-features { display: flex; flex-direction: column; gap: 6px; }
        .rs-card-feature { display: flex; align-items: center; gap: 8px; font-size: 12px; color: rgba(255,255,255,0.55); }
        .rs-card-feature::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: var(--color); flex-shrink: 0; opacity: 0.7; }
        .rs-card.selected .rs-card-feature { color: rgba(255,255,255,0.75); }
        .rs-card.selected .rs-card-feature::before { opacity: 1; }
        .rs-card.selected .rs-card-label { color: var(--color); }

        /* ── Profile Step ── */
        .rs-profile-card {
          max-width: 520px; margin: 0 auto;
          background: #080c10; border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px; padding: 40px 36px;
        }
        .rs-profile-header { display: flex; align-items: center; gap: 14px; margin-bottom: 28px; }
        .rs-profile-role-badge { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 26px; }
        .rs-profile-title { font-family: 'Space Grotesk',sans-serif; font-size: 22px; font-weight: 800; color: #fff; }
        .rs-profile-sub { font-size: 13px; color: rgba(255,255,255,0.4); margin-top: 2px; }
        .rs-fields { display: flex; flex-direction: column; gap: 18px; margin-bottom: 24px; }
        .rs-label { font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 0.06em; display: block; margin-bottom: 8px; }
        .rs-input {
          width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; padding: 14px 16px; color: #fff; font-size: 15px;
          font-family: 'Inter',sans-serif; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .rs-input::placeholder { color: rgba(255,255,255,0.2); }
        .rs-input:focus { border-color: var(--focus-color, rgba(34,197,94,0.5)); box-shadow: 0 0 0 4px var(--focus-glow, rgba(34,197,94,0.08)); }

        /* ── Buttons ── */
        .rs-btn-primary {
          width: 100%; padding: 16px; border-radius: 14px; border: none; cursor: pointer;
          font-size: 16px; font-weight: 700; font-family: 'Inter',sans-serif; color: #fff;
          background: var(--btn-bg, linear-gradient(135deg,#16a34a,#059669));
          box-shadow: 0 8px 28px var(--btn-shadow, rgba(34,197,94,0.25));
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .rs-btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 14px 40px var(--btn-shadow, rgba(34,197,94,0.35)); }
        .rs-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
        .rs-btn-ghost { background: none; border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); border-radius: 12px; padding: 12px 20px; cursor: pointer; font-size: 14px; font-family: 'Inter',sans-serif; transition: all 0.2s; }
        .rs-btn-ghost:hover { border-color: rgba(255,255,255,0.2); color: rgba(255,255,255,0.8); }

        .rs-error { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-radius: 12px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); color: #fca5a5; font-size: 14px; margin-bottom: 16px; }

        .rs-back { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: rgba(255,255,255,0.35); background: none; border: none; cursor: pointer; font-family: 'Inter',sans-serif; margin-top: 20px; padding: 0; transition: color 0.2s; }
        .rs-back:hover { color: rgba(255,255,255,0.7); }

        .spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.25); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 600px) {
          .rs-page { padding: 24px 16px 48px; }
          .rs-grid { grid-template-columns: 1fr; }
          .rs-profile-card { padding: 28px 20px; }
        }
      `}</style>

      <div className="rs-page">
        <div className="rs-bg" />
        <div className="rs-grid-bg" />
        <div className="rs-wrap">

          {/* Header */}
          <div className="rs-header">
            <div className="rs-brand">
              <div className="rs-brand-logo">🌱</div>
              <div className="rs-brand-name">AgroConnect 360</div>
            </div>

            {step === "role" ? (
              <>
                <div className="rs-eyebrow">Welcome Aboard</div>
                <h1 className="rs-title">How will you use <span>AgroConnect?</span></h1>
                <p className="rs-sub">Select your role to unlock features tailored for you. You can always change this later.</p>
                {email && <div className="rs-email">✉️ Signed in as {email}</div>}
              </>
            ) : (
              <>
                <div className="rs-eyebrow">Almost there</div>
                <h1 className="rs-title">Complete your <span>Profile</span></h1>
                <p className="rs-sub">Just a few more details and you're all set.</p>
              </>
            )}
          </div>

          {/* ── STEP 1: Role Cards ── */}
          {step === "role" && (
            <>
              <div className="rs-grid">
                {ROLES.map(({ id, emoji, label, color, glow, border, desc, features }) => (
                  <div
                    key={id}
                    id={`role-${id}`}
                    className={`rs-card ${selectedRole === id ? "selected" : ""}`}
                    style={{ "--color": color, "--glow": glow, "--border": border }}
                    onClick={() => handleRoleSelect(id)}
                  >
                    <div className="rs-card-top">
                      <span className="rs-card-emoji">{emoji}</span>
                      <div className="rs-card-check">
                        {selectedRole === id && <span style={{ color: "#fff", fontSize: 12, fontWeight: 900 }}>✓</span>}
                      </div>
                    </div>
                    <div className="rs-card-label">{label}</div>
                    <div className="rs-card-desc">{desc}</div>
                    <div className="rs-card-features">
                      {features.map((f) => (
                        <div key={f} className="rs-card-feature">{f}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {error && <div className="rs-error" style={{ maxWidth: 520, margin: "0 auto 16px" }}>⚠️ {error}</div>}

              {loading && (
                <div style={{ textAlign: "center", padding: "20px", color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  <div className="spinner" /> Signing you in…
                </div>
              )}
            </>
          )}

          {/* ── STEP 2: Profile Form (new users only) ── */}
          {step === "profile" && selectedRoleData && (
            <div className="rs-profile-card">
              <div className="rs-profile-header">
                <div className="rs-profile-role-badge" style={{ background: selectedRoleData.glow, border: `1px solid ${selectedRoleData.border}` }}>
                  {selectedRoleData.emoji}
                </div>
                <div>
                  <div className="rs-profile-title">Your Details</div>
                  <div className="rs-profile-sub">Joining as {selectedRoleData.label}</div>
                </div>
              </div>

              {error && <div className="rs-error">⚠️ {error}</div>}

              <form onSubmit={(e) => { e.preventDefault(); handleRoleSave(); }} style={{ "--focus-color": selectedRoleData.border, "--focus-glow": selectedRoleData.glow }}>
                <div className="rs-fields">
                  <div>
                    <label className="rs-label">Full Name *</label>
                    <input className="rs-input" name="name" required value={form.name} onChange={handleChange} placeholder="Enter your full name" />
                  </div>
                  <div>
                    <label className="rs-label">Mobile Number *</label>
                    <input className="rs-input" name="phone" type="tel" required value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" />
                  </div>
                  <div>
                    <label className="rs-label">City / District *</label>
                    <input className="rs-input" name="location" required value={form.location} onChange={handleChange} placeholder="e.g. Bengaluru, Karnataka" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="rs-btn-primary"
                  disabled={loading}
                  style={{
                    "--btn-bg": `linear-gradient(135deg, ${selectedRoleData.color}, ${selectedRoleData.color}cc)`,
                    "--btn-shadow": selectedRoleData.glow,
                  }}
                >
                  {loading ? <><div className="spinner" /> Setting up your account…</> : `🚀 Enter as ${selectedRoleData.label}`}
                </button>
              </form>

              <div style={{ marginTop: 16, textAlign: "center" }}>
                <button className="rs-back" onClick={() => setStep("role")}>← Choose a different role</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
