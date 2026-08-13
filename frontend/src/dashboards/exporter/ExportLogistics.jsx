import { useState, useEffect, useCallback } from "react";
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
  .field-input{width:100%;background:rgba(245,158,11,0.05);border:1px solid rgba(245,158,11,0.18);border-radius:11px;padding:10px 14px;color:#fff;outline:none;font-size:14px;font-family:'Inter',sans-serif;}
  .field-input:focus{border-color:rgba(245,158,11,0.4);}
  .field-input::placeholder{color:#7a8fa6;}
  .field-label{font-size:11px;font-weight:700;color:#a38a5d;text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:6px;}
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(6px);}
  .modal-box{background:#080d12;border:1px solid rgba(245,158,11,0.18);border-radius:22px;padding:28px;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;}
  .spinner{width:28px;height:28px;border:3px solid rgba(255,255,255,0.08);border-top-color:#f59e0b;border-radius:50%;animation:spin 0.7s linear infinite;margin:0 auto;}
  @keyframes spin{to{transform:rotate(360deg)}}
  .pulse{animation:pulse 1.6s ease-in-out infinite;}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
`;

const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("agroconnect_token")}`, "Content-Type": "application/json" });

const STEPS = [
  "Farm Pack & Inspection",
  "CFS Cold Storage",
  "Port Gate In",
  "Customs Clearance Passed",
  "Onboard Vessel",
  "Destination Delivered",
];

const STATUS_MAP = {
  cfs_cold_storage:  { label: "CFS Cold Storage",       step: 1, color: "#a78bfa" },
  customs_submitted: { label: "Customs Submitted",       step: 2, color: "#fbbf24" },
  customs_cleared:   { label: "Customs Clearance Passed",step: 3, color: "#4ade80" },
  onboard_vessel:    { label: "Onboard Vessel",          step: 4, color: "#38bdf8" },
  in_transit:        { label: "In Transit",              step: 4, color: "#38bdf8" },
  delivered:         { label: "Destination Delivered",   step: 5, color: "#4ade80" },
  cancelled:         { label: "Cancelled",               step: 0, color: "#f87171" },
};

const INDIAN_PORTS = [
  "Nhava Sheva (JNPT), Mumbai",
  "Mundra Port, Gujarat",
  "Chennai Port, Tamil Nadu",
  "Kolkata Port, West Bengal",
  "Kochi Port, Kerala",
  "Visakhapatnam Port, Andhra Pradesh",
  "Ennore Port, Tamil Nadu",
  "Kandla Port, Gujarat",
  "Mangalore Port, Karnataka",
];

const DEST_PORTS = [
  "Jebel Ali Port, Dubai (UAE)",
  "Port of Rotterdam, Netherlands",
  "London Gateway, UK",
  "Port of Hamburg, Germany",
  "Port of Singapore",
  "Port Klang, Malaysia",
  "Port of New York, USA",
  "Port of Los Angeles, USA",
  "Port of Tokyo, Japan",
  "Port of Antwerp, Belgium",
];

/* ─── Add Shipment Modal ──────────────────────────────────────────────── */
function AddShipmentModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    containerNo: "", vessel: "", cargo: "", quantityTons: "",
    portOfOrigin: "", destPort: "", destinationCountry: "",
    etd: "", eta: "",
  });
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState("");

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!form.containerNo || !form.vessel || !form.cargo || !form.portOfOrigin || !form.destPort || !form.destinationCountry) {
      setErr("All fields marked * are required.");
      return;
    }
    setSaving(true);
    try {
      const r = await fetch(`${API_URL}/api/exporter/shipments`, {
        method: "POST",
        headers: authH(),
        body: JSON.stringify({ ...form, quantityTons: Number(form.quantityTons) || 0 }),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.message);
      onSaved(d.shipment);
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: "#fff" }}>📦 Add Container Shipment</div>
            <div style={{ fontSize: 13, color: "#a38a5d", marginTop: 2 }}>Track real export container from Indian port</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#7a8fa6", cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="field-label">Container No. *</label>
              <input className="field-input" placeholder="e.g. MSKU-948201" value={form.containerNo} onChange={e => set("containerNo", e.target.value.toUpperCase())} />
            </div>
            <div>
              <label className="field-label">Vessel Name *</label>
              <input className="field-input" placeholder="e.g. Maersk Sentosa" value={form.vessel} onChange={e => set("vessel", e.target.value)} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="field-label">Cargo / Crop *</label>
              <input className="field-input" placeholder="e.g. Alphonso Mangoes" value={form.cargo} onChange={e => set("cargo", e.target.value)} />
            </div>
            <div>
              <label className="field-label">Quantity (Tons)</label>
              <input className="field-input" type="number" min="0" placeholder="e.g. 20" value={form.quantityTons} onChange={e => set("quantityTons", e.target.value)} />
            </div>
          </div>

          <div>
            <label className="field-label">Port of Origin (POL) *</label>
            <select className="field-input" value={form.portOfOrigin} onChange={e => set("portOfOrigin", e.target.value)} style={{ appearance: "none" }}>
              <option value="">Select Indian Port…</option>
              {INDIAN_PORTS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="field-label">Destination Port (POD) *</label>
              <select className="field-input" value={form.destPort} onChange={e => set("destPort", e.target.value)} style={{ appearance: "none" }}>
                <option value="">Select Dest. Port…</option>
                {DEST_PORTS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Destination Country *</label>
              <input className="field-input" placeholder="e.g. UAE" value={form.destinationCountry} onChange={e => set("destinationCountry", e.target.value)} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="field-label">ETD (Departure Date)</label>
              <input className="field-input" type="date" value={form.etd} onChange={e => set("etd", e.target.value)} />
            </div>
            <div>
              <label className="field-label">ETA (Arrival Date)</label>
              <input className="field-input" type="date" value={form.eta} onChange={e => set("eta", e.target.value)} />
            </div>
          </div>

          {err && <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 13 }}>⚠️ {err}</div>}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="button" className="btn-ghost" style={{ flex: 1, justifyContent: "center", padding: "12px" }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-gold" style={{ flex: 2, justifyContent: "center", padding: "12px" }} disabled={saving}>
              {saving ? "⏳ Adding…" : "🚢 Add Shipment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────── */
export default function ExportLogistics() {
  const [containers,     setContainers]     = useState([]);
  const [activeShipment, setActiveShipment] = useState(null);
  const [search,         setSearch]         = useState("");
  const [loading,        setLoading]        = useState(true);
  const [showAdd,        setShowAdd]        = useState(false);
  const [toast,          setToast]          = useState("");
  const [deleteConfId,   setDeleteConfId]   = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/exporter/shipments`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("agroconnect_token")}` },
      });
      const d = await r.json();
      if (d.success && Array.isArray(d.shipments)) {
        setContainers(d.shipments);
        if (d.shipments.length > 0) setActiveShipment(d.shipments[0]);
      }
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onSaved = (shipment) => {
    setContainers(p => [shipment, ...p]);
    setActiveShipment(shipment);
    setShowAdd(false);
    showToast("✅ Shipment added");
  };

  /* Advance / set status */
  const updateStatus = async (shipmentId, newStatus) => {
    setStatusUpdating(true);
    try {
      const r = await fetch(`${API_URL}/api/exporter/shipments/${shipmentId}/status`, {
        method: "PATCH",
        headers: authH(),
        body: JSON.stringify({ status: newStatus }),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.message);
      setContainers(p => p.map(c => c._id === shipmentId ? d.shipment : c));
      setActiveShipment(d.shipment);
      showToast(`✅ Status updated: ${STATUS_MAP[newStatus]?.label || newStatus}`);
    } catch (e) { showToast("⚠️ " + e.message); }
    finally { setStatusUpdating(false); }
  };

  /* Delete */
  const deleteShipment = async (id) => {
    try {
      const r = await fetch(`${API_URL}/api/exporter/shipments/${id}`, { method: "DELETE", headers: authH() });
      const d = await r.json();
      if (!d.success) throw new Error(d.message);
      const remaining = containers.filter(c => c._id !== id);
      setContainers(remaining);
      setActiveShipment(remaining.length > 0 ? remaining[0] : null);
      setDeleteConfId(null);
      showToast("✅ Shipment deleted");
    } catch (e) { showToast("⚠️ " + e.message); }
  };


  const filtered = containers.filter(c =>
    !search ||
    (c.containerNo || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.cargo || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.portOfOrigin || "").toLowerCase().includes(search.toLowerCase())
  );

  const activeShipments = containers.filter(s => !["delivered", "cancelled"].includes(s.status));

  const getStep = (s) => STATUS_MAP[s.status]?.step ?? 0;
  const getStepLabel = (s) => STATUS_MAP[s.status]?.label ?? s.status;
  const getStepColor = (s) => STATUS_MAP[s.status]?.color ?? "#a38a5d";

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

  return (
    <>
      <style>{DS_EXPORTER}</style>
      {showAdd && <AddShipmentModal onClose={() => setShowAdd(false)} onSaved={onSaved} />}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 28, right: 28, background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.28)", color: "#4ade80", padding: "12px 20px", borderRadius: 12, fontWeight: 700, fontSize: 14, zIndex: 99999 }}>
          {toast}
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="pg-head">
        <div>
          <div className="eyebrow">Container & Port Tracking</div>
          <h1 className="pg-title">🚢 International Logistics & Port Operations</h1>
          <p className="pg-sub">Real-time status tracking for sea & air freight shipping containers from Indian ports.</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {containers.length > 0 && (
            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 16, fontWeight: 800, color: "#fbbf24" }}>
              {activeShipments.length} Active Shipments
            </span>
          )}
          <button className="btn-gold" onClick={() => setShowAdd(true)}>+ Add Shipment</button>
        </div>
      </div>

      {/* ── Loading ────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div className="spinner" />
          <div style={{ marginTop: 14, fontSize: 14, color: "#a38a5d" }}>Loading shipments…</div>
        </div>
      ) : containers.length === 0 ? (
        /* ── Empty state ─────────────────────────────────────────────── */
        <div style={{ textAlign: "center", padding: "72px 24px" }}>
          <div style={{ fontSize: 56, marginBottom: 14 }}>🚢</div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 8 }}>No Shipments Yet</div>
          <div style={{ fontSize: 14, color: "#a38a5d", marginBottom: 28, maxWidth: 420, margin: "0 auto 28px" }}>
            Add your first export container to start tracking port & customs pipeline status.
          </div>
          <button className="btn-gold" onClick={() => setShowAdd(true)}>📦 Add First Shipment</button>
        </div>
      ) : (
        /* ── Main two-column layout ──────────────────────────────────── */
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20 }}>
          {/* Left: Container list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              className="field-input"
              placeholder="🔍 Search container, crop, port…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />

            {filtered.length === 0 && (
              <div style={{ padding: "24px 0", textAlign: "center", fontSize: 13, color: "#a38a5d" }}>No results</div>
            )}

            {filtered.map(c => {
              const isActive = activeShipment?._id === c._id || activeShipment?.containerNo === c.containerNo;
              return (
                <div
                  key={c._id || c.containerNo}
                  onClick={() => setActiveShipment(c)}
                  className="card"
                  style={{
                    padding: 14, cursor: "pointer", transition: "all 0.18s",
                    background: isActive ? "rgba(245,158,11,0.12)" : "rgba(245,158,11,0.03)",
                    borderColor: isActive ? "rgba(245,158,11,0.3)" : "rgba(245,158,11,0.1)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontFamily: "monospace", fontWeight: 800, color: "#fbbf24", fontSize: 13 }}>{c.containerNo}</span>
                    <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 6, background: `${getStepColor(c)}20`, color: getStepColor(c), fontWeight: 700, whiteSpace: "nowrap" }}>
                      {getStepLabel(c)}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, color: "#fff", fontSize: 13, marginBottom: 4 }}>{c.cargo} {c.quantityTons ? `(${c.quantityTons} MT)` : ""}</div>
                  <div style={{ fontSize: 11, color: "#a38a5d" }}>📍 {c.portOfOrigin} → <strong style={{ color: "#fff" }}>{c.destPort}</strong></div>
                </div>
              );
            })}
          </div>

          {/* Right: Shipment detail */}
          {activeShipment && (
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, borderBottom: "1px solid rgba(245,158,11,0.1)", paddingBottom: 16 }}>
                <div>
                  <div style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 800, color: "#fbbf24" }}>📦 {activeShipment.containerNo}</div>
                  <div style={{ fontSize: 15, color: "#fff", fontWeight: 700, marginTop: 4 }}>{activeShipment.cargo} {activeShipment.quantityTons ? `(${activeShipment.quantityTons} MT)` : ""}</div>
                  {activeShipment.vessel && (
                    <div style={{ fontSize: 12, color: "#a38a5d", marginTop: 2 }}>Vessel: <strong style={{ color: "#fff" }}>{activeShipment.vessel}</strong></div>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "#a38a5d", textTransform: "uppercase" }}>Estimated Arrival</div>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color: "#4ade80" }}>{fmtDate(activeShipment.eta)}</div>
                  <div style={{ fontSize: 11, color: "#a38a5d" }}>ETD: {fmtDate(activeShipment.etd)}</div>
                </div>
              </div>

              {/* Pipeline stepper */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#a38a5d", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
                  Port & Customs Clearance Pipeline
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {STEPS.map((step, idx) => {
                    const currentStep = getStep(activeShipment);
                    const done    = idx < currentStep;
                    const current = idx === currentStep;
                    const future  = idx > currentStep;
                    return (
                      <div key={step} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                          background: done || current ? "linear-gradient(135deg,#d97706,#f59e0b)" : "rgba(245,158,11,0.06)",
                          border: `2px solid ${done || current ? "#f59e0b" : "rgba(245,158,11,0.2)"}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 12, fontWeight: 800, color: done || current ? "#fff" : "#a38a5d",
                        }}>
                          {done ? "✓" : idx + 1}
                        </div>
                        <div style={{
                          flex: 1, padding: "10px 14px", borderRadius: 12,
                          background: current ? "rgba(245,158,11,0.1)" : "transparent",
                          border: `1px solid ${current ? "rgba(245,158,11,0.25)" : "transparent"}`,
                        }}>
                          <div style={{ fontSize: 14, fontWeight: current ? 800 : done ? 600 : 400, color: current ? "#fef08a" : done ? "#fff" : "#a38a5d" }}>
                            {step}
                          </div>
                          {current && <div style={{ fontSize: 11, color: "#fbbf24", marginTop: 2 }}>⚡ Currently in progress</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* POL / POD */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, background: "rgba(0,0,0,0.25)", padding: 14, borderRadius: 14, border: "1px solid rgba(245,158,11,0.1)" }}>
                <div>
                  <div style={{ fontSize: 11, color: "#a38a5d", textTransform: "uppercase" }}>Port of Loading (POL)</div>
                  <div style={{ fontSize: 13, color: "#fff", fontWeight: 700, marginTop: 2 }}>{activeShipment.portOfOrigin || "—"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#a38a5d", textTransform: "uppercase" }}>Port of Discharge (POD)</div>
                  <div style={{ fontSize: 13, color: "#fff", fontWeight: 700, marginTop: 2 }}>{activeShipment.destPort || "—"}</div>
                </div>
                {activeShipment.destinationCountry && (
                  <div>
                    <div style={{ fontSize: 11, color: "#a38a5d", textTransform: "uppercase" }}>Destination Country</div>
                    <div style={{ fontSize: 13, color: "#fff", fontWeight: 700, marginTop: 2 }}>{activeShipment.destinationCountry}</div>
                  </div>
                )}
              </div>

              {/* ── Action buttons ─────────────────────────────────── */}
              {(() => {
                const STATUS_NEXT = {
                  cfs_cold_storage:  "port_gate_in",
                  port_gate_in:      "customs_cleared",
                  customs_cleared:   "onboard_vessel",
                  onboard_vessel:    "delivered",
                };
                const nextStatus = STATUS_NEXT[activeShipment.status];
                const isDelivered = activeShipment.status === "delivered";
                const isCancelled = activeShipment.status === "cancelled";

                return (
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {/* Advance to next step */}
                    {nextStatus && !isDelivered && !isCancelled && (
                      <button
                        className="btn-gold"
                        style={{ flex: 2, justifyContent: "center", opacity: statusUpdating ? 0.6 : 1 }}
                        disabled={statusUpdating}
                        onClick={() => updateStatus(activeShipment._id, nextStatus)}
                      >
                        {statusUpdating ? "⏳ Updating…" : `▶ Advance to: ${STATUS_MAP[nextStatus]?.label}`}
                      </button>
                    )}

                    {/* Mark Delivered directly */}
                    {!isDelivered && !isCancelled && nextStatus !== "delivered" && (
                      <button
                        className="btn-ghost"
                        style={{ flex: 1, justifyContent: "center", color: "#4ade80", borderColor: "rgba(34,197,94,0.25)" }}
                        disabled={statusUpdating}
                        onClick={() => updateStatus(activeShipment._id, "delivered")}
                      >
                        ✅ Mark Delivered
                      </button>
                    )}

                    {/* Delivered badge */}
                    {isDelivered && (
                      <div style={{ flex: 1, padding: "10px 14px", borderRadius: 12, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#4ade80", fontWeight: 800, fontSize: 14, textAlign: "center" }}>
                        ✅ Destination Delivered
                      </div>
                    )}

                    {/* Delete */}
                    {deleteConfId === activeShipment._id ? (
                      <>
                        <button style={{ flex: 1, padding: "10px", borderRadius: 10, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171", fontWeight: 700, fontSize: 12, cursor: "pointer" }} onClick={() => deleteShipment(activeShipment._id)}>
                          Yes, Delete
                        </button>
                        <button style={{ flex: 1, padding: "10px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#a38a5d", fontWeight: 600, fontSize: 12, cursor: "pointer" }} onClick={() => setDeleteConfId(null)}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button className="btn-ghost" style={{ justifyContent: "center", color: "#f87171", borderColor: "rgba(239,68,68,0.2)" }} onClick={() => setDeleteConfId(activeShipment._id)}>
                        🗑 Delete
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </>
  );
}
