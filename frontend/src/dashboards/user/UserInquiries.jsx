import { useState } from "react";

const DS_USER = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
  .pg-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:16px;flex-wrap:wrap;}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#0ea5e9;margin-bottom:6px;}
  .pg-title{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:800;color:#fff;line-height:1.2;}
  .pg-sub{font-size:14px;color:var(--text2);margin-top:6px;}
  .card{background:rgba(14,165,233,0.04);border:1px solid rgba(14,165,233,0.1);border-radius:18px;padding:24px;}
  .btn-cyan{display:inline-flex;align-items:center;gap:8px;padding:12px 22px;border-radius:12px;background:linear-gradient(135deg,#0284c7,#0ea5e9);color:#fff;font-weight:700;font-size:14px;border:none;cursor:pointer;font-family:'Inter',sans-serif;}
  .btn-ghost{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border-radius:10px;border:1px solid rgba(14,165,233,0.2);background:rgba(14,165,233,0.06);color:#7dd3fc;font-weight:600;font-size:13px;cursor:pointer;font-family:'Inter',sans-serif;}
  .field-label{display:block;font-size:12px;font-weight:700;color:var(--text2);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.04em;}
  .field-input{width:100%;padding:10px 14px;border-radius:11px;border:1px solid rgba(14,165,233,0.18);background:rgba(14,165,233,0.05);color:#fff;font-size:14px;font-family:'Inter',sans-serif;outline:none;}
  .field-input:focus{border-color:rgba(14,165,233,0.4);}
`;

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
      { sender: "Buyer", text: "Hi Ramesh, I am looking for 500kg Tomatoes for a hotel chain. What is your best bulk rate?" },
      { sender: "Farmer", text: "Yes, we can offer ₹24/kg for orders above 300kg. Delivery by Tuesday." },
    ]
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
    ]
  }
];

export default function UserInquiries() {
  const [inquiries, setInquiries] = useState(() => JSON.parse(localStorage.getItem("ac_user_inquiries") || JSON.stringify(INITIAL_INQUIRIES)));
  const [activeInq, setActiveInq] = useState(inquiries[0] || null);
  const [newMsg, setNewMsg] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [newForm, setNewForm] = useState({
    farmerName: "Suresh Singh",
    crop: "Basmati Rice",
    qty: "200 kg",
    message: "Hi, I would like to inquire about bulk pricing and grain quality certificate.",
  });

  const sendReply = () => {
    if (!newMsg.trim() || !activeInq) return;
    const updatedHistory = [...activeInq.history, { sender: "Buyer", text: newMsg }];
    const updatedInq = { ...activeInq, history: updatedHistory, lastMsg: `Buyer: ${newMsg}`, date: "Today" };
    
    const newList = inquiries.map(i => i.id === activeInq.id ? updatedInq : i);
    setInquiries(newList);
    setActiveInq(updatedInq);
    localStorage.setItem("ac_user_inquiries", JSON.stringify(newList));
    setNewMsg("");
  };

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
      lastMsg: `Buyer: ${newForm.message}`,
      date: "Just now",
      history: [
        { sender: "Buyer", text: newForm.message },
      ]
    };
    const newList = [item, ...inquiries];
    setInquiries(newList);
    setActiveInq(item);
    localStorage.setItem("ac_user_inquiries", JSON.stringify(newList));
    setShowModal(false);
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
        <button className="btn-cyan" onClick={() => setShowModal(true)}>
          ➕ New Bulk Inquiry
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16, minHeight: 480 }}>
        {/* Left side list */}
        <div className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
            All Inquiries ({inquiries.length})
          </div>
          {inquiries.map(i => (
            <div key={i.id} onClick={() => setActiveInq(i)}
              style={{ padding: "12px 14px", borderRadius: 14, cursor: "pointer", background: activeInq?.id === i.id ? "rgba(14,165,233,0.12)" : "rgba(14,165,233,0.03)", border: `1px solid ${activeInq?.id === i.id ? "rgba(14,165,233,0.3)" : "rgba(14,165,233,0.08)"}`, transition: "all 0.2s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontWeight: 800, color: "#fff", fontSize: 14 }}>{i.farmerName}</span>
                <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 6, background: `${i.statusColor}20`, color: i.statusColor, fontWeight: 700 }}>
                  {i.status}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#38bdf8", fontWeight: 600, marginBottom: 4 }}>
                🌾 {i.crop} ({i.qty})
              </div>
              <div style={{ fontSize: 11, color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {i.lastMsg}
              </div>
            </div>
          ))}
        </div>

        {/* Right side chat panel */}
        {activeInq ? (
          <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 20 }}>
            <div>
              {/* Chat Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(14,165,233,0.1)", paddingBottom: 14, marginBottom: 16 }}>
                <div>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 800, color: "#fff" }}>
                    👨‍🌾 {activeInq.farmerName}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text2)" }}>
                    📍 {activeInq.location} · Product: <strong style={{ color: "#38bdf8" }}>{activeInq.crop}</strong> ({activeInq.qty})
                  </div>
                </div>
                <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 8, background: `${activeInq.statusColor}20`, color: activeInq.statusColor, fontWeight: 700 }}>
                  ● {activeInq.status}
                </span>
              </div>

              {/* Message thread */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 320, overflowY: "auto", paddingRight: 6 }}>
                {activeInq.history.map((m, idx) => (
                  <div key={idx} style={{ alignSelf: m.sender === "Buyer" ? "flex-end" : "flex-start", maxWidth: "80%" }}>
                    <div style={{ fontSize: 10, color: "var(--text2)", marginBottom: 3, textAlign: m.sender === "Buyer" ? "right" : "left" }}>
                      {m.sender}
                    </div>
                    <div style={{ padding: "10px 14px", borderRadius: 14, fontSize: 13, background: m.sender === "Buyer" ? "linear-gradient(135deg,#0284c7,#0ea5e9)" : "rgba(14,165,233,0.08)", color: "#fff", border: m.sender === "Buyer" ? "none" : "1px solid rgba(14,165,233,0.15)" }}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Input area */}
            <div style={{ display: "flex", gap: 10, marginTop: 20, paddingTop: 14, borderTop: "1px solid rgba(14,165,233,0.1)" }}>
              <input className="field-input" placeholder="Type message or offer to farmer…" value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === "Enter" && sendReply()} />
              <button className="btn-cyan" onClick={sendReply}>Send 🚀</button>
            </div>
          </div>
        ) : (
          <div className="card" style={{ display: "flex", alignItems: "center", justifyCenter: "center", textAlign: "center", color: "var(--text2)" }}>
            Select an inquiry to view chat thread
          </div>
        )}
      </div>

      {/* New Inquiry Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="card" style={{ maxWidth: 460, width: "100%", background: "#041a1f", border: "1px solid rgba(14,165,233,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 800, color: "#fff" }}>
                📩 Start New Farmer Inquiry
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: "var(--text2)", fontSize: 20, cursor: "pointer" }}>✕</button>
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
                <label className="field-label">Your Message / Custom Requirement</label>
                <textarea className="field-input" rows={3} style={{ resize: "none" }} value={newForm.message} onChange={e => setNewForm({ ...newForm, message: e.target.value })} />
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
