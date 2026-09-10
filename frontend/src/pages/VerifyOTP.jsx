import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";
import { Sprout, MailCheck, Mail, Check, AlertTriangle, ShieldCheck } from "lucide-react";

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
      setMessage("New code sent to your inbox!");
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
          background: #f8fafc;
          display: grid;
          grid-template-columns: 1fr 1fr;
          font-family: 'Inter', sans-serif;
          color: #0f172a;
        }

        /* LEFT */
        .auth-left {
          display: flex; flex-direction: column;
          justify-content: center; padding: 64px 56px;
          background: linear-gradient(145deg, #f0fdf4 0%, #f8fafc 100%);
          border-right: 1px solid #e2e8f0;
        }
        .auth-brand {
          display: inline-flex; align-items: center; gap: 12px;
          text-decoration: none; margin-bottom: 48px;
        }
        .auth-brand-logo {
          width: 42px; height: 42px; border-radius: 12px;
          background: #16a34a;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; color: #ffffff;
        }
        .auth-brand-name {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;
        }
        .auth-brand-sub { font-size: 12px; color: #64748b; }

        .verify-illustration {
          font-size: 64px; line-height: 1; margin-bottom: 24px;
        }

        .auth-left-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 36px; font-weight: 800; color: #0f172a;
          line-height: 1.2; letter-spacing: -0.02em; margin-bottom: 12px;
        }
        .auth-left-title .hl { color: #16a34a; }
        .auth-left-desc { font-size: 15px; color: #64748b; line-height: 1.65; max-width: 400px; }

        .email-chip {
          display: inline-flex; align-items: center; gap: 8px;
          margin-top: 24px; padding: 10px 16px; border-radius: 10px;
          background: #f0fdf4; border: 1px solid #bbf7d0;
          font-size: 14px; font-weight: 600; color: #166534;
        }

        .steps-list { margin-top: 40px; display: flex; flex-direction: column; gap: 14px; }
        .step-row { display: flex; align-items: center; gap: 12px; }
        .step-bubble {
          width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
          background: #f1f5f9; border: 1px solid #cbd5e1;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; color: #64748b;
        }
        .step-bubble.done { background: #dcfce7; border-color: #bbf7d0; color: #15803d; }
        .step-bubble.active { background: #16a34a; border-color: #16a34a; color: #ffffff; }
        .step-text { font-size: 14px; }
        .step-text.done { color: #94a3b8; text-decoration: line-through; }
        .step-text.active { color: #0f172a; font-weight: 600; }
        .step-text.pending { color: #94a3b8; }

        /* RIGHT */
        .auth-right {
          display: flex; align-items: center; justify-content: center;
          padding: 48px 40px; background: #f8fafc;
        }
        .auth-card {
          width: 100%; max-width: 420px;
          background: #ffffff; border: 1px solid #e2e8f0;
          border-radius: 20px; padding: 36px 32px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
        }

        .auth-back {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 13px; font-weight: 500; color: #64748b;
          text-decoration: none; margin-bottom: 24px; transition: color 0.15s ease;
        }
        .auth-back:hover { color: #0f172a; }

        .auth-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 26px; font-weight: 800; color: #0f172a;
          letter-spacing: -0.02em; margin-bottom: 6px;
        }
        .auth-sub { font-size: 14px; color: #64748b; line-height: 1.6; }
        .auth-sub strong { color: #0f172a; }

        /* OTP BOXES */
        .otp-form { margin-top: 28px; }
        .otp-label {
          font-size: 12px; font-weight: 700; color: #475569;
          text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 12px;
        }
        .otp-boxes {
          display: flex; gap: 8px; margin-bottom: 20px; justify-content: flex-start;
        }
        .otp-box {
          width: 40px; height: 40px; flex-shrink: 0;
          border-radius: 8px;
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          color: #0f172a; font-size: 16px; font-weight: 700;
          font-family: 'Space Grotesk', sans-serif;
          text-align: center; outline: none; padding: 0;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .otp-box:focus {
          border-color: #16a34a;
          box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.12);
        }
        .otp-box.filled { border-color: #16a34a; background: #f0fdf4; }
        .otp-box.error { border-color: #ef4444; }

        .auth-alert {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 14px; border-radius: 10px; font-size: 13px;
          margin-bottom: 16px;
        }
        .auth-alert.error {
          background: #fef2f2; border: 1px solid #fecaca;
          color: #991b1b;
        }
        .auth-alert.success {
          background: #f0fdf4; border: 1px solid #bbf7d0;
          color: #166534;
        }

        .auth-submit {
          width: 100%; padding: 13px; border-radius: 10px;
          background: #16a34a;
          color: #ffffff; font-size: 15px; font-weight: 600;
          font-family: 'Inter', sans-serif; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 2px 4px rgba(22, 163, 74, 0.2);
          transition: background 0.15s, transform 0.15s;
        }
        .auth-submit:hover:not(:disabled) {
          background: #15803d;
          transform: translateY(-1px);
        }
        .auth-submit:disabled { opacity: 0.55; cursor: not-allowed; }
        .auth-submit.incomplete {
          background: #f1f5f9; border: 1px solid #cbd5e1; box-shadow: none; color: #94a3b8;
        }

        .auth-spinner {
          width: 18px; height: 18px; border: 2px solid #ffffff;
          border-top-color: transparent; border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .otp-footer {
          margin-top: 24px; padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 10px;
        }
        .resend-text { font-size: 13px; color: #64748b; }
        .resend-btn {
          background: none; border: none; cursor: pointer;
          font-size: 13px; font-weight: 700; color: #16a34a;
          font-family: 'Inter', sans-serif;
          padding: 4px 8px; border-radius: 6px;
        }
        .resend-btn:hover { text-decoration: underline; }
        .resend-btn:disabled { color: #94a3b8; cursor: not-allowed; text-decoration: none; }
        .resend-countdown {
          font-size: 13px; color: #64748b; font-weight: 600;
        }

        @media (max-width: 900px) {
          .auth-page { grid-template-columns: 1fr; }
          .auth-left { display: none; }
          .auth-right { padding: 32px 20px; }
        }
      `}</style>

      <div className="auth-page">
        {/* ── LEFT ── */}
        <div className="auth-left">
          <Link to="/" className="auth-brand">
            <div className="auth-brand-logo"><Sprout size={22} color="#16a34a" /></div>
            <div>
              <div className="auth-brand-name">AgroConnect 360</div>
              <div className="auth-brand-sub">Smart Agriculture Platform</div>
            </div>
          </Link>

          <div className="verify-illustration" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MailCheck size={48} color="#16a34a" />
          </div>

          <h2 className="auth-left-title">
            One Code Away from Your <span className="hl">Agri Hub</span>
          </h2>
          <p className="auth-left-desc">
            We sent a 6-digit verification code to your email. Enter it below to access your tailored dashboard.
          </p>

          {email && (
            <div className="email-chip" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Mail size={14} /> {email}
            </div>
          )}

          <div className="steps-list">
            <div className="step-row">
              <div className="step-bubble done"><Check size={12} strokeWidth={3} /></div>
              <span className="step-text done">Enter your email address</span>
            </div>
            <div className="step-row">
              <div className="step-bubble active">2</div>
              <span className="step-text active">Verify 6-digit code</span>
            </div>
            <div className="step-row">
              <div className="step-bubble">3</div>
              <span className="step-text pending">Select your role</span>
            </div>
          </div>

          <div className="auth-left-footer">
            <span>&copy; {new Date().getFullYear()} AgroConnect 360</span>
            <span>·</span>
            <span>Privacy Policy</span>
            <span>·</span>
            <span>Help Center</span>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="auth-right">
          <div className="auth-card">
            <Link to="/login" className="auth-back">
              ← Change Email
            </Link>

            <h1 className="auth-card-title">Check your inbox</h1>
            <p className="auth-card-sub">
              We've sent a 6-digit code to <strong style={{ color: "#16a34a" }}>{email || "your email"}</strong>.
              Enter it below to continue.
            </p>

            <form className="otp-form" onSubmit={handleSubmit}>
              <div className="otp-label">6-Digit Code</div>

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
                <div className="auth-alert error" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <AlertTriangle size={15} /> {error}
                </div>
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
                  <><ShieldCheck size={16} style={{ marginRight: 6, verticalAlign: "middle" }} /> Verify & Continue</>
                ) : (
                  <>Enter all 6 digits to continue</>
                )}
              </button>

              <div className="otp-footer">
                <span className="resend-text">Didn't receive the code?</span>
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