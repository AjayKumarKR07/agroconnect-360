import { useState } from "react";
import { Link } from "react-router-dom";
import { Leaf, Apple, Wheat, Package, MapPin, X, Zap, Ban, ShoppingBag, CheckCircle2, Info } from "lucide-react";

const DS_USER = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
  .pg-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:16px;flex-wrap:wrap;}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#0ea5e9;margin-bottom:6px;}
  .pg-title{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:800;color:#0f172a;line-height:1.2;}
  .pg-sub{font-size:14px;color:var(--text2);margin-top:6px;}
  .card{background:rgba(14,165,233,0.04);border:1px solid rgba(14,165,233,0.1);border-radius:18px;padding:24px;transition:all 0.2s;}
  .card:hover{border-color:rgba(14,165,233,0.25);transform:translateY(-2px);}
  .card-title{font-family:'Space Grotesk',sans-serif;font-size:18px;font-weight:800;color:#0f172a;}
  .btn-cyan{display:inline-flex;align-items:center;gap:8px;padding:12px 22px;border-radius:12px;background:linear-gradient(135deg,#0284c7,#0ea5e9);color:#0f172a;font-weight:700;font-size:14px;border:none;cursor:pointer;text-decoration:none;font-family:'Inter',sans-serif;transition:opacity 0.2s;}
  .btn-cyan:hover{opacity:0.88;}
  .btn-ghost{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border-radius:10px;border:1px solid rgba(14,165,233,0.2);background:rgba(14,165,233,0.06);color:#7dd3fc;font-weight:600;font-size:13px;cursor:pointer;text-decoration:none;font-family:'Inter',sans-serif;}
  .tag{padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.04em;}
`;

const BOXES = [
  {
    id: "sub-1",
    name: "Organic Veggie Basket",
    Icon: Leaf,
    iconColor: "#16a34a",
    price: 499,
    cycle: "Weekly",
    items: ["Tomatoes (2kg)", "Onions (2kg)", "Potatoes (2kg)", "Spinach (500g)", "Green Chillies (250g)"],
    farmer: "Nashik Organic Co-op",
    badge: "Most Popular",
    color: "#0ea5e9",
  },
  {
    id: "sub-2",
    name: "Seasonal Fruit Box",
    Icon: Apple,
    iconColor: "#f59e0b",
    price: 799,
    cycle: "Bi-Weekly",
    items: ["Alphonso Mangoes (1.5kg)", "Green Bananas (1kg)", "Pomegranate (1kg)", "Fresh Apples (1kg)"],
    farmer: "Ratnagiri Orchards",
    badge: "Fresh Pick",
    color: "#f59e0b",
  },
  {
    id: "sub-3",
    name: "Pure Grain & Pulses Pack",
    Icon: Wheat,
    iconColor: "#10b981",
    price: 1199,
    cycle: "Monthly",
    items: ["Basmati Rice (5kg)", "Sharbati Wheat (5kg)", "Turmeric Powder (500g)", "Coriander Seeds (250g)"],
    farmer: "Punjab Farmer Federation",
    badge: "Best Value",
    color: "#10b981",
  },
];

export default function UserSubscriptions() {
  const [activeSubs, setActiveSubs] = useState(() => JSON.parse(localStorage.getItem("ac_user_subs") || "[]"));
  const [selectedBox, setSelectedBox] = useState(null);
  const [freq, setFreq] = useState("Weekly");
  const [msg, setMsg] = useState("");

  const subscribe = (box) => {
    const exists = activeSubs.some(s => s.id === box.id);
    if (exists) {
      setMsg(`You are already subscribed to ${box.name}!`);
      setTimeout(() => setMsg(""), 3000);
      return;
    }
    const newSub = {
      ...box,
      freq,
      startDate: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      nextDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      status: "Active",
    };
    const updated = [...activeSubs, newSub];
    setActiveSubs(updated);
    localStorage.setItem("ac_user_subs", JSON.stringify(updated));
    setSelectedBox(null);
    setMsg(`Subscribed to ${box.name}! First delivery scheduled.`);
    setTimeout(() => setMsg(""), 3000);
  };

  const cancelSub = (id) => {
    if (!window.confirm("Cancel this subscription?")) return;
    const updated = activeSubs.filter(s => s.id !== id);
    setActiveSubs(updated);
    localStorage.setItem("ac_user_subs", JSON.stringify(updated));
  };

  return (
    <>
      <style>{DS_USER}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Farm-to-Door Service</div>
          <h1 className="pg-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ShoppingBag size={26} color="#0ea5e9" /> Fresh Farm Subscriptions
          </h1>
          <p className="pg-sub">Subscribe to recurring fresh produce boxes straight from verified local farmers.</p>
        </div>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: "#0ea5e9" }}>
          {activeSubs.length} Active Subscription{activeSubs.length !== 1 ? "s" : ""}
        </div>
      </div>

      {msg && (
        <div style={{ marginBottom: 20, padding: "12px 18px", background: "rgba(14,165,233,0.12)", border: "1px solid rgba(14,165,233,0.25)", borderRadius: 14, color: "#0369a1", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle2 size={16} /> {msg}
        </div>
      )}

      {/* Active Subscriptions Section */}
      {activeSubs.length > 0 && (
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 14 }}>
            <Package size={16} strokeWidth={1.75} style={{ verticalAlign: "middle", marginRight: 6, color: "#0ea5e9" }} /> My Active Subscriptions
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
            {activeSubs.map(s => (
              <div key={s.id} className="card" style={{ background: "rgba(14,165,233,0.06)", borderColor: "rgba(14,165,233,0.22)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 12, background: (s.iconColor || s.color) + "18", color: s.iconColor || s.color, flexShrink: 0 }}>{s.Icon && <s.Icon size={22} strokeWidth={1.5} />}</span>
                    <div>
                      <div className="card-title" style={{ fontSize: 16 }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text2)" }}><Wheat size={11} strokeWidth={2} style={{ verticalAlign: "middle", marginRight: 4 }} />{s.farmer}</div>
                    </div>
                  </div>
                  <span className="tag" style={{ background: "rgba(34,197,94,0.15)", color: "#15803d", border: "1px solid rgba(34,197,94,0.3)" }}>
                    ● ACTIVE
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", background: "#f1f5f9", padding: "10px 14px", borderRadius: 12, marginBottom: 14, fontSize: 13 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase" }}>Price & Frequency</div>
                    <div style={{ color: "#0ea5e9", fontWeight: 800 }}>₹{s.price} / {s.freq || s.cycle}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase" }}>Next Delivery</div>
                    <div style={{ color: "#0f172a", fontWeight: 700 }}>{s.nextDelivery}</div>
                  </div>
                </div>

                <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 14 }}>
                  <strong style={{ color: "#0f172a" }}>Contents:</strong> {s.items.join(", ")}
                </div>

                <button onClick={() => cancelSub(s.id)} style={{ width: "100%", padding: "9px 0", borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)", background: "#fef2f2", color: "#dc2626", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Inter',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Ban size={14} strokeWidth={2} /> Cancel Subscription
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Plans */}
      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
        <Leaf size={18} strokeWidth={1.75} style={{ color: "#0ea5e9" }} /> Available Farm Basket Plans
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20 }}>
        {BOXES.map(b => (
          <div key={b.id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, background: b.color + "18", color: b.color, flexShrink: 0 }}>{b.Icon && <b.Icon size={26} strokeWidth={1.5} />}</span>
                <span className="tag" style={{ background: `${b.color}20`, color: b.color, border: `1px solid ${b.color}40` }}>
                  {b.badge}
                </span>
              </div>
              <div className="card-title" style={{ marginBottom: 4 }}>{b.name}</div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 14 }}><Wheat size={11} strokeWidth={2} style={{ verticalAlign: "middle", marginRight: 4 }} />Harvested by {b.farmer}</div>

              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 28, fontWeight: 800, color: "#0ea5e9", marginBottom: 16 }}>
                ₹{b.price} <span style={{ fontSize: 13, color: "var(--text2)", fontWeight: 500 }}>/ {b.cycle.toLowerCase()}</span>
              </div>

              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Included Fresh Items:</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
                {b.items.map((it, i) => (
                  <div key={i} style={{ fontSize: 13, color: "#e8f8ff", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#0369a1" }}>✓</span> {it}
                  </div>
                ))}
              </div>
            </div>

            <button className="btn-cyan" style={{ width: "100%", justifyContent: "center", display: "flex", alignItems: "center", gap: 8 }} onClick={() => setSelectedBox(b)}>
              <Zap size={14} strokeWidth={2} /> Subscribe Now · ₹{b.price}
            </button>
          </div>
        ))}
      </div>

      {/* Subscription Modal */}
      {selectedBox && (
        <div style={{ fixed: "top", position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="card" style={{ maxWidth: 440, width: "100%", background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 20px 40px rgba(0,0,0,0.12)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 12, background: selectedBox.color + "18", color: selectedBox.color, flexShrink: 0 }}>{selectedBox.Icon && <selectedBox.Icon size={22} strokeWidth={1.5} />}</span>
                <div className="card-title">{selectedBox.name}</div>
              </div>
              <button onClick={() => setSelectedBox(null)} style={{ background: "none", border: "none", color: "var(--text2)", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16 }}>
              Select your preferred delivery frequency for your fresh basket:
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {["Weekly", "Bi-Weekly", "Monthly"].map(f => (
                <button key={f} onClick={() => setFreq(f)}
                  style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${freq === f ? "#0ea5e9" : "rgba(14,165,233,0.15)"}`, background: freq === f ? "rgba(14,165,233,0.15)" : "transparent", color: freq === f ? "#38bdf8" : "var(--text2)", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
                  {f}
                </button>
              ))}
            </div>

            <div style={{ background: "rgba(14,165,233,0.05)", padding: "14px 16px", borderRadius: 12, border: "1px solid #e2e8f0", marginBottom: 20, fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: "var(--text2)" }}>Plan Total:</span>
                <span style={{ color: "#0f172a", fontWeight: 700 }}>₹{selectedBox.price} / {freq}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text2)" }}>First Delivery:</span>
                <span style={{ color: "#15803d", fontWeight: 700 }}>Tomorrow, 8:00 AM</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setSelectedBox(null)}>Cancel</button>
              <button className="btn-cyan" style={{ flex: 2 }} onClick={() => subscribe(selectedBox)}>Confirm Subscription</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
