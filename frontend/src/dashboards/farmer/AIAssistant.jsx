import { useState, useRef, useEffect } from "react";
import { API_URL } from "../../config/api";
import { DS } from "../../styles/ds";

const QUICK_PROMPTS = [
  "What crops should I grow in Kharif season?",
  "How to treat yellowing leaves on tomato?",
  "Best fertilizer for wheat crop?",
  "When should I harvest onion?",
  "How to prevent pest attack in cotton?",
  "What is MSP for paddy this year?",
];

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "👋 Hello! I'm your AgroConnect AI assistant. Ask me anything about farming — crop care, weather, pest control, market prices, and more!", time: new Date() }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const token = localStorage.getItem("agroconnect_token");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg) return;
    setInput("");
    setMessages((p) => [...p, { role: "user", text: msg, time: new Date() }]);
    setLoading(true);

    try {
      const r = await fetch(`${API_URL}/api/assistant/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: msg }),
      });
      const d = await r.json();
      // Backend always sends a 'reply' field (even on error)
      const reply = d.reply || d.message || "Sorry, I couldn't get a response. Please try again.";
      setMessages((p) => [...p, { role: "assistant", text: reply, time: new Date() }]);
    } catch (e) {
      setMessages((p) => [...p, { role: "assistant", text: "⚠️ Network error. Please check your connection and try again.", time: new Date() }]);
    } finally {
      setLoading(false);
    }
  };


  const formatTime = (d) => d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      <style>{DS + `
        .chat-wrap { display: flex; flex-direction: column; height: calc(100vh - 160px); min-height: 500px; }
        .chat-body { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
        .chat-body::-webkit-scrollbar { width: 4px; }
        .chat-body::-webkit-scrollbar-track { background: transparent; }
        .chat-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        .msg-row { display: flex; gap: 10px; align-items: flex-end; }
        .msg-row.user { flex-direction: row-reverse; }
        .msg-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
        .msg-bubble { max-width: 72%; padding: 12px 16px; border-radius: 16px; font-size: 14px; line-height: 1.7; }
        .msg-bubble.assistant { background: rgba(255,255,255,0.06); border: 1px solid var(--border); color: var(--text); border-bottom-left-radius: 4px; }
        .msg-bubble.user { background: linear-gradient(135deg,#16a34a,#059669); color: #fff; border-bottom-right-radius: 4px; }
        .msg-time { font-size: 10px; color: var(--text2); margin-top: 4px; }
        .chat-footer { padding: 16px 20px; border-top: 1px solid var(--border); background: var(--bg2); }
        .chat-input-row { display: flex; gap: 10px; }
        .chat-input { flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 13px 18px; color: #fff; font-size: 15px; font-family: 'Inter',sans-serif; outline: none; transition: border-color 0.2s; }
        .chat-input::placeholder { color: rgba(255,255,255,0.25); }
        .chat-input:focus { border-color: rgba(34,197,94,0.4); }
        .typing-dots { display: flex; gap: 4px; padding: 14px 18px; }
        .typing-dots span { width: 7px; height: 7px; background: rgba(255,255,255,0.3); border-radius: 50%; animation: bounce 1.2s infinite; }
        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-8px); } }
        .quick-btns { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
        .quick-btn { background: rgba(34,197,94,0.07); border: 1px solid rgba(34,197,94,0.15); color: #4ade80; border-radius: 20px; padding: 6px 14px; font-size: 12px; cursor: pointer; transition: background 0.2s; }
        .quick-btn:hover { background: rgba(34,197,94,0.12); }
      `}</style>

      <div className="pg-head" style={{ marginBottom: 0 }}>
        <div>
          <div className="eyebrow">Powered by Gemini AI</div>
          <h1 className="pg-title">🤖 AI Farming Assistant</h1>
        </div>
        <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => setMessages([{ role: "assistant", text: "👋 New conversation started! How can I help you today?", time: new Date() }])}>🗑️ Clear Chat</button>
      </div>

      <div className="card" style={{ padding: 0, marginTop: 20, overflow: "hidden", display: "flex", flexDirection: "column", height: "calc(100vh - 200px)", minHeight: 500 }}>
        {/* Chat body */}
        <div className="chat-body">
          {messages.map((m, i) => (
            <div key={i} className={`msg-row ${m.role}`}>
              <div className="msg-avatar" style={{ background: m.role === "assistant" ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.08)" }}>
                {m.role === "assistant" ? "🤖" : "👨‍🌾"}
              </div>
              <div>
                <div className={`msg-bubble ${m.role}`}>{m.text}</div>
                <div className={`msg-time`} style={{ textAlign: m.role === "user" ? "right" : "left" }}>{formatTime(m.time)}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="msg-row">
              <div className="msg-avatar" style={{ background: "rgba(34,197,94,0.1)" }}>🤖</div>
              <div className="msg-bubble assistant">
                <div className="typing-dots"><span /><span /><span /></div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Footer */}
        <div className="chat-footer">
          <div className="quick-btns">
            {QUICK_PROMPTS.map((p) => (
              <button key={p} className="quick-btn" onClick={() => sendMessage(p)}>{p}</button>
            ))}
          </div>
          <form className="chat-input-row" onSubmit={(e) => { e.preventDefault(); sendMessage(); }}>
            <input className="chat-input" placeholder="Ask anything about farming…" value={input} onChange={(e) => setInput(e.target.value)} disabled={loading} />
            <button type="submit" className="btn-green" disabled={loading || !input.trim()} style={{ padding: "13px 20px" }}>
              {loading ? "⏳" : "Send ➤"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
