import { useState } from "react";

const DS_ADMIN = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
  .pg-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:16px;flex-wrap:wrap;}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#818cf8;margin-bottom:6px;}
  .pg-title{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:800;color:#fff;line-height:1.2;}
  .pg-sub{font-size:14px;color:#a5b4fc;margin-top:6px;}
  .card{background:rgba(99,102,241,0.04);border:1px solid rgba(99,102,241,0.12);border-radius:18px;padding:22px;}
  .btn-indigo{display:inline-flex;align-items:center;gap:8px;padding:12px 22px;border-radius:12px;background:linear-gradient(135deg,#4f46e5,#6366f1);color:#fff;font-weight:700;font-size:14px;border:none;cursor:pointer;font-family:'Inter',sans-serif;}
  .field-label{display:block;font-size:12px;font-weight:700;color:#a5b4fc;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.04em;}
  .field-input{width:100%;padding:10px 14px;border-radius:11px;border:1px solid rgba(99,102,241,0.18);background:rgba(99,102,241,0.05);color:#fff;font-size:14px;font-family:'Inter',sans-serif;outline:none;}
`;

const HIST = [
  { id: "bc-1", target: "All Farmers (680)", title: "PM-Kisan Fertilizer Subsidy Alert", text: "New subsidy guidelines released by Ministry of Agriculture.", date: "Today", delivered: "99.4%" },
  { id: "bc-2", target: "All Exporters (50)", title: "APEDA Phytosanitary Fee Update", text: "Revised phytosanitary inspection fees effective from next week.", date: "2 Aug 2026", delivered: "100%" },
];

export default function AdminBroadcast() {
  const [form, setForm] = useState({ targetRole: "all", title: "", message: "" });
  const [history, setHistory] = useState(HIST);
  const [msg, setMsg] = useState("");

  const sendBroadcast = () => {
    if (!form.title || !form.message) return;
    const item = {
      id: "bc-" + Date.now(),
      target: form.targetRole === "all" ? "All Platform Users (1,420)" : `All ${form.targetRole}s`,
      title: form.title,
      text: form.message,
      date: "Just now",
      delivered: "100%",
    };
    setHistory([item, ...history]);
    setForm({ targetRole: "all", title: "", message: "" });
    setMsg("🚀 Announcement broadcasted successfully across platform push notifications & in-app alerts!");
    setTimeout(() => setMsg(""), 3500);
  };

  return (
    <>
      <style>{DS_ADMIN}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Platform Broadcast & Push Alerts</div>
          <h1 className="pg-title">📢 Platform Broadcast & Notification Center</h1>
          <p className="pg-sub">Broadcast global announcements or targeted push notifications to specific user roles.</p>
        </div>
      </div>

      {msg && (
        <div style={{ marginBottom: 20, padding: "12px 18px", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 14, color: "#4ade80", fontWeight: 700, fontSize: 14 }}>
          {msg}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Left Form */}
        <div className="card">
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 16 }}>
            📢 Dispatch New Announcement
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label className="field-label">Target Audience Role</label>
              <select className="field-input" value={form.targetRole} onChange={e => setForm({ ...form, targetRole: e.target.value })}>
                <option value="all">🌍 All Ecosystem Users (Farmers, Sellers, Buyers, Exporters)</option>
                <option value="farmer">🌾 Farmers Only</option>
                <option value="seller">🏬 Sellers & Inputs Dealers Only</option>
                <option value="user">🛒 Buyers & Consumers Only</option>
                <option value="exporter">🚢 Exporters Only</option>
              </select>
            </div>

            <div>
              <label className="field-label">Announcement Title</label>
              <input className="field-input" placeholder="e.g. PM-Kisan Scheme Portal Update" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>

            <div>
              <label className="field-label">Broadcast Message Content</label>
              <textarea className="field-input" rows={4} style={{ resize: "none" }} placeholder="Enter detailed notification text to send to user dashboards..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
            </div>

            <button className="btn-indigo" style={{ width: "100%", justifyContent: "center" }} onClick={sendBroadcast}>
              📢 Broadcast Now
            </button>
          </div>
        </div>

        {/* Right Broadcast History */}
        <div className="card">
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 16 }}>
            📜 Recent Broadcast History
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {history.map(h => (
              <div key={h.id} style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(99,102,241,0.03)", border: "1px solid rgba(99,102,241,0.08)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontWeight: 800, color: "#fff", fontSize: 14 }}>{h.title}</span>
                  <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 700 }}>● Delivered ({h.delivered})</span>
                </div>
                <div style={{ fontSize: 12, color: "#a5b4fc", marginBottom: 6 }}>{h.text}</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text2)" }}>
                  <span>🎯 Target: {h.target}</span>
                  <span>🗓️ {h.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
