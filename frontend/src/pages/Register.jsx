import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";
import {
  Sprout,
  Wheat,
  ShoppingCart,
  Ship,
  ShieldAlert,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Check,
} from "lucide-react";

const ROLES = [
  {
    id: "farmer",
    label: "Farmer",
    desc: "Grow crops, list harvests & use AI diagnosis",
    Icon: Wheat,
    color: "#16a34a",
    disabled: false,
  },
  {
    id: "user",
    label: "Consumer / Buyer",
    desc: "Purchase fresh produce directly from farmers",
    Icon: ShoppingCart,
    color: "#0284c7",
    disabled: false,
  },
  {
    id: "exporter",
    label: "Exporter",
    desc: "Manage international agricultural shipments",
    Icon: Ship,
    color: "#d97706",
    disabled: false,
  },
  {
    id: "admin",
    label: "Admin",
    desc: "System management (authorized personnel only)",
    Icon: ShieldAlert,
    color: "#dc2626",
    disabled: true,
  },
];

export default function Register() {
  const navigate = useNavigate();

  const [role, setRole] = useState("farmer");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [adminNotice, setAdminNotice] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleSelect = (r) => {
    if (r.id === "admin") {
      setAdminNotice("Admin accounts cannot be self-registered. They must be provisioned through an authorized system administrator.");
      return;
    }
    setAdminNotice("");
    setRole(r.id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    // Validate fields
    if (!form.name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match. Please verify both password fields.");
      return;
    }

    if (role === "admin") {
      setError("Public registration as Admin is not permitted.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          confirmPassword: form.confirmPassword,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create account.");
      }

      setSuccessMsg(data.message || "Account registered successfully!");

      // Short delay or instant redirect to login with registered email
      setTimeout(() => {
        navigate("/login", {
          state: {
            registeredEmail: form.email.trim(),
            message: "Account created successfully! Please sign in with your credentials.",
          },
          replace: true,
        });
      }, 1200);
    } catch (err) {
      setError(err.message || "Unable to complete registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .reg-page {
          min-height: 100vh;
          background: #f8fafc;
          display: grid;
          grid-template-columns: 1fr 1.25fr;
          font-family: 'Inter', sans-serif;
          color: #0f172a;
        }

        /* ── LEFT PANEL ── */
        .reg-left {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px;
          background: linear-gradient(145deg, #f0fdf4 0%, #f8fafc 100%);
          border-right: 1px solid #e2e8f0;
        }

        .reg-brand {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          margin-bottom: 36px;
        }
        .reg-brand-logo {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #16a34a;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(22, 163, 74, 0.25);
        }
        .reg-brand-name {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
        }
        .reg-brand-tag {
          font-size: 11px;
          font-weight: 600;
          color: #16a34a;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .reg-left-heading {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 34px;
          font-weight: 800;
          line-height: 1.2;
          color: #0f172a;
          margin-bottom: 14px;
        }
        .reg-left-heading .hl {
          color: #16a34a;
        }
        .reg-left-sub {
          font-size: 14px;
          color: #475569;
          line-height: 1.6;
          margin-bottom: 28px;
        }

        .reg-roles-showcase {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 32px;
        }
        .reg-role-card-mini {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .reg-role-mini-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .reg-role-mini-title {
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
        }
        .reg-role-mini-desc {
          font-size: 12px;
          color: #64748b;
        }

        /* ── RIGHT PANEL ── */
        .reg-right {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
          background: #ffffff;
          overflow-y: auto;
        }
        .reg-card {
          width: 100%;
          max-width: 540px;
        }

        .reg-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
          text-decoration: none;
          margin-bottom: 20px;
          transition: color 0.15s ease;
        }
        .reg-back:hover {
          color: #16a34a;
        }

        .reg-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 28px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 6px;
        }
        .reg-sub {
          font-size: 14px;
          color: #475569;
          margin-bottom: 24px;
        }

        .reg-role-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-bottom: 24px;
        }
        .reg-role-btn {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
          padding: 12px 14px;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
        }
        .reg-role-btn:hover:not(.is-disabled) {
          border-color: #cbd5e1;
          background: #ffffff;
        }
        .reg-role-btn.is-selected {
          background: #f0fdf4;
          border-color: #16a34a;
          box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.15);
        }
        .reg-role-btn.is-disabled {
          opacity: 0.65;
          cursor: not-allowed;
          background: #f1f5f9;
        }

        .reg-role-btn-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }
        .reg-role-btn-title {
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .reg-role-btn-desc {
          font-size: 11px;
          color: #64748b;
          line-height: 1.3;
        }
        .reg-role-badge-locked {
          font-size: 10px;
          font-weight: 600;
          color: #dc2626;
          background: #fef2f2;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid #fecaca;
        }

        .reg-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .reg-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .reg-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          margin-bottom: 6px;
        }

        .reg-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .reg-input-icon {
          position: absolute;
          left: 14px;
          color: #94a3b8;
          pointer-events: none;
          display: flex;
          align-items: center;
        }
        .reg-input {
          width: 100%;
          padding: 11px 14px 11px 40px;
          font-size: 14px;
          color: #0f172a;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .reg-input::placeholder {
          color: #94a3b8;
        }
        .reg-input:focus {
          border-color: #16a34a;
          box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.12);
        }

        .reg-eye-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
        }
        .reg-eye-btn:hover {
          color: #475569;
        }

        .reg-alert-success {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 14px;
          border-radius: 10px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
          font-size: 13px;
          line-height: 1.4;
        }

        .reg-alert-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 14px;
          border-radius: 10px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
          font-size: 13px;
          line-height: 1.4;
        }

        .reg-alert-info {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 10px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1e40af;
          font-size: 12px;
          line-height: 1.4;
        }

        .reg-submit {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 13px;
          font-size: 15px;
          font-weight: 600;
          color: #ffffff;
          background: #16a34a;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          margin-top: 6px;
          transition: background 0.15s ease, transform 0.05s ease;
          box-shadow: 0 2px 6px rgba(22, 163, 74, 0.25);
        }
        .reg-submit:hover:not(:disabled) {
          background: #15803d;
        }
        .reg-submit:active:not(:disabled) {
          transform: translateY(1px);
        }
        .reg-submit:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .reg-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .reg-footer {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          font-size: 14px;
          color: #475569;
        }
        .reg-footer a {
          color: #16a34a;
          font-weight: 600;
          text-decoration: none;
          margin-left: 4px;
        }
        .reg-footer a:hover {
          text-decoration: underline;
        }

        @media (max-width: 900px) {
          .reg-page { grid-template-columns: 1fr; }
          .reg-left { display: none; }
          .reg-right { padding: 32px 20px; }
          .reg-grid-2 { grid-template-columns: 1fr; }
          .reg-role-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="reg-page">
        {/* ── LEFT HERO PANEL ── */}
        <div className="reg-left">
          <div>
            <Link to="/" className="reg-brand">
              <div className="reg-brand-logo">
                <Sprout size={22} color="#ffffff" strokeWidth={2} />
              </div>
              <div>
                <div className="reg-brand-name">AgroConnect 360</div>
                <div className="reg-brand-tag">Smart Agriculture Platform</div>
              </div>
            </Link>

            <h2 className="reg-left-heading">
              Join the Connected <span className="hl">Agricultural Ecosystem</span>
            </h2>
            <p className="reg-left-sub">
              Create your account in seconds. Access transparent market prices, AI diagnostics, and export tools tailored to your role.
            </p>

            <div className="reg-roles-showcase">
              {ROLES.map((r) => (
                <div className="reg-role-card-mini" key={r.id}>
                  <div
                    className="reg-role-mini-icon"
                    style={{ background: `${r.color}15`, color: r.color }}
                  >
                    <r.Icon size={18} strokeWidth={2} />
                  </div>
                  <div>
                    <div className="reg-role-mini-title">{r.label}</div>
                    <div className="reg-role-mini-desc">{r.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontSize: 13, color: "#64748b", borderTop: "1px solid #e2e8f0", paddingTop: 16 }}>
            🔒 Simple, password-protected account access with instant activation.
          </div>
        </div>

        {/* ── RIGHT PANEL (FORM) ── */}
        <div className="reg-right">
          <div className="reg-card">
            <Link to="/" className="reg-back">
              ← Back to Home
            </Link>

            <h1 className="reg-title">Create Account</h1>
            <p className="reg-sub">
              Select your role and fill in your details to get started.
            </p>

            {/* Role Selection */}
            <div>
              <label className="reg-label">I want to register as</label>
              <div className="reg-role-grid">
                {ROLES.map((r) => {
                  const isSelected = role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleRoleSelect(r)}
                      className={`reg-role-btn ${isSelected ? "is-selected" : ""} ${
                        r.disabled ? "is-disabled" : ""
                      }`}
                    >
                      <div className="reg-role-btn-head">
                        <span className="reg-role-btn-title">
                          <r.Icon size={16} color={r.color} />
                          {r.label}
                        </span>
                        {isSelected && !r.disabled && (
                          <Check size={16} color="#16a34a" strokeWidth={2.5} />
                        )}
                        {r.disabled && (
                          <span className="reg-role-badge-locked">Protected</span>
                        )}
                      </div>
                      <span className="reg-role-btn-desc">{r.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {adminNotice && (
              <div className="reg-alert-info" style={{ marginBottom: 16 }}>
                <ShieldAlert size={16} style={{ flexShrink: 0 }} />
                <span>{adminNotice}</span>
              </div>
            )}

            {successMsg && (
              <div className="reg-alert-success" style={{ marginBottom: 16 }}>
                <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                <span>{successMsg}</span>
              </div>
            )}

            {error && (
              <div className="reg-alert-error" style={{ marginBottom: 16 }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <form className="reg-form" onSubmit={handleSubmit}>
              <div>
                <label className="reg-label" htmlFor="reg-name">
                  Full Name
                </label>
                <div className="reg-input-wrap">
                  <span className="reg-input-icon">
                    <User size={16} />
                  </span>
                  <input
                    id="reg-name"
                    name="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="reg-input"
                    autoComplete="name"
                  />
                </div>
              </div>

              <div>
                <label className="reg-label" htmlFor="reg-email">
                  Email Address
                </label>
                <div className="reg-input-wrap">
                  <span className="reg-input-icon">
                    <Mail size={16} />
                  </span>
                  <input
                    id="reg-email"
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    className="reg-input"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="reg-grid-2">
                <div>
                  <label className="reg-label" htmlFor="reg-password">
                    Password
                  </label>
                  <div className="reg-input-wrap">
                    <span className="reg-input-icon">
                      <Lock size={16} />
                    </span>
                    <input
                      id="reg-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Min. 8 characters"
                      className="reg-input"
                      autoComplete="new-password"
                      style={{ paddingRight: 38 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="reg-eye-btn"
                      title={showPassword ? "Hide password" : "Show password"}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="reg-label" htmlFor="reg-confirm-password">
                    Confirm Password
                  </label>
                  <div className="reg-input-wrap">
                    <span className="reg-input-icon">
                      <Lock size={16} />
                    </span>
                    <input
                      id="reg-confirm-password"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={form.confirmPassword}
                      onChange={handleChange}
                      placeholder="Re-enter password"
                      className="reg-input"
                      autoComplete="new-password"
                      style={{ paddingRight: 38 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="reg-eye-btn"
                      title={showConfirmPassword ? "Hide password" : "Show password"}
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                id="register-submit-btn"
                type="submit"
                className="reg-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="reg-spinner" />
                    Creating Account…
                  </>
                ) : (
                  <>
                    Create Account <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="reg-footer">
              Already have an account?{" "}
              <Link to="/login" id="register-to-login-link">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}