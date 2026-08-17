import { useState, useEffect, useCallback } from "react";
import { API_URL } from "../../config/api";
import { DS_ADMIN, relativeTime } from "./adminStyles";

const dbStateLabel = { connected: "🟢 Connected", disconnected: "🔴 Disconnected", connecting: "🟡 Connecting", disconnecting: "🟠 Disconnecting" };
const dbStateColor = { connected: "#4ade80", disconnected: "#f87171", connecting: "#fbbf24", disconnecting: "#fb923c" };

function Metric({ label, value, sub, color = "#818cf8", icon }) {
  return (
    <div style={{ padding: "16px 18px", background: "rgba(99,102,241,0.04)", borderRadius: 14, border: "1px solid rgba(99,102,241,0.1)" }}>
      <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 11, color: "#a5b4fc", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#a5b4fc", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function AdminSystem() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const token = localStorage.getItem("agroconnect_token");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${API_URL}/api/admin/system/health`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (d.success) {
        setHealth(d.health);
        setLastChecked(new Date());
      } else {
        throw new Error(d.message || "Health check failed");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => load(), 60000);
    return () => clearInterval(id);
  }, [autoRefresh, load]);

  const heapPct = health ? Math.round((health.memory.heapUsedMB / health.memory.heapTotalMB) * 100) : 0;

  return (
    <>
      <style>{DS_ADMIN}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Infrastructure &amp; Runtime Health</div>
          <h1 className="pg-title">⚡ System Health Dashboard</h1>
          <p className="pg-sub">Live server metrics derived from real Node.js runtime and MongoDB connection state.</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#a5b4fc", cursor: "pointer" }}>
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
            Auto-refresh (60s)
          </label>
          {lastChecked && <span style={{ fontSize: 12, color: "#a5b4fc" }}>Checked {relativeTime(lastChecked)}</span>}
          <button className="btn-indigo" onClick={load} disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : "🔄"} Check Now
          </button>
        </div>
      </div>

      {!loading && error && (
        <div className="card error-state">
          <div className="error-state-icon">⚠️</div>
          <div className="error-state-msg">Health check failed</div>
          <div className="error-state-sub">{error}</div>
          <button className="btn-indigo" onClick={load}>Retry</button>
        </div>
      )}

      {loading && !health && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14 }}>
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 14 }} />)}
        </div>
      )}

      {health && (
        <>
          {/* Overall Status Banner */}
          <div style={{ marginBottom: 24, padding: "16px 20px", background: health.api === "operational" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", borderRadius: 16, border: `1px solid ${health.api === "operational" ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`, display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 28 }}>{health.api === "operational" ? "✅" : "⚠️"}</span>
            <div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 800, color: health.api === "operational" ? "#4ade80" : "#f87171" }}>
                API Status: {health.api.toUpperCase()}
              </div>
              <div style={{ fontSize: 13, color: "#a5b4fc", marginTop: 2 }}>
                Response time: <strong style={{ color: "#fff" }}>{health.responseTimeMs}ms</strong> · Checked: {new Date(health.checkedAt).toLocaleTimeString("en-IN")}
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginBottom: 24 }}>
            <Metric icon="🗄️" label="Database" value={dbStateLabel[health.database] || health.database} color={dbStateColor[health.database] || "#a5b4fc"} sub={health.databaseName ? `DB: ${health.databaseName}` : undefined} />
            <Metric icon="⏱️" label="Server Uptime" value={health.uptimeFormatted} color="#818cf8" sub={`${health.uptimeSeconds.toLocaleString()} seconds`} />
            <Metric icon="⚡" label="Response Time" value={`${health.responseTimeMs}ms`} color={health.responseTimeMs < 100 ? "#4ade80" : health.responseTimeMs < 500 ? "#fbbf24" : "#f87171"} sub="Time to process this health check" />
            <Metric icon="🟢" label="Node.js Version" value={health.nodeVersion} color="#4ade80" sub={`Env: ${health.environment}`} />
          </div>

          {/* Memory Usage */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-title" style={{ marginBottom: 16 }}>🧠 Memory Usage (Node.js Heap)</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, color: "#a5b4fc" }}>
                  <span>Heap Used: <strong style={{ color: "#fff" }}>{health.memory.heapUsedMB} MB</strong></span>
                  <span>Heap Total: <strong style={{ color: "#fff" }}>{health.memory.heapTotalMB} MB</strong></span>
                  <span style={{ color: heapPct > 85 ? "#f87171" : heapPct > 65 ? "#fbbf24" : "#4ade80" }}>{heapPct}%</span>
                </div>
                <div style={{ height: 10, background: "rgba(99,102,241,0.1)", borderRadius: 6, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${heapPct}%`, borderRadius: 6, background: heapPct > 85 ? "#f87171" : heapPct > 65 ? "#fbbf24" : "linear-gradient(90deg,#4f46e5,#6366f1)", transition: "width 0.5s" }} />
                </div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: "#a5b4fc" }}>
              RSS (total process): <strong style={{ color: "#fff" }}>{health.memory.rssMB} MB</strong>
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: "#818cf8" }}>
              💡 Heap data from <code>process.memoryUsage()</code>. CPU% not exposed — requires native Node.js addons.
            </div>
          </div>

          {/* Integrated Services (actual, no fake statuses) */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>🔌 Integrated Services</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
              {[
                { name: "MongoDB Atlas", status: health.database === "connected" ? "Connected" : health.database, ok: health.database === "connected", icon: "🗄️" },
                { name: "AgroConnect API", status: "Operational", ok: health.api === "operational", icon: "🌐" },
                { name: "Gemini AI (Assistant)", status: "Not polled", ok: null, icon: "🤖", note: "Availability not verified by health check" },
                { name: "Crop Disease AI", status: "Not polled", ok: null, icon: "🔬", note: "Availability not verified by health check" },
              ].map((svc) => (
                <div key={svc.name} style={{ padding: "14px 16px", background: "rgba(99,102,241,0.04)", borderRadius: 14, border: `1px solid ${svc.ok === true ? "rgba(34,197,94,0.2)" : svc.ok === false ? "rgba(239,68,68,0.2)" : "rgba(251,191,36,0.15)"}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 20 }}>{svc.icon}</span>
                    <span style={{ fontWeight: 800, color: "#fff", fontSize: 14 }}>{svc.name}</span>
                  </div>
                  <div style={{ fontSize: 12, color: svc.ok === true ? "#4ade80" : svc.ok === false ? "#f87171" : "#fbbf24", fontWeight: 700 }}>● {svc.status}</div>
                  {svc.note && <div style={{ fontSize: 11, color: "#a5b4fc", marginTop: 4 }}>{svc.note}</div>}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
