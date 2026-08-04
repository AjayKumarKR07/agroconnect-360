import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";

export default function VerifyOTP() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef([]);

  // Auto-focus first box on mount
  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleOtpChange = (index, val) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setError("");
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...otp];
    pasted.split("").forEach((d, i) => { next[i] = d; });
    setOtp(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const otpValue = otp.join("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { navigate("/login"); return; }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpValue }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "OTP verification failed");

      localStorage.setItem("agroconnect_token", data.token);
      localStorage.setItem("agroconnect_user", JSON.stringify(data.user));

      // Always show role selection after login
      navigate("/select-role", {
        state: {
          email: data.user.email,
          isNewUser: data.isNewUser || !data.profileCompleted,
        },
        replace: true,
      });

    } catch (err) {
      setError(err.message || "Unable to verify OTP");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) { navigate("/login"); return; }
    setResending(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${API_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to resend code");
      setOtp(["", "", "", "", "", ""]);
      setCountdown(60);
      setMessage("✓ New code sent to your inbox!");
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  const isComplete = otpValue.length === 6;

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
        }

        /* LEFT */
        .auth-left {
          position: relative;
          display: flex; flex-direction: column;
          justify-content: center; padding: 64px 56px;
          background: linear-gradient(150deg, #071a0e 0%, #050d18 60%, #08051a 100%);
          overflow: hidden;
        }
        .auth-left-canvas {
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 70% 60% at 30% 30%, rgba(34,197,94,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at 70% 70%, rgba(56,189,248,0.07) 0%, transparent 60%);
        }
        .auth-left-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 50px 50px;
        }
        .auth-orb {
          position: absolute; border-radius: 50%; filter: blur(70px); pointer-events: none;
        }

        .auth-left-inner { position: relative; z-index: 1; }

        .auth-brand {
          display: inline-flex; align-items: center; gap: 12px;
          text-decoration: none; margin-bottom: 56px;
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
        .auth-brand-sub { font-size: 12px; color: rgba(255,255,255,0.4); }

        .verify-illustration {
          font-size: 80px; line-height: 1; margin-bottom: 36px;
          animation: float 4s ease-in-out infinite;
        }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }

        .auth-left-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 38px; font-weight: 800; color: #fff;
          line-height: 1.15; letter-spacing: -0.03em; margin-bottom: 16px;
        }
        .auth-left-title .hl {
          background: linear-gradient(135deg, #4ade80, #22d3ee);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .auth-left-desc { font-size: 15px; color: rgba(255,255,255,0.5); line-height: 1.7; max-width: 360px; }

        .email-chip {
          display: inline-flex; align-items: center; gap: 8px;
          margin-top: 28px; padding: 10px 18px; border-radius: 10px;
          background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2);
          font-size: 14px; font-weight: 600; color: #4ade80;
        }

        .steps-list { margin-top: 48px; display: flex; flex-direction: column; gap: 16px; }
        .step-row { display: flex; align-items: center; gap: 14px; }
        .step-bubble {
          width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.5);
        }
        .step-bubble.done { background: rgba(34,197,94,0.15); border-color: rgba(34,197,94,0.3); color: #4ade80; }
        .step-bubble.active { background: rgba(34,197,94,0.2); border-color: rgba(34,197,94,0.5); color: #4ade80; box-shadow: 0 0 12px rgba(34,197,94,0.2); }
        .step-text { font-size: 14px; }
        .step-text.done { color: rgba(255,255,255,0.4); text-decoration: line-through; }
        .step-text.active { color: #fff; font-weight: 600; }
        .step-text.pending { color: rgba(255,255,255,0.3); }

        /* RIGHT */
        .auth-right {
          display: flex; align-items: center; justify-content: center;
          padding: 48px 56px; background: #080c10;
          border-left: 1px solid rgba(255,255,255,0.06);
        }
        .auth-card { width: 100%; max-width: 440px; }

        .auth-back {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 13px; color: rgba(255,255,255,0.4);
          text-decoration: none; margin-bottom: 48px; transition: color 0.2s;
        }
        .auth-back:hover { color: rgba(255,255,255,0.75); }

        .auth-icon-ring {
          width: 72px; height: 72px; border-radius: 20px; margin-bottom: 28px;
          background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2);
          display: flex; align-items: center; justify-content: center; font-size: 32px;
          box-shadow: 0 0 40px rgba(34,197,94,0.08);
        }

        .auth-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 30px; font-weight: 800; color: #fff;
          letter-spacing: -0.03em; margin-bottom: 8px;
        }
        .auth-sub { font-size: 14px; color: rgba(255,255,255,0.45); line-height: 1.65; }
        .auth-sub strong { color: rgba(255,255,255,0.75); }

        /* OTP BOXES */
        .otp-form { margin-top: 36px; }
        .otp-label {
          font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.6);
          text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px;
        }
        .otp-boxes {
          display: flex; gap: 8px; margin-bottom: 24px;
        }
        .otp-box {
          flex: 1; width: 52px; height: 60px; border-radius: 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff; font-size: 22px; font-weight: 800;
          font-family: 'Space Grotesk', sans-serif;
          text-align: center; outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s, transform 0.1s;
          caret-color: transparent;
        }
        .otp-box:focus {
          border-color: rgba(34,197,94,0.6);
          background: rgba(34,197,94,0.06);
          box-shadow: 0 0 0 4px rgba(34,197,94,0.1), 0 0 20px rgba(34,197,94,0.08);
          transform: scale(1.05);
        }
        .otp-box.filled { border-color: rgba(34,197,94,0.35); background: rgba(34,197,94,0.05); }
        .otp-box.error { border-color: rgba(239,68,68,0.5); }

        .auth-alert {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 16px; border-radius: 12px; font-size: 14px;
          margin-bottom: 20px;
        }
        .auth-alert.error {
          background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
          color: #fca5a5;
        }
        .auth-alert.success {
          background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2);
          color: #86efac;
        }

        .auth-submit {
          width: 100%; padding: 17px; border-radius: 14px;
          background: linear-gradient(135deg, #16a34a, #059669);
          color: #fff; font-size: 16px; font-weight: 700;
          font-family: 'Inter', sans-serif; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          box-shadow: 0 8px 32px rgba(34,197,94,0.25);
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
          position: relative; overflow: hidden;
        }
        .auth-submit::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%);
          opacity: 0; transition: opacity 0.2s;
        }
        .auth-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 16px 48px rgba(34,197,94,0.35); }
        .auth-submit:hover::before { opacity: 1; }
        .auth-submit:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
        .auth-submit.incomplete { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); box-shadow: none; color: rgba(255,255,255,0.4); }

        .auth-spinner {
          width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff; border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .otp-footer {
          margin-top: 28px; padding-top: 24px;
          border-top: 1px solid rgba(255,255,255,0.06);
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 10px;
        }
        .resend-text { font-size: 13px; color: rgba(255,255,255,0.4); }
        .resend-btn {
          background: none; border: none; cursor: pointer;
          font-size: 13px; font-weight: 700; color: #4ade80;
          font-family: 'Inter', sans-serif;
          padding: 6px 14px; border-radius: 8px;
          transition: background 0.2s;
        }
        .resend-btn:hover { background: rgba(34,197,94,0.1); }
        .resend-btn:disabled { color: rgba(255,255,255,0.25); cursor: not-allowed; }
        .resend-countdown {
          font-size: 13px; color: rgba(255,255,255,0.3);
          padding: 6px 14px; border-radius: 8px;
          background: rgba(255,255,255,0.03);
        }

        @media (max-width: 900px) {
          .auth-page { grid-template-columns: 1fr; }
          .auth-left { display: none; }
          .auth-right { padding: 32px 24px; }
        }
      `}</style>

      <div className="auth-page">
        {/* ── LEFT ───────────────────────────────────────────────────── */}
        <div className="auth-left">
          <div className="auth-left-canvas" />
          <div className="auth-left-grid" />
          <div className="auth-orb" style={{ width: 300, height: 300, background: "rgba(34,197,94,0.1)", top: "-80px", left: "-80px" }} />
          <div className="auth-orb" style={{ width: 200, height: 200, background: "rgba(56,189,248,0.08)", bottom: "80px", right: "-40px" }} />

          <div className="auth-left-inner">
            <Link to="/" className="auth-brand">
              <div className="auth-brand-logo">🌱</div>
              <div>
                <div className="auth-brand-name">AgroConnect 360</div>
                <div className="auth-brand-sub">Smart Agriculture Platform</div>
              </div>
            </Link>

            <div className="verify-illustration">📬</div>

            <h2 className="auth-left-title">
              One code away<br />from your <span className="hl">smart farm</span>
            </h2>
            <p className="auth-left-desc">
              We sent a 6-digit code to your inbox. It expires in 10 minutes for your security.
            </p>

            {email && (
              <div className="email-chip">
                ✉️ {email}
              </div>
            )}

            <div className="steps-list">
              <div className="step-row">
                <div className="step-bubble done">✓</div>
                <span className="step-text done">Enter your email address</span>
              </div>
              <div className="step-row">
                <div className="step-bubble active">2</div>
                <span className="step-text active">Verify your 6-digit OTP</span>
              </div>
              <div className="step-row">
                <div className="step-bubble" style={{ color: "rgba(255,255,255,0.25)" }}>3</div>
                <span className="step-text pending">Complete your profile</span>
              </div>
              <div className="step-row">
                <div className="step-bubble" style={{ color: "rgba(255,255,255,0.25)" }}>4</div>
                <span className="step-text pending">Access your dashboard</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT ──────────────────────────────────────────────────── */}
        <div className="auth-right">
          <div className="auth-card">
            <Link to="/login" className="auth-back">← Use a different email</Link>

            <div className="auth-icon-ring">🔐</div>
            <h1 className="auth-title">Enter your code</h1>
            <p className="auth-sub">
              6-digit code sent to&nbsp;
              <strong>{email || "your email"}</strong>.<br />
              Check your spam folder if needed.
            </p>

            <form className="otp-form" onSubmit={handleSubmit}>
              <div className="otp-label">Verification Code</div>

              <div className="otp-boxes" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputRefs.current[i] = el)}
                    id={`otp-box-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className={`otp-box ${error ? "error" : ""} ${digit ? "filled" : ""}`}
                  />
                ))}
              </div>

              {error && (
                <div className="auth-alert error">⚠️ {error}</div>
              )}
              {message && (
                <div className="auth-alert success">{message}</div>
              )}

              <button
                id="verify-otp-btn"
                type="submit"
                className={`auth-submit ${!isComplete ? "incomplete" : ""}`}
                disabled={!isComplete || loading}
              >
                {loading ? (
                  <><div className="auth-spinner" /> Verifying…</>
                ) : isComplete ? (
                  <>🔓 Verify & Enter Dashboard</>
                ) : (
                  <>Enter all 6 digits to continue</>
                )}
              </button>

              <div className="otp-footer">
                <span className="resend-text">Didn't get the code?</span>
                {countdown > 0 ? (
                  <span className="resend-countdown">Resend in {countdown}s</span>
                ) : (
                  <button
                    id="resend-otp-btn"
                    type="button"
                    className="resend-btn"
                    onClick={handleResend}
                    disabled={resending}
                  >
                    {resending ? "Sending…" : "Resend Code"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}