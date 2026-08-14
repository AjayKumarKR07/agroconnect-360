import { useState, useRef, useEffect } from "react";
import { API_URL } from "../../config/api";

const QUICK_PROMPTS = [
  { icon: "🌍", text: "Best export markets for wheat?" },
  { icon: "📦", text: "Cold chain requirements for mangoes?" },
  { icon: "📋", text: "Phytosanitary certificate process?" },
  { icon: "💱", text: "USD/INR impact on export margins?" },
  { icon: "🚢", text: "Sea freight vs air freight costs?" },
  { icon: "📊", text: "Global rice demand trends 2025?" },
];

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');

  .ai-wrap {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 140px);
    min-height: 560px;
    border-radius: 24px;
    overflow: hidden;
    position: relative;
    background: linear-gradient(160deg, rgba(2,8,18,0.95) 0%, rgba(1,10,20,0.97) 100%);
    border: 1px solid rgba(245,158,11,0.15);
    box-shadow: 0 0 0 1px rgba(245,158,11,0.05), 0 40px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04);
  }

  /* animated bg grid */
  .ai-wrap::before {
    content:'';
    position:absolute;
    inset:0;
    background-image: linear-gradient(rgba(245,158,11,0.03) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(245,158,11,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events:none;
    z-index:0;
  }

  .ai-header {
    position: relative;
    z-index: 2;
    padding: 18px 24px;
    border-bottom: 1px solid rgba(245,158,11,0.1);
    background: rgba(0,0,0,0.3);
    backdrop-filter: blur(20px);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  .ai-avatar-ring {
    width: 46px; height: 46px;
    border-radius: 50%;
    background: linear-gradient(135deg, #b45309, #f59e0b, #d97706);
    padding: 2px;
    position: relative;
    flex-shrink: 0;
  }
  .ai-avatar-ring::after {
    content:'';
    position:absolute;
    inset:-3px;
    border-radius:50%;
    border:2px solid rgba(245,158,11,0.4);
    animation: pulseRing 2s ease infinite;
  }
  @keyframes pulseRing{0%,100%{transform:scale(1);opacity:0.6}50%{transform:scale(1.08);opacity:1}}
  .ai-avatar-inner {
    width:100%;height:100%;border-radius:50%;
    background:rgba(0,0,0,0.6);
    display:flex;align-items:center;justify-content:center;
    font-size:22px;
  }

  .ai-status-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #fbbf24;
    box-shadow: 0 0 8px #fbbf24;
    animation: blink 1.8s ease infinite;
  }
  @keyframes blink{0%,100%{opacity:1}50%{opacity:0.4}}

  .ai-body {
    flex: 1;
    overflow-y: auto;
    padding: 24px 24px 12px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    position: relative;
    z-index: 1;
  }
  .ai-body::-webkit-scrollbar { width: 3px; }
  .ai-body::-webkit-scrollbar-track { background: transparent; }
  .ai-body::-webkit-scrollbar-thumb { background: rgba(245,158,11,0.2); border-radius: 2px; }

  .msg-row { display: flex; gap: 12px; align-items: flex-start; }
  .msg-row.user { flex-direction: row-reverse; }

  .msg-avatar {
    width: 34px; height: 34px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; flex-shrink: 0; margin-top: 2px;
  }
  .msg-avatar.ai  { background: linear-gradient(135deg,#b4530930,#f59e0b20); border: 1px solid rgba(245,158,11,0.2); }
  .msg-avatar.user{ background: linear-gradient(135deg,rgba(245,158,11,0.15),rgba(251,191,36,0.15)); border: 1px solid rgba(251,191,36,0.15); }

  .bubble-wrap { max-width: 74%; display: flex; flex-direction: column; }
  .msg-row.user .bubble-wrap { align-items: flex-end; }

  .bubble {
    padding: 13px 18px;
    font-size: 14px;
    line-height: 1.75;
    word-break: break-word;
    font-family: 'Inter', sans-serif;
  }
  .bubble.ai {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(245,158,11,0.12);
    border-radius: 4px 18px 18px 18px;
    color: #fef9e7;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  }
  .bubble.user {
    background: linear-gradient(135deg,#b45309,#f59e0b);
    border-radius: 18px 4px 18px 18px;
    color: #fff;
    box-shadow: 0 4px 20px rgba(245,158,11,0.35);
  }

  .msg-meta {
    font-size: 10px;
    color: rgba(255,255,255,0.25);
    margin-top: 5px;
    padding: 0 4px;
    font-family: 'Inter',sans-serif;
  }

  /* Typing animation */
  .typing-pill {
    padding: 12px 18px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(245,158,11,0.12);
    border-radius: 4px 18px 18px 18px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    backdrop-filter: blur(10px);
  }
  .td { width: 7px; height: 7px; border-radius: 50%; background: #fbbf24; animation: td 1.2s infinite; }
  .td:nth-child(2){ animation-delay:.2s; }
  .td:nth-child(3){ animation-delay:.4s; }
  @keyframes td{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-7px);opacity:1}}

  /* Footer */
  .ai-footer {
    padding: 16px 20px;
    background: rgba(0,0,0,0.4);
    backdrop-filter: blur(20px);
    border-top: 1px solid rgba(245,158,11,0.08);
    position: relative; z-index: 2;
    flex-shrink: 0;
  }

  .quick-row {
    display: flex; gap: 7px; flex-wrap: wrap; margin-bottom: 13px;
  }
  .quick-chip {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 6px 13px;
    background: rgba(245,158,11,0.06);
    border: 1px solid rgba(245,158,11,0.15);
    color: #fde68a;
    border-radius: 20px; font-size: 12px; font-weight: 600;
    cursor: pointer; transition: all 0.18s;
    font-family: 'Inter', sans-serif;
    white-space: nowrap;
  }
  .quick-chip:hover {
    background: rgba(245,158,11,0.14);
    border-color: rgba(245,158,11,0.35);
    color: #fbbf24;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(245,158,11,0.15);
  }

  .input-row {
    display: flex; gap: 10px; align-items: flex-end;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(245,158,11,0.18);
    border-radius: 16px;
    padding: 8px 8px 8px 16px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .input-row:focus-within {
    border-color: rgba(245,158,11,0.45);
    box-shadow: 0 0 0 4px rgba(245,158,11,0.07);
  }
  .ai-input {
    flex: 1; background: transparent; border: none; outline: none;
    color: #fff; font-size: 14.5px; font-family: 'Inter',sans-serif;
    resize: none; line-height: 1.5; padding: 4px 0; max-height: 110px; overflow: auto;
  }
  .ai-input::placeholder { color: rgba(255,255,255,0.22); }

  .send-btn {
    width: 42px; height: 42px; border-radius: 12px; border: none; cursor: pointer;
    background: linear-gradient(135deg,#b45309,#f59e0b);
    color: #fff; font-size: 17px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    transition: all 0.2s;
    box-shadow: 0 4px 14px rgba(245,158,11,0.4);
  }
  .send-btn:hover:not(:disabled){ transform: scale(1.06); box-shadow: 0 6px 20px rgba(245,158,11,0.55); }
  .send-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }

  .clear-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 14px; border-radius: 10px;
    border: 1px solid rgba(239,68,68,0.2);
    background: rgba(239,68,68,0.06);
    color: #f87171; font-size: 12px; font-weight: 700;
    cursor: pointer; font-family: 'Inter',sans-serif;
    transition: all 0.2s;
  }
  .clear-btn:hover{ background:rgba(239,68,68,0.12); border-color:rgba(239,68,68,0.35); }

  /* Gemini badge */
  .gemini-badge {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase;
    background: linear-gradient(90deg,#f59e0b,#d97706,#fbbf24);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Markdown-like code blocks inside bubble */
  .bubble code {
    background: rgba(0,0,0,0.3);
    padding: 2px 6px; border-radius: 5px;
    font-family: monospace; font-size: 12.5px; color: #fde68a;
  }
`;

const INIT_MSG = {
  role: "assistant",
  text: "🌍 Hello! I'm your AgroConnect Export AI assistant powered by Gemini. Ask me anything about agricultural exports — global market prices, trade compliance, phytosanitary requirements, freight logistics, forex impact, Letters of Credit, customs documentation, and more!",
  time: new Date(),
};

export default function ExporterAIAssistant() {
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
    setMessages(p => [...p, { role: "user", text: msg, time: new Date() }]);
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/assistant/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: msg }),
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
    setMessages([{ ...INIT_MSG, text: "🌍 New conversation! How can I assist with your export operations today?", time: new Date() }]);
    setInput("");
  };

  // Render markdown-lite: **bold**, `code`
  const renderText = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#fde68a">$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, "<br/>");
  };

  return (
    <>
      <style>{STYLES}</style>

      {/* Page header — outside the card */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
            <span className="gemini-badge">✦ Powered by Gemini AI</span>
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "clamp(22px,3vw,28px)", fontWeight: 800, color: "#fff", margin: 0 }}>
            🌍 Export Trade AI Assistant
          </h1>
        </div>
        <button className="clear-btn" onClick={clearChat}>🗑 Clear Chat</button>
      </div>

      {/* Main chat card */}
      <div className="ai-wrap">

        {/* Header bar inside card */}
        <div className="ai-header">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="ai-avatar-ring">
              <div className="ai-avatar-inner">🌍</div>
            </div>
            <div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 15, fontWeight: 800, color: "#fff" }}>AgroConnect Export AI</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                <div className="ai-status-dot" />
                <span style={{ fontSize: 11, color: "#fbbf24", fontWeight: 600, fontFamily: "'Inter',sans-serif" }}>Online · Gemini Pro</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'Inter',sans-serif" }}>{messages.length - 1} messages</div>
            </div>
          </div>
        </div>

        {/* Chat body */}
        <div className="ai-body">
          {messages.map((m, i) => (
            <div key={i} className={`msg-row ${m.role === "user" ? "user" : ""}`}>
              <div className={`msg-avatar ${m.role === "user" ? "user" : "ai"}`}>
                {m.role === "assistant" ? "🌍" : "👤"}
              </div>
              <div className="bubble-wrap">
                <div
                  className={`bubble ${m.role === "assistant" ? "ai" : "user"}`}
                  dangerouslySetInnerHTML={{ __html: renderText(m.text) }}
                />
                <div className="msg-meta">{formatTime(m.time)}</div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="msg-row">
              <div className="msg-avatar ai">🌍</div>
              <div className="bubble-wrap">
                <div className="typing-pill">
                  <div className="td" /><div className="td" /><div className="td" />
                </div>
                <div className="msg-meta">Thinking…</div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Footer */}
        <div className="ai-footer">
          {/* Quick prompts */}
          <div className="quick-row">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p.text}
                className="quick-chip"
                onClick={() => sendMessage(p.text)}
                disabled={loading}
              >
                <span>{p.icon}</span> {p.text}
              </button>
            ))}
          </div>

          {/* Input box */}
          <form
            className="input-row"
            onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          >
            <textarea
              ref={inputRef}
              className="ai-input"
              rows={1}
              placeholder="Ask about export markets, compliance, freight, forex, trade docs…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
              }}
              disabled={loading}
            />
            <button type="submit" className="send-btn" disabled={loading || !input.trim()} title="Send (Enter)">
              {loading ? "⏳" : "➤"}
            </button>
          </form>

          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.18)", marginTop: 8, textAlign: "center", fontFamily: "'Inter',sans-serif" }}>
            Press Enter to send · Shift+Enter for new line · AI can make mistakes — verify important info
          </div>
        </div>
      </div>
    </>
  );
}
