import { useState, useEffect } from "react";
import { API_URL } from "../../config/api";

const DS_ADMIN = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
  .pg-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:16px;flex-wrap:wrap;}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#f59e0b;margin-bottom:6px;}
  .pg-title{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:800;color:#fff;line-height:1.2;}
  .pg-sub{font-size:14px;color:#a5b4fc;margin-top:6px;}
  .card{background:rgba(245,158,11,0.04);border:1px solid rgba(245,158,11,0.12);border-radius:18px;padding:20px 22px;}
  .tab-btn{padding:8px 20px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;border:1px solid rgba(245,158,11,0.15);background:rgba(245,158,11,0.04);color:#a5b4fc;transition:all 0.2s;font-family:'Inter',sans-serif;}
  .tab-btn.active{background:rgba(245,158,11,0.15);color:#fbbf24;border-color:rgba(245,158,11,0.35);}
  .spinner{width:22px;height:22px;border:3px solid rgba(245,158,11,0.15);border-top-color:#f59e0b;border-radius:50%;animation:spin 0.8s linear infinite;}
  @keyframes spin{to{transform:rotate(360deg)}}
  .loading-wrap{display:flex;align-items:center;justify-content:center;gap:12px;padding:60px 0;color:#a5b4fc;}
`;

const RFQ_STATUS = {
  pending:  { bg: "rgba(251,191,36,0.1)",  color: "#fbbf24", label: "⏳ Pending" },
  accepted: { bg: "rgba(34,197,94,0.1)",   color: "#4ade80", label: "✅ Accepted" },
  rejected: { bg: "rgba(239,68,68,0.1)",   color: "#f87171", label: "❌ Rejected" },
  quoted:   { bg: "rgba(56,189,248,0.1)",  color: "#38bdf8", label: "💬 Quoted" },
};

const SHIP_STATUS = {
  farm_packed:      { color: "#a78bfa", label: "📦 Farm Packed" },
  cfs_cold_storage: { color: "#38bdf8", label: "❄️ Cold Storage" },
  port_gate_in:     { color: "#fbbf24", label: "⚓ Port Gate In" },
  customs_cleared:  { color: "#4ade80", label: "🛂 Customs Cleared" },
  onboard_vessel:   { color: "#34d399", label: "🚢 Onboard Vessel" },
  delivered:        { color: "#4ade80", label: "🎉 Delivered" },
  cancelled:        { color: "#f87171", label: "🚫 Cancelled" },
};

export default function AdminExports() {
  const [view, setView] = useState("rfqs"); // 'rfqs' | 'shipments'
  const [rfqs, setRfqs] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const token = localStorage.getItem("agroconnect_token");

  const loadData = async () => {
    setLoading(true);
    try {
      const [rfqRes, shipRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/rfqs`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/admin/shipments`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [rfqData, shipData] = await Promise.all([rfqRes.json(), shipRes.json()]);
      if (rfqData.success) setRfqs(rfqData.rfqs || []);
      if (shipData.success) setShipments(shipData.shipments || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const updateRFQStatus = async (id, status) => {
    setUpdating(id);
    try {
      const r = await fetch(`${API_URL}/api/admin/rfqs/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const d = await r.json();
      if (d.success) setRfqs(prev => prev.map(r => r._id === id ? { ...r, status } : r));
    } catch { alert("Failed to update RFQ."); }
    finally { setUpdating(null); }
  };

  const rfqBadge = (s) => {
    const m = RFQ_STATUS[s] || { bg: "rgba(255,255,255,0.05)", color: "#a5b4fc", label: s };
    return <span style={{ padding: "3px 9px", borderRadius: 7, background: m.bg, color: m.color, fontSize: 11, fontWeight: 700 }}>{m.label}</span>;
  };

  const shipBadge = (s) => {
    const m = SHIP_STATUS[s] || { color: "#a5b4fc", label: s };
    return <span style={{ fontSize: 12, fontWeight: 700, color: m.color }}>{m.label}</span>;
  };

  return (
    <>
      <style>{DS_ADMIN}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Export Monitoring — Admin View</div>
          <h1 className="pg-title">🚢 Export RFQs & Shipments</h1>
          <p className="pg-sub">Monitor all export procurement requests and active container shipments from exporters.</p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: "#fbbf24" }}>{rfqs.length} RFQs</div>
            <div style={{ fontSize: 12, color: "#a5b4fc" }}>{shipments.length} Shipments</div>
          </div>
        </div>
      </div>

      {/* View toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <button className={`tab-btn ${view === "rfqs" ? "active" : ""}`} onClick={() => setView("rfqs")}>
          📩 RFQ Requests ({rfqs.length})
        </button>
        <button className={`tab-btn ${view === "shipments" ? "active" : ""}`} onClick={() => setView("shipments")}>
          🚢 Active Shipments ({shipments.length})
        </button>
      </div>

      {loading && <div className="loading-wrap"><div className="spinner" /><span>Loading export data…</span></div>}

      {/* ── RFQs ── */}
      {!loading && view === "rfqs" && (
        <>
          {rfqs.length === 0 && (
            <div className="card" style={{ textAlign: "center", padding: "40px" }}>
              <div style={{ fontSize: 40 }}>📩</div>
              <div style={{ color: "#fff", fontWeight: 700, marginTop: 12 }}>No RFQs submitted yet</div>
            </div>
          )}
          {rfqs.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {rfqs.map(r => (
                <div key={r._id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 16, fontWeight: 800, color: "#fff" }}>{r.cropName}</div>
                      {rfqBadge(r.status)}
                    </div>
                    <div style={{ display: "flex", gap: 18, flexWrap: "wrap", fontSize: 12, color: "#a5b4fc" }}>
                      <span>👤 Exporter: <strong style={{ color: "#fff" }}>{r.exporter?.name || "—"}</strong></span>
                      <span>📧 {r.exporter?.email || "—"}</span>
                      <span>🌍 Destination: <strong style={{ color: "#fff" }}>{r.destinationCountry}</strong></span>
                      <span>📦 {r.quantityTons} Tons</span>
                      <span>🚚 {r.containerSize}</span>
                      <span>🗓️ {new Date(r.createdAt).toLocaleDateString("en-IN")}</span>
                    </div>
                    {r.packagingNotes && (
                      <div style={{ marginTop: 8, fontSize: 12, color: "#a5b4fc", fontStyle: "italic" }}>
                        📝 {r.packagingNotes}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", alignItems: "center" }}>
                    {["pending","accepted","rejected","quoted"].map(st => (
                      r.status !== st && (
                        <button key={st}
                          disabled={updating === r._id}
                          onClick={() => updateRFQStatus(r._id, st)}
                          style={{ padding: "6px 13px", borderRadius: 8, border: "1px solid rgba(245,158,11,0.25)", background: "rgba(245,158,11,0.06)", color: "#fbbf24", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}
                        >
                          {updating === r._id ? "⏳" : `→ ${st.charAt(0).toUpperCase() + st.slice(1)}`}
                        </button>
                      )
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Shipments ── */}
      {!loading && view === "shipments" && (
        <>
          {shipments.length === 0 && (
            <div className="card" style={{ textAlign: "center", padding: "40px" }}>
              <div style={{ fontSize: 40 }}>🚢</div>
              <div style={{ color: "#fff", fontWeight: 700, marginTop: 12 }}>No shipments yet</div>
            </div>
          )}
          {shipments.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {shipments.map(s => (
                <div key={s._id} className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 16, fontWeight: 800, color: "#fff" }}>
                          {s.containerNo}
                        </div>
                        {shipBadge(s.status)}
                      </div>
                      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", fontSize: 12, color: "#a5b4fc" }}>
                        <span>🚢 Vessel: <strong style={{ color: "#fff" }}>{s.vessel}</strong></span>
                        <span>📦 Cargo: <strong style={{ color: "#fff" }}>{s.cargo}</strong></span>
                        <span>⚖️ {s.quantityTons} Tons</span>
                        <span>🛫 From: <strong style={{ color: "#fff" }}>{s.portOfOrigin}</strong></span>
                        <span>🛬 To: <strong style={{ color: "#fff" }}>{s.destPort}, {s.destinationCountry}</strong></span>
                        <span>👤 {s.exporter?.name || "Exporter"}</span>
                        <span>📅 ETD: {s.etd ? new Date(s.etd).toLocaleDateString("en-IN") : "—"}</span>
                        <span>📅 ETA: {s.eta ? new Date(s.eta).toLocaleDateString("en-IN") : "—"}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: "#a5b4fc", textAlign: "right", flexShrink: 0 }}>
                      <div>Step {s.statusStep || 0}/5</div>
                      <div style={{ marginTop: 4 }}>{new Date(s.createdAt).toLocaleDateString("en-IN")}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
