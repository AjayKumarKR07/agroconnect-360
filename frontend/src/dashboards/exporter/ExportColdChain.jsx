import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../../config/api";
import {
  Snowflake,
  Thermometer,
  Droplets,
  Battery,
  Cloud,
  AlertTriangle,
  LineChart,
  Info,
  Ship,
  CheckCircle2,
  MapPin,
} from "lucide-react";

const DS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
  .pg-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:16px;flex-wrap:wrap;}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#f59e0b;margin-bottom:6px;}
  .pg-title{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:800;color:#0f172a;line-height:1.2;}
  .pg-sub{font-size:14px;color:var(--text2);margin-top:6px;}
  .card{background:rgba(245,158,11,0.04);border:1px solid rgba(245,158,11,0.12);border-radius:18px;padding:22px;}
  .btn-gold{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:12px;background:linear-gradient(135deg,#d97706,#f59e0b);color:#0f172a;font-weight:700;font-size:14px;border:none;cursor:pointer;font-family:'Inter',sans-serif;}
  .spinner{width:28px;height:28px;border:3px solid rgba(255,255,255,0.08);border-top-color:#f59e0b;border-radius:50%;animation:spin 0.7s linear infinite;margin:0 auto;}
  @keyframes spin{to{transform:rotate(360deg)}}
  .pulse{animation:pulse 1.6s ease-in-out infinite;}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
`;

const authH = () => ({
  Authorization: `Bearer ${localStorage.getItem("agroconnect_token")}`,
});

/**
 * Cold-chain sensor data is simulated per container.
 * In a real setup these readings would come from Carrier/Daikin IoT APIs.
 * Here we derive stable (but realistic) values from the container's DB data.
 */
function simulateSensors(shipment) {
  // Seed a deterministic "random" from the container number to keep
  // values consistent across page refreshes for the same container.
  const seed = (shipment.containerNo || "X")
    .split("")
    .reduce((a, c) => a + c.charCodeAt(0), 0);
  const pseudo = (offset) => ((seed * 9301 + offset * 49297 + 233) % 100) / 100;

  const baseTemp  = 4 + pseudo(1) * 10;           // 4°C – 14°C
  const humidity  = 80 + pseudo(2) * 15;           // 80–95%
  const co2       = 0.3 + pseudo(3) * 1.2;         // 0.3–1.5%
  const battery   = 70 + pseudo(4) * 25;           // 70–95%

  const isActive  = !["delivered", "cancelled"].includes(shipment.status);
  const hasSpike  = pseudo(5) > 0.8 && isActive;   // ~20% chance of temp spike

  const temp = hasSpike ? baseTemp + 2 : baseTemp;
  const status = !isActive ? "OFFLINE" : hasSpike ? "TEMP SPIKE" : "OPTIMAL";
  const color  = status === "OFFLINE" ? "#7a8fa6" : status === "TEMP SPIKE" ? "#fbbf24" : "#4ade80";

  // Simulated 24h hourly log (6 sample points)
  const log = [0, 4, 8, 12, 16, 20].map((h, i) => ({
    time: `${String(h).padStart(2, "0")}:00`,
    temp: (baseTemp + pseudo(i + 6) * 0.8 - 0.4).toFixed(1),
  }));

  return {
    temp:       `+${temp.toFixed(1)}°C`,
    targetTemp: `+${baseTemp.toFixed(1)}°C`,
    humidity:   `${humidity.toFixed(0)}%`,
    co2:        `${co2.toFixed(1)}%`,
    battery:    `${battery.toFixed(0)}%`,
    status,
    color,
    log,
  };
}

export default function ExportColdChain() {
  const [shipments, setShipments] = useState([]);
  const [selected,  setSelected]  = useState(null);
  const [loading,   setLoading]   = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/exporter/shipments`, { headers: authH() });
      const d = await r.json();
      if (d.success && Array.isArray(d.shipments)) {
        setShipments(d.shipments);
        if (d.shipments.length > 0) setSelected(d.shipments[0]);
      }
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Active reefers = shipments that are not yet delivered/cancelled
  const reefers = shipments.filter(s => !["delivered", "cancelled"].includes(s.status));
  const selectedSensors = selected ? simulateSensors(selected) : null;

  return (
    <>
      <style>{DS}</style>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="pg-head">
        <div>
          <div className="eyebrow">IoT Reefer Container Telematics</div>
          <h1 className="pg-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Snowflake size={26} color="#0284c7" /> Cold Chain & Climate Monitoring
          </h1>
          <p className="pg-sub">
            Simulated IoT telemetry monitoring temperature, humidity, and gas levels
            for your registered shipment containers.
          </p>
        </div>
        {!loading && reefers.length > 0 && (
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 800, color: "#b45309" }}>
            {reefers.length} Active Reefe{reefers.length !== 1 ? "rs" : "r"} Monitored
          </div>
        )}
      </div>

      {/* ── Loading ─────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "64px 0" }}>
          <div className="spinner" />
          <div style={{ marginTop: 14, fontSize: 14, color: "#a38a5d" }}>Loading container data…</div>
        </div>
      ) : shipments.length === 0 ? (
        /* ── No shipments at all ──────────────────────────────────── */
        <div style={{ textAlign: "center", padding: "72px 24px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <Snowflake size={52} color="#0284c7" strokeWidth={1.5} />
          </div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>
            No Containers to Monitor
          </div>
          <div style={{ fontSize: 14, color: "#a38a5d", marginBottom: 28, maxWidth: 420, margin: "0 auto 28px" }}>
            Cold Chain IoT monitoring activates automatically once you add shipment containers.
            Add containers from the Shipments & Port page.
          </div>
          <Link to="/exporter/logistics" className="btn-gold" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Ship size={16} /> Go to Shipments & Port
          </Link>
        </div>
      ) : reefers.length === 0 ? (
        /* ── All shipments delivered / cancelled ─────────────────── */
        <div style={{ textAlign: "center", padding: "72px 24px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <CheckCircle2 size={52} color="#16a34a" strokeWidth={1.5} />
          </div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>
            All Containers Delivered
          </div>
          <div style={{ fontSize: 14, color: "#a38a5d", marginBottom: 24 }}>
            All your containers have been delivered or cancelled. Cold chain monitoring will appear for active shipments.
          </div>
          <Link to="/exporter/logistics" className="btn-gold" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Ship size={16} /> View Logistics
          </Link>
        </div>
      ) : (
        /* ── Main view ──────────────────────────────────────────── */
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20 }}>

          {/* Left: Reefer list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {reefers.map(s => {
              const sensors = simulateSensors(s);
              const isSelected = selected?._id === s._id;
              return (
                <div
                  key={s._id}
                  onClick={() => setSelected(s)}
                  className="card"
                  style={{
                    padding: 14, cursor: "pointer", transition: "all 0.18s",
                    background: isSelected ? "rgba(245,158,11,0.12)" : "rgba(245,158,11,0.03)",
                    borderColor: isSelected ? "rgba(245,158,11,0.3)" : "rgba(245,158,11,0.1)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontFamily: "monospace", fontWeight: 800, color: "#b45309", fontSize: 13 }}>{s.containerNo}</span>
                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 6, background: `${sensors.color}20`, color: sensors.color, fontWeight: 800 }}>
                      ● {sensors.status}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 13, marginBottom: 6 }}>
                    {s.cargo} {s.quantityTons ? `(${s.quantityTons} MT)` : ""}
                  </div>
                  <div style={{ display: "flex", gap: 14, fontSize: 12, color: "#a38a5d", alignItems: "center" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Thermometer size={13} color="#f59e0b" /> <strong style={{ color: "#0f172a" }}>{sensors.temp}</strong></span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Droplets size={13} color="#38bdf8" /> <strong style={{ color: "#0f172a" }}>{sensors.humidity}</strong></span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Battery size={13} color="#4ade80" /> <strong style={{ color: "#0f172a" }}>{sensors.battery}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Telemetry detail */}
          {selected && selectedSensors && (
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid rgba(245,158,11,0.1)", paddingBottom: 16, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 800, color: "#b45309", display: "flex", alignItems: "center", gap: 8 }}>
                    <Snowflake size={18} color="#0284c7" /> Reefer Unit: {selected.containerNo}
                  </div>
                  <div style={{ fontSize: 14, color: "#0f172a", fontWeight: 700, marginTop: 4 }}>
                    {selected.cargo} {selected.quantityTons ? `(${selected.quantityTons} MT)` : ""}
                  </div>
                  <div style={{ fontSize: 12, color: "#a38a5d", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                    <MapPin size={13} color="#d97706" /> Destination: {selected.destPort || selected.destinationCountry || "—"}
                  </div>
                </div>
                <span style={{ fontSize: 12, padding: "4px 12px", borderRadius: 8, background: `${selectedSensors.color}20`, color: selectedSensors.color, fontWeight: 800, border: `1px solid ${selectedSensors.color}40` }}>
                  ● SENSOR STATUS: {selectedSensors.status}
                </span>
              </div>

              {/* 4 Sensor Metric Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 14 }}>
                {[
                  { label: "Temperature",       Icon: Thermometer, val: selectedSensors.temp,     sub: `Target: ${selectedSensors.targetTemp}`, color: "#f59e0b" },
                  { label: "Relative Humidity",  Icon: Droplets,    val: selectedSensors.humidity, sub: "Optimal Range 80–95%",                  color: "#38bdf8" },
                  { label: "CO₂ Gas Level",     Icon: Cloud,       val: selectedSensors.co2,      sub: "Controlled Atmosphere",                 color: "#a78bfa" },
                  { label: "IoT Battery",        Icon: Battery,     val: selectedSensors.battery,  sub: "Solar + Battery Backup",                color: "#4ade80" },
                ].map(({ label, Icon, val, sub, color }) => (
                  <div key={label} style={{ background: "rgba(0,0,0,0.25)", padding: "14px 16px", borderRadius: 14, border: "1px solid rgba(245,158,11,0.1)" }}>
                    <div style={{ fontSize: 10, color: "#a38a5d", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 5 }}>
                      <Icon size={12} color={color} /> {label}
                    </div>
                    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color, marginTop: 4 }}>{val}</div>
                    <div style={{ fontSize: 11, color: "#a38a5d", marginTop: 2 }}>{sub}</div>
                  </div>
                ))}
              </div>

              {/* Temp spike alert */}
              {selectedSensors.status === "TEMP SPIKE" && (
                <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)", color: "#b45309", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                  <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0 }} />
                  <span>Temperature deviation detected. Monitor closely — cargo quality may be affected if deviation persists.</span>
                </div>
              )}

              {/* 24h Climate Log */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <LineChart size={16} color="#d97706" /> Simulated 24-Hour Climate Log
                </div>
                <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
                  {selectedSensors.log.map((entry, idx) => (
                    <div key={idx} style={{ flex: 1, minWidth: 72, padding: "10px 8px", borderRadius: 10, background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.1)", textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: "#a38a5d" }}>{entry.time}</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#f59e0b", marginTop: 2 }}>+{entry.temp}°C</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info note */}
              <div style={{ padding: "10px 14px", borderRadius: 10, background: "#f0f9ff", border: "1px solid rgba(56,189,248,0.15)", fontSize: 12, color: "#0369a1", display: "flex", alignItems: "flex-start", gap: 6 }}>
                <Info size={14} color="#0284c7" style={{ flexShrink: 0, marginTop: 1 }} />
                <span>Sensor readings are simulated from your container data. Connect real IoT devices (Carrier, Daikin, Emerson) to get live telemetry.</span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
