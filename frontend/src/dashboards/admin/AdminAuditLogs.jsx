import { useState } from "react";

const DS_ADMIN = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
  .pg-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:16px;flex-wrap:wrap;}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#818cf8;margin-bottom:6px;}
  .pg-title{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:800;color:#fff;line-height:1.2;}
  .pg-sub{font-size:14px;color:#a5b4fc;margin-top:6px;}
  .card{background:rgba(99,102,241,0.04);border:1px solid rgba(99,102,241,0.12);border-radius:18px;padding:20px 22px;}
`;

const LOGS = [
  { id: "log-901", action: "User Role Escalation", user: "Admin User", ip: "192.168.1.45", level: "INFO", time: "2 mins ago", details: "Changed user 'Ajaykumar2005' status to VERIFIED" },
  { id: "log-902", action: "Export RFQ Created", user: "Demo Exporter", ip: "103.44.12.89", level: "INFO", time: "14 mins ago", details: "Created 20 Ton RFQ for Alphonso Mangoes to UAE" },
  { id: "log-903", action: "Failed Login Attempt", user: "Unknown", ip: "45.12.89.201", level: "WARNING", time: "1 hour ago", details: "3 invalid password attempts for user 'seller@agroconnect.com'" },
  { id: "log-904", action: "Order Refund Processed", user: "Admin User", ip: "192.168.1.45", level: "INFO", time: "3 hours ago", details: "Approved ₹840 refund for dispute #dsp-101" },
];

export default function AdminAuditLogs() {
  const [logs] = useState(LOGS);

  return (
    <>
      <style>{DS_ADMIN}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Security & System Activity Stream</div>
          <h1 className="pg-title">📜 Audit Logs & Security Telemetry</h1>
          <p className="pg-sub">Real-time immutable audit trails for administrative overrides, user role updates, and authentication events.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 26 }}>
        {[
          ["🛡️", "Security Threat Level", "NORMAL", "0 Malicious Attacks", "#4ade80"],
          ["📜", "Audit Events Logged", "1,842 Events", "Last 30 Days", "#818cf8"],
          ["🌐", "Whitelisted Admin IPs", "4 Addresses", "Active Session Secured", "#38bdf8"],
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
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 16 }}>
          📜 Real-Time Security Audit Stream
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {logs.map(l => (
            <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "rgba(99,102,241,0.03)", borderRadius: 12, border: "1px solid rgba(99,102,241,0.08)", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontWeight: 800, color: "#fff", fontSize: 14 }}>{l.action}</span>
                  <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 6, background: l.level === "WARNING" ? "rgba(251,191,36,0.15)" : "rgba(99,102,241,0.15)", color: l.level === "WARNING" ? "#fbbf24" : "#c7d2fe", fontWeight: 800 }}>
                    {l.level}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "#a5b4fc", marginTop: 4 }}>{l.details}</div>
                <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>By: {l.user} · IP: <span style={{ fontFamily: "monospace" }}>{l.ip}</span></div>
              </div>

              <div style={{ fontSize: 11, color: "#a5b4fc" }}>{l.time}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
