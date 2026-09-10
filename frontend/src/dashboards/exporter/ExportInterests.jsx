import { useState, useEffect, useCallback } from "react";
import { API_URL } from "../../config/api";
import { Inbox, MessageSquare, Handshake, Clock } from "lucide-react";

const DSX = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
  .pg-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:16px;flex-wrap:wrap;}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#f59e0b;margin-bottom:6px;}
  .pg-title{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:800;color:#0f172a;line-height:1.2;}
  .pg-sub{font-size:14px;color:var(--text2);margin-top:6px;}
  .btn-gold{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:12px;background:linear-gradient(135deg,#d97706,#f59e0b);color:#0f172a;font-weight:700;font-size:14px;border:none;cursor:pointer;font-family:'Inter',sans-serif;transition:opacity 0.18s;}
  .btn-gold:hover{opacity:0.88;}
  .btn-ghost{display:inline-flex;align-items:center;gap:8px;padding:9px 16px;border-radius:10px;border:1px solid rgba(245,158,11,0.2);background:rgba(245,158,11,0.06);color:#fef08a;font-weight:600;font-size:13px;cursor:pointer;font-family:'Inter',sans-serif;transition:all 0.18s;}
  .btn-ghost:hover{border-color:rgba(245,158,11,0.4);background:rgba(245,158,11,0.12);}
  .field-input{width:100%;padding:10px 14px;border-radius:11px;border:1px solid rgba(245,158,11,0.18);background:rgba(245,158,11,0.05);color:#0f172a;font-size:14px;font-family:'Inter',sans-serif;outline:none;box-sizing:border-box;}
  .field-input:focus{border-color:rgba(245,158,11,0.4);}
  select.field-input option{background:#1a1206;color:#0f172a;}
  .field-label{display:block;font-size:12px;font-weight:700;color:#a38a5d;margin-bottom:5px;}

  .badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:6px;font-size:11px;font-weight:600;}
  .badge-gold{background:rgba(245,158,11,0.15);color:#b45309;border:1px solid rgba(245,158,11,0.25);}
  .badge-green{background:rgba(34,197,94,0.12);color:#15803d;border:1px solid rgba(34,197,94,0.2);}
  .badge-red{background:rgba(239,68,68,0.12);color:#dc2626;border:1px solid rgba(239,68,68,0.2);}
  .badge-blue{background:rgba(56,189,248,0.12);color:#0369a1;border:1px solid rgba(56,189,248,0.2);}
  .badge-grey{background:rgba(255,255,255,0.06);color:#7a8fa6;border:1px solid #e2e8f0;}

  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.78);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(8px);}
  .modal-box{background:#1a1206;border:1px solid rgba(245,158,11,0.25);border-radius:24px;padding:28px;width:100%;max-height:90vh;overflow-y:auto;animation:fadeIn 0.2s ease;}
  @keyframes fadeIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
  .modal-title{font-family:'Space Grotesk',sans-serif;font-size:20px;font-weight:800;color:#0f172a;margin-bottom:4px;}
  .modal-sub{font-size:13px;color:#a38a5d;margin-bottom:20px;}

  .toast{position:fixed;bottom:28px;right:28px;background:rgba(34,197,94,0.14);border:1px solid rgba(34,197,94,0.3);color:#15803d;padding:12px 20px;border-radius:12px;font-size:14px;font-weight:600;z-index:99999;backdrop-filter:blur(12px);animation:slideUp 0.3s ease;}
  @keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}

  .icard{background:rgba(245,158,11,0.04);border:1px solid rgba(245,158,11,0.12);border-radius:18px;padding:20px;transition:border-color 0.2s;}
  .icard:hover{border-color:rgba(245,158,11,0.3);}
`;

const STATUS_CFG = {
  pending:     { label: "Pending",     cls: "badge-gold", desc: "Waiting for farmer response" },
  accepted:    { label: "Accepted",    cls: "badge-green",desc: "Farmer accepted — proceed to negotiation" },
  rejected:    { label: "Rejected",    cls: "badge-red",  desc: "Farmer rejected this interest" },
  negotiating: { label: "Negotiating", cls: "badge-blue", desc: "In negotiation — counter offers in progress" },
  confirmed:   { label: "Deal Confirmed",cls:"badge-green",desc:"Both parties confirmed. Proceed to shipment." },
  cancelled:   { label: "Cancelled",   cls: "badge-grey", desc: "Interest cancelled" },
  completed:   { label: "Completed",   cls: "badge-green",desc: "Export completed successfully" },
};

const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("agroconnect_token")}`, "Content-Type": "application/json" });
const fmt   = (n) => n != null ? `₹${Number(n).toLocaleString("en-IN")}` : "—";

function SBadge({ status }) {
  const cfg = STATUS_CFG[status] || { label: status, cls: "badge-grey" };
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
}

/* ─── Action Modal ─────────────────────────────────────────────────── */
function ActionModal({ interest, onClose, onUpdated }) {
  const [action, setAction] = useState(null); // "counter" | "confirm"
  const [counter,    setCounter]    = useState(interest.farmerCounter || interest.offeredPrice || "");
  const [notes,      setNotes]      = useState("");
  const [agreePrice, setAgreePrice] = useState(interest.farmerCounter || interest.offeredPrice || "");
  const [agreeQty,   setAgreeQty]   = useState(interest.requestedQty || "");
  const [dest,       setDest]       = useState(interest.destination || "");
  const [terms,      setTerms]      = useState("");
  const [saving,     setSaving]     = useState(false);
  const [err,        setErr]        = useState("");

  const lst = interest.listing  || {};
  const far = interest.farmer   || {};

  const doAction = async () => {
    setSaving(true); setErr("");
    try {
      let url, body;
      if (action === "counter") { url = `/api/export/interests/${interest._id}/counter-ex`; body = { exporterCounter: Number(counter), negotiationNotes: notes }; }
      if (action === "confirm") { url = `/api/export/interests/${interest._id}/confirm-ex`;  body = { agreedPrice: Number(agreePrice), agreedQty: Number(agreeQty), agreedDest: dest, shipmentTerms: terms }; }
      const r = await fetch(`${API_URL}${url}`, { method: "PATCH", headers: authH(), body: JSON.stringify(body) });
      const d = await r.json();
      if (!d.success) throw new Error(d.message);
      onUpdated(d.interest);
      onClose();
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const statusInfo = STATUS_CFG[interest.status] || {};

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 500 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div className="modal-title" style={{ fontSize: 17 }}>Export Interest Details</div>
            <SBadge status={interest.status} />
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, color: "#a38a5d", cursor: "pointer", width: 30, height: 30, fontSize: 18 }}>×</button>
        </div>

        {statusInfo.desc && (
          <div style={{ padding: "8px 14px", borderRadius: 10, background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.15)", fontSize: 12, color: "#b45309", marginBottom: 16 }}>
            ℹ️ {statusInfo.desc}
          </div>
        )}

        {[
          ["Produce",        lst.name || "—"],
          ["Farmer",         far.name || "—"],
          ["Farm Location",  far.location || far.state || "—"],
          ["Your Request",   `${interest.requestedQty} ${interest.requestedUnit || "MT"}`],
          ["Your Offer",     `${fmt(interest.offeredPrice)}/${interest.requestedUnit || "MT"}`],
          ["Your Counter",   interest.exporterCounter ? `${fmt(interest.exporterCounter)}/${interest.requestedUnit || "MT"}` : "—"],
          ["Farmer Counter", interest.farmerCounter   ? `${fmt(interest.farmerCounter)}/${interest.requestedUnit || "MT"}`  : "—"],
          ["Destination",    interest.destination || "—"],
          ["Message Sent",   interest.message || "—"],
          ...(interest.status === "confirmed" ? [
            ["Agreed Price",    `${fmt(interest.agreedPrice)}/${interest.agreedUnit || "MT"}`],
            ["Agreed Qty",      `${interest.agreedQty} ${interest.agreedUnit || "MT"}`],
            ["Shipment Terms",  interest.shipmentTerms || "—"],
          ] : []),
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(245,158,11,0.08)", fontSize: 13 }}>
            <span style={{ color: "#a38a5d" }}>{k}</span>
            <span style={{ color: "#0f172a", fontWeight: 600, maxWidth: "60%", textAlign: "right" }}>{v}</span>
          </div>
        ))}

        {err && (
          <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#dc2626", fontSize: 13 }}>
            ⚠️ {err}
          </div>
        )}

        {/* Actions for accepted/negotiating */}
        {["accepted", "negotiating"].includes(interest.status) && !action && (
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <button className="btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={() => setAction("counter")} id="counter-offer-btn"><MessageSquare size={14} strokeWidth={2} style={{ marginRight: 4 }} />Counter Offer</button>
            <button className="btn-gold"  style={{ flex: 1, justifyContent: "center" }} onClick={() => setAction("confirm")} id="confirm-deal-btn"><Handshake size={14} strokeWidth={2} style={{ marginRight: 4 }} />Confirm Deal</button>
          </div>
        )}

        {action === "counter" && (
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label className="field-label">Your Counter Price (₹/{interest.requestedUnit || "MT"})</label>
              <input className="field-input" type="number" min="0" value={counter} onChange={e => setCounter(e.target.value)} placeholder="Your counter price" />
            </div>
            <div>
              <label className="field-label">Notes (optional)</label>
              <textarea className="field-input" rows={2} style={{ resize: "none" }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Reason, requirements, packaging notes…" />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={() => setAction(null)}>Back</button>
              <button className="btn-gold" style={{ flex: 2, justifyContent: "center" }} onClick={doAction} disabled={saving || !counter}>{saving ? <><Clock size={14} strokeWidth={2} />…</> : <><MessageSquare size={14} strokeWidth={2} style={{ marginRight: 4 }} />Send Counter</>}</button>
            </div>
          </div>
        )}

        {action === "confirm" && (
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label className="field-label">Agreed Price (₹/{interest.requestedUnit || "MT"})</label>
                <input className="field-input" type="number" min="0" value={agreePrice} onChange={e => setAgreePrice(e.target.value)} />
              </div>
              <div>
                <label className="field-label">Agreed Quantity ({interest.requestedUnit || "MT"})</label>
                <input className="field-input" type="number" min="0" value={agreeQty} onChange={e => setAgreeQty(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="field-label">Destination</label>
              <input className="field-input" value={dest} onChange={e => setDest(e.target.value)} placeholder="e.g. UAE, Netherlands" />
            </div>
            <div>
              <label className="field-label">Shipment Terms (optional)</label>
              <input className="field-input" value={terms} onChange={e => setTerms(e.target.value)} placeholder="e.g. FOB Nhava Sheva, Sept 2026" />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={() => setAction(null)}>Back</button>
              <button className="btn-gold"  style={{ flex: 2, justifyContent: "center" }} onClick={doAction} disabled={saving}>{saving ? <><Clock size={14} strokeWidth={2} />…</> : <><Handshake size={14} strokeWidth={2} style={{ marginRight: 4 }} />Confirm Deal</>}</button>
            </div>
          </div>
        )}

        {!action && !["accepted","negotiating"].includes(interest.status) && (
          <button className="btn-ghost" style={{ width: "100%", justifyContent: "center", marginTop: 16 }} onClick={onClose}>Close</button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */
export default function ExportInterests() {
  const [interests, setInterests] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [toast,     setToast]     = useState("");
  const [selected,  setSelected]  = useState(null);
  const [filter,    setFilter]    = useState("all");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const loadInterests = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const r = await fetch(`${API_URL}/api/export/exporter/interests`, { headers: authH() });
      const d = await r.json();
      if (!d.success) throw new Error(d.message);
      setInterests(d.interests || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadInterests(); }, [loadInterests]);

  const onUpdated = (updated) => {
    setInterests(prev => prev.map(i => i._id === updated._id ? { ...i, ...updated } : i));
    showToast("✅ Interest updated");
  };

  const FILTER_TABS = [
    { id: "all",         label: "All" },
    { id: "pending",     label: "Pending" },
    { id: "accepted",    label: "Accepted" },
    { id: "negotiating", label: "Negotiating" },
    { id: "confirmed",   label: "Confirmed" },
    { id: "rejected",    label: "Rejected" },
  ];

  const filtered = filter === "all" ? interests : interests.filter(i => i.status === filter);

  const counts = FILTER_TABS.reduce((acc, t) => {
    acc[t.id] = t.id === "all" ? interests.length : interests.filter(i => i.status === t.id).length;
    return acc;
  }, {});

  return (
    <>
      <style>{DSX}</style>
      {toast && <div className="toast">{toast}</div>}
      {selected && <ActionModal interest={selected} onClose={() => setSelected(null)} onUpdated={onUpdated} />}

      <div className="pg-head">
        <div>
          <div className="eyebrow">My Export Activity</div>
          <h1 className="pg-title"><Inbox size={22} strokeWidth={2} style={{ marginRight: 8, color: "#d97706", verticalAlign: "middle" }} />My Export Interests</h1>
          <p className="pg-sub">Track your interest requests, negotiations and confirmed deals with farmers.</p>
        </div>
      </div>

      {/* Status summary */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        {[
          ["📩", "Total", interests.length,                                                                    "#fbbf24"],
          ["⏳", "Pending",     interests.filter(i => i.status === "pending").length,     "#fbbf24"],
          ["✅", "Accepted",    interests.filter(i => i.status === "accepted").length,    "#4ade80"],
          ["💬", "Negotiating", interests.filter(i => i.status === "negotiating").length, "#38bdf8"],
          ["🤝", "Confirmed",   interests.filter(i => i.status === "confirmed").length,   "#4ade80"],
        ].map(([e, l, v, c]) => (
          <div key={l} style={{ padding: "10px 16px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.14)", borderRadius: 12, display: "flex", gap: 6, alignItems: "center" }}>
            <span>{e}</span>
            <span style={{ fontSize: 12, color: "#a38a5d" }}>{l}</span>
            <span style={{ fontWeight: 800, color: c, fontSize: 16 }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 20 }}>
        {FILTER_TABS.map(t => (
          <button key={t.id}
            onClick={() => setFilter(t.id)}
            style={{
              padding: "7px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer",
              border: `1px solid ${filter === t.id ? "rgba(245,158,11,0.35)" : "rgba(245,158,11,0.15)"}`,
              background: filter === t.id ? "rgba(245,158,11,0.18)" : "rgba(245,158,11,0.06)",
              color: filter === t.id ? "#fbbf24" : "#a38a5d",
              transition: "all 0.15s",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            {t.label}
            {counts[t.id] > 0 && (
              <span style={{ minWidth: 18, height: 18, borderRadius: 9, background: filter === t.id ? "#f59e0b" : "rgba(245,158,11,0.3)", color: filter === t.id ? "#000" : "#fbbf24", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
                {counts[t.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ padding: "12px 18px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, color: "#dc2626", marginBottom: 20 }}>⚠️ {error}</div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#a38a5d" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>Loading interests…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📩</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
            {filter === "all" ? "No interest requests yet" : `No ${filter} interests`}
          </div>
          <div style={{ fontSize: 14, color: "#a38a5d" }}>
            {filter === "all"
              ? "Browse available farmer produce and express interest to start connecting."
              : "Try another filter."}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map(i => {
            const lst = i.listing || {};
            const far = i.farmer  || {};
            const cfg = STATUS_CFG[i.status] || { label: i.status, cls: "badge-grey" };
            const canAct = ["accepted","negotiating"].includes(i.status);
            return (
              <div key={i._id} className="icard" style={{ borderColor: canAct ? "rgba(245,158,11,0.3)" : undefined }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "#0f172a" }}>{lst.name || "—"}</div>
                    <div style={{ fontSize: 12, color: "#a38a5d", marginTop: 2 }}>🌾 {far.name || "Farmer"} · 📍 {far.location || far.state || "—"}</div>
                  </div>
                  <SBadge status={i.status} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 8, marginBottom: 12 }}>
                  {[
                    ["My Request",  `${i.requestedQty} ${i.requestedUnit || "MT"}`],
                    ["My Offer",    `${fmt(i.offeredPrice)}/${i.requestedUnit || "MT"}`],
                    ["My Counter",  i.exporterCounter ? `${fmt(i.exporterCounter)}` : "—"],
                    ["Farmer Ctr",  i.farmerCounter   ? `${fmt(i.farmerCounter)}`  : "—"],
                    ["Destination", i.destination     || "—"],
                    ["Date",        new Date(i.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short"})],
                  ].map(([k,v]) => (
                    <div key={k} style={{ background: "#f1f5f9", borderRadius: 8, padding: "6px 10px" }}>
                      <div style={{ fontSize: 10, color: "#a38a5d", textTransform: "uppercase", marginBottom: 2 }}>{k}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{v}</div>
                    </div>
                  ))}
                </div>

                {i.status === "confirmed" && (
                  <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#15803d", marginBottom: 4 }}>🎉 Deal Confirmed!</div>
                    <div style={{ fontSize: 12, color: "#7a8fa6" }}>
                      Agreed: {fmt(i.agreedPrice)}/{i.agreedUnit || "MT"} · {i.agreedQty} {i.agreedUnit || "MT"}
                      {i.shipmentTerms ? ` · ${i.shipmentTerms}` : ""}
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-ghost" style={{ flex: 1, justifyContent: "center", fontSize: 12 }} onClick={() => setSelected(i)}>
                    👁 View Details
                  </button>
                  {canAct && (
                    <button className="btn-gold" style={{ flex: 1, justifyContent: "center", fontSize: 12 }} onClick={() => setSelected(i)}>
                      💬 Take Action
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
