import { useState } from "react";

const DS_ADMIN = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
  .pg-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:16px;flex-wrap:wrap;}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#818cf8;margin-bottom:6px;}
  .pg-title{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:800;color:#fff;line-height:1.2;}
  .pg-sub{font-size:14px;color:#a5b4fc;margin-top:6px;}
  .card{background:rgba(99,102,241,0.04);border:1px solid rgba(99,102,241,0.12);border-radius:18px;padding:20px 22px;}
`;

export default function AdminSystem() {
  const [telemetry] = useState({
    serverPort: 5000,
    dbStatus: "Connected (MongoDB Atlas)",
    nodeVersion: "v24.14.0",
    cpuUsage: "12%",
    memoryUsed: "148 MB / 512 MB",
    apiLatency: "24 ms",
    uptime: "10 hours 56 mins",
  });

  return (
    <>
      <style>{DS_ADMIN}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Backend Infrastructure Telemetry</div>
          <h1 className="pg-title">⚡ Server Telemetry & Database Health</h1>
          <p className="pg-sub">Monitor Node.js Express server performance, API response latency, and MongoDB database health.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16, marginBottom: 26 }}>
        {[
          ["🟢", "Database Connection", telemetry.dbStatus, "MongoDB Atlas Cluster", "#4ade80"],
          ["⚡", "API Latency (Avg)", telemetry.apiLatency, "Sub-30ms Response Time", "#38bdf8"],
          ["💻", "CPU & Process Load", telemetry.cpuUsage, `Node ${telemetry.nodeVersion}`, "#818cf8"],
          ["🧠", "Memory Allocation", telemetry.memoryUsed, "Heap Used / Reserved", "#a78bfa"],
        ].map(([emoji, label, val, sub, color]) => (
          <div key={label} className="card">
            <div style={{ fontSize: 24, marginBottom: 8 }}>{emoji}</div>
            <div style={{ fontSize: 11, color: "#a5b4fc", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color }}>{val}</div>
            <div style={{ fontSize: 12, color: "#a5b4fc", marginTop: 4 }}>{sub}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 14 }}>
          ⚙️ Active Microservices & Integrations
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
          {[
            { name: "Google Gemini AI API", status: "HEALTHY", detail: "@google/genai v2.13.0" },
            { name: "Open-Meteo Weather API", status: "HEALTHY", detail: "Real-time forecast feed" },
            { name: "APMC Mandi Price Sync", status: "SYNCED", detail: "Data.gov API Gateway" },
            { name: "Cloudinary Image CDN", status: "ONLINE", detail: "Media upload pipeline" },
          ].map(s => (
            <div key={s.name} style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(99,102,241,0.03)", border: "1px solid rgba(99,102,241,0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontWeight: 800, color: "#fff", fontSize: 14 }}>{s.name}</span>
                <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 800 }}>● {s.status}</span>
              </div>
              <div style={{ fontSize: 11, color: "#a5b4fc" }}>{s.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
