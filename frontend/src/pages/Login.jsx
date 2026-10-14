import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { API_URL } from "../config/api";
import {
  BarChart3,
  Stethoscope,
  TrendingUp,
  CloudSun,
  Sprout,
  Check,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

const FEATURES = [
  { Icon: BarChart3, label: "Live APMC Mandi Prices" },
  { Icon: Stethoscope, label: "Crop Disease AI Diagnosis" },
  { Icon: TrendingUp, label: "ML Price Predictions" },
  { Icon: CloudSun, label: "Hyperlocal Weather Advisories" },
];

const STATS = [
  { value: "12,800+", label: "Active Farmers" },
  { value: "340+", label: "APMC Mandis" },
  { value: "₹48Cr+", label: "Trade Facilitated" },
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.registeredEmail || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState(location.state?.message || "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to sign in. Please verify your credentials.");
      }

      // Store auth session
      localStorage.setItem("agroconnect_token", data.token);
      localStorage.setItem("agroconnect_user", JSON.stringify(data.user));

      // Role-based dashboard redirection
      const role = data.user.role;
      if (role === "farmer") {
        navigate("/farmer/dashboard", { replace: true });
      } else if (role === "exporter") {
        navigate("/exporter/dashboard", { replace: true });
      } else if (role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (role === "user") {
        navigate("/user/dashboard", { replace: true });
      } else {
        navigate("/select-role", { replace: true });
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .auth-page {
          min-height: 100vh;
          background: #f8fafc;
          display: grid;
          grid-template-columns: 1fr 1fr;
          font-family: 'Inter', sans-serif;
          color: #0f172a;
        }

        /* ── LEFT PANEL ── */
        .auth-left {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px;
          background: linear-gradient(145deg, #f0fdf4 0%, #f8fafc 100%);
          border-right: 1px solid #e2e8f0;
        }

        .auth-brand {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          margin-bottom: 48px;
        }
        .auth-brand-logo {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #16a34a;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(22, 163, 74, 0.25);
        }
        .auth-brand-name {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
        }
        .auth-brand-tag {
          font-size: 11px;
          font-weight: 600;
          color: #16a34a;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .auth-left-heading {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 36px;
          font-weight: 800;
          line-height: 1.2;
          color: #0f172a;
          margin-bottom: 16px;
        }
        .auth-left-heading .hl {
          color: #16a34a;
        }
        .auth-left-sub {
          font-size: 15px;
          color: #475569;
          line-height: 1.6;
          margin-bottom: 36px;
          max-width: 460px;
        }

        .auth-feature-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 40px;
        }
        .auth-feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          color: #334155;
          box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        }
        .auth-feature-check {
          margin-left: auto;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #dcfce7;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #16a34a;
        }

        .auth-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
        }
        .auth-stat-val {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: #0f172a;
        }
        .auth-stat-lbl {
          font-size: 12px;
          color: #64748b;
          margin-top: 2px;
        }

        /* ── RIGHT PANEL ── */
        .auth-right {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
          background: #ffffff;
        }
        .auth-card {
          width: 100%;
          max-width: 440px;
        }

        .auth-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
          text-decoration: none;
          margin-bottom: 28px;
          transition: color 0.15s ease;
        }
        .auth-back:hover {
          color: #16a34a;
        }

        .auth-card-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 28px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 8px;
        }
        .auth-card-sub {
          font-size: 14px;
          color: #475569;
          line-height: 1.5;
          margin-bottom: 28px;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .auth-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          margin-bottom: 6px;
        }

        .auth-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .auth-input-icon {
          position: absolute;
          left: 14px;
          color: #94a3b8;
          pointer-events: none;
          display: flex;
          align-items: center;
        }
        .auth-input {
          width: 100%;
          padding: 12px 14px 12px 42px;
          font-size: 14px;
          color: #0f172a;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .auth-input::placeholder {
          color: #94a3b8;
        }
        .auth-input:focus {
          border-color: #16a34a;
          box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.12);
        }
        .auth-input.has-error {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }

        .auth-eye-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          transition: color 0.15s ease;
        }
        .auth-eye-btn:hover {
          color: #475569;
        }

        .auth-alert-success {
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

        .auth-alert-error {
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

        .auth-submit {
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
          transition: background 0.15s ease, transform 0.05s ease;
          box-shadow: 0 2px 6px rgba(22, 163, 74, 0.25);
        }
        .auth-submit:hover:not(:disabled) {
          background: #15803d;
        }
        .auth-submit:active:not(:disabled) {
          transform: translateY(1px);
        }
        .auth-submit:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .auth-spinner {
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

        .auth-footer {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          font-size: 14px;
          color: #475569;
        }
        .auth-footer a {
          color: #16a34a;
          font-weight: 600;
          text-decoration: none;
          margin-left: 4px;
        }
        .auth-footer a:hover {
          text-decoration: underline;
        }

        @media (max-width: 900px) {
          .auth-page { grid-template-columns: 1fr; }
          .auth-left { display: none; }
          .auth-right { padding: 32px 20px; }
        }
      `}</style>

      <div className="auth-page">
        {/* ── LEFT PANEL ── */}
        <div className="auth-left">
          <div>
            <Link to="/" className="auth-brand">
              <div className="auth-brand-logo">
                <Sprout size={22} color="#ffffff" strokeWidth={2} />
              </div>
              <div>
                <div className="auth-brand-name">AgroConnect 360</div>
                <div className="auth-brand-tag">Smart Agriculture Platform</div>
              </div>
            </Link>

            <h2 className="auth-left-heading">
              Smart Agriculture for <span className="hl">Every Stakeholder</span>
            </h2>
            <p className="auth-left-sub">
              Access live APMC mandi rates, AI crop leaf disease analysis, and accurate price forecasts to maximize your agricultural revenue.
            </p>

            <div className="auth-feature-list">
              {FEATURES.map((f) => (
                <div className="auth-feature-item" key={f.label}>
                  <span style={{ display: "flex", alignItems: "center", color: "#16a34a" }}>
                    <f.Icon size={16} strokeWidth={1.75} />
                  </span>
                  <span>{f.label}</span>
                  <div className="auth-feature-check">
                    <Check size={11} strokeWidth={3} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="auth-stats">
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="auth-stat-val">{s.value}</div>
                <div className="auth-stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="auth-right">
          <div className="auth-card">
            <Link to="/" className="auth-back">
              ← Back to Home
            </Link>

            <h1 className="auth-card-title">Sign In</h1>
            <p className="auth-card-sub">
              Enter your registered email address and password to access your dashboard.
            </p>

            {successMsg && (
              <div className="auth-alert-success" style={{ marginBottom: 20 }}>
                <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                <span>{successMsg}</span>
              </div>
            )}

            {error && (
              <div className="auth-alert-error" style={{ marginBottom: 20 }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit}>
              <div>
                <label className="auth-label" htmlFor="login-email">
                  Email Address
                </label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">
                    <Mail size={16} />
                  </span>
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className={`auth-input ${error ? "has-error" : ""}`}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="auth-label" htmlFor="login-password">
                  Password
                </label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">
                    <Lock size={16} />
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className={`auth-input ${error ? "has-error" : ""}`}
                    autoComplete="current-password"
                    style={{ paddingRight: 42 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="auth-eye-btn"
                    title={showPassword ? "Hide password" : "Show password"}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                id="login-btn"
                type="submit"
                className="auth-submit"
                disabled={loading || !email || !password}
              >
                {loading ? (
                  <>
                    <div className="auth-spinner" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign In <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="auth-footer">
              Don't have an account?{" "}
              <Link to="/register" id="login-to-register-link">
                Register here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}