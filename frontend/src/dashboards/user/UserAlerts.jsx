import { useState } from "react";

const DS_USER = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
  .pg-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:16px;flex-wrap:wrap;}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#0ea5e9;margin-bottom:6px;}
  .pg-title{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:800;color:#fff;line-height:1.2;}
  .pg-sub{font-size:14px;color:var(--text2);margin-top:6px;}
  .card{background:rgba(14,165,233,0.04);border:1px solid rgba(14,165,233,0.1);border-radius:18px;padding:22px;}
  .btn-cyan{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:12px;background:linear-gradient(135deg,#0284c7,#0ea5e9);color:#fff;font-weight:700;font-size:14px;border:none;cursor:pointer;font-family:'Inter',sans-serif;}
  .btn-ghost{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:10px;border:1px solid rgba(14,165,233,0.2);background:rgba(14,165,233,0.06);color:#7dd3fc;font-weight:600;font-size:12px;cursor:pointer;font-family:'Inter',sans-serif;}
  .field-label{display:block;font-size:12px;font-weight:700;color:var(--text2);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.04em;}
  .field-input{width:100%;padding:10px 14px;border-radius:11px;border:1px solid rgba(14,165,233,0.18);background:rgba(14,165,233,0.05);color:#fff;font-size:14px;font-family:'Inter',sans-serif;outline:none;}
`;

const INITIAL_ALERTS = [
  { id: "alt-1", crop: "Alphonso Mangoes", targetPrice: 150, currentPrice: 200, unit: "kg", trigger: "Below Target", active: true },
  { id: "alt-2", crop: "Fresh Tomatoes", targetPrice: 25, currentPrice: 28, unit: "kg", trigger: "Below Target", active: true },
  { id: "alt-3", crop: "Basmati Rice", targetPrice: 80, currentPrice: 85, unit: "kg", trigger: "Below Target", active: false },
];

const NOTIFS = [
  { id: "n-1", emoji: "📉", title: "Price Drop Alert!", text: "Red Onions dropped from ₹25/kg to ₹22/kg in Nashik.", time: "10 mins ago", unread: true },
  { id: "n-2", emoji: "🌿", title: "Fresh Harvest Arrival", text: "Ramesh Patil just listed 500kg fresh Tomatoes.", time: "1 hour ago", unread: true },
  { id: "n-3", emoji: "🎉", title: "Special Offer", text: "Free shipping on orders above ₹500 today!", time: "4 hours ago", unread: false },
];

export default function UserAlerts() {
  const [alerts, setAlerts] = useState(() => JSON.parse(localStorage.getItem("ac_user_alerts") || JSON.stringify(INITIAL_ALERTS)));
  const [notifs, setNotifs] = useState(NOTIFS);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ crop: "Fresh Tomatoes", targetPrice: 25, unit: "kg" });

  const toggleAlert = (id) => {
    const updated = alerts.map(a => a.id === id ? { ...a, active: !a.active } : a);
    setAlerts(updated);
    localStorage.setItem("ac_user_alerts", JSON.stringify(updated));
  };

  const removeAlert = (id) => {
    const updated = alerts.filter(a => a.id !== id);
    setAlerts(updated);
    localStorage.setItem("ac_user_alerts", JSON.stringify(updated));
  };

  const addAlert = () => {
    const newAlt = {
      id: "alt-" + Date.now(),
      crop: form.crop,
      targetPrice: Number(form.targetPrice),
      currentPrice: Number(form.targetPrice) + 5,
      unit: form.unit,
      trigger: "Below Target",
      active: true,
    };
    const updated = [newAlt, ...alerts];
    setAlerts(updated);
    localStorage.setItem("ac_user_alerts", JSON.stringify(updated));
    setShowModal(false);
  };

  const markAllRead = () => setNotifs(notifs.map(n => ({ ...n, unread: false })));

  return (
    <>
      <style>{DS_USER}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Smart Notifications</div>
          <h1 className="pg-title">🔔 Price Drop & Harvest Alerts</h1>
          <p className="pg-sub">Set automated price triggers and receive fresh harvest updates from local farms.</p>
        </div>
        <button className="btn-cyan" onClick={() => setShowModal(true)}>
          ➕ Set Price Alert
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Left column: Price Trackers */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 800, color: "#fff" }}>
              📉 Active Price Trackers ({alerts.length})
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {alerts.map(a => (
              <div key={a.id} style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(14,165,233,0.03)", border: "1px solid rgba(14,165,233,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 800, color: "#fff", fontSize: 15, marginBottom: 2 }}>{a.crop}</div>
                  <div style={{ fontSize: 12, color: "var(--text2)" }}>
                    Target: <strong style={{ color: "#38bdf8" }}>₹{a.targetPrice}/{a.unit}</strong> (Current: ₹{a.currentPrice})
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button onClick={() => toggleAlert(a.id)}
                    style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${a.active ? "rgba(34,197,94,0.3)" : "rgba(148,163,184,0.3)"}`, background: a.active ? "rgba(34,197,94,0.12)" : "rgba(148,163,184,0.1)", color: a.active ? "#4ade80" : "#94a3b8", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>
                    {a.active ? "ON" : "OFF"}
                  </button>
                  <button onClick={() => removeAlert(a.id)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 14 }}>
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Recent Activity Feed */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 800, color: "#fff" }}>
              📣 Market Feed & Activity
            </div>
            <button className="btn-ghost" onClick={markAllRead}>Mark All Read</button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {notifs.map(n => (
              <div key={n.id} style={{ padding: "14px 16px", borderRadius: 14, background: n.unread ? "rgba(14,165,233,0.08)" : "rgba(14,165,233,0.02)", border: `1px solid ${n.unread ? "rgba(14,165,233,0.2)" : "rgba(14,165,233,0.06)"}`, display: "flex", gap: 12 }}>
                <span style={{ fontSize: 24, flexShrink: 0 }}>{n.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontWeight: 800, color: "#fff", fontSize: 14 }}>{n.title}</span>
                    <span style={{ fontSize: 11, color: "var(--text2)" }}>{n.time}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text2)" }}>{n.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Set Alert Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="card" style={{ maxWidth: 420, width: "100%", background: "#041a1f", border: "1px solid rgba(14,165,233,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 800, color: "#fff" }}>
                🔔 Create Price Alert
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: "var(--text2)", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label className="field-label">Crop Name</label>
                <input className="field-input" value={form.crop} onChange={e => setForm({ ...form, crop: e.target.value })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label className="field-label">Target Price (₹)</label>
                  <input className="field-input" type="number" value={form.targetPrice} onChange={e => setForm({ ...form, targetPrice: e.target.value })} />
                </div>
                <div>
                  <label className="field-label">Unit</label>
                  <select className="field-input" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                    <option value="kg">kg</option>
                    <option value="quintal">quintal</option>
                    <option value="ton">ton</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-cyan" style={{ flex: 2 }} onClick={addAlert}>Create Alert →</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
