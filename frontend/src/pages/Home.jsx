import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import {
  Wheat, Microscope, TrendingUp, TrendingDown, CloudSun,
  BarChart3, Stethoscope, Store, Ship, ShoppingBag,
  Smartphone, Sprout, Zap, Pill, ShieldCheck, Lock
} from "lucide-react";

/* ─── Animated counter hook ────────────────────────────────────────────── */
function useCounter(target, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

/* ─── Intersection observer hook ───────────────────────────────────────── */
function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

/* ─── Ticker items ─────────────────────────────────────────────────────── */
const tickerItems = [
  { crop: "Tomato", market: "Bangalore APMC", price: "₹2,840/q", trend: "+12%" },
  { crop: "Onion", market: "Nasik Mandi", price: "₹1,650/q", trend: "+4%" },
  { crop: "Potato", market: "Agra Mandi", price: "₹980/q", trend: "-2%" },
  { crop: "Wheat", market: "Delhi APMC", price: "₹2,125/q", trend: "+8%" },
  { crop: "Maize", market: "Hyderabad", price: "₹1,890/q", trend: "+6%" },
  { crop: "Rice", market: "Chennai APMC", price: "₹3,200/q", trend: "+3%" },
  { crop: "Green Peas", market: "Pune Mandi", price: "₹4,500/q", trend: "+15%" },
  { crop: "Capsicum", market: "Mysuru APMC", price: "₹3,100/q", trend: "+9%" },
];

export default function Home() {
  const [statsRef, statsInView] = useInView();
  const farmers = useCounter(12800, 2000, statsInView);
  const markets = useCounter(340, 2000, statsInView);
  const crops = useCounter(85, 2000, statsInView);
  const revenue = useCounter(48, 2000, statsInView);

  const [activeFeature, setActiveFeature] = useState(0);
  const [tickerPaused, setTickerPaused] = useState(false);

  const features = [
    {
      id: 0,
      Icon: Wheat,
      title: "Live Mandi & Market Prices",
      subtitle: "Direct APMC market intelligence",
      desc: "Track real-time commodity prices across 340+ APMC mandis in India. Compare prices between neighboring markets, analyze daily trends, and sell at maximum profitability.",
      bullets: ["340+ Verified APMC mandis", "Min, Max & Modal prices updated daily", "Direct market-to-market comparison", "Official Data.gov.in integrated data"],
      Visual: BarChart3,
    },
    {
      id: 1,
      Icon: Microscope,
      title: "Crop Disease AI Diagnosis",
      subtitle: "Instant photo-based leaf scanner",
      desc: "Take a photo of any diseased crop leaf. Our multi-engine AI (Gemini Vision + Agronomist Enrichment) identifies the disease, confidence level, chemical and organic treatments, and prevention guidelines.",
      bullets: ["50+ crop diseases recognized", "Accurate confidence scoring", "Organic & chemical dosage remedies", "Actionable prevention roadmap"],
      Visual: Stethoscope,
    },
    {
      id: 2,
      Icon: TrendingUp,
      title: "ML Price Predictions",
      subtitle: "7–30 day price forecasting engine",
      desc: "Machine learning models trained on historical APMC patterns forecast commodity prices up to 30 days ahead, empowering farmers to time harvests and lock in the best rates.",
      bullets: ["7–30 day advance price forecasts", "Historical trend analysis", "MSP reference benchmarks", "Confidence band indicators"],
      Visual: TrendingDown,
    },
    {
      id: 3,
      Icon: CloudSun,
      title: "Hyperlocal Weather Advisory",
      subtitle: "Pincode-level field forecasting",
      desc: "Get field-level meteorological forecasts with crop-specific action advisories. Know exactly when to irrigate, spray fertilizers, or harvest to minimize weather damage.",
      bullets: ["5-day precision forecast", "Irrigation & spraying schedule", "Rain & pest risk alerts", "Temperature & humidity monitoring"],
      Visual: CloudSun,
    },
  ];

  const roles = [
    {
      Icon: Wheat,
      title: "Farmers",
      badge: "Producer",
      accent: "#16a34a",
      desc: "Sell produce directly, detect diseases early with AI, and track mandi prices to maximize profit margins.",
      perks: ["List & sell produce directly", "Instant AI disease detection", "Daily APMC mandi alerts", "Hyperlocal weather advisory"],
    },
    {
      Icon: Store,
      title: "Sellers & Traders",
      badge: "Commerce",
      accent: "#7c3aed",
      desc: "Source fresh commodities directly from farmers with transparent inventory and price tracking.",
      perks: ["Direct farm-gate sourcing", "Bulk procurement management", "Live inventory tracking", "Real-time mandi analytics"],
    },
    {
      Icon: Ship,
      title: "Exporters",
      badge: "Global",
      accent: "#d97706",
      desc: "Connect with certified growers, track export quality standards, and coordinate cross-border logistics.",
      perks: ["Bulk export sourcing", "Quality certification tracking", "Global price comparisons", "Shipment coordination"],
    },
    {
      Icon: ShoppingBag,
      title: "Buyers & Consumers",
      badge: "Direct Farm",
      accent: "#0284c7",
      desc: "Enjoy fresh, pesticide-checked farm produce with zero middlemen markups and transparent sourcing.",
      perks: ["Direct from verified farms", "Fresh harvest notifications", "Fair, transparent pricing", "Order status tracking"],
    },
  ];

  const steps = [
    { n: "01", Icon: Smartphone, title: "Quick OTP Login", desc: "Sign in with your email in 30 seconds. No passwords required." },
    { n: "02", Icon: Sprout,     title: "Select Your Role", desc: "Choose Farmer, Seller, Exporter, or Buyer to unlock your tailored workspace." },
    { n: "03", Icon: Zap,        title: "Access Smart Tools", desc: "Check live mandi rates, scan diseased crops, or forecast commodity prices." },
    { n: "04", Icon: TrendingUp, title: "Grow Your Business", desc: "Make data-backed decisions, eliminate middlemen, and increase income." },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #f8fafc;
          --surface: #ffffff;
          --border: #e2e8f0;
          --border-subtle: #f1f5f9;
          --text: #0f172a;
          --text-muted: #64748b;
          --green: #16a34a;
          --green-hover: #15803d;
          --green-light: #f0fdf4;
          --green-border: #bbf7d0;
        }

        body {
          font-family: 'Inter', sans-serif;
          background: var(--bg);
          color: var(--text);
          overflow-x: hidden;
        }

        /* ── HERO ── */
        .hero-section {
          position: relative;
          padding: 130px 24px 70px;
          background: linear-gradient(180deg, #f0fdf4 0%, #f8fafc 100%);
          border-bottom: 1px solid var(--border);
        }
        .hero-inner {
          max-width: 1240px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 50px;
          align-items: center;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #dcfce7;
          border: 1px solid #bbf7d0;
          color: #15803d;
          font-size: 13px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 20px;
          margin-bottom: 20px;
        }
        .hero-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: clamp(36px, 4.5vw, 56px);
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -0.03em;
          color: #0f172a;
          margin-bottom: 18px;
        }
        .hero-title .highlight {
          color: #16a34a;
        }
        .hero-desc {
          font-size: 16px;
          color: #475569;
          line-height: 1.7;
          max-width: 520px;
          margin-bottom: 30px;
        }
        .hero-actions {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          margin-bottom: 32px;
        }
        .btn-main {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #16a34a;
          color: #ffffff;
          font-size: 15px;
          font-weight: 600;
          padding: 12px 26px;
          border-radius: 10px;
          text-decoration: none;
          box-shadow: 0 2px 6px rgba(22, 163, 74, 0.25);
          transition: all 0.15s ease;
        }
        .btn-main:hover {
          background: #15803d;
          transform: translateY(-1px);
        }
        .btn-alt {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #334155;
          font-size: 15px;
          font-weight: 600;
          padding: 12px 24px;
          border-radius: 10px;
          text-decoration: none;
          transition: all 0.15s ease;
        }
        .btn-alt:hover {
          background: #f8fafc;
          border-color: #94a3b8;
        }

        .hero-badges-row {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }
        .hero-badge-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .hero-badge-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #16a34a;
        }

        /* ── HERO PREVIEW CARD ── */
        .preview-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
        }
        .preview-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 16px;
          border-bottom: 1px solid #f1f5f9;
          margin-bottom: 18px;
        }
        .preview-app-title {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700;
          font-size: 15px;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .preview-status {
          font-size: 12px;
          font-weight: 600;
          color: #16a34a;
          background: #f0fdf4;
          padding: 3px 10px;
          border-radius: 20px;
          border: 1px solid #bbf7d0;
        }
        .preview-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 18px;
        }
        .preview-metric {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px;
        }
        .preview-metric-lbl {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          color: #64748b;
          letter-spacing: 0.04em;
        }
        .preview-metric-val {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          margin-top: 4px;
        }
        .preview-metric-trend {
          font-size: 11px;
          font-weight: 600;
          color: #16a34a;
          margin-top: 2px;
        }
        .preview-mandi-box {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 12px;
          padding: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .preview-mandi-crop {
          font-size: 13px;
          font-weight: 700;
          color: #166534;
        }
        .preview-mandi-market {
          font-size: 12px;
          color: #4b5563;
        }
        .preview-mandi-price {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 16px;
          font-weight: 800;
          color: #15803d;
        }

        /* ── TICKER ── */
        .ticker-bar {
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          padding: 12px 0;
          overflow: hidden;
        }
        .ticker-inner {
          display: flex;
          gap: 40px;
          animation: tickerScroll 35s linear infinite;
          width: max-content;
        }
        .ticker-inner.paused { animation-play-state: paused; }
        @keyframes tickerScroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .ticker-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          white-space: nowrap;
        }
        .ticker-crop-name { font-weight: 600; color: #1e293b; }
        .ticker-mkt { color: #64748b; }
        .ticker-val { font-weight: 700; color: #0f172a; }
        .ticker-up { color: #16a34a; font-weight: 600; font-size: 12px; }
        .ticker-dn { color: #dc2626; font-weight: 600; font-size: 12px; }

        /* ── STATS SECTION ── */
        .stats-section {
          padding: 60px 24px;
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
        }
        .stats-inner {
          max-width: 1240px;
          margin: 0 auto;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .stat-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 24px;
          text-align: center;
          transition: transform 0.15s ease;
        }
        .stat-box:hover {
          transform: translateY(-2px);
          border-color: #cbd5e1;
        }
        .stat-box-val {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 38px;
          font-weight: 800;
          color: #0f172a;
        }
        .stat-box-sfx {
          color: #16a34a;
        }
        .stat-box-lbl {
          font-size: 14px;
          font-weight: 600;
          color: #475569;
          margin-top: 4px;
        }
        .stat-box-desc {
          font-size: 12px;
          color: #94a3b8;
          margin-top: 2px;
        }

        /* ── FEATURES SECTION ── */
        .section-wrap {
          padding: 80px 24px;
          max-width: 1240px;
          margin: 0 auto;
        }
        .section-header {
          text-align: center;
          margin-bottom: 50px;
        }
        .section-pill {
          display: inline-block;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #16a34a;
          background: #dcfce7;
          border: 1px solid #bbf7d0;
          padding: 4px 12px;
          border-radius: 20px;
          margin-bottom: 12px;
        }
        .section-heading {
          font-family: 'Space Grotesk', sans-serif;
          font-size: clamp(28px, 3.5vw, 40px);
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
        }
        .section-subheading {
          font-size: 16px;
          color: #64748b;
          margin-top: 10px;
          max-width: 540px;
          margin-left: auto;
          margin-right: auto;
        }

        .features-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          align-items: start;
        }
        .features-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .feature-item-btn {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 18px 20px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }
        .feature-item-btn:hover {
          border-color: #cbd5e1;
          background: #fafafa;
        }
        .feature-item-btn.active {
          border-color: #16a34a;
          background: #f0fdf4;
          box-shadow: 0 2px 8px rgba(22, 163, 74, 0.08);
        }
        .feature-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }
        .feature-item-btn.active .feature-icon-box {
          border-color: #bbf7d0;
          background: #dcfce7;
        }
        .feature-item-title {
          font-weight: 700;
          font-size: 16px;
          color: #0f172a;
        }
        .feature-item-subtitle {
          font-size: 13px;
          color: #64748b;
          margin-top: 2px;
        }

        .feature-display-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 36px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
          position: sticky;
          top: 100px;
        }
        .feature-display-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        .feature-display-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 10px;
        }
        .feature-display-desc {
          font-size: 15px;
          color: #475569;
          line-height: 1.65;
          margin-bottom: 24px;
        }
        .feature-bullets {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .feature-bullet {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 500;
          color: #1e293b;
        }
        .bullet-icon {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          background: #dcfce7;
          color: #15803d;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
        }

        /* ── ROLES SECTION ── */
        .roles-section {
          background: #ffffff;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          padding: 80px 24px;
        }
        .roles-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          max-width: 1240px;
          margin: 0 auto;
        }
        .role-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 28px 22px;
          display: flex;
          flex-direction: column;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .role-box:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
          border-color: #cbd5e1;
        }
        .role-emoji-wrap {
          font-size: 34px;
          margin-bottom: 14px;
        }
        .role-box-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
        }
        .role-box-desc {
          font-size: 13.5px;
          color: #64748b;
          line-height: 1.6;
          margin: 8px 0 20px;
        }
        .role-perks-list {
          list-style: none;
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
        }
        .role-perk-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #334155;
          font-weight: 500;
        }
        .role-check-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #16a34a;
          flex-shrink: 0;
        }

        /* ── AI SECTION ── */
        .ai-banner {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 24px;
          padding: 48px;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 40px;
          align-items: center;
          margin-bottom: 60px;
        }
        .ai-pill {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: #166534;
          background: #dcfce7;
          padding: 4px 10px;
          border-radius: 12px;
          margin-bottom: 12px;
        }
        .ai-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 32px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.2;
          margin-bottom: 12px;
        }
        .ai-desc {
          font-size: 15px;
          color: #374151;
          line-height: 1.65;
          margin-bottom: 24px;
        }
        .ai-feats-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .ai-feat-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 14px;
          color: #1f2937;
        }
        .ai-demo-card {
          background: #ffffff;
          border: 1px solid #d1fae5;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
        }
        .ai-demo-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 12px;
          border-bottom: 1px solid #f1f5f9;
          margin-bottom: 16px;
        }
        .ai-demo-title {
          font-weight: 700;
          font-size: 14px;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ai-demo-badge {
          font-size: 11px;
          font-weight: 700;
          background: #dcfce7;
          color: #15803d;
          padding: 2px 8px;
          border-radius: 12px;
        }
        .ai-res-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 13px;
        }
        .ai-res-k { color: #64748b; }
        .ai-res-v { font-weight: 700; color: #0f172a; }

        /* ── HOW IT WORKS ── */
        .how-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .how-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 28px 20px;
          text-align: center;
        }
        .how-num {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #16a34a;
          color: #ffffff;
          font-size: 12px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }
        .how-card-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 8px;
        }
        .how-card-desc {
          font-size: 13px;
          color: #64748b;
          line-height: 1.55;
        }

        /* ── BOTTOM CTA ── */
        .cta-box {
          background: linear-gradient(135deg, #16a34a, #15803d);
          border-radius: 24px;
          padding: 60px 32px;
          text-align: center;
          color: #ffffff;
          margin-top: 70px;
        }
        .cta-heading {
          font-family: 'Space Grotesk', sans-serif;
          font-size: clamp(28px, 4vw, 42px);
          font-weight: 800;
          margin-bottom: 14px;
        }
        .cta-sub {
          font-size: 16px;
          opacity: 0.9;
          max-width: 580px;
          margin: 0 auto 28px;
          line-height: 1.6;
        }
        .cta-btn-white {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          color: #15803d;
          font-size: 15px;
          font-weight: 700;
          padding: 13px 30px;
          border-radius: 10px;
          text-decoration: none;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
          transition: transform 0.15s ease;
        }
        .cta-btn-white:hover {
          transform: translateY(-1px);
        }

        /* ── FOOTER ── */
        .site-footer {
          background: #ffffff;
          border-top: 1px solid #e2e8f0;
          padding: 48px 24px 28px;
        }
        .footer-inner {
          max-width: 1240px;
          margin: 0 auto;
        }
        .footer-cols {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 40px;
          margin-bottom: 40px;
        }
        .footer-brand {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .footer-bio {
          font-size: 14px;
          color: #64748b;
          line-height: 1.6;
          max-width: 280px;
        }
        .footer-head {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          color: #0f172a;
          letter-spacing: 0.06em;
          margin-bottom: 14px;
        }
        .footer-links-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 9px;
        }
        .footer-links-list a, .footer-links-list span {
          font-size: 14px;
          color: #64748b;
          text-decoration: none;
          transition: color 0.15s ease;
        }
        .footer-links-list a:hover {
          color: #16a34a;
        }
        .footer-legal {
          border-top: 1px solid #f1f5f9;
          padding-top: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 13px;
          color: #94a3b8;
        }

        @media (max-width: 1024px) {
          .hero-inner { grid-template-columns: 1fr; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .features-container { grid-template-columns: 1fr; }
          .feature-display-card { position: static; }
          .roles-grid { grid-template-columns: repeat(2, 1fr); }
          .how-grid { grid-template-columns: repeat(2, 1fr); }
          .ai-banner { grid-template-columns: 1fr; }
          .footer-cols { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: 1fr; }
          .roles-grid { grid-template-columns: 1fr; }
          .how-grid { grid-template-columns: 1fr; }
          .footer-cols { grid-template-columns: 1fr; }
          .hero-section { padding-top: 100px; }
          .ai-banner { padding: 28px 20px; }
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <Navbar />

      {/* ── HERO ── */}
      <section className="hero-section">
        <div className="hero-inner">
          <div>
            <div className="hero-badge">
              <span style={{ display: "inline-flex", alignItems: "center", marginRight: 6 }}><Sprout size={14} color="#16a34a" /></span> India's Smart Agriculture Platform
            </div>

            <h1 className="hero-title">
              Smart Agriculture for <span className="highlight">Modern Farming</span>
            </h1>

            <p className="hero-desc">
              AgroConnect 360 equips farmers, sellers, exporters, and buyers with live APMC mandi prices, AI crop disease detection, and ML price predictions — all in one clean, reliable platform.
            </p>

            <div className="hero-actions">
              <Link to="/login" className="btn-main" id="hero-get-started">
                Get Started Free →
              </Link>
              <a href="#features" className="btn-alt" id="hero-learn-more">
                Explore Features
              </a>
            </div>

            <div className="hero-badges-row">
              <div className="hero-badge-item">
                <span className="hero-badge-dot" /> 12,800+ Farmers
              </div>
              <div className="hero-badge-item">
                <span className="hero-badge-dot" style={{ background: "#0284c7" }} /> 340+ APMC Mandis
              </div>
              <div className="hero-badge-item">
                <span className="hero-badge-dot" style={{ background: "#7c3aed" }} /> AI Crop Diagnosis
              </div>
            </div>
          </div>

          {/* Right Card: Clean Agricultural Dashboard Preview */}
          <div className="preview-card">
            <div className="preview-header">
              <div className="preview-app-title">
                <span style={{ display: "inline-flex", alignItems: "center", marginRight: 6 }}><Sprout size={16} color="#16a34a" /></span> AgroConnect Live Dashboard
              </div>
              <span className="preview-status">● Live Data</span>
            </div>

            <div className="preview-grid">
              <div className="preview-metric">
                <div className="preview-metric-lbl">Modal Mandi Price</div>
                <div className="preview-metric-val">₹2,840/q</div>
                <div className="preview-metric-trend">▲ +12% this week</div>
              </div>
              <div className="preview-metric">
                <div className="preview-metric-lbl">Crop Health Score</div>
                <div className="preview-metric-val">96.4%</div>
                <div className="preview-metric-trend" style={{ color: "#0284c7" }}>✓ Optimal status</div>
              </div>
            </div>

            <div className="preview-mandi-box">
              <div>
                <div className="preview-mandi-crop" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Sprout size={14} color="#16a34a" /> Tomato (Hybrid)
                </div>
                <div className="preview-mandi-market">Bangalore APMC Mandi</div>
              </div>
              <div className="preview-mandi-price">₹28 - ₹32 / kg</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LIVE MANDI TICKER ── */}
      <div
        className="ticker-bar"
        onMouseEnter={() => setTickerPaused(true)}
        onMouseLeave={() => setTickerPaused(false)}
      >
        <div className={`ticker-inner ${tickerPaused ? "paused" : ""}`}>
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <div className="ticker-item" key={i}>
              <span className="ticker-crop-name" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Sprout size={13} color="#16a34a" /> {item.crop}
              </span>
              <span className="ticker-mkt">({item.market})</span>
              <span className="ticker-val">{item.price}</span>
              <span className={item.trend.startsWith("+") ? "ticker-up" : "ticker-dn"} style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                {item.trend.startsWith("+") ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {item.trend}
              </span>
              <span style={{ color: "#cbd5e1", marginLeft: 8 }}>|</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── STATS ── */}
      <section className="stats-section" ref={statsRef}>
        <div className="stats-inner">
          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-box-val">{farmers.toLocaleString("en-IN")}<span className="stat-box-sfx">+</span></div>
              <div className="stat-box-lbl">Active Farmers</div>
              <div className="stat-box-desc">Across Indian states</div>
            </div>
            <div className="stat-box">
              <div className="stat-box-val">{markets}<span className="stat-box-sfx">+</span></div>
              <div className="stat-box-lbl">APMC Mandis</div>
              <div className="stat-box-desc">Real-time daily updates</div>
            </div>
            <div className="stat-box">
              <div className="stat-box-val">{crops}<span className="stat-box-sfx">+</span></div>
              <div className="stat-box-lbl">Commodity Varieties</div>
              <div className="stat-box-desc">Tracked and predicted</div>
            </div>
            <div className="stat-box">
              <div className="stat-box-val">₹{revenue}<span className="stat-box-sfx">Cr+</span></div>
              <div className="stat-box-lbl">Trade Facilitated</div>
              <div className="stat-box-desc">Direct farm revenue</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section className="section-wrap" id="features">
        <div className="section-header">
          <span className="section-pill">Core Capabilities</span>
          <h2 className="section-heading">Everything You Need for Profitable Farming</h2>
          <p className="section-subheading">
            Four powerful modules designed to help farmers, traders, and buyers succeed in one unified platform.
          </p>
        </div>

        <div className="features-container">
          <div className="features-list">
            {features.map((f) => (
              <button
                type="button"
                key={f.id}
                className={`feature-item-btn ${activeFeature === f.id ? "active" : ""}`}
                onClick={() => setActiveFeature(f.id)}
              >
                <div className="feature-icon-box" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "inherit" }}><f.Icon size={20} strokeWidth={1.75} /></div>
                <div>
                  <div className="feature-item-title">{f.title}</div>
                  <div className="feature-item-subtitle">{f.subtitle}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="feature-display-card">
            {(() => { const FeatureIcon = features[activeFeature].Visual; return <div className="feature-display-icon" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><FeatureIcon size={48} strokeWidth={1.5} /></div>; })()}
            <h3 className="feature-display-title">{features[activeFeature].title}</h3>
            <p className="feature-display-desc">{features[activeFeature].desc}</p>
            <div className="feature-bullets">
              {features[activeFeature].bullets.map((b) => (
                <div className="feature-bullet" key={b}>
                  <div className="bullet-icon">✓</div>
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── ROLES SECTION ── */}
      <section className="roles-section" id="users">
        <div className="section-header">
          <span className="section-pill">Built for Everyone</span>
          <h2 className="section-heading">One Platform, Tailored for Every Role</h2>
          <p className="section-subheading">
            Seamlessly switch between dedicated dashboards depending on how you participate in agriculture.
          </p>
        </div>

        <div className="roles-grid">
          {roles.map((r) => (
            <div className="role-box" key={r.title}>
              <div className="role-emoji-wrap" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: r.accent }}><r.Icon size={30} strokeWidth={1.5} /></div>
              <h3 className="role-box-title">{r.title}</h3>
              <p className="role-box-desc">{r.desc}</p>
              <ul className="role-perks-list">
                {r.perks.map((p) => (
                  <li className="role-perk-item" key={p}>
                    <span className="role-check-dot" style={{ background: r.accent }} />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── AI SECTION ── */}
      <section className="section-wrap" id="ai">
        <div className="ai-banner">
          <div>
            <span className="ai-pill">AI Agronomist Intelligence</span>
            <h2 className="ai-title">Instant Crop Disease Diagnosis & Recovery Plans</h2>
            <p className="ai-desc">
              Upload a clear photo of any infected leaf or crop. Our AI vision instantly identifies the pathogen, estimates severity, and provides verified chemical and organic treatment regimens.
            </p>
            <div className="ai-feats-list">
              <div className="ai-feat-row">
                <Microscope size={18} color="#16a34a" style={{ flexShrink: 0 }} />
                <span>Identifies 50+ diseases across tomatoes, potatoes, rice, cotton and more</span>
              </div>
              <div className="ai-feat-row">
                <Pill size={18} color="#16a34a" style={{ flexShrink: 0 }} />
                <span>Exact chemical fungicide/pesticide dosage and organic alternatives</span>
              </div>
              <div className="ai-feat-row">
                <ShieldCheck size={18} color="#16a34a" style={{ flexShrink: 0 }} />
                <span>Proactive prevention guidelines to protect adjacent crops</span>
              </div>
            </div>
          </div>

          <div className="ai-demo-card">
            <div className="ai-demo-header">
              <div className="ai-demo-title">
                <span style={{ display: "inline-flex", alignItems: "center", marginRight: 6 }}><Sprout size={16} color="#16a34a" /></span> Leaf Diagnosis Result
              </div>
              <span className="ai-demo-badge">94.7% Match</span>
            </div>
            <div className="ai-res-item">
              <span className="ai-res-k">Detected Disease</span>
              <span className="ai-res-v">Early Blight (Alternaria solani)</span>
            </div>
            <div className="ai-res-item">
              <span className="ai-res-k">Severity Level</span>
              <span className="ai-res-v" style={{ color: "#d97706" }}>Moderate</span>
            </div>
            <div className="ai-res-item">
              <span className="ai-res-k">Recommended Chemical</span>
              <span className="ai-res-v">Mancozeb 75% WP @ 2.5g/L</span>
            </div>
            <div className="ai-res-item">
              <span className="ai-res-k">Organic Treatment</span>
              <span className="ai-res-v">Neem oil spray (5ml/L)</span>
            </div>
          </div>
        </div>

        {/* ── HOW IT WORKS ── */}
        <div id="how" style={{ paddingTop: 20 }}>
          <div className="section-header">
            <span className="section-pill">Getting Started</span>
            <h2 className="section-heading">Up and Running in 4 Simple Steps</h2>
          </div>

          <div className="how-grid">
            {steps.map((s) => (
              <div className="how-card" key={s.n}>
                <div className="how-num">{s.n}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8, color: "#16a34a" }}><s.Icon size={24} strokeWidth={1.75} /></div>
                <h4 className="how-card-title">{s.title}</h4>
                <p className="how-card-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── CALL TO ACTION ── */}
        <div className="cta-box">
          <h2 className="cta-heading">Ready to Transform Your Farming Intelligence?</h2>
          <p className="cta-sub">
            Join thousands of farmers, traders, and agricultural professionals who rely on AgroConnect 360 every day.
          </p>
          <Link to="/login" className="cta-btn-white" id="cta-bottom-login">
            Get Started Free Now →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-cols">
            <div>
              <div className="footer-brand">
                <span style={{ display: "inline-flex", alignItems: "center", marginRight: 6 }}><Sprout size={18} color="#16a34a" /></span> AgroConnect 360
              </div>
              <p className="footer-bio">
                India's modern agricultural intelligence and trade platform, empowering farmers and traders with data-driven tools.
              </p>
            </div>

            <div>
              <div className="footer-head">Platform</div>
              <div className="footer-links-list">
                <a href="#features">Features</a>
                <a href="#users">For Farmers</a>
                <a href="#users">For Sellers & Traders</a>
                <a href="#users">For Exporters</a>
              </div>
            </div>

            <div>
              <div className="footer-head">Intelligence</div>
              <div className="footer-links-list">
                <a href="#ai">AI Crop Diagnosis</a>
                <a href="#features">Mandi Market Rates</a>
                <a href="#features">Price Predictions</a>
                <a href="#features">Weather Advisories</a>
              </div>
            </div>

            <div>
              <div className="footer-head">Data Sources</div>
              <div className="footer-links-list">
                <span>Data.gov.in (APMC)</span>
                <span>OpenWeather API</span>
                <span>Gemini AI Vision</span>
                <span>Agmarknet India</span>
              </div>
            </div>
          </div>

          <div className="footer-legal">
            <div>&copy; {new Date().getFullYear()} AgroConnect 360. All rights reserved.</div>
            <div style={{ display: "flex", gap: 16 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Lock size={12} /> Secure OTP Auth</span>
              <span>🇮🇳 Built for India</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Sprout size={12} /> 100% Free Plan</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}