import { useState, useEffect, useCallback } from "react";
import { API_URL } from "../../config/api";
import { Scroll, Info, AlertTriangle, FileText, Sprout, Trash2, Loader2, X } from "lucide-react";

const DS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
  .pg-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:16px;flex-wrap:wrap;}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#f59e0b;margin-bottom:6px;}
  .pg-title{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:800;color:#0f172a;line-height:1.2;}
  .pg-sub{font-size:14px;color:var(--text2);margin-top:6px;}
  .card{background:rgba(245,158,11,0.04);border:1px solid rgba(245,158,11,0.12);border-radius:18px;padding:22px;}
  .btn-gold{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:12px;background:linear-gradient(135deg,#d97706,#f59e0b);color:#0f172a;font-weight:700;font-size:14px;border:none;cursor:pointer;font-family:'Inter',sans-serif;}
  .btn-ghost{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:10px;border:1px solid rgba(245,158,11,0.2);background:rgba(245,158,11,0.06);color:#fef08a;font-weight:600;font-size:12px;cursor:pointer;font-family:'Inter',sans-serif;}
  .field-label{font-size:11px;font-weight:700;color:#a38a5d;text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:6px;}
  .field-input{width:100%;background:rgba(245,158,11,0.05);border:1px solid rgba(245,158,11,0.18);border-radius:11px;padding:10px 14px;color:#0f172a;outline:none;font-size:14px;font-family:'Inter',sans-serif;}
  .field-input:focus{border-color:rgba(245,158,11,0.4);}
  .field-input::placeholder{color:#7a8fa6;}
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(6px);}
  .modal-box{background:#0f0a03;border:1px solid rgba(245,158,11,0.2);border-radius:22px;padding:28px;width:100%;max-width:580px;max-height:90vh;overflow-y:auto;}
  .spinner{width:28px;height:28px;border:3px solid rgba(255,255,255,0.08);border-top-color:#f59e0b;border-radius:50%;animation:spin 0.7s linear infinite;margin:0 auto;}
  @keyframes spin{to{transform:rotate(360deg)}}
  .pulse{animation:pulse 1.6s ease-in-out infinite;}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
`;

const authH = () => ({
  Authorization: `Bearer ${localStorage.getItem("agroconnect_token")}`,
  "Content-Type": "application/json",
});

const LC_TYPES = [
  "Irrevocable LC at Sight",
  "Confirmed LC 60 Days",
  "Usance LC 90 Days",
  "Standby LC",
  "Red Clause LC",
  "Revolving LC",
  "Other",
];

const DEFAULT_MILESTONES = [
  { label: "20% Advance",      percentage: 20, released: false },
  { label: "50% BL Onboard",  percentage: 50, released: false },
  { label: "30% Port Customs", percentage: 30, released: false },
];

function fmtUsd(n) {
  return n != null ? `$${Number(n).toLocaleString("en-US")}` : "—";
}

/* ─── Add Contract Modal ─────────────────────────────────────────────── */
function AddContractModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    lcRef: "", lcType: "Irrevocable LC at Sight",
    buyerName: "", buyerCountry: "", issuingBank: "",
    cropName: "", quantityTons: "", contractValueUsd: "", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault(); setErr("");
    if (!form.buyerName) return setErr("Buyer name is required.");
    if (!form.cropName)  return setErr("Crop / commodity is required.");
    if (!form.contractValueUsd || Number(form.contractValueUsd) <= 0) return setErr("Contract value must be > 0.");
    setSaving(true);
    try {
      const r = await fetch(`${API_URL}/api/contracts`, {
        method: "POST", headers: authH(),
        body: JSON.stringify({ ...form, contractValueUsd: Number(form.contractValueUsd), quantityTons: Number(form.quantityTons) || 0 }),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.message);
      onSaved(d.contract);
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
              <Scroll size={22} color="#d97706" /> Add LC / Contract
            </div>
            <div style={{ fontSize: 13, color: "#a38a5d", marginTop: 2 }}>Record a new Letter of Credit or trade contract</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#7a8fa6", cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="field-label">LC Reference No.</label>
              <input className="field-input" placeholder="e.g. LC-2024-001" value={form.lcRef} onChange={e => set("lcRef", e.target.value)} />
            </div>
            <div>
              <label className="field-label">LC Type</label>
              <select className="field-input" value={form.lcType} onChange={e => set("lcType", e.target.value)} style={{ appearance: "none" }}>
                {LC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="field-label">Buyer / Importer Name *</label>
              <input className="field-input" placeholder="e.g. Al Maya Trading LLC" value={form.buyerName} onChange={e => set("buyerName", e.target.value)} />
            </div>
            <div>
              <label className="field-label">Buyer Country</label>
              <input className="field-input" placeholder="e.g. Dubai, UAE" value={form.buyerCountry} onChange={e => set("buyerCountry", e.target.value)} />
            </div>
          </div>

          <div>
            <label className="field-label">Issuing Bank</label>
            <input className="field-input" placeholder="e.g. Emirates NBD" value={form.issuingBank} onChange={e => set("issuingBank", e.target.value)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="field-label">Crop / Commodity *</label>
              <input className="field-input" placeholder="e.g. Alphonso Mangoes" value={form.cropName} onChange={e => set("cropName", e.target.value)} />
            </div>
            <div>
              <label className="field-label">Quantity (MT)</label>
              <input className="field-input" type="number" min="0" placeholder="e.g. 20" value={form.quantityTons} onChange={e => set("quantityTons", e.target.value)} />
            </div>
          </div>

          <div>
            <label className="field-label">Contract Value (USD) *</label>
            <input className="field-input" type="number" min="0" placeholder="e.g. 95000" value={form.contractValueUsd} onChange={e => set("contractValueUsd", e.target.value)} />
          </div>

          <div>
            <label className="field-label">Notes (optional)</label>
            <textarea className="field-input" rows={2} style={{ resize: "none" }} placeholder="Any additional contract terms…" value={form.notes} onChange={e => set("notes", e.target.value)} />
          </div>

          <div style={{ fontSize: 12, color: "#a38a5d", padding: "8px 12px", borderRadius: 8, background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.12)", display: "flex", alignItems: "center", gap: 6 }}>
            <Info size={14} color="#0284c7" style={{ flexShrink: 0 }} />
            <span>Default payment milestones: 20% Advance → 50% BL Onboard → 30% Port Customs. You can mark each as released after saving.</span>
          </div>

          {err && (
            <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#dc2626", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
              <AlertTriangle size={14} color="#dc2626" /> {err}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="button" className="btn-ghost" style={{ flex: 1, justifyContent: "center", padding: "12px" }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-gold" style={{ flex: 2, justifyContent: "center", padding: "12px", display: "inline-flex", alignItems: "center", gap: 8 }} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                  Saving…
                </>
              ) : (
                <>
                  <Scroll size={14} /> Add Contract
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────── */
export default function ExportContracts() {
  const [contracts, setContracts]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [showAdd, setShowAdd]             = useState(false);
  const [milestoneUpdating, setMilestoneUpdating] = useState(null);
  const [deleteConfId, setDeleteConfId]   = useState(null);
  const [toast, setToast]                 = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/contracts`, { headers: authH() });
      const d = await r.json();
      if (d.success) setContracts(d.contracts || []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onSaved = (contract) => {
    setContracts(p => [contract, ...p]);
    setShowAdd(false);
    showToast("Contract added successfully");
  };

  /* Toggle milestone released/pending */
  const toggleMilestone = async (contractId, idx, currentVal) => {
    const key = `${contractId}-${idx}`;
    setMilestoneUpdating(key);
    try {
      const r = await fetch(`${API_URL}/api/contracts/${contractId}/milestone`, {
        method: "PATCH", headers: authH(),
        body: JSON.stringify({ milestoneIndex: idx, released: !currentVal }),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.message);
      setContracts(p => p.map(c => c._id === contractId ? d.contract : c));
    } catch (e) { showToast(e.message); }
    finally { setMilestoneUpdating(null); }
  };

  /* Delete contract */
  const deleteContract = async (id) => {
    try {
      const r = await fetch(`${API_URL}/api/contracts/${id}`, { method: "DELETE", headers: authH() });
      const d = await r.json();
      if (!d.success) throw new Error(d.message);
      setContracts(p => p.filter(c => c._id !== id));
      setDeleteConfId(null);
      showToast("Contract deleted");
    } catch (e) { showToast(e.message); }
  };

  const getMilestoneProgress = (milestones) => {
    if (!milestones?.length) return { pct: 0, label: "0%" };
    const releasedPct = milestones.filter(m => m.released).reduce((s, m) => s + (m.percentage || 0), 0);
    const all = milestones.every(m => m.released);
    return { pct: releasedPct, label: all ? "FULLY RELEASED (100%)" : `IN PROGRESS (${releasedPct}%)` };
  };

  return (
    <>
      <style>{DS}</style>
      {showAdd && <AddContractModal onClose={() => setShowAdd(false)} onSaved={onSaved} />}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 28, right: 28, background: "rgba(34,197,94,0.14)", border: "1px solid rgba(34,197,94,0.3)", color: "#15803d", padding: "12px 20px", borderRadius: 12, fontWeight: 700, fontSize: 14, zIndex: 99999 }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="pg-head">
        <div>
          <div className="eyebrow">Bank Letters of Credit & Trade Contracts</div>
          <h1 className="pg-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Scroll size={26} color="#d97706" /> Export Contracts & LC Hub
          </h1>
          <p className="pg-sub">Manage Letters of Credit, milestone payment releases, and trade contracts.</p>
        </div>
        <button className="btn-gold" onClick={() => setShowAdd(true)}>+ Add Contract / LC</button>
      </div>

      {/* Loading */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "64px 0" }}>
          <div className="spinner" />
          <div style={{ marginTop: 14, fontSize: 14, color: "#a38a5d" }}>Loading contracts…</div>
        </div>
      ) : contracts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "72px 24px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <Scroll size={52} color="#d97706" strokeWidth={1.5} />
          </div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>No Contracts Yet</div>
          <div style={{ fontSize: 14, color: "#a38a5d", marginBottom: 28, maxWidth: 420, margin: "0 auto 28px" }}>
            Add your first export LC or trade contract to track payment milestones and buyer details.
          </div>
          <button className="btn-gold" onClick={() => setShowAdd(true)} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Scroll size={16} /> Add First Contract
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {contracts.map(c => {
            const { pct, label } = getMilestoneProgress(c.milestones);
            const isCompleted = c.status === "completed";
            return (
              <div key={c._id} className="card">
                {/* Card header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      {c.lcRef && <span style={{ fontFamily: "monospace", fontWeight: 800, color: "#b45309", fontSize: 15 }}>{c.lcRef}</span>}
                      <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "rgba(245,158,11,0.15)", color: "#fef08a", fontWeight: 800, border: "1px solid rgba(245,158,11,0.3)" }}>
                        {c.lcType}
                      </span>
                      {isCompleted && (
                        <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "rgba(34,197,94,0.12)", color: "#15803d", fontWeight: 800, border: "1px solid rgba(34,197,94,0.3)" }}>
                          ✓ COMPLETED
                        </span>
                      )}
                    </div>
                    <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 16, marginTop: 6 }}>
                      {c.buyerName}{c.buyerCountry ? <span style={{ fontSize: 13, color: "#a38a5d", fontWeight: 400 }}> · {c.buyerCountry}</span> : ""}
                    </div>
                    {c.cropName && (
                      <div style={{ fontSize: 13, color: "#0369a1", fontWeight: 600, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                        <Sprout size={14} color="#0369a1" /> {c.cropName}{c.quantityTons ? ` (${c.quantityTons} MT)` : ""}
                      </div>
                    )}
                    {c.issuingBank && <div style={{ fontSize: 12, color: "#a38a5d", marginTop: 2 }}>Issuing Bank: <strong style={{ color: "#0f172a" }}>{c.issuingBank}</strong></div>}
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "#a38a5d", textTransform: "uppercase" }}>Contract Value</div>
                    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 800, color: "#15803d" }}>{fmtUsd(c.contractValueUsd)}</div>
                    <div style={{ fontSize: 12, color: "#a38a5d", marginTop: 2 }}>
                      Added {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                </div>

                {/* Payment milestones */}
                {c.milestones?.length > 0 && (
                  <div style={{ background: "#f1f5f9", padding: "14px 16px", borderRadius: 14, marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#a38a5d", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
                      LC Payment Release Milestones — {label}
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: 4, borderRadius: 4, background: "rgba(255,255,255,0.06)", marginBottom: 12, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, borderRadius: 4, background: "linear-gradient(90deg,#d97706,#4ade80)", transition: "width 0.4s ease" }} />
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {c.milestones.map((m, idx) => {
                        const key = `${c._id}-${idx}`;
                        const busy = milestoneUpdating === key;
                        return (
                          <button
                            key={idx}
                            disabled={busy}
                            onClick={() => toggleMilestone(c._id, idx, m.released)}
                            style={{
                              flex: 1, minWidth: 110, padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                              background: m.released ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.04)",
                              border: `1px solid ${m.released ? "rgba(34,197,94,0.3)" : "rgba(245,158,11,0.12)"}`,
                              textAlign: "center", transition: "all 0.2s", opacity: busy ? 0.6 : 1,
                            }}
                          >
                            <div style={{ fontSize: 11, fontWeight: 800, color: m.released ? "#4ade80" : "#a38a5d" }}>
                              {busy ? "…" : m.released ? "✓ RELEASED" : "PENDING"}
                            </div>
                            <div style={{ fontSize: 12, color: "#0f172a", fontWeight: 700, marginTop: 2 }}>{m.label}</div>
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ fontSize: 11, color: "#a38a5d", marginTop: 8 }}>
                      ↑ Click a milestone to mark it as released or pending
                    </div>
                  </div>
                )}

                {/* Notes */}
                {c.notes && (
                  <div style={{ fontSize: 13, color: "#a38a5d", marginBottom: 12, fontStyle: "italic", display: "flex", alignItems: "flex-start", gap: 6 }}>
                    <FileText size={14} color="#a38a5d" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>{c.notes}</span>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: 8 }}>
                  {deleteConfId === c._id ? (
                    <>
                      <button style={{ flex: 1, padding: "8px 14px", borderRadius: 10, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#dc2626", fontWeight: 700, fontSize: 12, cursor: "pointer" }} onClick={() => deleteContract(c._id)}>
                        Yes, Delete
                      </button>
                      <button style={{ flex: 1, padding: "8px 14px", borderRadius: 10, background: "var(--surface, rgba(255,255,255,0.04))", border: "1px solid #e2e8f0", color: "#a38a5d", fontWeight: 600, fontSize: 12, cursor: "pointer" }} onClick={() => setDeleteConfId(null)}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button className="btn-ghost" style={{ color: "#dc2626", borderColor: "rgba(239,68,68,0.2)", display: "inline-flex", alignItems: "center", gap: 6 }} onClick={() => setDeleteConfId(c._id)}>
                      <Trash2 size={13} /> Delete
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
