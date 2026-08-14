import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../../config/api";

/* ═══════════════════════════════════════════════════════
   SELLER-SPECIFIC QUICK PROMPTS
═══════════════════════════════════════════════════════ */
const QUICK_PROMPTS = [
  { icon: "📊", text: "Best crops to procure this season?" },
  { icon: "💰", text: "Current wholesale price of tomato?" },
  { icon: "🧾", text: "GST on agricultural products?" },
  { icon: "📦", text: "How to manage bulk inventory?" },
  { icon: "🚚", text: "Cold chain logistics costs in India?" },
  { icon: "📈", text: "High-margin crops for resale?" },
  { icon: "🤝", text: "How to negotiate with farmers?" },
  { icon: "📋", text: "How to use the Procurement page?" },
];

const TOPIC_CARDS = [
  {
    icon: "🛒",
    title: "Procurement",
    desc: "Sourcing, bulk pricing, seasonal availability",
    prompts: ["Best Kharif crops to source?", "How to evaluate a farmer supplier?", "Minimum order quantity for onions?"],
  },
  {
    icon: "📊",
    title: "Market Prices",
    desc: "APMC rates, wholesale trends, margins",
    prompts: ["Current wholesale price of potato?", "Wheat market trend this season?", "Mango procurement margin?"],
  },
  {
    icon: "📦",
    title: "Inventory & Logistics",
    desc: "Stock management, cold chain, transport",
    prompts: ["Cold storage cost per quintal?", "How long can I store onions?", "Truck freight rates per ton?"],
  },
  {
    icon: "📋",
    title: "Portal Help",
    desc: "How to use AgroConnect Seller Portal",
    prompts: ["How to place a bulk order?", "How to track my orders?", "How to read my revenue report?"],
  },
];

/* ═══════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════ */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');

  .sai-layout {
    display: grid;
    grid-template-columns: 260px 1fr;
    gap: 20px;
    height: calc(100vh - 140px);
    min-height: 580px;
  }

  /* ── Sidebar ── */
  .sai-sidebar {
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow-y: auto;
  }
  .sai-sidebar::-webkit-scrollbar { width: 0; }

  .sai-topic-card {
    padding: 14px 16px;
    background: rgba(167,139,250,0.04);
    border: 1px solid rgba(167,139,250,0.1);
    border-radius: 14px;
    cursor: default;
    transition: border-color 0.2s, background 0.2s;
  }
  .sai-topic-card:hover { background: rgba(167,139,250,0.07); border-color: rgba(167,139,250,0.2); }

  .sai-topic-icon { font-size: 20px; margin-bottom: 6px; }
  .sai-topic-title { font-family: 'Space Grotesk',sans-serif; font-size: 13px; font-weight: 800; color: #fff; margin-bottom: 2px; }
  .sai-topic-desc { font-size: 11px; color: rgba(167,139,250,0.7); margin-bottom: 10px; }
  .sai-topic-prompt {
    display: block; width: 100%;
    text-align: left; background: none; border: none;
    color: rgba(255,255,255,0.55); font-size: 11.5px;
    font-family: 'Inter',sans-serif; font-weight: 500;
    padding: 5px 0; cursor: pointer; border-radius: 5px;
    transition: color 0.15s;
  }
  .sai-topic-prompt:hover { color: #a78bfa; }
  .sai-topic-prompt::before { content: '› '; color: rgba(167,139,250,0.4); }

  /* ── Chat pane ── */
  .sai-chat {
    display: flex;
    flex-direction: column;
    border-radius: 22px;
    overflow: hidden;
    background: linear-gradient(160deg, rgba(8,6,22,0.97) 0%, rgba(6,5,18,0.98) 100%);
    border: 1px solid rgba(167,139,250,0.15);
    box-shadow: 0 0 0 1px rgba(167,139,250,0.04), 0 40px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04);
    position: relative;
  }

  /* Animated bg grid */
  .sai-chat::before {
    content:'';
    position:absolute; inset:0;
    background-image:
      linear-gradient(rgba(167,139,250,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(167,139,250,0.025) 1px, transparent 1px);
    background-size:40px 40px;
    pointer-events:none; z-index:0;
  }

  /* ── Header ── */
  .sai-header {
    position: relative; z-index: 2;
    padding: 16px 22px;
    border-bottom: 1px solid rgba(167,139,250,0.1);
    background: rgba(0,0,0,0.3);
    backdrop-filter: blur(20px);
    display: flex; align-items: center; justify-content: space-between;
    flex-shrink: 0;
  }
  .sai-avatar-ring {
    width: 44px; height: 44px; border-radius: 50%;
    background: linear-gradient(135deg, #7c3aed, #a78bfa, #6d28d9);
    padding: 2px; position: relative; flex-shrink: 0;
  }
  .sai-avatar-ring::after {
    content:''; position:absolute; inset:-3px; border-radius:50%;
    border:2px solid rgba(167,139,250,0.4);
    animation: saiPulse 2s ease infinite;
  }
  @keyframes saiPulse { 0%,100%{transform:scale(1);opacity:0.5} 50%{transform:scale(1.08);opacity:1} }
  .sai-avatar-inner {
    width:100%; height:100%; border-radius:50%;
    background: rgba(0,0,0,0.55);
    display:flex; align-items:center; justify-content:center;
    font-size:20px;
  }
  .sai-status-dot {
    width:8px; height:8px; border-radius:50%;
    background:#a78bfa; box-shadow:0 0 8px #a78bfa;
    animation: saiDot 1.8s ease infinite;
  }
  @keyframes saiDot { 0%,100%{opacity:1} 50%{opacity:0.35} }

  /* ── Body ── */
  .sai-body {
    flex:1; overflow-y:auto; padding:22px 22px 10px;
    display:flex; flex-direction:column; gap:18px;
    position:relative; z-index:1;
  }
  .sai-body::-webkit-scrollbar { width:3px; }
  .sai-body::-webkit-scrollbar-track { background:transparent; }
  .sai-body::-webkit-scrollbar-thumb { background:rgba(167,139,250,0.2); border-radius:2px; }

  .sai-msg-row { display:flex; gap:10px; align-items:flex-start; }
  .sai-msg-row.user { flex-direction:row-reverse; }

  .sai-msg-avatar {
    width:32px; height:32px; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    font-size:14px; flex-shrink:0; margin-top:2px;
  }
  .sai-msg-avatar.ai   { background:linear-gradient(135deg,rgba(124,58,237,0.25),rgba(167,139,250,0.15)); border:1px solid rgba(167,139,250,0.2); }
  .sai-msg-avatar.user { background:linear-gradient(135deg,rgba(167,139,250,0.15),rgba(124,58,237,0.1)); border:1px solid rgba(167,139,250,0.15); }

  .sai-bubble-wrap { max-width:76%; display:flex; flex-direction:column; }
  .sai-msg-row.user .sai-bubble-wrap { align-items:flex-end; }

  .sai-bubble {
    padding:12px 16px; font-size:13.5px; line-height:1.78;
    word-break:break-word; font-family:'Inter',sans-serif;
  }
  .sai-bubble.ai {
    background:rgba(255,255,255,0.04);
    border:1px solid rgba(167,139,250,0.12);
    border-radius:4px 18px 18px 18px;
    color:#ede9fe;
    backdrop-filter:blur(10px);
    box-shadow:0 4px 20px rgba(0,0,0,0.2);
  }
  .sai-bubble.user {
    background:linear-gradient(135deg,#7c3aed,#9333ea);
    border-radius:18px 4px 18px 18px;
    color:#fff;
    box-shadow:0 4px 20px rgba(124,58,237,0.4);
  }

  .sai-msg-meta {
    font-size:10px; color:rgba(255,255,255,0.2);
    margin-top:4px; padding:0 4px;
    font-family:'Inter',sans-serif;
  }

  /* Typing */
  .sai-typing-pill {
    padding:12px 16px;
    background:rgba(255,255,255,0.04); border:1px solid rgba(167,139,250,0.12);
    border-radius:4px 18px 18px 18px;
    display:inline-flex; align-items:center; gap:5px;
    backdrop-filter:blur(10px);
  }
  .sai-td { width:7px; height:7px; border-radius:50%; background:#a78bfa; animation:saiTd 1.2s infinite; }
  .sai-td:nth-child(2){ animation-delay:.2s; }
  .sai-td:nth-child(3){ animation-delay:.4s; }
  @keyframes saiTd{0%,80%,100%{transform:translateY(0);opacity:.35}40%{transform:translateY(-7px);opacity:1}}

  /* ── Footer ── */
  .sai-footer {
    padding:14px 18px;
    background:rgba(0,0,0,0.4); backdrop-filter:blur(20px);
    border-top:1px solid rgba(167,139,250,0.07);
    position:relative; z-index:2; flex-shrink:0;
  }
  .sai-quick-row { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:11px; }
  .sai-quick-chip {
    display:inline-flex; align-items:center; gap:5px;
    padding:5px 12px;
    background:rgba(167,139,250,0.06);
    border:1px solid rgba(167,139,250,0.15);
    color:#c4b5fd; border-radius:20px;
    font-size:11.5px; font-weight:600;
    cursor:pointer; transition:all 0.18s;
    font-family:'Inter',sans-serif; white-space:nowrap;
  }
  .sai-quick-chip:hover {
    background:rgba(167,139,250,0.14); border-color:rgba(167,139,250,0.35);
    color:#a78bfa; transform:translateY(-1px);
    box-shadow:0 4px 12px rgba(124,58,237,0.2);
  }

  .sai-input-row {
    display:flex; gap:8px; align-items:flex-end;
    background:rgba(255,255,255,0.03);
    border:1px solid rgba(167,139,250,0.18);
    border-radius:14px; padding:7px 7px 7px 15px;
    transition:border-color 0.2s, box-shadow 0.2s;
  }
  .sai-input-row:focus-within {
    border-color:rgba(167,139,250,0.45);
    box-shadow:0 0 0 4px rgba(124,58,237,0.07);
  }
  .sai-input {
    flex:1; background:transparent; border:none; outline:none;
    color:#fff; font-size:14px; font-family:'Inter',sans-serif;
    resize:none; line-height:1.5; padding:4px 0; max-height:110px; overflow:auto;
  }
  .sai-input::placeholder { color:rgba(255,255,255,0.2); }

  .sai-send-btn {
    width:40px; height:40px; border-radius:11px; border:none; cursor:pointer;
    background:linear-gradient(135deg,#7c3aed,#a78bfa);
    color:#fff; font-size:16px;
    display:flex; align-items:center; justify-content:center; flex-shrink:0;
    transition:all 0.2s; box-shadow:0 4px 14px rgba(124,58,237,0.45);
  }
  .sai-send-btn:hover:not(:disabled){ transform:scale(1.06); box-shadow:0 6px 20px rgba(124,58,237,0.6); }
  .sai-send-btn:disabled { opacity:0.35; cursor:not-allowed; transform:none; box-shadow:none; }

  .sai-clear-btn {
    display:inline-flex; align-items:center; gap:6px;
    padding:7px 13px; border-radius:9px;
    border:1px solid rgba(239,68,68,0.2);
    background:rgba(239,68,68,0.06);
    color:#f87171; font-size:12px; font-weight:700;
    cursor:pointer; font-family:'Inter',sans-serif;
    transition:all 0.2s;
  }
  .sai-clear-btn:hover { background:rgba(239,68,68,0.12); border-color:rgba(239,68,68,0.35); }

  .sai-gemini-badge {
    display:inline-flex; align-items:center; gap:5px;
    font-size:10px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase;
    background:linear-gradient(90deg,#a78bfa,#7c3aed,#6d28d9);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
  }

  .sai-bubble code {
    background:rgba(0,0,0,0.3); padding:2px 6px; border-radius:5px;
    font-family:monospace; font-size:12px; color:#c4b5fd;
  }
  .sai-bubble strong { color:#c4b5fd; }

  /* Responsive */
  @media(max-width:860px) {
    .sai-layout { grid-template-columns:1fr; height:auto; }
    .sai-sidebar { flex-direction:row; flex-wrap:wrap; overflow-x:auto; overflow-y:visible; padding-bottom:4px; }
    .sai-topic-card { min-width:200px; flex:1 1 200px; }
    .sai-chat { min-height:520px; height:calc(100vh - 220px); }
    .sai-quick-row { display:none; }
  }
  @media(max-width:520px) {
    .sai-sidebar { display:none; }
    .sai-chat { height:calc(100vh - 155px); border-radius:16px; }
  }
`;

/* ═══════════════════════════════════════════════════════
   INIT MESSAGE
═══════════════════════════════════════════════════════ */
const INIT_MSG = {
  role: "assistant",
  text: "🛍️ Hello! I'm your AgroConnect **Seller AI** powered by Groq. I specialize in:\n\n• **Procurement & sourcing** — best crops, seasonal availability, bulk pricing\n• **Market intelligence** — wholesale rates, margins, APMC prices\n• **Inventory & logistics** — stock management, cold chain, freight\n• **Business operations** — GST, FSSAI, working capital\n• **Portal guidance** — how to use Procurement, Orders, Revenue pages\n\nAsk me anything to grow your business! 💼",
  time: new Date(),
};

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════ */
export default function SellerAIAssistant() {
  const [messages, setMessages] = useState([INIT_MSG]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef(null);
  const inputRef                = useRef(null);
  const token                   = localStorage.getItem("agroconnect_token");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");

    const userMsg = { role: "user", text: msg, time: new Date() };
    setMessages(p => [...p, userMsg]);
    setLoading(true);

    // Build history for context (last 6 turns, excluding init)
    const history = messages
      .filter(m => m !== INIT_MSG)
      .slice(-6)
      .map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.text }));

    try {
      const r = await fetch(`${API_URL}/api/assistant/seller-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: msg, history }),
      });
      const d = await r.json();
      const reply = d.reply || d.message || "Sorry, I couldn't get a response. Please try again.";
      setMessages(p => [...p, { role: "assistant", text: reply, time: new Date() }]);
    } catch {
      setMessages(p => [...p, { role: "assistant", text: "⚠️ Network error. Please check your connection and try again.", time: new Date() }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const formatTime = (d) => d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const clearChat = () => {
    setMessages([{ ...INIT_MSG, text: "🛍️ New conversation! How can I help you with your seller business today?", time: new Date() }]);
    setInput("");
  };

  // Markdown-lite renderer
  const renderText = (text) =>
    text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, "<br/>");

  return (
    <>
      <style>{STYLES}</style>

      {/* Page header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
            <span className="sai-gemini-badge">✦ Powered by Groq AI</span>
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "clamp(20px,3vw,26px)", fontWeight: 800, color: "#fff", margin: 0 }}>
            🛍️ Seller Business AI
          </h1>
          <p style={{ fontSize: 12, color: "rgba(167,139,250,0.7)", marginTop: 4 }}>
            Procurement · Market Prices · Inventory · Business Operations
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <Link to="/seller/market-trends"
            style={{ fontSize: 12, color: "#a78bfa", background: "rgba(167,139,250,0.07)", border: "1px solid rgba(167,139,250,0.15)", padding: "7px 14px", borderRadius: 10, textDecoration: "none", fontWeight: 700 }}>
            📊 Market Trends
          </Link>
          <Link to="/seller/procurement"
            style={{ fontSize: 12, color: "#4ade80", background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.15)", padding: "7px 14px", borderRadius: 10, textDecoration: "none", fontWeight: 700 }}>
            🛒 Procurement
          </Link>
          <button className="sai-clear-btn" onClick={clearChat}>🗑 Clear</button>
        </div>
      </div>

      {/* Layout */}
      <div className="sai-layout">
        {/* Sidebar — topic cards */}
        <div className="sai-sidebar">
          {TOPIC_CARDS.map(card => (
            <div key={card.title} className="sai-topic-card">
              <div className="sai-topic-icon">{card.icon}</div>
              <div className="sai-topic-title">{card.title}</div>
              <div className="sai-topic-desc">{card.desc}</div>
              {card.prompts.map(p => (
                <button key={p} className="sai-topic-prompt" onClick={() => sendMessage(p)} disabled={loading}>
                  {p}
                </button>
              ))}
            </div>
          ))}

          {/* Quick nav */}
          <div style={{ padding: "12px 14px", background: "rgba(167,139,250,0.04)", border: "1px solid rgba(167,139,250,0.1)", borderRadius: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(167,139,250,0.7)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Quick Nav</div>
            {[
              { emoji: "📦", label: "Orders",      to: "/seller/orders" },
              { emoji: "🛒", label: "Procurement", to: "/seller/procurement" },
              { emoji: "💰", label: "Revenue",     to: "/seller/revenue" },
              { emoji: "📈", label: "Analytics",   to: "/seller/analytics" },
              { emoji: "🏠", label: "Dashboard",   to: "/seller/dashboard" },
            ].map(nav => (
              <Link key={nav.label} to={nav.to}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", textDecoration: "none", color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, transition: "color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.color = "#a78bfa"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
              >
                <span>{nav.emoji}</span> {nav.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Chat pane */}
        <div className="sai-chat">
          {/* Header */}
          <div className="sai-header">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="sai-avatar-ring">
                <div className="sai-avatar-inner">🛍️</div>
              </div>
              <div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 14, fontWeight: 800, color: "#fff" }}>AgroConnect Seller AI</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                  <div className="sai-status-dot" />
                  <span style={{ fontSize: 11, color: "#a78bfa", fontWeight: 600, fontFamily: "'Inter',sans-serif" }}>Online · Groq LLaMA</span>
                </div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "'Inter',sans-serif" }}>{messages.length - 1} messages</div>
              <div style={{ fontSize: 10, color: "rgba(167,139,250,0.4)", marginTop: 2 }}>Business specialist</div>
            </div>
          </div>

          {/* Body */}
          <div className="sai-body">
            {messages.map((m, i) => (
              <div key={i} className={`sai-msg-row ${m.role === "user" ? "user" : ""}`}>
                <div className={`sai-msg-avatar ${m.role === "user" ? "user" : "ai"}`}>
                  {m.role === "assistant" ? "🛍️" : "👤"}
                </div>
                <div className="sai-bubble-wrap">
                  <div
                    className={`sai-bubble ${m.role === "assistant" ? "ai" : "user"}`}
                    dangerouslySetInnerHTML={{ __html: renderText(m.text) }}
                  />
                  <div className="sai-msg-meta">{formatTime(m.time)}</div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="sai-msg-row">
                <div className="sai-msg-avatar ai">🛍️</div>
                <div className="sai-bubble-wrap">
                  <div className="sai-typing-pill">
                    <div className="sai-td" /><div className="sai-td" /><div className="sai-td" />
                  </div>
                  <div className="sai-msg-meta">Analyzing…</div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Footer */}
          <div className="sai-footer">
            {/* Quick prompts */}
            <div className="sai-quick-row">
              {QUICK_PROMPTS.map(p => (
                <button
                  key={p.text}
                  className="sai-quick-chip"
                  onClick={() => sendMessage(p.text)}
                  disabled={loading}
                >
                  <span>{p.icon}</span> {p.text}
                </button>
              ))}
            </div>

            {/* Input */}
            <form className="sai-input-row" onSubmit={e => { e.preventDefault(); sendMessage(); }}>
              <textarea
                ref={inputRef}
                className="sai-input"
                rows={1}
                placeholder="Ask about procurement, market prices, GST, logistics, inventory…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                }}
                disabled={loading}
              />
              <button type="submit" className="sai-send-btn" disabled={loading || !input.trim()} title="Send (Enter)">
                {loading ? "⏳" : "➤"}
              </button>
            </form>

            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.16)", marginTop: 7, textAlign: "center", fontFamily: "'Inter',sans-serif" }}>
              Enter to send · Shift+Enter for new line · Verify prices at your local APMC mandi
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
