import { useState, useRef, useEffect } from "react";
import { API_URL } from "../../config/api";
import { Bot, User, Trash2, Sprout, Leaf, Wheat, Clock, Bug, DollarSign, Send, RefreshCw } from "lucide-react";

const QUICK_PROMPTS = [
  { Icon: Sprout, text: "Kharif season crops?" },
  { Icon: Leaf, text: "Tomato yellowing leaves?" },
  { Icon: Wheat, text: "Best wheat fertilizer?" },
  { Icon: Clock, text: "When to harvest onion?" },
  { Icon: Bug, text: "Cotton pest control?" },
  { Icon: DollarSign, text: "MSP for paddy this year?" },
];

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');

  .ai-wrap {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 140px);
    min-height: 560px;
    border-radius: 16px;
    overflow: hidden;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }

  .ai-header {
    padding: 16px 20px;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  .ai-avatar-wrap {
    width: 40px; height: 40px;
    border-radius: 12px;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; flex-shrink: 0;
  }

  .ai-status-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #16a34a;
    animation: blink 1.8s ease infinite;
  }
  @keyframes blink{0%,100%{opacity:1}50%{opacity:0.4}}

  .ai-body {
    flex: 1; overflow-y: auto;
    padding: 20px 20px 12px;
    display: flex; flex-direction: column; gap: 16px;
    background: #f8fafc;
  }
  .ai-body::-webkit-scrollbar { width: 4px; }
  .ai-body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }

  .msg-row { display: flex; gap: 10px; align-items: flex-start; }
  .msg-row.user { flex-direction: row-reverse; }

  .msg-avatar {
    width: 32px; height: 32px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; flex-shrink: 0; margin-top: 2px;
  }
  .msg-avatar.ai   { background: #f0fdf4; border: 1px solid #bbf7d0; }
  .msg-avatar.user { background: #eff6ff; border: 1px solid #bfdbfe; }

  .bubble-wrap { max-width: 74%; display: flex; flex-direction: column; }
  .msg-row.user .bubble-wrap { align-items: flex-end; }

  .bubble { padding: 12px 16px; font-size: 14px; line-height: 1.75; word-break: break-word; font-family: 'Inter', sans-serif; }
  .bubble.ai {
    background: #ffffff; border: 1px solid #e2e8f0;
    border-radius: 4px 14px 14px 14px; color: #0f172a;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }
  .bubble.user {
    background: #16a34a; border-radius: 14px 4px 14px 14px;
    color: #ffffff; box-shadow: 0 2px 8px rgba(22,163,74,0.25);
  }

  .msg-meta { font-size: 10px; color: #94a3b8; margin-top: 4px; padding: 0 4px; font-family: 'Inter', sans-serif; }

  .typing-pill {
    padding: 12px 16px; background: #ffffff; border: 1px solid #e2e8f0;
    border-radius: 4px 14px 14px 14px;
    display: inline-flex; align-items: center; gap: 5px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }
  .td { width: 7px; height: 7px; border-radius: 50%; background: #16a34a; animation: td 1.2s infinite; }
  .td:nth-child(2){ animation-delay:.2s; }
  .td:nth-child(3){ animation-delay:.4s; }
  @keyframes td{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-7px);opacity:1}}

  .ai-footer {
    padding: 14px 18px; background: #ffffff;
    border-top: 1px solid #e2e8f0; flex-shrink: 0;
  }

  .quick-row { display: flex; gap: 7px; flex-wrap: wrap; margin-bottom: 12px; }
  .quick-chip {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 5px 12px; background: #f0fdf4; border: 1px solid #bbf7d0;
    color: #15803d; border-radius: 20px; font-size: 12px; font-weight: 600;
    cursor: pointer; transition: all 0.15s; font-family: 'Inter', sans-serif; white-space: nowrap;
  }
  .quick-chip:hover { background: #dcfce7; border-color: #86efac; color: #14532d; transform: translateY(-1px); }
  .quick-chip:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  .input-row {
    display: flex; gap: 10px; align-items: flex-end;
    background: #f8fafc; border: 1px solid #cbd5e1;
    border-radius: 12px; padding: 8px 8px 8px 14px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .input-row:focus-within { border-color: #16a34a; box-shadow: 0 0 0 3px rgba(22,163,74,0.1); }
  .ai-input {
    flex: 1; background: transparent; border: none; outline: none;
    color: #0f172a; font-size: 14px; font-family: 'Inter', sans-serif;
    resize: none; line-height: 1.5; padding: 4px 0; max-height: 110px; overflow: auto;
  }
  .ai-input::placeholder { color: #94a3b8; }

  .send-btn {
    width: 38px; height: 38px; border-radius: 10px; border: none; cursor: pointer;
    background: #16a34a; color: #ffffff; font-size: 16px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    transition: all 0.15s;
  }
  .send-btn:hover:not(:disabled){ background: #15803d; transform: scale(1.05); }
  .send-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .clear-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 8px;
    border: 1px solid #fecaca; background: #fef2f2;
    color: #dc2626; font-size: 12px; font-weight: 600;
    cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s;
  }
  .clear-btn:hover { background: #fee2e2; border-color: #fca5a5; }

  .bubble.ai strong { color: #15803d; }
  .bubble.user strong { color: #ffffff; font-weight: 700; }
  .bubble code { background: #f1f5f9; padding: 2px 6px; border-radius: 5px; font-family: monospace; font-size: 12.5px; color: #0369a1; border: 1px solid #e2e8f0; }
  .bubble.user code { background: rgba(255,255,255,0.25); color: #ffffff; border-color: rgba(255,255,255,0.3); }
`;

const INIT_MSG = { role: "assistant", text: "Hello! I'm your AgroConnect AI assistant powered by Gemini. Ask me anything about farming — crop care, weather, pest control, market prices, government schemes, and more!", time: new Date() };

export default function AIAssistant() {
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
      setMessages(p => [...p, { role: "assistant", text: "Network error. Please check your connection and try again.", time: new Date() }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const formatTime = (d) => d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const clearChat = () => {
    setMessages([{ ...INIT_MSG, text: "New conversation! How can I help you with farming today?", time: new Date() }]);
    setInput("");
  };

  const renderText = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, "<br/>");
  };

  return (
    <>
      <style>{STYLES}</style>

      {/* Page header — outside the card */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#16a34a", marginBottom: 4 }}>
            ✦ Powered by Gemini AI
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "clamp(22px,3vw,28px)", fontWeight: 800, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <Bot size={26} color="#16a34a" /> AI Farming Assistant
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", marginTop: 4, marginBottom: 0 }}>Ask anything about crops, weather, prices, pests, and government schemes.</p>
        </div>
        <button className="clear-btn" onClick={clearChat} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Trash2 size={13} /> Clear Chat
        </button>
      </div>

      {/* Main chat card */}
      <div className="ai-wrap">

        {/* Header bar inside card */}
        <div className="ai-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="ai-avatar-wrap" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bot size={20} color="#15803d" />
            </div>
            <div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 15, fontWeight: 700, color: "#0f172a" }}>AgroConnect AI</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                <div className="ai-status-dot" />
                <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 600, fontFamily: "'Inter',sans-serif" }}>Online · Gemini Pro</span>
              </div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#64748b", fontFamily: "'Inter',sans-serif", background: "#f1f5f9", padding: "4px 10px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
            {messages.length - 1} message{messages.length !== 2 ? "s" : ""}
          </div>
        </div>

        {/* Chat body */}
        <div className="ai-body">
          {messages.map((m, i) => (
            <div key={i} className={`msg-row ${m.role === "user" ? "user" : ""}`}>
              <div className={`msg-avatar ${m.role === "user" ? "user" : "ai"}`}>
                {m.role === "assistant" ? <Bot size={16} color="#15803d" /> : <User size={16} color="#0369a1" />}
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
              <div className="msg-avatar ai">
                <Bot size={16} color="#15803d" />
              </div>
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
            {QUICK_PROMPTS.map((p) => {
              const IconComp = p.Icon;
              return (
                <button
                  key={p.text}
                  className="quick-chip"
                  onClick={() => sendMessage(p.text)}
                  disabled={loading}
                >
                  <IconComp size={13} color="#16a34a" /> {p.text}
                </button>
              );
            })}
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
              placeholder="Ask anything about farming, crops, prices, weather…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
              }}
              disabled={loading}
            />
            <button type="submit" className="send-btn" disabled={loading || !input.trim()} title="Send (Enter)" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              {loading ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </form>

          <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 8, textAlign: "center", fontFamily: "'Inter',sans-serif" }}>
            Press Enter to send · Shift+Enter for new line · AI can make mistakes — verify important info
          </div>
        </div>
      </div>
    </>
  );
}
