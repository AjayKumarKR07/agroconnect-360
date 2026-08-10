import { useState, useRef, useEffect } from "react";

const DS_USER = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
  .pg-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:16px;flex-wrap:wrap;}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#0ea5e9;margin-bottom:6px;}
  .pg-title{font-family:'Space Grotesk',sans-serif;font-size:clamp(22px,3vw,28px);font-weight:800;color:#fff;line-height:1.2;}
  .pg-sub{font-size:14px;color:var(--text2);margin-top:6px;}
  .card{background:rgba(14,165,233,0.04);border:1px solid rgba(14,165,233,0.1);border-radius:18px;padding:24px;}
  .btn-cyan{display:inline-flex;align-items:center;gap:8px;padding:12px 22px;border-radius:12px;background:linear-gradient(135deg,#0284c7,#0ea5e9);color:#fff;font-weight:700;font-size:14px;border:none;cursor:pointer;font-family:'Inter',sans-serif;transition:opacity 0.2s,transform 0.2s;box-shadow:0 4px 15px rgba(14,165,233,0.3);}
  .btn-cyan:hover{opacity:0.9;transform:translateY(-1px);}
  .btn-ghost{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border-radius:10px;border:1px solid rgba(14,165,233,0.2);background:rgba(14,165,233,0.06);color:#7dd3fc;font-weight:600;font-size:13px;cursor:pointer;font-family:'Inter',sans-serif;}
  .field-label{display:block;font-size:12px;font-weight:700;color:var(--text2);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.04em;}
  .field-input{width:100%;padding:10px 14px;border-radius:11px;border:1px solid rgba(14,165,233,0.18);background:rgba(14,165,233,0.05);color:#fff;font-size:14px;font-family:'Inter',sans-serif;outline:none;transition:border-color 0.2s;box-sizing:border-box;}
  .field-input:focus{border-color:rgba(14,165,233,0.4);}
  .typing-dot{width:7px;height:7px;border-radius:50%;background:#7dd3fc;animation:typingBounce 1.2s ease infinite;}
  .typing-dot:nth-child(2){animation-delay:0.2s;}
  .typing-dot:nth-child(3){animation-delay:0.4s;}
  @keyframes typingBounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}
  .inq-item{padding:12px 14px;border-radius:14px;cursor:pointer;transition:all 0.2s;}
  .inq-item:hover{background:rgba(14,165,233,0.06);}
  .inq-item.active{background:rgba(14,165,233,0.12);border:1px solid rgba(14,165,233,0.3);}
  .msg-input{flex:1;padding:12px 16px;border-radius:12px;border:1px solid rgba(14,165,233,0.2);background:rgba(14,165,233,0.05);color:#fff;font-size:14px;font-family:'Inter',sans-serif;outline:none;resize:none;line-height:1.5;}
  .msg-input:focus{border-color:rgba(14,165,233,0.4);background:rgba(14,165,233,0.08);}
  .msg-input::placeholder{color:rgba(255,255,255,0.3);}
`;

/* ── Contextual auto-reply bank ───────────────────────────────── */
const FARMER_REPLIES = {
  price: [
    "Our current wholesale rate for bulk orders (300kg+) is ₹22/kg. For 500kg+ we can offer ₹20/kg with free loading.",
    "Pricing depends on delivery timeline. Same-week: standard rate. Next-week delivery gets 8% discount. What's your schedule?",
    "Best I can do for that quantity is ₹21/kg. That already includes packaging in jute sacks.",
  ],
  quality: [
    "Yes, we have FSSAI certification and Grade A produce. Lab reports from last harvest are available on request.",
    "Our produce is organically grown, no pesticides since 2022. We can provide soil test reports if needed.",
    "Quality is Grade A. We sort and grade at farm before dispatch. Rejection rate is under 2%.",
  ],
  delivery: [
    "We can arrange delivery within 3–4 days via refrigerated transport for perishables. Which city?",
    "We have tie-ups with 3 cold-chain logistics partners. Delivery to major cities takes 2–3 days.",
    "Delivery possible. We pack in moisture-proof bags for long-distance. Please share your delivery pincode.",
  ],
  bulk: [
    "For orders above 1 ton, we offer direct farm gate pickup at ₹18/kg. Saves you transport cost.",
    "Bulk orders above 500kg get priority dispatch and dedicated packaging. We can also split into weekly batches.",
    "For that volume, let's discuss a standing order — guaranteed weekly supply at locked-in prices for 3 months.",
  ],
  cert: [
    "Yes, we hold GI certification for this produce. Certificate copy can be emailed. Please share your email.",
    "We have organic certification from India Organic (NPOP standard). Happy to share the document.",
    "APEDA registration is in place for export-quality grading. Certificate number available on invoice.",
  ],
  greet: [
    "Hello! Thanks for reaching out. I'm happy to discuss bulk requirements. What quantity are you looking at?",
    "Namaste! I saw your inquiry. We have fresh stock ready. How can I help you today?",
    "Good day! We would love to work with you. Tell me more about your requirements.",
  ],
  default: [
    "Thank you for your message. Let me check stock availability and get back to you shortly.",
    "Understood. I'll confirm the details with our farm supervisor and reply within the hour.",
    "Thanks for the inquiry. We're interested. Can you share your delivery location so I can calculate logistics?",
    "Yes, that's possible. We've done similar orders before. Let me send you our current price list.",
    "Noted! We have fresh harvest this week. Please share your order quantity and I'll prepare a quote.",
  ],
};

const pickReply = (msgText, inq) => {
  const lower = msgText.toLowerCase();
  const cropLower = (inq?.crop || "").toLowerCase();

  if (/price|rate|cost|how much|₹|rs\.?|rupee/i.test(lower)) return pick(FARMER_REPLIES.price);
  if (/quality|grade|organic|pesticide|fssai|certif/i.test(lower)) return pick(FARMER_REPLIES.quality);
  if (/deliver|transport|ship|dispatch|city|location|pincode/i.test(lower)) return pick(FARMER_REPLIES.delivery);
  if (/bulk|ton|quintal|kg|quantity|large order|500|1000/i.test(lower)) return pick(FARMER_REPLIES.bulk);
  if (/gi tag|certif|apeda|export|organic cert/i.test(lower)) return pick(FARMER_REPLIES.cert);
  if (/hi|hello|hey|namaste|good|morning|afternoon|evening/i.test(lower)) return pick(FARMER_REPLIES.greet);

  // Crop-specific context
  if (cropLower.includes("tomato")) return `Our tomatoes are harvested twice a week to ensure freshness. For ${inq?.qty || "bulk"} orders, I can give you a special rate. When do you need delivery?`;
  if (cropLower.includes("mango")) return `Alphonso season is at peak right now. Grade A export quality available. ${inq?.qty || "Your quantity"} can be packed in 5kg gift boxes or bulk sacks — your choice.`;
  if (cropLower.includes("rice")) return `Basmati stock from this Kharif season — aged 6 months. Perfect aroma and texture. For ${inq?.qty || "bulk"} orders, I offer HDPE bag packing free of cost.`;

  return pick(FARMER_REPLIES.default);
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/* ── Initial data ─────────────────────────────────────────────── */
const INITIAL_INQUIRIES = [
  {
    id: "inq-1",
    farmerName: "Ramesh Patil",
    location: "Nashik, Maharashtra",
    crop: "Fresh Tomatoes",
    qty: "500 kg",
    status: "Replied",
    statusColor: "#4ade80",
    lastMsg: "Farmer: Yes, we can offer ₹24/kg for orders above 300kg. Delivery by Tuesday.",
    date: "4 Aug 2026",
    history: [
      { sender: "Buyer",  text: "Hi Ramesh, I am looking for 500kg Tomatoes for a hotel chain. What is your best bulk rate?" },
      { sender: "Farmer", text: "Yes, we can offer ₹24/kg for orders above 300kg. Delivery by Tuesday." },
    ],
  },
  {
    id: "inq-2",
    farmerName: "Sanjay Deore",
    location: "Ratnagiri, Maharashtra",
    crop: "Alphonso Mangoes",
    qty: "100 kg",
    status: "Pending",
    statusColor: "#fbbf24",
    lastMsg: "Buyer: Do you have GI tag certification for export quality Alphonso?",
    date: "3 Aug 2026",
    history: [
      { sender: "Buyer", text: "Do you have GI tag certification for export quality Alphonso?" },
    ],
  },
];

export default function UserInquiries() {
  const [inquiries, setInquiries]   = useState(() => JSON.parse(localStorage.getItem("ac_user_inquiries") || JSON.stringify(INITIAL_INQUIRIES)));
  const [activeInq, setActiveInq]   = useState(inquiries[0] || null);
  const [newMsg, setNewMsg]         = useState("");
  const [showModal, setShowModal]   = useState(false);
  const [isTyping, setIsTyping]     = useState(false);   // farmer "typing…"
  const chatEndRef                  = useRef(null);

  const [newForm, setNewForm] = useState({
    farmerName: "Suresh Singh",
    crop: "Basmati Rice",
    qty: "200 kg",
    message: "Hi, I would like to inquire about bulk pricing and grain quality certificate.",
  });

  // Auto-scroll to bottom when messages change or typing indicator changes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeInq?.history, isTyping]);

  /* ── Send message + trigger auto-reply ───────────────────────── */
  const sendReply = () => {
    if (!newMsg.trim() || !activeInq || isTyping) return;

    const buyerMsg = newMsg.trim();
    const updatedHistory = [...activeInq.history, { sender: "Buyer", text: buyerMsg }];
    const updatedInq = { ...activeInq, history: updatedHistory, lastMsg: `You: ${buyerMsg}`, date: "Today", status: "Sent", statusColor: "#38bdf8" };

    const newList = inquiries.map(i => i.id === activeInq.id ? updatedInq : i);
    setInquiries(newList);
    setActiveInq(updatedInq);
    localStorage.setItem("ac_user_inquiries", JSON.stringify(newList));
    setNewMsg("");

    // Show "Farmer is typing…" after 600ms
    const typingDelay = 600 + Math.random() * 400;
    setTimeout(() => {
      setIsTyping(true);

      // After realistic typing time, send the farmer's reply
      const replyDelay = 1400 + Math.random() * 1200;
      setTimeout(() => {
        const farmerText = pickReply(buyerMsg, activeInq);
        const withReply = [...updatedHistory, { sender: "Farmer", text: farmerText }];
        const repliedInq = { ...updatedInq, history: withReply, lastMsg: `Farmer: ${farmerText}`, status: "Replied", statusColor: "#4ade80" };
        const finalList = newList.map(i => i.id === activeInq.id ? repliedInq : i);

        setInquiries(finalList);
        setActiveInq(repliedInq);
        localStorage.setItem("ac_user_inquiries", JSON.stringify(finalList));
        setIsTyping(false);
      }, replyDelay);
    }, typingDelay);
  };

  /* ── Create new inquiry + trigger immediate auto-reply ─────────── */
  const createInquiry = () => {
    if (!newForm.message.trim()) return;
    const item = {
      id: "inq-" + Date.now(),
      farmerName: newForm.farmerName,
      location: "Verified Farmer",
      crop: newForm.crop,
      qty: newForm.qty,
      status: "Sent",
      statusColor: "#38bdf8",
      lastMsg: `You: ${newForm.message}`,
      date: "Just now",
      history: [{ sender: "Buyer", text: newForm.message }],
    };
    const newList = [item, ...inquiries];
    setInquiries(newList);
    setActiveInq(item);
    localStorage.setItem("ac_user_inquiries", JSON.stringify(newList));
    setShowModal(false);

    // Auto-reply to the first message as well
    const typingDelay = 800 + Math.random() * 600;
    setTimeout(() => {
      setIsTyping(true);
      const replyDelay = 1500 + Math.random() * 1000;
      setTimeout(() => {
        const farmerText = pickReply(newForm.message, item);
        const withReply = [...item.history, { sender: "Farmer", text: farmerText }];
        const repliedInq = { ...item, history: withReply, lastMsg: `Farmer: ${farmerText}`, status: "Replied", statusColor: "#4ade80" };
        const finalList = [repliedInq, ...inquiries];
        setInquiries(finalList);
        setActiveInq(repliedInq);
        localStorage.setItem("ac_user_inquiries", JSON.stringify(finalList));
        setIsTyping(false);
      }, replyDelay);
    }, typingDelay);
  };

  return (
    <>
      <style>{DS_USER}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Direct Communication</div>
          <h1 className="pg-title">💬 Farmer Inquiries & Bulk Requests</h1>
          <p className="pg-sub">Negotiate bulk prices, ask about farming practices, or request custom harvests.</p>
        </div>
        <button className="btn-cyan" onClick={() => setShowModal(true)}>➕ New Bulk Inquiry</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16, minHeight: 500 }}>

        {/* ── Left: Inquiry list ─────────────────────────────── */}
        <div className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
            All Inquiries ({inquiries.length})
          </div>
          {inquiries.map(i => (
            <div
              key={i.id}
              className={`inq-item ${activeInq?.id === i.id ? "active" : ""}`}
              onClick={() => setActiveInq(i)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontWeight: 800, color: "#fff", fontSize: 14 }}>{i.farmerName}</span>
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: `${i.statusColor}20`, color: i.statusColor, fontWeight: 700, border: `1px solid ${i.statusColor}40` }}>
                  {i.status}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#38bdf8", fontWeight: 600, marginBottom: 3 }}>🌾 {i.crop} ({i.qty})</div>
              <div style={{ fontSize: 11, color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {i.lastMsg}
              </div>
            </div>
          ))}
        </div>

        {/* ── Right: Chat panel ─────────────────────────────── */}
        {activeInq ? (
          <div className="card" style={{ display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>

            {/* Chat header */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(14,165,233,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 17, fontWeight: 800, color: "#fff" }}>
                  👨‍🌾 {activeInq.farmerName}
                </div>
                <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>
                  📍 {activeInq.location} · Product: <strong style={{ color: "#38bdf8" }}>{activeInq.crop}</strong> ({activeInq.qty})
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {isTyping && (
                  <span style={{ fontSize: 11, color: "#38bdf8", fontStyle: "italic", fontFamily: "'Inter',sans-serif" }}>
                    Farmer is typing…
                  </span>
                )}
                <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8, background: `${activeInq.statusColor}20`, color: activeInq.statusColor, fontWeight: 700, border: `1px solid ${activeInq.statusColor}40` }}>
                  ● {activeInq.status}
                </span>
              </div>
            </div>

            {/* Message thread */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 12px", display: "flex", flexDirection: "column", gap: 14, minHeight: 0, maxHeight: 380 }}>
              {activeInq.history.map((m, idx) => (
                <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: m.sender === "Buyer" ? "flex-end" : "flex-start" }}>
                  <div style={{ fontSize: 10, color: "var(--text2)", marginBottom: 4, fontWeight: 600, letterSpacing: "0.04em" }}>
                    {m.sender === "Buyer" ? "You" : `${activeInq.farmerName}`}
                  </div>
                  <div style={{
                    maxWidth: "76%", padding: "11px 16px", borderRadius: m.sender === "Buyer" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    fontSize: 13.5, lineHeight: 1.55,
                    background: m.sender === "Buyer" ? "linear-gradient(135deg,#0284c7,#0ea5e9)" : "rgba(14,165,233,0.1)",
                    color: "#fff",
                    border: m.sender === "Buyer" ? "none" : "1px solid rgba(14,165,233,0.18)",
                    boxShadow: m.sender === "Buyer" ? "0 4px 16px rgba(14,165,233,0.25)" : "none",
                  }}>
                    {m.text}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                  <div style={{ fontSize: 10, color: "var(--text2)", marginBottom: 4, fontWeight: 600 }}>{activeInq.farmerName}</div>
                  <div style={{ padding: "12px 18px", borderRadius: "18px 18px 18px 4px", background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.18)", display: "flex", alignItems: "center", gap: 5 }}>
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input bar */}
            <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(14,165,233,0.1)", display: "flex", gap: 10, alignItems: "flex-end" }}>
              <textarea
                className="msg-input"
                rows={1}
                placeholder="Type your message or offer to the farmer…"
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendReply();
                  }
                }}
                style={{ minHeight: 44, maxHeight: 120, overflow: "auto" }}
              />
              <button
                className="btn-cyan"
                onClick={sendReply}
                disabled={!newMsg.trim() || isTyping}
                style={{ opacity: (!newMsg.trim() || isTyping) ? 0.5 : 1, flexShrink: 0, cursor: (!newMsg.trim() || isTyping) ? "not-allowed" : "pointer", padding: "11px 20px" }}
              >
                Send 🚀
              </button>
            </div>
          </div>
        ) : (
          <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text2)", fontSize: 14 }}>
            Select an inquiry to view the chat
          </div>
        )}
      </div>

      {/* ── New Inquiry Modal ──────────────────────────────────── */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", backdropFilter: "blur(10px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="card" style={{ maxWidth: 480, width: "100%", background: "#041a1f", border: "1px solid rgba(14,165,233,0.3)", boxShadow: "0 24px 60px rgba(0,0,0,0.8)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 800, color: "#fff" }}>
                📩 Start New Farmer Inquiry
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: "var(--text2)", fontSize: 22, cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label className="field-label">Farmer Name</label>
                <input className="field-input" value={newForm.farmerName} onChange={e => setNewForm({ ...newForm, farmerName: e.target.value })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label className="field-label">Crop / Product</label>
                  <input className="field-input" value={newForm.crop} onChange={e => setNewForm({ ...newForm, crop: e.target.value })} />
                </div>
                <div>
                  <label className="field-label">Target Quantity</label>
                  <input className="field-input" value={newForm.qty} onChange={e => setNewForm({ ...newForm, qty: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="field-label">Your Opening Message</label>
                <textarea className="field-input" rows={3} style={{ resize: "none" }} value={newForm.message} onChange={e => setNewForm({ ...newForm, message: e.target.value })} />
              </div>
              <div style={{ fontSize: 12, color: "var(--text2)", background: "rgba(14,165,233,0.06)", padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(14,165,233,0.12)" }}>
                💡 The farmer will be notified and typically responds within a few minutes.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-cyan" style={{ flex: 2 }} onClick={createInquiry}>Send Inquiry →</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
