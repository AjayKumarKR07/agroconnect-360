import { Link } from "react-router-dom";
import { Sprout, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <style>{`
        .navbar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          transition: background 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
          border-bottom: 1px solid transparent;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
        }
        .navbar.scrolled {
          background: rgba(255, 255, 255, 0.96);
          border-color: #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        .navbar-inner {
          max-width: 1280px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 32px;
        }
        .nav-brand {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none; font-family: 'Space Grotesk', sans-serif;
        }
        .nav-logo {
          width: 38px; height: 38px; border-radius: 10px;
          background: #16a34a;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; color: #ffffff;
        }
        .nav-brand-text { font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
        .nav-brand-sub { font-size: 11px; color: #64748b; font-weight: 500; margin-top: -2px; }

        .nav-links {
          display: flex; align-items: center; gap: 32px; list-style: none;
        }
        .nav-link {
          font-size: 14px; font-weight: 600; color: #475569;
          text-decoration: none; transition: color 0.15s ease;
        }
        .nav-link:hover { color: #16a34a; }

        .nav-cta {
          display: inline-flex; align-items: center; gap: 6px;
          background: #16a34a;
          color: #ffffff; font-weight: 600; font-size: 14px;
          padding: 9px 20px; border-radius: 9px; text-decoration: none;
          box-shadow: 0 1px 2px rgba(22, 163, 74, 0.2);
          transition: background 0.15s ease, transform 0.15s ease;
        }
        .nav-cta:hover {
          background: #15803d;
          transform: translateY(-1px);
        }

        .nav-hamburger {
          display: none; background: none; border: none; cursor: pointer;
          padding: 6px; color: #0f172a; font-size: 22px;
        }

        .nav-mobile {
          background: #ffffff; border-top: 1px solid #e2e8f0;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
          padding: 20px 24px; display: flex; flex-direction: column; gap: 12px;
        }
        .nav-mobile a { color: #334155; text-decoration: none; font-size: 15px; font-weight: 600; padding: 8px 0; }
        .nav-mobile a:hover { color: #16a34a; }
        .nav-mobile-cta {
          margin-top: 6px; background: #16a34a;
          color: #ffffff !important; font-weight: 600; padding: 12px !important; border-radius: 9px;
          text-align: center; text-decoration: none;
        }
        .nav-mobile-cta:hover { background: #15803d; }

        @media (max-width: 768px) {
          .nav-links, .nav-cta { display: none; }
          .nav-hamburger { display: block; }
          .navbar-inner { padding: 14px 20px; }
        }
      `}</style>

      <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
        <div className="navbar-inner">
          <Link to="/" className="nav-brand">
            <div className="nav-logo"><Sprout size={20} strokeWidth={2} color="#16a34a" /></div>
            <div>
              <div className="nav-brand-text">AgroConnect 360</div>
              <div className="nav-brand-sub">Smart Agriculture Platform</div>
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

          <button className="nav-hamburger" onClick={() => setOpen(!open)} aria-label="Toggle Navigation">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {open && (
          <div className="nav-mobile">
            <a href="#features" onClick={() => setOpen(false)}>Features</a>
            <a href="#users" onClick={() => setOpen(false)}>Who It's For</a>
            <a href="#ai" onClick={() => setOpen(false)}>AI Tools</a>
            <a href="#how" onClick={() => setOpen(false)}>How It Works</a>
            <Link to="/login" className="nav-mobile-cta" onClick={() => setOpen(false)}>
              Login / Get Started →
            </Link>
          </div>
        )}
      </nav>
    </>
  );
}