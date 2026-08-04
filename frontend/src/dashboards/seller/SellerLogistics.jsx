import { useEffect, useState } from "react";
import { API_URL } from "../../config/api";
import { DS } from "../../styles/ds";

const MOCK_SHIPMENTS = [
  { id: "SHP-001", orderId: "ORD-2841", product: "Tomatoes", buyer: "Ramesh Kumar", qty: "50 kg", status: "in_transit", carrier: "BlueDart", trackingNo: "BD123456789", eta: "2026-08-05", from: "Mumbai", to: "Pune", createdAt: "2026-08-03" },
  { id: "SHP-002", orderId: "ORD-2837", product: "Basmati Rice", buyer: "Priya Stores", qty: "2 quintal", status: "delivered", carrier: "DTDC", trackingNo: "DT987654321", eta: "2026-08-02", from: "Delhi", to: "Jaipur", createdAt: "2026-07-31" },
  { id: "SHP-003", orderId: "ORD-2850", product: "Wheat", buyer: "City Mart", qty: "5 quintal", status: "pending", carrier: "Delhivery", trackingNo: "DL456789123", eta: "2026-08-07", from: "Indore", to: "Bhopal", createdAt: "2026-08-04" },
  { id: "SHP-004", orderId: "ORD-2839", product: "Onions", buyer: "Fresh Hub", qty: "100 kg", status: "dispatched", carrier: "DTDC", trackingNo: "DT112233445", eta: "2026-08-06", from: "Nashik", to: "Mumbai", createdAt: "2026-08-02" },
  { id: "SHP-005", orderId: "ORD-2828", product: "Potatoes", buyer: "Green Basket", qty: "80 kg", status: "delivered", carrier: "BlueDart", trackingNo: "BD998877665", eta: "2026-07-30", from: "Agra", to: "Lucknow", createdAt: "2026-07-28" },
];

const STATUS_CONFIG = {
  pending:    { label: "⏳ Pending",      bg: "rgba(251,191,36,0.1)",  color: "#fbbf24", step: 0 },
  dispatched: { label: "🚚 Dispatched",   bg: "rgba(167,139,250,0.1)", color: "#a78bfa", step: 1 },
  in_transit: { label: "📍 In Transit",   bg: "rgba(56,189,248,0.1)",  color: "#38bdf8", step: 2 },
  delivered:  { label: "✅ Delivered",    bg: "rgba(34,197,94,0.1)",   color: "#4ade80", step: 3 },
};

const STEPS = ["Order Placed", "Dispatched", "In Transit", "Delivered"];

export default function SellerLogistics() {
  const [shipments, setShipments] = useState(MOCK_SHIPMENTS);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");

  const token = localStorage.getItem("agroconnect_token");

  // Try loading from backend, fall back to mock
  useEffect(() => {
    fetch(`${API_URL}/api/seller/shipments`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success && d.shipments?.length) setShipments(d.shipments); })
      .catch(() => {});
  }, []);

  const filtered = shipments.filter(s => {
    if (filter !== "all" && s.status !== filter) return false;
    if (search && !s.product.toLowerCase().includes(search.toLowerCase()) && !s.buyer.toLowerCase().includes(search.toLowerCase()) && !s.trackingNo.includes(search)) return false;
    return true;
  });

  const counts = {
    all: shipments.length,
    pending: shipments.filter(s => s.status === "pending").length,
    dispatched: shipments.filter(s => s.status === "dispatched").length,
    in_transit: shipments.filter(s => s.status === "in_transit").length,
    delivered: shipments.filter(s => s.status === "delivered").length,
  };

  const updateStatus = (id, status) => {
    setShipments(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    if (selected?.id === id) setSelected(prev => ({ ...prev, status }));
    // Also update backend if connected
    fetch(`${API_URL}/api/seller/shipments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    }).catch(() => {});
  };

  return (
    <>
      <style>{DS + `
        .log-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:22px;}
        .log-tab{padding:7px 16px;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;border:1px solid var(--border);background:var(--surface);color:var(--text2);transition:all 0.2s;font-family:'Inter',sans-serif;}
        .log-tab.active{background:rgba(167,139,250,0.1);color:#a78bfa;border-color:rgba(167,139,250,0.2);}
        .ship-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:18px 20px;cursor:pointer;transition:all 0.2s;}
        .ship-card:hover{border-color:rgba(167,139,250,0.2);background:rgba(167,139,250,0.04);}
        .ship-card.sel{border-color:rgba(167,139,250,0.35);background:rgba(167,139,250,0.06);}
        .tracker{display:flex;align-items:center;gap:0;margin:20px 0;}
        .tr-step{display:flex;flex-direction:column;align-items:center;gap:6px;flex:1;}
        .tr-dot{width:28px;height:28px;border-radius:50%;border:2px solid var(--border);background:var(--surface);display:flex;align-items:center;justify-content:center;font-size:13px;transition:all 0.3s;}
        .tr-dot.done{background:linear-gradient(135deg,#7c3aed,#a78bfa);border-color:#a78bfa;box-shadow:0 0 14px rgba(167,139,250,0.5);}
        .tr-dot.cur{background:rgba(167,139,250,0.15);border-color:#a78bfa;animation:trPulse 1.5s ease infinite;}
        @keyframes trPulse{0%,100%{box-shadow:0 0 8px rgba(167,139,250,0.4)}50%{box-shadow:0 0 16px rgba(167,139,250,0.8)}}
        .tr-line{flex:1;height:2px;background:var(--border);transition:background 0.3s;margin-top:-22px;}
        .tr-line.done{background:linear-gradient(90deg,#7c3aed,#a78bfa);}
        .tr-label{font-size:10px;color:var(--text2);text-align:center;white-space:nowrap;}
        .tr-label.done,.tr-label.cur{color:#a78bfa;font-weight:700;}
      `}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Fulfillment</div>
          <h1 className="pg-title">🚚 Logistics & Shipments</h1>
          <p className="pg-sub">Track and manage all deliveries for your orders.</p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 800, color: "#a78bfa" }}>{counts.in_transit}</div>
            <div style={{ fontSize: 11, color: "var(--text2)" }}>In Transit</div>
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        {[
          ["⏳", "Pending",    counts.pending,    "#fbbf24"],
          ["🚚", "Dispatched", counts.dispatched,  "#a78bfa"],
          ["📍", "In Transit", counts.in_transit,  "#38bdf8"],
          ["✅", "Delivered",  counts.delivered,   "#4ade80"],
        ].map(([icon, label, val, color]) => (
          <div key={label} className="card" style={{ padding: "16px 18px", cursor: "pointer", transition: "border-color 0.2s" }}
            onClick={() => setFilter(label.toLowerCase().replace(" ", "_") === "in_transit" ? "in_transit" : label.toLowerCase())}
          >
            <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
            <div style={{ fontSize: 10, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 24, fontWeight: 800, color }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 380px" : "1fr", gap: 20, alignItems: "start" }}>
        {/* Shipment list */}
        <div>
          {/* Filter + Search */}
          <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
            <div className="log-tabs" style={{ marginBottom: 0 }}>
              {Object.entries(counts).map(([k, v]) => (
                <button key={k} className={`log-tab ${filter === k ? "active" : ""}`} onClick={() => setFilter(k)}>
                  {k.charAt(0).toUpperCase() + k.slice(1).replace("_", " ")} ({v})
                </button>
              ))}
            </div>
            <input className="field-input" placeholder="🔍 Search product, buyer, tracking…" value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 280, marginLeft: "auto" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.length === 0 && (
              <div className="card empty-state">
                <div className="empty-emoji">🚚</div>
                <div className="empty-title">No shipments found</div>
                <div className="empty-sub">Shipments will appear here once orders are placed.</div>
              </div>
            )}
            {filtered.map(s => {
              const st = STATUS_CONFIG[s.status];
              return (
                <div key={s.id} className={`ship-card ${selected?.id === s.id ? "sel" : ""}`} onClick={() => setSelected(s.id === selected?.id ? null : s)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <div style={{ fontWeight: 800, color: "#fff", fontSize: 15 }}>{s.product}</div>
                        <span style={{ padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color }}>{st.label}</span>
                      </div>
                      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                        <div style={{ fontSize: 12, color: "var(--text2)" }}>👤 <span style={{ color: "var(--text)" }}>{s.buyer}</span></div>
                        <div style={{ fontSize: 12, color: "var(--text2)" }}>📦 <span style={{ color: "var(--text)" }}>{s.qty}</span></div>
                        <div style={{ fontSize: 12, color: "var(--text2)" }}>📍 <span style={{ color: "var(--text)" }}>{s.from} → {s.to}</span></div>
                        <div style={{ fontSize: 12, color: "var(--text2)" }}>🚛 <span style={{ color: "var(--text)" }}>{s.carrier}</span></div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 11, color: "#a78bfa", fontWeight: 700, fontFamily: "monospace" }}>{s.trackingNo}</div>
                      <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 4 }}>ETA: {new Date(s.eta).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (() => {
          const st = STATUS_CONFIG[selected.status];
          const stepIdx = st.step;
          return (
            <div className="card" style={{ position: "sticky", top: 80 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <div className="card-title">{selected.product}</div>
                  <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>Order {selected.orderId}</div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: "var(--surface)", border: "none", borderRadius: 8, padding: "6px 10px", color: "var(--text2)", cursor: "pointer", fontSize: 14 }}>✕</button>
              </div>

              {/* Tracker */}
              <div className="tracker">
                {STEPS.map((step, i) => (
                  <div key={step} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : 0 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <div className={`tr-dot ${i < stepIdx ? "done" : i === stepIdx ? "cur" : ""}`}>
                        {i < stepIdx ? "✓" : i === stepIdx ? "●" : ""}
                      </div>
                      <div className={`tr-label ${i <= stepIdx ? (i < stepIdx ? "done" : "cur") : ""}`}>{step}</div>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`tr-line ${i < stepIdx ? "done" : ""}`} style={{ flex: 1 }} />
                    )}
                  </div>
                ))}
              </div>

              {/* Info rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                {[
                  ["👤 Buyer",    selected.buyer],
                  ["📦 Quantity", selected.qty],
                  ["📍 Route",    `${selected.from} → ${selected.to}`],
                  ["🚛 Carrier",  selected.carrier],
                  ["🔢 Tracking", selected.trackingNo],
                  ["📅 ETA",      new Date(selected.eta).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, paddingBottom: 10, borderBottom: "1px solid var(--border)" }}>
                    <span style={{ color: "var(--text2)" }}>{label}</span>
                    <span style={{ color: "#fff", fontWeight: 600 }}>{val}</span>
                  </div>
                ))}
              </div>

              {/* Status update buttons */}
              <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Update Status</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Object.entries(STATUS_CONFIG).map(([key, conf]) => (
                  <button key={key}
                    onClick={() => updateStatus(selected.id, key)}
                    style={{
                      padding: "10px 14px", borderRadius: 10, border: `1px solid ${selected.status === key ? conf.color + "40" : "var(--border)"}`,
                      background: selected.status === key ? conf.bg : "var(--surface)",
                      color: selected.status === key ? conf.color : "var(--text2)",
                      fontWeight: 700, fontSize: 13, cursor: "pointer",
                      fontFamily: "'Inter',sans-serif", textAlign: "left",
                      transition: "all 0.2s",
                    }}
                  >
                    {conf.label}
                    {selected.status === key && <span style={{ float: "right" }}>✓ Current</span>}
                  </button>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </>
  );
}
