import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";

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

/* ─── Floating orb component ───────────────────────────────────────────── */
function Orb({ style }) {
  return <div className="hero-orb" style={style} />;
}

/* ─── Ticker item ──────────────────────────────────────────────────────── */
const tickerItems = [
  { crop: "🍅 Tomato", market: "Bangalore", price: "₹2,840/q", trend: "+12%" },
  { crop: "🧅 Onion", market: "Nasik", price: "₹1,650/q", trend: "+4%" },
  { crop: "🥔 Potato", market: "Agra", price: "₹980/q", trend: "-2%" },
  { crop: "🌾 Wheat", market: "Delhi", price: "₹2,125/q", trend: "+8%" },
  { crop: "🌽 Maize", market: "Hyderabad", price: "₹1,890/q", trend: "+6%" },
  { crop: "🍚 Rice", market: "Chennai", price: "₹3,200/q", trend: "+3%" },
  { crop: "🫛 Green Peas", market: "Pune", price: "₹4,500/q", trend: "+15%" },
  { crop: "🫑 Capsicum", market: "Mysuru", price: "₹3,100/q", trend: "+9%" },
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
      emoji: "🌿",
      color: "#22c55e",
      glow: "rgba(34,197,94,0.3)",
      title: "Digital Farm Marketplace",
      subtitle: "Direct farm-to-buyer commerce",
      desc: "Farmers list produce directly on the platform. Buyers browse real photos, verify quality grades, and purchase without middlemen — getting fresh produce at fair prices with transparent supply chain tracking.",
      bullets: ["Zero middleman markup", "Real-time inventory sync", "Digital payment gateway", "Quality grading system"],
      visual: "🛒",
    },
    {
      id: 1,
      emoji: "🧠",
      color: "#a78bfa",
      glow: "rgba(167,139,250,0.3)",
      title: "AI Crop Disease Scanner",
      subtitle: "Gemini Vision powered diagnosis",
      desc: "Snap a photo of any diseased leaf or crop. Our Gemini 2.0 Flash AI instantly analyzes it, identifies the disease with confidence scores, and recommends precise treatment plans in your local language.",
      bullets: ["50+ disease library", "Confidence scoring", "Treatment recommendations", "Multilingual output"],
      visual: "🔬",
    },
    {
      id: 2,
      emoji: "📊",
      color: "#38bdf8",
      glow: "rgba(56,189,248,0.3)",
      title: "ML Price Predictions",
      subtitle: "RandomForest APMC intelligence",
      desc: "Our machine learning models trained on years of APMC mandi data predict commodity prices 7–30 days ahead. Know the best time to sell before your neighbours do, with confidence intervals shown clearly.",
      bullets: ["7–30 day forecasts", "APMC mandi coverage", "MSP comparison", "Confidence intervals"],
      visual: "📈",
    },
    {
      id: 3,
      emoji: "🌦️",
      color: "#fb923c",
      glow: "rgba(251,146,60,0.3)",
      title: "Hyperlocal Weather Advisory",
      subtitle: "Field-level precision forecasting",
      desc: "Get pin-code level weather data with farming-specific advisories. Know exactly when to irrigate, sow, harvest, or apply pesticides based on your microclimate — not a city average 50 km away.",
      bullets: ["5-day precision forecast", "Irrigation advisories", "Pest risk alerts", "Sowing recommendations"],
      visual: "🌤️",
    },
  ];

  const roles = [
    {
      emoji: "👨‍🌾",
      title: "Farmers",
      color: "#22c55e",
      bg: "linear-gradient(135deg, #052e16 0%, #14532d 100%)",
      stats: "₹2.1L avg annual uplift",
      perks: ["List & sell crops directly", "AI disease detection", "Price prediction alerts", "Weather farming advisory"],
    },
    {
      emoji: "🏪",
      title: "Sellers",
      color: "#38bdf8",
      bg: "linear-gradient(135deg, #0c1a2e 0%, #1e3a5f 100%)",
      stats: "340+ verified markets",
      perks: ["Browse fresh listings", "Bulk order management", "Supply chain tracking", "Price trend analytics"],
    },
    {
      emoji: "🚢",
      title: "Exporters",
      color: "#f59e0b",
      bg: "linear-gradient(135deg, #1c1407 0%, #3d2a06 100%)",
      stats: "28 countries connected",
      perks: ["Export opportunity finder", "Quality certification help", "Market intelligence reports", "Logistics coordination"],
    },
    {
      emoji: "🛍️",
      title: "Consumers",
      color: "#f472b6",
      bg: "linear-gradient(135deg, #1f0a1a 0%, #4a1030 100%)",
      stats: "30% fresher, 20% cheaper",
      perks: ["Buy directly from farms", "Farm visit scheduling", "Seasonal crop alerts", "Nutritional data access"],
    },
  ];

  const steps = [
    { n: "01", icon: "📱", title: "Create Account", desc: "Register with your email in 60 seconds. Choose your role — farmer, seller, exporter, or consumer.", color: "#22c55e" },
    { n: "02", icon: "🎯", title: "Set Up Profile", desc: "Complete your role-specific profile. Add farm location, crop types, or business details.", color: "#38bdf8" },
    { n: "03", icon: "🔗", title: "Connect & Trade", desc: "List produce, place orders, explore market prices, run AI diagnosis — all in one dashboard.", color: "#a78bfa" },
    { n: "04", icon: "📈", title: "Grow & Prosper", desc: "Use AI insights to time your harvests, predict prices, and build direct market relationships.", color: "#fb923c" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #050a0e;
          --bg2: #080f14;
          --surface: rgba(255,255,255,0.04);
          --surface2: rgba(255,255,255,0.07);
          --border: rgba(255,255,255,0.08);
          --border2: rgba(255,255,255,0.12);
          --text: #f0f6ff;
          --text2: #94a3b8;
          --green: #22c55e;
          --green-dim: rgba(34,197,94,0.15);
        }

        body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); overflow-x: hidden; }

        /* ── HERO ─────────────────────────────────────────────────────── */
        .hero-wrap {
          min-height: 100vh;
          background: var(--bg);
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .hero-canvas {
          position: absolute; inset: 0; pointer-events: none; z-index: 0;
          background:
            radial-gradient(ellipse 80% 60% at 20% 30%, rgba(34,197,94,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 70%, rgba(56,189,248,0.06) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 50% 100%, rgba(167,139,250,0.05) 0%, transparent 60%);
        }

        .hero-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse 100% 100% at 50% 0%, black 20%, transparent 80%);
        }

        .hero-orb {
          position: absolute; border-radius: 50%;
          filter: blur(80px); pointer-events: none; animation: float 8s ease-in-out infinite;
        }
        @keyframes float { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-30px) scale(1.05)} }

        .hero-inner {
          position: relative; z-index: 1;
          flex: 1; display: flex; flex-direction: column;
          max-width: 1280px; margin: 0 auto; padding: 0 32px;
          width: 100%;
        }

        .hero-content {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 60px; align-items: center;
          padding: 120px 0 80px;
        }

        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(34,197,94,0.12); border: 1px solid rgba(34,197,94,0.25);
          color: #4ade80; font-size: 13px; font-weight: 600; letter-spacing: 0.04em;
          padding: 7px 16px; border-radius: 100px;
          margin-bottom: 28px;
          animation: pulse-border 3s ease infinite;
        }
        @keyframes pulse-border {
          0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.2)}
          50%{box-shadow:0 0 0 8px rgba(34,197,94,0)}
        }

        .hero-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: clamp(40px, 5vw, 72px);
          font-weight: 800; line-height: 1.05;
          letter-spacing: -0.03em; color: #fff;
        }
        .hero-title .gradient-text {
          background: linear-gradient(135deg, #4ade80 0%, #22d3ee 50%, #818cf8 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-desc {
          margin-top: 24px; font-size: 17px; line-height: 1.75;
          color: var(--text2); max-width: 500px;
        }

        .hero-actions { margin-top: 36px; display: flex; gap: 14px; flex-wrap: wrap; }

        .btn-primary {
          display: inline-flex; align-items: center; gap: 10px;
          background: linear-gradient(135deg, #16a34a 0%, #059669 100%);
          color: #fff; font-weight: 700; font-size: 15px;
          padding: 15px 28px; border-radius: 14px; text-decoration: none;
          border: none; cursor: pointer;
          box-shadow: 0 8px 32px rgba(34,197,94,0.35);
          transition: transform 0.2s, box-shadow 0.2s;
          position: relative; overflow: hidden;
        }
        .btn-primary::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 100%);
          opacity: 0; transition: opacity 0.2s;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 16px 40px rgba(34,197,94,0.45); }
        .btn-primary:hover::after { opacity: 1; }

        .btn-secondary {
          display: inline-flex; align-items: center; gap: 10px;
          background: var(--surface2); backdrop-filter: blur(12px);
          border: 1px solid var(--border2); color: var(--text);
          font-weight: 600; font-size: 15px; padding: 15px 28px;
          border-radius: 14px; text-decoration: none; cursor: pointer;
          transition: background 0.2s, border-color 0.2s, transform 0.2s;
        }
        .btn-secondary:hover {
          background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2);
          transform: translateY(-2px);
        }

        .hero-trust {
          margin-top: 32px; display: flex; align-items: center; gap: 20px; flex-wrap: wrap;
        }
        .trust-chip {
          display: flex; align-items: center; gap: 7px;
          font-size: 13px; color: var(--text2);
        }
        .trust-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); }

        /* ── DASHBOARD MOCKUP ─────────────────────────────────────────── */
        .hero-mockup {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px; padding: 24px;
          backdrop-filter: blur(20px);
          box-shadow: 0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset;
          position: relative;
        }
        .mockup-header {
          display: flex; align-items: center; gap: 8px; margin-bottom: 20px;
          padding-bottom: 16px; border-bottom: 1px solid var(--border);
        }
        .mockup-dot { width: 10px; height: 10px; border-radius: 50%; }
        .mockup-title { margin-left: auto; font-size: 12px; color: var(--text2); font-weight: 500; }

        .mockup-ticker {
          background: rgba(34,197,94,0.06); border: 1px solid rgba(34,197,94,0.15);
          border-radius: 10px; padding: 10px 14px; margin-bottom: 16px;
          font-size: 12px; color: #4ade80; display: flex; align-items: center; gap: 8px;
        }
        .ticker-dot { width: 6px; height: 6px; border-radius: 50%; background: #4ade80; animation: blink 1.5s ease infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

        .mockup-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .mockup-card {
          padding: 16px; border-radius: 14px; border: 1px solid var(--border);
          background: var(--surface); position: relative; overflow: hidden;
        }
        .mockup-card-icon { font-size: 22px; margin-bottom: 10px; }
        .mockup-card-label { font-size: 10px; color: var(--text2); text-transform: uppercase; letter-spacing: 0.06em; }
        .mockup-card-value { font-size: 20px; font-weight: 700; color: #fff; margin-top: 4px; }
        .mockup-card-trend {
          font-size: 11px; font-weight: 600; margin-top: 4px;
          display: flex; align-items: center; gap: 4px;
        }
        .trend-up { color: #4ade80; }
        .trend-down { color: #f87171; }
        .mockup-card-glow {
          position: absolute; width: 60px; height: 60px; border-radius: 50%;
          filter: blur(20px); top: -10px; right: -10px; opacity: 0.4;
        }

        .mockup-chart { margin-top: 14px; height: 56px; position: relative; }
        .chart-bars { display: flex; align-items: flex-end; gap: 4px; height: 100%; }
        .chart-bar {
          flex: 1; border-radius: 4px 4px 0 0;
          background: linear-gradient(to top, rgba(34,197,94,0.6), rgba(34,197,94,0.1));
          transition: background 0.3s;
        }
        .chart-bar.active { background: linear-gradient(to top, #22c55e, rgba(34,197,94,0.3)); }

        /* ── TICKER ───────────────────────────────────────────────────── */
        .ticker-wrap {
          background: var(--bg2); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
          overflow: hidden; padding: 12px 0;
        }
        .ticker-track {
          display: flex; gap: 48px;
          animation: scroll 30s linear infinite;
          width: max-content;
        }
        .ticker-track.paused { animation-play-state: paused; }
        @keyframes scroll { from{transform:translateX(0)} to{transform:translateX(-50%)} }

        .ticker-item {
          display: flex; align-items: center; gap: 10px; white-space: nowrap;
          font-size: 13px; font-weight: 500;
        }
        .ticker-crop { color: var(--text); }
        .ticker-market { color: var(--text2); }
        .ticker-price { color: #fff; font-weight: 700; }
        .ticker-up { color: #4ade80; font-size: 12px; }
        .ticker-dn { color: #f87171; font-size: 12px; }
        .ticker-sep { color: var(--border2); }

        /* ── STATS ───────────────────────────────────────────────────── */
        .stats-section {
          padding: 80px 32px;
          background: linear-gradient(180deg, var(--bg) 0%, var(--bg2) 100%);
        }
        .stats-inner { max-width: 1280px; margin: 0 auto; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        .stat-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 20px; padding: 32px 28px; text-align: center;
          transition: transform 0.3s, border-color 0.3s, box-shadow 0.3s;
          position: relative; overflow: hidden;
        }
        .stat-card::before {
          content: ''; position: absolute; top: 0; left: 50%; transform: translateX(-50%);
          width: 60%; height: 1px; background: linear-gradient(90deg, transparent, var(--green), transparent);
        }
        .stat-card:hover { transform: translateY(-4px); border-color: rgba(34,197,94,0.25); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        .stat-value { font-family: 'Space Grotesk', sans-serif; font-size: 48px; font-weight: 800; color: #fff; }
        .stat-suffix { font-size: 28px; color: var(--green); }
        .stat-label { font-size: 14px; color: var(--text2); margin-top: 8px; font-weight: 500; }
        .stat-emoji { font-size: 28px; margin-bottom: 12px; }

        /* ── FEATURES ───────────────────────────────────────────────── */
        .features-section { padding: 100px 32px; background: var(--bg); }
        .features-inner { max-width: 1280px; margin: 0 auto; }
        .section-eyebrow {
          font-size: 12px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: var(--green); margin-bottom: 12px;
          display: flex; align-items: center; gap: 10px;
        }
        .section-eyebrow::before { content: ''; flex: 0 0 30px; height: 1px; background: var(--green); }
        .section-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: clamp(32px, 4vw, 52px); font-weight: 800;
          line-height: 1.1; letter-spacing: -0.03em; color: #fff;
        }
        .section-desc { font-size: 17px; color: var(--text2); line-height: 1.7; margin-top: 16px; max-width: 520px; }

        .features-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-top: 64px; align-items: start; }
        .features-tabs { display: flex; flex-direction: column; gap: 4px; }
        .feature-tab {
          display: flex; align-items: center; gap: 16px;
          padding: 20px 24px; border-radius: 16px; cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.3s;
        }
        .feature-tab:hover { background: var(--surface); }
        .feature-tab.active { background: var(--surface2); border-color: var(--border2); }
        .tab-emoji-wrap {
          width: 48px; height: 48px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; flex-shrink: 0; transition: background 0.3s;
        }
        .tab-title { font-weight: 700; font-size: 16px; color: #fff; }
        .tab-sub { font-size: 13px; color: var(--text2); margin-top: 2px; }
        .tab-arrow { margin-left: auto; color: var(--text2); font-size: 18px; opacity: 0; transition: opacity 0.2s; }
        .feature-tab.active .tab-arrow { opacity: 1; }

        .feature-panel {
          background: var(--surface); border: 1px solid var(--border2);
          border-radius: 24px; padding: 40px; position: sticky; top: 100px;
          min-height: 400px;
        }
        .panel-big-emoji { font-size: 64px; margin-bottom: 20px; line-height: 1; }
        .panel-title { font-family: 'Space Grotesk', sans-serif; font-size: 28px; font-weight: 800; color: #fff; }
        .panel-desc { font-size: 15px; color: var(--text2); line-height: 1.75; margin-top: 12px; }
        .panel-bullets { margin-top: 24px; display: flex; flex-direction: column; gap: 10px; }
        .panel-bullet { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--text); }
        .bullet-check { width: 20px; height: 20px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 11px; flex-shrink: 0; }

        /* ── ROLES ──────────────────────────────────────────────────── */
        .roles-section { padding: 100px 32px; background: var(--bg2); }
        .roles-inner { max-width: 1280px; margin: 0 auto; }
        .roles-header { text-align: center; margin-bottom: 64px; }
        .roles-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .role-card {
          border-radius: 24px; padding: 32px 24px;
          border: 1px solid rgba(255,255,255,0.06);
          position: relative; overflow: hidden;
          transition: transform 0.3s, box-shadow 0.3s;
          cursor: pointer;
        }
        .role-card:hover { transform: translateY(-6px); }
        .role-card-glow {
          position: absolute; width: 200px; height: 200px; border-radius: 50%;
          filter: blur(60px); top: -50px; right: -50px; opacity: 0.15;
          transition: opacity 0.3s;
        }
        .role-card:hover .role-card-glow { opacity: 0.3; }
        .role-emoji { font-size: 40px; margin-bottom: 16px; }
        .role-title { font-size: 22px; font-weight: 800; color: #fff; font-family: 'Space Grotesk', sans-serif; }
        .role-stat { font-size: 12px; font-weight: 600; margin-top: 6px; margin-bottom: 20px; }
        .role-perks { list-style: none; display: flex; flex-direction: column; gap: 8px; }
        .role-perk { font-size: 13px; color: rgba(255,255,255,0.7); display: flex; align-items: center; gap: 8px; }
        .perk-dot { width: 4px; height: 4px; border-radius: 50%; flex-shrink: 0; }

        /* ── HOW IT WORKS ───────────────────────────────────────────── */
        .how-section { padding: 100px 32px; background: var(--bg); }
        .how-inner { max-width: 1280px; margin: 0 auto; }
        .how-header { text-align: center; margin-bottom: 80px; }
        .how-steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; position: relative; }
        .how-steps::before {
          content: ''; position: absolute; top: 32px; left: 10%; right: 10%; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(34,197,94,0.3) 20%, rgba(34,197,94,0.3) 80%, transparent);
        }
        .how-step { text-align: center; padding: 0 20px; position: relative; }
        .step-bubble {
          width: 64px; height: 64px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 28px; margin: 0 auto 24px;
          border: 1px solid var(--border2);
          background: var(--surface); position: relative;
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .step-bubble:hover { transform: scale(1.1); }
        .step-num {
          position: absolute; top: -6px; right: -6px;
          width: 22px; height: 22px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 800; color: #000;
          background: var(--green);
        }
        .step-title { font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 10px; font-family: 'Space Grotesk', sans-serif; }
        .step-desc { font-size: 14px; color: var(--text2); line-height: 1.65; }

        /* ── AI SECTION ─────────────────────────────────────────────── */
        .ai-section {
          padding: 100px 32px; margin: 0 32px 80px;
          background: linear-gradient(135deg, #0a1f12 0%, #0d1f2d 50%, #0f0a1f 100%);
          border-radius: 32px; border: 1px solid rgba(255,255,255,0.07);
          position: relative; overflow: hidden;
        }
        .ai-inner { max-width: 1216px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .ai-glow-1 { position: absolute; width: 400px; height: 400px; border-radius: 50%; background: rgba(34,197,94,0.08); filter: blur(80px); top: -100px; left: -100px; }
        .ai-glow-2 { position: absolute; width: 300px; height: 300px; border-radius: 50%; background: rgba(56,189,248,0.06); filter: blur(80px); bottom: -80px; right: 20%; }

        .ai-features { display: flex; flex-direction: column; gap: 16px; margin-top: 36px; }
        .ai-feature { display: flex; align-items: flex-start; gap: 14px; padding: 18px 20px; border-radius: 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); }
        .ai-feature-icon { font-size: 24px; }
        .ai-feature-title { font-size: 15px; font-weight: 700; color: #fff; }
        .ai-feature-desc { font-size: 13px; color: var(--text2); margin-top: 2px; }

        .ai-demo {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px; padding: 32px; position: relative;
        }
        .ai-demo-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .ai-demo-icon { width: 40px; height: 40px; border-radius: 10px; background: rgba(34,197,94,0.15); display: flex; align-items: center; justify-content: center; font-size: 20px; }
        .ai-demo-title { font-weight: 700; color: #fff; }
        .ai-demo-sub { font-size: 12px; color: var(--text2); }
        .ai-terminal { background: rgba(0,0,0,0.4); border-radius: 12px; padding: 20px; font-family: 'Courier New', monospace; font-size: 13px; }
        .terminal-line { margin-bottom: 8px; }
        .t-green { color: #4ade80; }
        .t-blue { color: #67e8f9; }
        .t-yellow { color: #fde68a; }
        .t-gray { color: #64748b; }
        .t-white { color: #fff; }
        .t-cursor { display: inline-block; width: 8px; height: 14px; background: #4ade80; animation: cursor-blink 1s ease infinite; vertical-align: middle; }
        @keyframes cursor-blink { 0%,100%{opacity:1} 50%{opacity:0} }

        /* ── CTA ────────────────────────────────────────────────────── */
        .cta-section { padding: 80px 32px 100px; text-align: center; }
        .cta-inner { max-width: 800px; margin: 0 auto; }
        .cta-title { font-family: 'Space Grotesk', sans-serif; font-size: clamp(36px, 5vw, 60px); font-weight: 800; color: #fff; line-height: 1.1; letter-spacing: -0.03em; }
        .cta-desc { font-size: 18px; color: var(--text2); margin-top: 20px; line-height: 1.65; }
        .cta-actions { margin-top: 40px; display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; }
        .cta-note { margin-top: 20px; font-size: 13px; color: var(--text2); }

        /* ── FOOTER ─────────────────────────────────────────────────── */
        .footer {
          background: var(--bg2); border-top: 1px solid var(--border);
          padding: 48px 32px 32px;
        }
        .footer-inner { max-width: 1280px; margin: 0 auto; }
        .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; margin-bottom: 48px; }
        .footer-brand { display: flex; align-items: center; gap: 10px; font-family: 'Space Grotesk', sans-serif; font-size: 20px; font-weight: 800; color: #fff; margin-bottom: 12px; }
        .footer-tagline { font-size: 14px; color: var(--text2); line-height: 1.6; max-width: 260px; }
        .footer-col-title { font-size: 13px; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 16px; }
        .footer-links { display: flex; flex-direction: column; gap: 10px; }
        .footer-link { font-size: 14px; color: var(--text2); text-decoration: none; transition: color 0.2s; }
        .footer-link:hover { color: var(--green); }
        .footer-bottom { border-top: 1px solid var(--border); padding-top: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: gap; }
        .footer-copy { font-size: 13px; color: var(--text2); }
        .footer-badges { display: flex; gap: 12px; }
        .footer-badge { font-size: 12px; color: var(--text2); display: flex; align-items: center; gap: 6px; }

        /* ── RESPONSIVE ─────────────────────────────────────────────── */
        @media (max-width: 1024px) {
          .hero-content { grid-template-columns: 1fr; padding: 100px 0 60px; }
          .hero-mockup { display: none; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .features-layout { grid-template-columns: 1fr; }
          .feature-panel { position: static; }
          .roles-grid { grid-template-columns: repeat(2, 1fr); }
          .how-steps { grid-template-columns: repeat(2, 1fr); }
          .how-steps::before { display: none; }
          .ai-inner { grid-template-columns: 1fr; }
          .footer-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: 1fr 1fr; }
          .roles-grid { grid-template-columns: 1fr; }
          .how-steps { grid-template-columns: 1fr; }
          .footer-grid { grid-template-columns: 1fr; }
          .hero-actions { flex-direction: column; }
          .btn-primary, .btn-secondary { width: 100%; justify-content: center; }
          .ai-section { margin: 0 16px 60px; border-radius: 20px; }
        }

        /* ── ANIMATIONS ─────────────────────────────────────────────── */
        .fade-up { opacity: 0; transform: translateY(30px); transition: opacity 0.6s ease, transform 0.6s ease; }
        .fade-up.visible { opacity: 1; transform: translateY(0); }
        .fade-up:nth-child(2) { transition-delay: 0.1s; }
        .fade-up:nth-child(3) { transition-delay: 0.2s; }
        .fade-up:nth-child(4) { transition-delay: 0.3s; }
      `}</style>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div className="hero-wrap">
        <div className="hero-canvas" />
        <div className="hero-grid" />
        <Orb style={{ width: 400, height: 400, background: "rgba(34,197,94,0.12)", top: "10%", left: "-10%", animationDelay: "0s" }} />
        <Orb style={{ width: 300, height: 300, background: "rgba(56,189,248,0.08)", top: "30%", right: "-5%", animationDelay: "2s" }} />
        <Orb style={{ width: 250, height: 250, background: "rgba(167,139,250,0.07)", bottom: "10%", left: "30%", animationDelay: "4s" }} />

        <div className="hero-inner">
          <Navbar />

          <div className="hero-content">
            {/* Left */}
            <div>
              <div className="hero-badge">
                <span>🌱</span> India's #1 Agri Intelligence Platform
              </div>

              <h1 className="hero-title">
                Where Every<br />
                <span className="gradient-text">Farm Meets Its</span><br />
                Market
              </h1>

              <p className="hero-desc">
                AgroConnect 360 arms farmers with AI disease detection, ML price predictions, and live APMC market data — while connecting them directly to buyers, sellers, and exporters across India.
              </p>

              <div className="hero-actions">
                <Link to="/login" className="btn-primary" id="hero-cta-start">
                  Start for Free →
                </Link>
                <a href="#features" className="btn-secondary" id="hero-explore">
                  See How It Works
                </a>
              </div>

              <div className="hero-trust">
                <div className="trust-chip"><div className="trust-dot" /> 12,800+ Farmers</div>
                <div className="trust-chip"><div className="trust-dot" style={{ background: "#38bdf8" }} /> 340 APMC Markets</div>
                <div className="trust-chip"><div className="trust-dot" style={{ background: "#a78bfa" }} /> AI Powered</div>
              </div>
            </div>

            {/* Right — Dashboard Mockup */}
            <div className="hero-mockup">
              <div className="mockup-header">
                <div className="mockup-dot" style={{ background: "#f87171" }} />
                <div className="mockup-dot" style={{ background: "#fbbf24" }} />
                <div className="mockup-dot" style={{ background: "#4ade80" }} />
                <span className="mockup-title">AgroConnect Dashboard — Live</span>
              </div>

              <div className="mockup-ticker">
                <div className="ticker-dot" />
                🍅 Tomato · Bangarpet APMC ·&nbsp;<strong>₹2,840/q</strong>&nbsp;· <span style={{ color: "#4ade80" }}>▲ +12%</span>
              </div>

              <div className="mockup-grid">
                <div className="mockup-card">
                  <div className="mockup-card-glow" style={{ background: "#4ade80" }} />
                  <div className="mockup-card-icon">🌿</div>
                  <div className="mockup-card-label">Today's Revenue</div>
                  <div className="mockup-card-value">₹18,450</div>
                  <div className="mockup-card-trend trend-up">▲ +23% vs yesterday</div>
                </div>
                <div className="mockup-card">
                  <div className="mockup-card-glow" style={{ background: "#38bdf8" }} />
                  <div className="mockup-card-icon">📦</div>
                  <div className="mockup-card-label">Active Orders</div>
                  <div className="mockup-card-value">34</div>
                  <div className="mockup-card-trend trend-up">▲ 6 new today</div>
                </div>
                <div className="mockup-card">
                  <div className="mockup-card-glow" style={{ background: "#fbbf24" }} />
                  <div className="mockup-card-icon">🌤️</div>
                  <div className="mockup-card-label">Weather</div>
                  <div className="mockup-card-value">28°C</div>
                  <div className="mockup-card-trend" style={{ color: "#fbbf24" }}>✓ Good for harvest</div>
                </div>
                <div className="mockup-card">
                  <div className="mockup-card-glow" style={{ background: "#a78bfa" }} />
                  <div className="mockup-card-icon">🧠</div>
                  <div className="mockup-card-label">Price Forecast</div>
                  <div className="mockup-card-value">₹3,100</div>
                  <div className="mockup-card-trend" style={{ color: "#a78bfa" }}>↑ Expected in 7d</div>
                </div>
              </div>

              <div className="mockup-chart">
                <div className="chart-bars">
                  {[40, 55, 45, 70, 60, 80, 65, 90, 75, 95, 85, 100].map((h, i) => (
                    <div key={i} className={`chart-bar ${i >= 9 ? "active" : ""}`} style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── LIVE PRICE TICKER ─────────────────────────────────────────────── */}
      <div className="ticker-wrap" onMouseEnter={() => setTickerPaused(true)} onMouseLeave={() => setTickerPaused(false)}>
        <div className={`ticker-track ${tickerPaused ? "paused" : ""}`}>
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <div className="ticker-item" key={i}>
              <span className="ticker-crop">{item.crop}</span>
              <span className="ticker-sep">·</span>
              <span className="ticker-market">{item.market}</span>
              <span className="ticker-sep">·</span>
              <span className="ticker-price">{item.price}</span>
              <span className={item.trend.startsWith("+") ? "ticker-up" : "ticker-dn"}>
                {item.trend.startsWith("+") ? "▲" : "▼"} {item.trend}
              </span>
              <span className="ticker-sep">⸺</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── STATS ─────────────────────────────────────────────────────────── */}
      <div className="stats-section">
        <div className="stats-inner">
          <div className="stats-grid" ref={statsRef}>
            {[
              { emoji: "👨‍🌾", value: farmers, suffix: "+", label: "Active Farmers", after: "on platform" },
              { emoji: "🏪", value: markets, suffix: "+", label: "APMC Markets", after: "across India" },
              { emoji: "🌾", value: crops, suffix: "+", label: "Crop Varieties", after: "tracked daily" },
              { emoji: "💰", value: revenue, suffix: "Cr+", label: "Farm Revenue", after: "facilitated" },
            ].map(({ emoji, value, suffix, label, after }) => (
              <div className="stat-card fade-up visible" key={label}>
                <div className="stat-emoji">{emoji}</div>
                <div className="stat-value">{value.toLocaleString("en-IN")}<span className="stat-suffix">{suffix}</span></div>
                <div className="stat-label">{label}</div>
                <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>{after}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FEATURES ──────────────────────────────────────────────────────── */}
      <div className="features-section" id="features">
        <div className="features-inner">
          <div className="section-eyebrow">Platform Capabilities</div>
          <h2 className="section-title">Everything a farmer<br />needs to succeed</h2>
          <p className="section-desc">Four powerful tools, one unified platform. AI-driven intelligence for every farming decision.</p>

          <div className="features-layout">
            <div className="features-tabs">
              {features.map((f) => (
                <div
                  key={f.id}
                  className={`feature-tab ${activeFeature === f.id ? "active" : ""}`}
                  onClick={() => setActiveFeature(f.id)}
                  id={`feature-tab-${f.id}`}
                >
                  <div className="tab-emoji-wrap" style={{ background: activeFeature === f.id ? `rgba(${f.id === 0 ? "34,197,94" : f.id === 1 ? "167,139,250" : f.id === 2 ? "56,189,248" : "251,146,60"},0.15)` : "var(--surface)" }}>
                    {f.emoji}
                  </div>
                  <div>
                    <div className="tab-title">{f.title}</div>
                    <div className="tab-sub">{f.subtitle}</div>
                  </div>
                  <span className="tab-arrow">→</span>
                </div>
              ))}
            </div>

            <div className="feature-panel" style={{ borderColor: `rgba(${activeFeature === 0 ? "34,197,94" : activeFeature === 1 ? "167,139,250" : activeFeature === 2 ? "56,189,248" : "251,146,60"},0.2)` }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: 24, background: `radial-gradient(ellipse 60% 50% at 80% 20%, ${features[activeFeature].glow}, transparent)`, pointerEvents: "none" }} />
              <div style={{ position: "relative" }}>
                <div className="panel-big-emoji">{features[activeFeature].visual}</div>
                <div className="panel-title">{features[activeFeature].title}</div>
                <div className="panel-desc">{features[activeFeature].desc}</div>
                <div className="panel-bullets">
                  {features[activeFeature].bullets.map((b) => (
                    <div className="panel-bullet" key={b}>
                      <div className="bullet-check" style={{ background: `rgba(${activeFeature === 0 ? "34,197,94" : activeFeature === 1 ? "167,139,250" : activeFeature === 2 ? "56,189,248" : "251,146,60"},0.15)`, color: features[activeFeature].color }}>✓</div>
                      {b}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── ROLES ─────────────────────────────────────────────────────────── */}
      <div className="roles-section" id="users">
        <div className="roles-inner">
          <div className="roles-header">
            <div className="section-eyebrow" style={{ justifyContent: "center" }}>Who It's For</div>
            <h2 className="section-title" style={{ textAlign: "center" }}>One platform, every role<br />in the supply chain</h2>
          </div>

          <div className="roles-grid">
            {roles.map((r) => (
              <div key={r.title} className="role-card" style={{ background: r.bg }}>
                <div className="role-card-glow" style={{ background: r.color }} />
                <div className="role-emoji">{r.emoji}</div>
                <div className="role-title">{r.title}</div>
                <div className="role-stat" style={{ color: r.color }}>{r.stats}</div>
                <ul className="role-perks">
                  {r.perks.map((p) => (
                    <li key={p} className="role-perk">
                      <div className="perk-dot" style={{ background: r.color }} />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── AI SECTION ────────────────────────────────────────────────────── */}
      <div className="ai-section" id="ai">
        <div className="ai-glow-1" />
        <div className="ai-glow-2" />
        <div className="ai-inner">
          <div>
            <div className="section-eyebrow">Artificial Intelligence</div>
            <h2 className="section-title">AI that works as hard<br />as the farmer</h2>
            <div className="ai-features">
              {[
                { icon: "🌿", title: "Gemini Vision Diagnosis", desc: "Upload a leaf photo, get instant disease ID with treatment plan in seconds." },
                { icon: "📊", title: "RandomForest Price Engine", desc: "ML models trained on 5 years of Karnataka APMC data predict prices 7–30 days ahead." },
                { icon: "🌦️", title: "Weather Intelligence", desc: "Hyperlocal forecasts with irrigation, sowing, and pesticide timing advisories." },
                { icon: "💬", title: "Smart Advisory Bot", desc: "Ask farming questions in Kannada, Hindi, or English — get AI expert answers." },
              ].map((f) => (
                <div className="ai-feature" key={f.title}>
                  <div className="ai-feature-icon">{f.icon}</div>
                  <div>
                    <div className="ai-feature-title">{f.title}</div>
                    <div className="ai-feature-desc">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ai-demo">
            <div className="ai-demo-header">
              <div className="ai-demo-icon">🧠</div>
              <div>
                <div className="ai-demo-title">Gemini Crop Diagnosis</div>
                <div className="ai-demo-sub">Live analysis result</div>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#4ade80" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80" }} />
                Processing
              </div>
            </div>

            <div className="ai-terminal">
              <div className="terminal-line"><span className="t-gray">$ </span><span className="t-green">agroconnect</span> <span className="t-blue">diagnose</span> <span className="t-yellow">tomato_leaf.jpg</span></div>
              <div className="terminal-line t-gray">→ Uploading to Gemini Vision API...</div>
              <div className="terminal-line t-gray">→ Analyzing crop image (1024×768px)...</div>
              <div className="terminal-line" style={{ marginTop: 12 }}><span className="t-green">✓ DISEASE DETECTED</span></div>
              <div className="terminal-line"><span className="t-white">  Name: </span><span className="t-yellow">Early Blight (Alternaria solani)</span></div>
              <div className="terminal-line"><span className="t-white">  Confidence: </span><span className="t-green">94.7%</span></div>
              <div className="terminal-line"><span className="t-white">  Severity: </span><span style={{ color: "#fb923c" }}>Moderate</span></div>
              <div className="terminal-line" style={{ marginTop: 8 }}><span className="t-green">✓ TREATMENT PLAN</span></div>
              <div className="terminal-line"><span className="t-gray">  1. Apply Mancozeb 75WP @ 2.5g/L</span></div>
              <div className="terminal-line"><span className="t-gray">  2. Remove infected lower leaves</span></div>
              <div className="terminal-line"><span className="t-gray">  3. Spray every 7 days for 3 weeks</span></div>
              <div className="terminal-line" style={{ marginTop: 8 }}><span className="t-green">$</span> <div className="t-cursor" /></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <div className="how-section">
        <div className="how-inner">
          <div className="how-header">
            <div className="section-eyebrow" style={{ justifyContent: "center" }}>Simple & Powerful</div>
            <h2 className="section-title" style={{ textAlign: "center" }}>Up and running in<br />under 5 minutes</h2>
          </div>

          <div className="how-steps">
            {steps.map((s) => (
              <div className="how-step" key={s.n}>
                <div className="step-bubble">
                  <span>{s.icon}</span>
                  <div className="step-num">{s.n}</div>
                </div>
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <div className="cta-section">
        <div className="cta-inner">
          <div style={{ fontSize: 56, marginBottom: 24 }}>🌾</div>
          <h2 className="cta-title">Ready to transform<br />your farming income?</h2>
          <p className="cta-desc">Join 12,800+ farmers who use AgroConnect 360 to sell smarter, detect diseases early, and predict market prices before anyone else.</p>
          <div className="cta-actions">
            <Link to="/login" className="btn-primary" id="cta-join-btn">
              Join Free — No Credit Card →
            </Link>
            <a href="#features" className="btn-secondary">View All Features</a>
          </div>
          <div className="cta-note">✓ Free forever plan &nbsp; ✓ OTP login, no password &nbsp; ✓ All Indian languages</div>
        </div>
      </div>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-grid">
            <div>
              <div className="footer-brand">🌱 AgroConnect 360</div>
              <p className="footer-tagline">India's most advanced agricultural intelligence platform. Connecting every link in the farm-to-market chain.</p>
            </div>
            <div>
              <div className="footer-col-title">Platform</div>
              <div className="footer-links">
                <a href="#features" className="footer-link">Features</a>
                <a href="#users" className="footer-link">For Farmers</a>
                <a href="#users" className="footer-link">For Sellers</a>
                <a href="#users" className="footer-link">For Exporters</a>
              </div>
            </div>
            <div>
              <div className="footer-col-title">Intelligence</div>
              <div className="footer-links">
                <a href="#ai" className="footer-link">AI Disease Detection</a>
                <a href="#ai" className="footer-link">Price Predictions</a>
                <a href="#features" className="footer-link">Weather Advisory</a>
                <a href="#features" className="footer-link">Market Trends</a>
              </div>
            </div>
            <div>
              <div className="footer-col-title">Data Sources</div>
              <div className="footer-links">
                <span className="footer-link">Data.gov.in APMC</span>
                <span className="footer-link">OpenWeatherMap</span>
                <span className="footer-link">Google Gemini AI</span>
                <span className="footer-link">Agmarknet India</span>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="footer-copy">© {new Date().getFullYear()} AgroConnect 360. Built with ❤️ for Indian farmers.</div>
            <div className="footer-badges">
              <div className="footer-badge">🔒 Secure</div>
              <div className="footer-badge">🇮🇳 Made in India</div>
              <div className="footer-badge">🤖 AI Powered</div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}