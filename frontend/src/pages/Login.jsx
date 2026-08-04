import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";

const FEATURES = [
  { emoji: "📊", label: "Live APMC Market Prices" },
  { emoji: "🧠", label: "AI Crop Disease Detection" },
  { emoji: "📈", label: "ML Price Predictions" },
  { emoji: "🌦️", label: "Weather Advisory" },
];

const STATS = [
  { value: "12,800+", label: "Active Farmers" },
  { value: "340+", label: "APMC Markets" },
  { value: "₹48Cr+", label: "Revenue Facilitated" },
];

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [focused, setFocused] = useState(false);

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
          background: #050a0e;
          display: grid;
          grid-template-columns: 1fr 1fr;
          font-family: 'Inter', sans-serif;
          color: #f0f6ff;
          overflow: hidden;
          position: relative;
        }

        /* ── LEFT PANEL ──────────────────────────────────────────── */
        .auth-left {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px;
          background: linear-gradient(150deg, #071a0e 0%, #050d18 50%, #08051a 100%);
          overflow: hidden;
        }

        .auth-left-canvas {
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 70% 60% at 20% 20%, rgba(34,197,94,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at 80% 80%, rgba(56,189,248,0.07) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 50% 50%, rgba(167,139,250,0.05) 0%, transparent 60%);
        }
        .auth-left-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 50px 50px;
        }
        .auth-left-orb {
          position: absolute; border-radius: 50%; filter: blur(70px); pointer-events: none;
        }

        .auth-left-content { position: relative; z-index: 1; }

        .auth-brand {
          display: inline-flex; align-items: center; gap: 12px;
          text-decoration: none; margin-bottom: 64px;
        }
        .auth-brand-logo {
          width: 44px; height: 44px; border-radius: 12px;
          background: linear-gradient(135deg, #16a34a, #059669);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; box-shadow: 0 6px 20px rgba(34,197,94,0.4);
        }
        .auth-brand-name {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 20px; font-weight: 800; color: #fff;
        }
        .auth-brand-tag { font-size: 12px; color: rgba(255,255,255,0.4); }

        .auth-left-heading {
          font-family: 'Space Grotesk', sans-serif;
          font-size: clamp(32px, 3.5vw, 48px);
          font-weight: 800; line-height: 1.1;
          letter-spacing: -0.03em; color: #fff;
          margin-bottom: 16px;
        }
        .auth-left-heading .hl {
          background: linear-gradient(135deg, #4ade80, #22d3ee);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .auth-left-sub {
          font-size: 16px; color: rgba(255,255,255,0.55); line-height: 1.7;
          max-width: 380px; margin-bottom: 48px;
        }

        .auth-feature-list { display: flex; flex-direction: column; gap: 14px; }
        .auth-feature-item {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 18px; border-radius: 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.8);
          transition: background 0.2s, border-color 0.2s;
        }
        .auth-feature-item:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.1); }
        .auth-feature-emoji { font-size: 20px; }
        .auth-feature-check {
          margin-left: auto; width: 20px; height: 20px; border-radius: 6px;
          background: rgba(34,197,94,0.15); display: flex; align-items: center;
          justify-content: center; font-size: 11px; color: #4ade80;
        }

        .auth-stats {
          display: flex; gap: 32px; padding-top: 40px;
          border-top: 1px solid rgba(255,255,255,0.07);
        }
        .auth-stat-val {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 22px; font-weight: 800; color: #fff;
        }
        .auth-stat-lbl { font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 2px; }

        /* ── RIGHT PANEL ─────────────────────────────────────────── */
        .auth-right {
          display: flex; align-items: center; justify-content: center;
          padding: 48px 56px;
          background: #080c10;
          border-left: 1px solid rgba(255,255,255,0.06);
        }
        .auth-card {
          width: 100%; max-width: 440px;
        }

        .auth-back {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 13px; color: rgba(255,255,255,0.45);
          text-decoration: none; margin-bottom: 48px;
          transition: color 0.2s;
        }
        .auth-back:hover { color: rgba(255,255,255,0.8); }

        .auth-card-icon {
          width: 64px; height: 64px; border-radius: 18px;
          background: rgba(34,197,94,0.12);
          border: 1px solid rgba(34,197,94,0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 28px; margin-bottom: 28px;
          box-shadow: 0 0 40px rgba(34,197,94,0.1);
        }

        .auth-card-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 32px; font-weight: 800;
          color: #fff; letter-spacing: -0.03em; line-height: 1.15;
          margin-bottom: 10px;
        }
        .auth-card-sub { font-size: 15px; color: rgba(255,255,255,0.45); line-height: 1.6; }

        .auth-form { margin-top: 36px; display: flex; flex-direction: column; gap: 20px; }

        .auth-label {
          font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.7);
          letter-spacing: 0.03em; text-transform: uppercase;
          display: block; margin-bottom: 8px;
        }

        .auth-input-wrap { position: relative; }
        .auth-input-icon {
          position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
          font-size: 18px; pointer-events: none;
          transition: opacity 0.2s;
        }
        .auth-input {
          width: 100%; background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px; padding: 16px 16px 16px 46px;
          color: #fff; font-size: 15px; font-family: 'Inter', sans-serif;
          outline: none; transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .auth-input::placeholder { color: rgba(255,255,255,0.25); }
        .auth-input:focus {
          border-color: rgba(34,197,94,0.5);
          background: rgba(34,197,94,0.04);
          box-shadow: 0 0 0 4px rgba(34,197,94,0.08), 0 0 20px rgba(34,197,94,0.05);
        }
        .auth-input.has-error { border-color: rgba(248,113,113,0.5); }

        .auth-error {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 16px; border-radius: 12px;
          background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
          font-size: 14px; color: #fca5a5;
        }

        .auth-submit {
          width: 100%; padding: 17px; border-radius: 14px;
          background: linear-gradient(135deg, #16a34a 0%, #059669 100%);
          color: #fff; font-size: 16px; font-weight: 700;
          font-family: 'Inter', sans-serif; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          box-shadow: 0 8px 32px rgba(34,197,94,0.3);
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
          position: relative; overflow: hidden;
        }
        .auth-submit::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%);
          opacity: 0; transition: opacity 0.2s;
        }
        .auth-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 16px 48px rgba(34,197,94,0.4);
        }
        .auth-submit:hover::before { opacity: 1; }
        .auth-submit:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

        .auth-spinner {
          width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff; border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .auth-note {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 16px; border-radius: 14px;
          background: rgba(34,197,94,0.06); border: 1px solid rgba(34,197,94,0.12);
        }
        .auth-note-icon { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
        .auth-note-text { font-size: 13px; color: rgba(255,255,255,0.55); line-height: 1.6; }
        .auth-note-text strong { color: rgba(255,255,255,0.8); }

        .auth-divider {
          display: flex; align-items: center; gap: 12px;
          color: rgba(255,255,255,0.2); font-size: 12px;
        }
        .auth-divider::before, .auth-divider::after {
          content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.08);
        }

        @media (max-width: 900px) {
          .auth-page { grid-template-columns: 1fr; }
          .auth-left { display: none; }
          .auth-right { padding: 32px 24px; }
        }
      `}</style>

      <div className="auth-page">
        {/* ── LEFT PANEL ───────────────────────────────────────────── */}
        <div className="auth-left">
          <div className="auth-left-canvas" />
          <div className="auth-left-grid" />
          <div className="auth-left-orb" style={{ width: 300, height: 300, background: "rgba(34,197,94,0.1)", top: "-80px", left: "-80px" }} />
          <div className="auth-left-orb" style={{ width: 200, height: 200, background: "rgba(56,189,248,0.08)", bottom: "100px", right: "-40px" }} />

          <div className="auth-left-content">
            <Link to="/" className="auth-brand">
              <div className="auth-brand-logo">🌱</div>
              <div>
                <div className="auth-brand-name">AgroConnect 360</div>
                <div className="auth-brand-tag">Smart Agriculture Platform</div>
              </div>
            </Link>

            <h2 className="auth-left-heading">
              Your farm's<br />
              <span className="hl">smartest partner</span><br />
              awaits
            </h2>
            <p className="auth-left-sub">
              Join 12,800+ farmers already using AI-powered tools to predict prices, detect diseases, and sell directly to buyers.
            </p>

            <div className="auth-feature-list">
              {FEATURES.map((f) => (
                <div className="auth-feature-item" key={f.label}>
                  <span className="auth-feature-emoji">{f.emoji}</span>
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

        {/* ── RIGHT PANEL ──────────────────────────────────────────── */}
        <div className="auth-right">
          <div className="auth-card">
            <Link to="/" className="auth-back">
              ← Back to Home
            </Link>

            <div className="auth-card-icon">📧</div>
            <h1 className="auth-card-title">Welcome back</h1>
            <p className="auth-card-sub">
              Enter your email and we'll send a one-time verification code — no password needed.
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
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder="you@example.com"
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
                <span className="auth-note-icon">🔒</span>
                <p className="auth-note-text">
                  <strong>No password required.</strong> We'll send a 6-digit code to your inbox. New users are automatically registered on first login.
                </p>
              </div>

              <div className="auth-divider">New here? Your account is created automatically</div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}