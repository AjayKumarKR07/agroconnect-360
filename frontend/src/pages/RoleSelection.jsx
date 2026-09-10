import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { API_URL } from "../config/api";
import { Wheat, ShoppingCart, Store, Ship, Settings, Sprout, AlertTriangle, Check } from "lucide-react";

const ROLES = [
  {
    id: "farmer",
    Icon: Wheat,
    color: "#16a34a",
    glow: "rgba(22,163,74,0.12)",
    border: "#86efac",
    label: "Farmer",
    desc: "Sell crops directly to buyers, track income, get AI disease diagnosis and weather forecasts.",
    features: ["List & Sell Crops", "AI Crop Diagnosis", "Weather Advisory", "Income Tracking"],
  },
  {
    id: "user",
    Icon: ShoppingCart,
    color: "#0284c7",
    glow: "rgba(2,132,199,0.12)",
    border: "#7dd3fc",
    label: "Consumer / Buyer",
    desc: "Browse and buy fresh produce directly from local farmers at market prices.",
    features: ["Browse Fresh Produce", "Direct from Farmers", "Order Tracking", "Market Prices"],
  },
  {
    id: "seller",
    Icon: Store,
    color: "#7c3aed",
    glow: "rgba(124,58,237,0.12)",
    border: "#c4b5fd",
    label: "Seller / Agent",
    desc: "Operate as a local trader, APMC agent or aggregator between farmers and buyers.",
    features: ["Bulk Trading", "APMC Mandi Prices", "Manage Inventory", "Price Analytics"],
  },
  {
    id: "exporter",
    Icon: Ship,
    color: "#d97706",
    glow: "rgba(217,119,6,0.12)",
    border: "#fde68a",
    label: "Exporter",
    desc: "Export Indian agricultural commodities internationally with compliance tools.",
    features: ["Export Management", "Global Market Prices", "Compliance Tools", "Bulk Orders"],
  },
  {
    id: "admin",
    Icon: Settings,
    color: "#dc2626",
    glow: "rgba(220,38,38,0.12)",
    border: "#fca5a5",
    label: "Admin",
    desc: "Manage the AgroConnect 360 platform — users, listings, orders and system settings.",
    features: ["User Management", "Platform Analytics", "Moderate Listings", "System Settings"],
  },
];

export default function RoleSelection() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";

  // Read existing user data (for returning users)
  const savedUser = (() => {
    try { return JSON.parse(localStorage.getItem("agroconnect_user") || "{}"); }
    catch { return {}; }
  })();

  const isNewUser = location.state?.isNewUser ?? (!savedUser?.name && !savedUser?.email && !savedUser?.role);

  const [selectedRole, setSelectedRole] = useState(savedUser.role || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState("role"); // "role" | "profile"

  // Profile fields (only for new users)
  const [form, setForm] = useState({
    name: savedUser.name || "",
    phone: savedUser.phone || "",
    location: savedUser.location || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const sanitized = name === "phone" ? value.replace(/\D/g, "").slice(0, 10) : value;
    setForm((p) => ({ ...p, [name]: sanitized }));
  };

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
      if (savedUser.role === roleId) {
        goToDashboard(roleId);
        return;
      }
      handleRoleSave(roleId, {
        name: savedUser.name || "User",
        phone: savedUser.phone || "",
        location: savedUser.location || "India",
      });
    } else {
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
          district: savedUser.district || "",
          state: savedUser.state || "",
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
          min-height: 100vh; background: #f8fafc;
          font-family: 'Inter', sans-serif; padding: 48px 24px 70px;
          color: #0f172a;
        }

        .rs-wrap { max-width: 1100px; margin: 0 auto; }

        /* ── Header ── */
        .rs-header { text-align: center; margin-bottom: 40px; }
        .rs-brand { display: inline-flex; align-items: center; gap: 10px; margin-bottom: 24px; text-decoration: none; }
        .rs-brand-logo {
          width: 40px; height: 40px; border-radius: 10px;
          background: #16a34a; display: flex; align-items: center;
          justify-content: center; font-size: 20px; color: #0f172a;
        }
        .rs-brand-name { font-family: 'Space Grotesk', sans-serif; font-size: 18px; font-weight: 800; color: #0f172a; }
        .rs-eyebrow { font-size: 11px; font-weight: 700; color: #16a34a; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
        .rs-title { font-family: 'Space Grotesk', sans-serif; font-size: clamp(28px, 4vw, 38px); font-weight: 800; color: #0f172a; letter-spacing: -0.02em; margin-bottom: 8px; }
        .rs-title span { color: #16a34a; }
        .rs-sub { font-size: 15px; color: #64748b; max-width: 500px; margin: 0 auto; line-height: 1.6; }
        .rs-email { display: inline-flex; align-items: center; gap: 6px; margin-top: 14px; padding: 4px 14px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 100px; font-size: 13px; color: #166534; font-weight: 600; }

        /* ── Role Grid ── */
        .rs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 18px; margin-bottom: 32px; }

        .rs-card {
          background: #ffffff; border: 1px solid #e2e8f0;
          border-radius: 18px; padding: 26px 22px; cursor: pointer;
          transition: all 0.2s ease;
          position: relative; overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
        }
        .rs-card:hover {
          transform: translateY(-2px);
          border-color: #cbd5e1;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
        }
        .rs-card.selected {
          border-color: #16a34a;
          background: #f0fdf4;
          box-shadow: 0 0 0 2px #16a34a, 0 8px 24px rgba(22, 163, 74, 0.12);
        }

        .rs-card-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 14px; }
        .rs-card-emoji { font-size: 36px; line-height: 1; }
        .rs-card-check {
          width: 22px; height: 22px; border-radius: 50%;
          border: 2px solid #cbd5e1; display: flex; align-items: center;
          justify-content: center; transition: all 0.15s ease; flex-shrink: 0;
        }
        .rs-card.selected .rs-card-check {
          background: #16a34a; border-color: #16a34a; color: #ffffff; font-size: 12px; font-weight: 900;
        }
        .rs-card-label { font-family: 'Space Grotesk', sans-serif; font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 6px; }
        .rs-card-desc { font-size: 13px; color: #64748b; line-height: 1.6; margin-bottom: 16px; }
        .rs-card-features { display: flex; flex-direction: column; gap: 6px; }
        .rs-card-feature { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #475569; font-weight: 500; }
        .rs-card-feature::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: #16a34a; flex-shrink: 0; }

        /* ── Profile Step ── */
        .rs-profile-card {
          max-width: 480px; margin: 0 auto;
          background: #ffffff; border: 1px solid #e2e8f0;
          border-radius: 20px; padding: 36px 32px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        }
        .rs-profile-header { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
        .rs-profile-role-badge {
          width: 48px; height: 48px; border-radius: 12px;
          background: #f0fdf4; border: 1px solid #bbf7d0;
          display: flex; align-items: center; justify-content: center; font-size: 24px;
        }
        .rs-profile-title { font-family: 'Space Grotesk', sans-serif; font-size: 20px; font-weight: 800; color: #0f172a; }
        .rs-profile-sub { font-size: 13px; color: #64748b; margin-top: 2px; }
        .rs-fields { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }
        .rs-label { font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; display: block; margin-bottom: 6px; }
        .rs-input {
          width: 100%; background: #ffffff; border: 1px solid #cbd5e1;
          border-radius: 10px; padding: 12px 14px; color: #0f172a; font-size: 14px;
          font-family: 'Inter', sans-serif; outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .rs-input::placeholder { color: #94a3b8; }
        .rs-input:focus { border-color: #16a34a; box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.12); }

        /* ── Buttons ── */
        .rs-btn-primary {
          width: 100%; padding: 13px; border-radius: 10px; border: none; cursor: pointer;
          font-size: 15px; font-weight: 600; font-family: 'Inter', sans-serif; color: #ffffff;
          background: #16a34a;
          box-shadow: 0 2px 4px rgba(22, 163, 74, 0.2);
          transition: background 0.15s, transform 0.15s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .rs-btn-primary:hover:not(:disabled) { background: #15803d; transform: translateY(-1px); }
        .rs-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

        .rs-error {
          display: flex; align-items: center; gap: 8px; padding: 12px 14px;
          border-radius: 10px; background: #fef2f2; border: 1px solid #fecaca;
          color: #991b1b; font-size: 13px; margin-bottom: 16px;
        }

        .rs-back {
          display: inline-flex; align-items: center; gap: 6px; font-size: 13px;
          color: #64748b; background: none; border: none; cursor: pointer;
          font-family: 'Inter', sans-serif; margin-top: 16px; padding: 0;
          font-weight: 500;
        }
        .rs-back:hover { color: #0f172a; }

        .spinner {
          width: 18px; height: 18px; border: 2px solid #ffffff;
          border-top-color: transparent; border-radius: 50%;
          animation: spin 0.7s linear infinite; flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 600px) {
          .rs-page { padding: 24px 16px 48px; }
          .rs-grid { grid-template-columns: 1fr; }
          .rs-profile-card { padding: 24px 18px; }
        }
      `}</style>

      <div className="rs-page">
        <div className="rs-wrap">

          {/* Header */}
          <div className="rs-header">
            <Link to="/" className="rs-brand">
              <div className="rs-brand-logo"><Sprout size={20} strokeWidth={2} color="#16a34a" /></div>
              <div className="rs-brand-name">AgroConnect 360</div>
            </Link>

            {step === "role" ? (
              <>
                <div className="rs-eyebrow">Welcome to AgroConnect</div>
                <h1 className="rs-title">How Will You Use <span>AgroConnect?</span></h1>
                <p className="rs-sub">Select your primary role to unlock your tailored workspace. You can switch between roles at any time.</p>
                {email && <div className="rs-email">Signed in as {email}</div>}
              </>
            ) : (
              <>
                <div className="rs-eyebrow">Quick Setup</div>
                <h1 className="rs-title">Complete Your <span>Profile</span></h1>
                <p className="rs-sub">Provide a few basic details to set up your account workspace.</p>
              </>
            )}
          </div>

          {/* ── STEP 1: Role Cards ── */}
          {step === "role" && (
            <>
              {savedUser?.role && (
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <button
                    onClick={() => goToDashboard(savedUser.role)}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      borderRadius: 100,
                      padding: "8px 20px",
                      color: "#334155",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: "'Inter', sans-serif",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                    }}
                  >
                    ← Back to {savedUser.role.charAt(0).toUpperCase() + savedUser.role.slice(1)} Dashboard
                  </button>
                </div>
              )}

              <div className="rs-grid">
                {ROLES.map(({ id, Icon, label, color, desc, features }) => {
                  const isCurrent = savedUser.role === id;
                  return (
                    <div
                      key={id}
                      id={`role-${id}`}
                      className={`rs-card ${selectedRole === id ? "selected" : ""}`}
                      onClick={() => !loading && handleRoleSelect(id)}
                    >
                      <div className="rs-card-top">
                        <span className="rs-card-emoji" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 46, height: 46, borderRadius: 12, background: color + "15" }}><Icon size={24} strokeWidth={1.75} color={color} /></span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {isCurrent && (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0", textTransform: "uppercase" }}>
                              Active Role
                            </span>
                          )}
                          <div className="rs-card-check">
                            {selectedRole === id && <Check size={13} strokeWidth={3} />}
                          </div>
                        </div>
                      </div>
                      <div className="rs-card-label">{label}</div>
                      <div className="rs-card-desc">{desc}</div>
                      <div className="rs-card-features">
                        {features.map((f) => (
                          <div key={f} className="rs-card-feature">{f}</div>
                        ))}
                      </div>
                      {!isNewUser && !isCurrent && (
                        <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid #f1f5f9", fontSize: 12, color: color, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                          <span>Switch to {label} →</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {error && <div className="rs-error" style={{ maxWidth: 480, margin: "0 auto 16px" }}><AlertTriangle size={14} strokeWidth={2} style={{ flexShrink: 0, marginRight: 4 }} />{error}</div>}

              {loading && (
                <div style={{ textAlign: "center", padding: "16px", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 14, fontWeight: 600 }}>
                  <div className="spinner" style={{ borderColor: "#cbd5e1", borderTopColor: "#16a34a" }} /> Switching role…
                </div>
              )}
            </>
          )}

          {/* ── STEP 2: Profile Form (new users only) ── */}
          {step === "profile" && selectedRoleData && (
            <div className="rs-profile-card">
              <div className="rs-profile-header">
                <div className="rs-profile-role-badge">
                  {selectedRoleData && <selectedRoleData.Icon size={22} strokeWidth={1.75} color={selectedRoleData.color} />}
                </div>
                <div>
                  <div className="rs-profile-title">Your Details</div>
                  <div className="rs-profile-sub">Joining as {selectedRoleData.label}</div>
                </div>
              </div>

              {error && <div className="rs-error"><AlertTriangle size={14} strokeWidth={2} style={{ flexShrink: 0, marginRight: 4 }} />{error}</div>}

              <form onSubmit={(e) => { e.preventDefault(); handleRoleSave(); }}>
                <div className="rs-fields">
                  <div>
                    <label className="rs-label">Full Name *</label>
                    <input className="rs-input" name="name" required value={form.name} onChange={handleChange} placeholder="Enter your full name" />
                  </div>
                  <div>
                    <label className="rs-label">Mobile Number *</label>
                    <input className="rs-input" name="phone" type="tel" required value={form.phone} onChange={handleChange} placeholder="9876543210" maxLength={10} />
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
                >
                  {loading ? <><div className="spinner" /> Setting up workspace…</> : `Enter as ${selectedRoleData.label}`}
                </button>
              </form>

              <div style={{ marginTop: 14, textAlign: "center" }}>
                <button className="rs-back" onClick={() => setStep("role")}>← Choose a different role</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
