import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";

const FEATURES = [
  { emoji: "📊", label: "Live APMC Mandi Prices" },
  { emoji: "🩺", label: "Crop Disease AI Diagnosis" },
  { emoji: "📈", label: "ML Price Predictions" },
  { emoji: "🌦️", label: "Hyperlocal Weather Advisories" },
];

const STATS = [
  { value: "12,800+", label: "Active Farmers" },
  { value: "340+", label: "APMC Mandis" },
  { value: "₹48Cr+", label: "Trade Facilitated" },
];

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to send verification code");
      navigate("/verify-otp", { state: { email } });
    } catch (err) {
      setError(err.message);
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
          font-size: 20px;
          color: #ffffff;
        }
        .auth-brand-name {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
        }
        .auth-brand-tag {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
        }

        .auth-left-heading {
          font-family: 'Space Grotesk', sans-serif;
          font-size: clamp(30px, 3vw, 42px);
          font-weight: 800;
          line-height: 1.2;
          letter-spacing: -0.02em;
          color: #0f172a;
          margin-bottom: 14px;
        }
        .auth-left-heading .hl {
          color: #16a34a;
        }
        .auth-left-sub {
          font-size: 15px;
          color: #64748b;
          line-height: 1.65;
          max-width: 420px;
          margin-bottom: 36px;
        }

        .auth-feature-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .auth-feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 12px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          font-size: 14px;
          font-weight: 500;
          color: #1e293b;
        }
        .auth-feature-check {
          margin-left: auto;
          width: 20px;
          height: 20px;
          border-radius: 6px;
          background: #dcfce7;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          color: #15803d;
        }

        .auth-stats {
          display: flex;
          gap: 32px;
          padding-top: 36px;
          border-top: 1px solid #e2e8f0;
        }
        .auth-stat-val {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 22px;
          font-weight: 800;
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
          padding: 48px 40px;
          background: #f8fafc;
        }
        .auth-card {
          width: 100%;
          max-width: 420px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 36px 32px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
        }

        .auth-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
          text-decoration: none;
          margin-bottom: 24px;
          transition: color 0.15s ease;
        }
        .auth-back:hover { color: #0f172a; }

        .auth-card-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 28px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
          margin-bottom: 8px;
        }
        .auth-card-sub {
          font-size: 14px;
          color: #64748b;
          line-height: 1.6;
        }

        .auth-form {
          margin-top: 28px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .auth-label {
          font-size: 12px;
          font-weight: 700;
          color: #475569;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          display: block;
          margin-bottom: 6px;
        }

        .auth-input-wrap { position: relative; }
        .auth-input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 16px;
          pointer-events: none;
        }
        .auth-input {
          width: 100%;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 12px 14px 12px 42px;
          color: #0f172a;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .auth-input::placeholder { color: #94a3b8; }
        .auth-input:focus {
          border-color: #16a34a;
          box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.12);
        }
        .auth-input.has-error { border-color: #ef4444; }

        .auth-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 14px;
          border-radius: 10px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          font-size: 13px;
          color: #991b1b;
        }

        .auth-submit {
          width: 100%;
          padding: 13px;
          border-radius: 10px;
          background: #16a34a;
          color: #ffffff;
          font-size: 15px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 2px 4px rgba(22, 163, 74, 0.2);
          transition: background 0.15s, transform 0.15s;
        }
        .auth-submit:hover:not(:disabled) {
          background: #15803d;
          transform: translateY(-1px);
        }
        .auth-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .auth-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid #ffffff;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .auth-note {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 10px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
        }
        .auth-note-text {
          font-size: 12.5px;
          color: #166534;
          line-height: 1.55;
        }
        .auth-note-text strong {
          color: #14532d;
        }

        .auth-divider {
          text-align: center;
          font-size: 12px;
          color: #94a3b8;
          padding-top: 6px;
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
              <div className="auth-brand-logo">🌱</div>
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
                  <span>{f.emoji}</span>
                  <span>{f.label}</span>
                  <div className="auth-feature-check">✓</div>
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

            <h1 className="auth-card-title">Welcome to AgroConnect</h1>
            <p className="auth-card-sub">
              Enter your email address to receive an instant verification code. No password needed.
            </p>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div>
                <label className="auth-label" htmlFor="login-email">Email Address</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">✉️</span>
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="farmer@example.com"
                    className={`auth-input ${error ? "has-error" : ""}`}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="auth-error">
                  <span>⚠️</span> {error}
                </div>
              )}

              <button
                id="send-otp-btn"
                type="submit"
                className="auth-submit"
                disabled={loading || !email}
              >
                {loading ? (
                  <>
                    <div className="auth-spinner" />
                    Sending Code…
                  </>
                ) : (
                  <>
                    Send Verification Code →
                  </>
                )}
              </button>

              <div className="auth-note">
                <span style={{ fontSize: 16 }}>🔒</span>
                <p className="auth-note-text">
                  <strong>Secure & Passwordless:</strong> A 6-digit code will be sent to your email. First-time users are automatically registered.
                </p>
              </div>

              <div className="auth-divider">First time? Your account is created instantly upon verification</div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}