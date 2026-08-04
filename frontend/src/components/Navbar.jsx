import { Link } from "react-router-dom";
import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Track scroll for background change
  if (typeof window !== "undefined") {
    window.addEventListener("scroll", () => {
      setScrolled(window.scrollY > 20);
    }, { passive: true });
  }

  return (
    <>
      <style>{`
        .navbar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          transition: background 0.3s, backdrop-filter 0.3s, border-color 0.3s;
          border-bottom: 1px solid transparent;
        }
        .navbar.scrolled {
          background: rgba(5,10,14,0.85);
          backdrop-filter: blur(20px);
          border-color: rgba(255,255,255,0.08);
        }
        .navbar-inner {
          max-width: 1280px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 32px;
        }
        .nav-brand {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none; font-family: 'Space Grotesk', sans-serif;
        }
        .nav-logo {
          width: 38px; height: 38px; border-radius: 10px;
          background: linear-gradient(135deg, #16a34a, #059669);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; box-shadow: 0 4px 14px rgba(34,197,94,0.35);
        }
        .nav-brand-text { font-size: 18px; font-weight: 800; color: #fff; }
        .nav-brand-sub { font-size: 11px; color: rgba(255,255,255,0.45); margin-top: -2px; }

        .nav-links {
          display: flex; align-items: center; gap: 36px; list-style: none;
        }
        .nav-link {
          font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.65);
          text-decoration: none; transition: color 0.2s; letter-spacing: 0.01em;
        }
        .nav-link:hover { color: #fff; }

        .nav-cta {
          display: inline-flex; align-items: center; gap: 8px;
          background: linear-gradient(135deg, #16a34a, #059669);
          color: #fff; font-weight: 700; font-size: 14px;
          padding: 10px 22px; border-radius: 10px; text-decoration: none;
          box-shadow: 0 4px 16px rgba(34,197,94,0.3);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .nav-cta:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(34,197,94,0.4);
        }

        .nav-hamburger {
          display: none; background: none; border: none; cursor: pointer;
          padding: 4px; color: #fff; font-size: 22px;
        }

        .nav-mobile {
          background: rgba(5,10,14,0.97); backdrop-filter: blur(20px);
          border-top: 1px solid rgba(255,255,255,0.08);
          padding: 20px 32px; display: flex; flex-direction: column; gap: 14px;
        }
        .nav-mobile a { color: rgba(255,255,255,0.75); text-decoration: none; font-size: 16px; padding: 8px 0; }
        .nav-mobile-cta {
          margin-top: 8px; background: linear-gradient(135deg, #16a34a, #059669);
          color: #fff; font-weight: 700; padding: 13px; border-radius: 10px;
          text-align: center; text-decoration: none;
        }

        @media (max-width: 768px) {
          .nav-links, .nav-cta { display: none; }
          .nav-hamburger { display: block; }
          .navbar-inner { padding: 14px 20px; }
        }
      `}</style>

      <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
        <div className="navbar-inner">
          <Link to="/" className="nav-brand">
            <div className="nav-logo">🌱</div>
            <div>
              <div className="nav-brand-text">AgroConnect 360</div>
              <div className="nav-brand-sub">Smart Agriculture</div>
            </div>
          </Link>

          <ul className="nav-links">
            <li><a href="#features" className="nav-link">Features</a></li>
            <li><a href="#users" className="nav-link">Who It's For</a></li>
            <li><a href="#ai" className="nav-link">AI Tools</a></li>
            <li><a href="#how" className="nav-link">How It Works</a></li>
          </ul>

          <Link to="/login" className="nav-cta" id="navbar-login-btn">
            Login / Get Started →
          </Link>

          <button className="nav-hamburger" onClick={() => setOpen(!open)}>
            {open ? "✕" : "☰"}
          </button>
        </div>

        {open && (
          <div className="nav-mobile">
            <a href="#features" onClick={() => setOpen(false)}>Features</a>
            <a href="#users" onClick={() => setOpen(false)}>Who It's For</a>
            <a href="#ai" onClick={() => setOpen(false)}>AI Tools</a>
            <a href="#how" onClick={() => setOpen(false)}>How It Works</a>
            <Link to="/login" className="nav-mobile-cta" onClick={() => setOpen(false)}>
              Login / Get Started
            </Link>
          </div>
        )}
      </nav>
    </>
  );
}