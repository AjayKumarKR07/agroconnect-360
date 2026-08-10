import { useState, useEffect } from "react";
import { API_URL } from "../../config/api";


const DS_EXPORTER = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
  .pg-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:16px;flex-wrap:wrap;}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#f59e0b;margin-bottom:6px;}
  .pg-title{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:800;color:#fff;line-height:1.2;}
  .pg-sub{font-size:14px;color:var(--text2);margin-top:6px;}
  .card{background:rgba(245,158,11,0.04);border:1px solid rgba(245,158,11,0.12);border-radius:18px;padding:20px 22px;}
  .btn-gold{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:12px;background:linear-gradient(135deg,#d97706,#f59e0b);color:#fff;font-weight:700;font-size:14px;border:none;cursor:pointer;font-family:'Inter',sans-serif;}
  .btn-ghost{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:10px;border:1px solid rgba(245,158,11,0.2);background:rgba(245,158,11,0.06);color:#fef08a;font-weight:600;font-size:12px;cursor:pointer;font-family:'Inter',sans-serif;}
`;

const CONTAINERS = [
  {
    containerNo: "MSKU-948201",
    vessel: "Maersk Sentosa v.2408",
    cargo: "Alphonso Mangoes (20 Tons)",
    portOfOrigin: "Nhava Sheva (JNPT), Mumbai",
    destPort: "Jebel Ali Port, Dubai (UAE)",
    etd: "2 Aug 2026",
    eta: "8 Aug 2026",
    statusStep: 3, // 0=Farm Pack, 1=Factory Cold Storage, 2=Port Gate In, 3=Customs Clearance, 4=Onboard Vessel, 5=Delivered
    steps: ["Farm Pack & Inspection", "CFS Cold Storage", "Port Gate In", "Customs Clearance Passed", "Onboard Vessel", "Destination Delivered"],
  },
  {
    containerNo: "CMAU-102938",
    vessel: "CMA CGM Marco Polo",
    cargo: "Basmati Rice 1121 (50 Tons)",
    portOfOrigin: "Mundra Port, Gujarat",
    destPort: "Port of Rotterdam, Netherlands",
    etd: "28 Jul 2026",
    eta: "14 Aug 2026",
    statusStep: 4,
    steps: ["Farm Pack & Inspection", "CFS Cold Storage", "Port Gate In", "Customs Clearance Passed", "Onboard Vessel", "Destination Delivered"],
  },
  {
    containerNo: "HLCU-883012",
    vessel: "Hapag-Lloyd Express",
    cargo: "Salem Turmeric (15 Tons)",
    portOfOrigin: "Chennai Port, Tamil Nadu",
    destPort: "London Gateway, UK",
    etd: "5 Aug 2026",
    eta: "19 Aug 2026",
    statusStep: 1,
    steps: ["Farm Pack & Inspection", "CFS Cold Storage", "Port Gate In", "Customs Clearance Passed", "Onboard Vessel", "Destination Delivered"],
  },
];

export default function ExportLogistics() {
  const [containers, setContainers] = useState(CONTAINERS);
  const [activeShipment, setActiveShipment] = useState(CONTAINERS[0]);
  const [searchContainer, setSearchContainer] = useState("");
  const token = localStorage.getItem("agroconnect_token");

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch(`${API_URL}/api/exporter/shipments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const d = await r.json();
        if (d.success && Array.isArray(d.shipments) && d.shipments.length > 0) {
          const mapped = d.shipments.map(s => ({
            ...s,
            etd: new Date(s.etd).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
            eta: new Date(s.eta).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
            steps: ["Farm Pack & Inspection", "CFS Cold Storage", "Port Gate In", "Customs Clearance Passed", "Onboard Vessel", "Destination Delivered"],
          }));
          setContainers(mapped);
          setActiveShipment(mapped[0]);
        }
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);


  const filtered = containers.filter(c => !searchContainer || c.containerNo.toLowerCase().includes(searchContainer.toLowerCase()) || c.cargo.toLowerCase().includes(searchContainer.toLowerCase()));


  return (
    <>
      <style>{DS_EXPORTER}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Container & Port Tracking</div>
          <h1 className="pg-title">🚢 International Logistics & Port Operations</h1>
          <p className="pg-sub">Real-time status tracking for sea & air freight shipping containers from Indian ports.</p>
        </div>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: "#fbbf24" }}>
          {containers.length} Active Shipments
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 20 }}>
        {/* Left Side: Container List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input className="field-input" placeholder="🔍 Search Container No, Crop, Port…" value={searchContainer} onChange={e => setSearchContainer(e.target.value)} style={{ padding: "10px 14px", borderRadius: 11, border: "1px solid rgba(245,158,11,0.18)", background: "rgba(245,158,11,0.05)", color: "#fff", outline: "none" }} />

          {filtered.map(c => (
            <div key={c.containerNo} onClick={() => setActiveShipment(c)}
              className="card" style={{ padding: 16, cursor: "pointer", background: activeShipment.containerNo === c.containerNo ? "rgba(245,158,11,0.12)" : "rgba(245,158,11,0.03)", borderColor: activeShipment.containerNo === c.containerNo ? "rgba(245,158,11,0.3)" : "rgba(245,158,11,0.1)", transition: "all 0.2s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontFamily: "monospace", fontWeight: 800, color: "#fbbf24", fontSize: 14 }}>{c.containerNo}</span>
                <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 6, background: "rgba(34,197,94,0.12)", color: "#4ade80", fontWeight: 700 }}>
                  {c.steps[c.statusStep]}
                </span>
              </div>
              <div style={{ fontWeight: 700, color: "#fff", fontSize: 13, marginBottom: 4 }}>{c.cargo}</div>
              <div style={{ fontSize: 11, color: "var(--text2)" }}>📍 {c.portOfOrigin} → <strong style={{ color: "#fff" }}>{c.destPort}</strong></div>
            </div>
          ))}
        </div>

        {/* Right Side: Detailed Shipment Tracker */}
        {activeShipment && (
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, borderBottom: "1px solid rgba(245,158,11,0.1)", paddingBottom: 16 }}>
                <div>
                  <div style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 800, color: "#fbbf24" }}>
                    📦 {activeShipment.containerNo}
                  </div>
                  <div style={{ fontSize: 14, color: "#fff", fontWeight: 700, marginTop: 2 }}>
                    {activeShipment.cargo}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>
                    Vessel: <strong style={{ color: "#fff" }}>{activeShipment.vessel}</strong>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase" }}>Estimated Arrival</div>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color: "#4ade80" }}>
                    {activeShipment.eta}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text2)" }}>ETD: {activeShipment.etd}</div>
                </div>
              </div>
            </div>

            {/* Stepper Progress */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16 }}>
                Port & Customs Clearance Pipeline
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {activeShipment.steps.map((step, idx) => {
                  const done = idx <= activeShipment.statusStep;
                  const current = idx === activeShipment.statusStep;
                  return (
                    <div key={step} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: done ? "linear-gradient(135deg,#d97706,#f59e0b)" : "rgba(245,158,11,0.06)", border: `2px solid ${done ? "#f59e0b" : "rgba(245,158,11,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: done ? "#fff" : "var(--text2)", flexShrink: 0 }}>
                        {done ? "✓" : idx + 1}
                      </div>
                      <div style={{ flex: 1, padding: "10px 14px", borderRadius: 12, background: current ? "rgba(245,158,11,0.12)" : "rgba(245,158,11,0.02)", border: `1px solid ${current ? "rgba(245,158,11,0.25)" : "transparent"}` }}>
                        <div style={{ fontSize: 14, fontWeight: current ? 800 : done ? 600 : 400, color: current ? "#fef08a" : done ? "#fff" : "var(--text2)" }}>
                          {step}
                        </div>
                        {current && <div style={{ fontSize: 11, color: "#fbbf24", marginTop: 2 }}>⚡ Currently in progress at port container terminal</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Logistics Info Box */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, background: "rgba(0,0,0,0.25)", padding: 14, borderRadius: 14, border: "1px solid rgba(245,158,11,0.1)" }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase" }}>Port of Loading (POL)</div>
                <div style={{ fontSize: 13, color: "#fff", fontWeight: 700, marginTop: 2 }}>{activeShipment.portOfOrigin}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase" }}>Port of Discharge (POD)</div>
                <div style={{ fontSize: 13, color: "#fff", fontWeight: 700, marginTop: 2 }}>{activeShipment.destPort}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
