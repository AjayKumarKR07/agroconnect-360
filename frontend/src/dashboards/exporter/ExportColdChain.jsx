import { useState } from "react";

const DS_EXPORTER = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
  .pg-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:16px;flex-wrap:wrap;}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#f59e0b;margin-bottom:6px;}
  .pg-title{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:800;color:#fff;line-height:1.2;}
  .pg-sub{font-size:14px;color:var(--text2);margin-top:6px;}
  .card{background:rgba(245,158,11,0.04);border:1px solid rgba(245,158,11,0.12);border-radius:18px;padding:22px;}
  .btn-gold{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:12px;background:linear-gradient(135deg,#d97706,#f59e0b);color:#fff;font-weight:700;font-size:14px;border:none;cursor:pointer;font-family:'Inter',sans-serif;}
`;

const REEFERS = [
  { container: "MSKU-948201", cargo: "Alphonso Mangoes (20 Tons)", temp: "+4.2°C", targetTemp: "+4.0°C", humidity: "88%", co2: "0.5%", battery: "94%", status: "OPTIMAL", color: "#4ade80", location: "Arabian Sea (En-Route Dubai)" },
  { container: "CMAU-102938", cargo: "Green Bananas (18 Tons)", temp: "+13.5°C", targetTemp: "+13.0°C", humidity: "90%", co2: "0.8%", battery: "89%", status: "OPTIMAL", color: "#4ade80", location: "Indian Ocean (En-Route Rotterdam)" },
  { container: "HLCU-883012", cargo: "Fresh Okra & Vegetables (12 Tons)", temp: "+7.8°C", targetTemp: "+6.0°C", humidity: "95%", co2: "1.2%", battery: "76%", status: "TEMP SPIKE", color: "#fbbf24", location: "Nhava Sheva CFS Cold Store" },
];

export default function ExportColdChain() {
  const [reefers, setReefers] = useState(REEFERS);
  const [selected, setSelected] = useState(REEFERS[0]);

  return (
    <>
      <style>{DS_EXPORTER}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">IoT Reefer Container Telematics</div>
          <h1 className="pg-title">❄️ Cold Chain & Climate Monitoring</h1>
          <p className="pg-sub">Live IoT sensor telemetry monitoring temperature, humidity, and atmospheric gas levels inside refrigerated containers.</p>
        </div>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: "#fbbf24" }}>
          3 Active Reefers Monitored
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 20 }}>
        {/* Left Side: Reefer List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {reefers.map(r => (
            <div key={r.container} onClick={() => setSelected(r)} className="card"
              style={{ padding: 16, cursor: "pointer", background: selected.container === r.container ? "rgba(245,158,11,0.12)" : "rgba(245,158,11,0.03)", borderColor: selected.container === r.container ? "rgba(245,158,11,0.3)" : "rgba(245,158,11,0.1)", transition: "all 0.2s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontFamily: "monospace", fontWeight: 800, color: "#fbbf24", fontSize: 14 }}>{r.container}</span>
                <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 6, background: `${r.color}20`, color: r.color, fontWeight: 800 }}>
                  ● {r.status}
                </span>
              </div>
              <div style={{ fontWeight: 700, color: "#fff", fontSize: 13, marginBottom: 6 }}>{r.cargo}</div>
              <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text2)" }}>
                <span>🌡️ <strong style={{ color: "#fff" }}>{r.temp}</strong></span>
                <span>💧 <strong style={{ color: "#fff" }}>{r.humidity}</strong></span>
                <span>🔋 <strong style={{ color: "#fff" }}>{r.battery}</strong></span>
              </div>
            </div>
          ))}
        </div>

        {/* Right Side: IoT Telemetry Dashboard */}
        {selected && (
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid rgba(245,158,11,0.1)", paddingBottom: 16, flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 800, color: "#fbbf24" }}>
                  ❄️ Reefer Unit: {selected.container}
                </div>
                <div style={{ fontSize: 14, color: "#fff", fontWeight: 700, marginTop: 2 }}>{selected.cargo}</div>
                <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>📍 Location: {selected.location}</div>
              </div>
              <span style={{ fontSize: 12, padding: "4px 12px", borderRadius: 8, background: `${selected.color}20`, color: selected.color, fontWeight: 800, border: `1px solid ${selected.color}40` }}>
                ● SENSOR STATUS: {selected.status}
              </span>
            </div>

            {/* 4 Sensor Telemetry Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 14 }}>
              {[
                ["🌡️ Temperature", selected.temp, `Target: ${selected.targetTemp}`, "#f59e0b"],
                ["💧 Relative Humidity", selected.humidity, "Optimal Range 85-95%", "#38bdf8"],
                ["☁️ CO2 Gas Level", selected.co2, "Controlled Atmosphere", "#a78bfa"],
                ["🔋 IoT Battery", selected.battery, "Solar + Battery Backup", "#4ade80"],
              ].map(([label, val, sub, color]) => (
                <div key={label} style={{ background: "rgba(0,0,0,0.25)", padding: "14px 16px", borderRadius: 14, border: "1px solid rgba(245,158,11,0.1)" }}>
                  <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase" }}>{label}</div>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color, marginTop: 4 }}>{val}</div>
                  <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>{sub}</div>
                </div>
              ))}
            </div>

            {/* Temperature Log Timeline */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginBottom: 12 }}>
                📈 Last 24 Hours Climate Log (Hourly Intervals)
              </div>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
                {[
                  { time: "00:00", t: "+4.1°C" },
                  { time: "04:00", t: "+4.0°C" },
                  { time: "08:00", t: "+4.3°C" },
                  { time: "12:00", t: "+4.2°C" },
                  { time: "16:00", t: "+4.1°C" },
                  { time: "20:00", t: "+4.2°C" },
                ].map((log, idx) => (
                  <div key={idx} style={{ flex: 1, minWidth: 80, padding: "10px", borderRadius: 10, background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.1)", textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "var(--text2)" }}>{log.time}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#f59e0b", marginTop: 2 }}>{log.t}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
