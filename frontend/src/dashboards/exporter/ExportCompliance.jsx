import { useState, useEffect, useCallback } from "react";
import { API_URL } from "../../config/api";

const DS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
  .pg-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:16px;flex-wrap:wrap;}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#f59e0b;margin-bottom:6px;}
  .pg-title{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:800;color:#fff;line-height:1.2;}
  .pg-sub{font-size:14px;color:var(--text2);margin-top:6px;}
  .card{background:rgba(245,158,11,0.04);border:1px solid rgba(245,158,11,0.12);border-radius:18px;padding:20px 22px;}
  .btn-gold{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:12px;background:linear-gradient(135deg,#d97706,#f59e0b);color:#fff;font-weight:700;font-size:14px;border:none;cursor:pointer;font-family:'Inter',sans-serif;}
  .btn-ghost{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:10px;border:1px solid rgba(245,158,11,0.2);background:rgba(245,158,11,0.06);color:#fef08a;font-weight:600;font-size:12px;cursor:pointer;font-family:'Inter',sans-serif;}
  .field-label{font-size:11px;font-weight:700;color:#a38a5d;text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:6px;}
  .field-input{width:100%;background:rgba(245,158,11,0.05);border:1px solid rgba(245,158,11,0.18);border-radius:11px;padding:10px 14px;color:#fff;outline:none;font-size:14px;font-family:'Inter',sans-serif;}
  .field-input:focus{border-color:rgba(245,158,11,0.4);}
  .field-input::placeholder{color:#7a8fa6;}
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.78);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(6px);}
  .modal-box{background:#0f0a03;border:1px solid rgba(245,158,11,0.2);border-radius:22px;padding:28px;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;}
  .spinner{width:28px;height:28px;border:3px solid rgba(255,255,255,0.08);border-top-color:#f59e0b;border-radius:50%;animation:spin 0.7s linear infinite;margin:0 auto;}
  @keyframes spin{to{transform:rotate(360deg)}}
  .pulse{animation:pulse 1.6s ease-in-out infinite;}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
`;

const authH = () => ({
  Authorization: `Bearer ${localStorage.getItem("agroconnect_token")}`,
  "Content-Type": "application/json",
});

const DOC_TYPES = [
  "Phytosanitary Certificate",
  "Certificate of Origin",
  "APEDA Registration (RCMC)",
  "FSSAI Export License",
  "IEC Code (Import Export Code)",
  "GlobalGAP Certification",
  "Fumigation Certificate",
  "Inspection Certificate",
  "Packing List",
  "Bill of Lading",
  "Commercial Invoice",
  "Other",
];

const STATUSES = ["VERIFIED", "ACTIVE", "RENEWAL DUE", "EXPIRED", "PENDING"];

const STATUS_CFG = {
  "VERIFIED":     { color: "#4ade80", bg: "rgba(34,197,94,0.08)"   },
  "ACTIVE":       { color: "#38bdf8", bg: "rgba(56,189,248,0.08)"  },
  "RENEWAL DUE":  { color: "#fbbf24", bg: "rgba(251,191,36,0.08)"  },
  "EXPIRED":      { color: "#f87171", bg: "rgba(239,68,68,0.08)"   },
  "PENDING":      { color: "#a78bfa", bg: "rgba(167,139,250,0.08)" },
};

const DOC_ICONS = {
  "Phytosanitary Certificate":   "🌱",
  "Certificate of Origin":       "📜",
  "APEDA Registration (RCMC)":   "🏛️",
  "FSSAI Export License":        "🛡️",
  "IEC Code (Import Export Code)":"📑",
  "GlobalGAP Certification":     "🌍",
  "Fumigation Certificate":      "💨",
  "Inspection Certificate":      "🔍",
  "Packing List":                "📦",
  "Bill of Lading":              "🚢",
  "Commercial Invoice":          "💵",
  "Other":                       "📄",
};

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null;
}

function daysLeft(d) {
  if (!d) return null;
  return Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24));
}

/* ─── Add Document Modal ─────────────────────────────────────────────── */
function AddDocModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    title: "", authority: "", docType: "Other",
    status: "ACTIVE", validFrom: "", validTill: "",
    isLifetime: false, refNumber: "", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState("");

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Auto-fill title from docType
  const handleDocType = (v) => {
    setForm(p => ({ ...p, docType: v, title: v === "Other" ? p.title : v }));
  };

  const submit = async (e) => {
    e.preventDefault(); setErr("");
    if (!form.title.trim()) return setErr("Document title is required.");
    setSaving(true);
    try {
      const r = await fetch(`${API_URL}/api/compliance`, {
        method: "POST", headers: authH(),
        body: JSON.stringify({ ...form, isLifetime: form.isLifetime }),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.message);
      onSaved(d.doc);
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: "#fff" }}>📑 Add Compliance Document</div>
            <div style={{ fontSize: 13, color: "#a38a5d", marginTop: 2 }}>Add a real export licence, certificate, or clearance</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#7a8fa6", cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label className="field-label">Document Type</label>
            <select className="field-input" value={form.docType} onChange={e => handleDocType(e.target.value)} style={{ appearance: "none" }}>
              {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="field-label">Document Title *</label>
            <input className="field-input" placeholder="e.g. FSSAI License No. 12345678" value={form.title} onChange={e => set("title", e.target.value)} />
          </div>

          <div>
            <label className="field-label">Issuing Authority / Body</label>
            <input className="field-input" placeholder="e.g. Plant Quarantine Dept of India" value={form.authority} onChange={e => set("authority", e.target.value)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="field-label">Reference / Licence No.</label>
              <input className="field-input" placeholder="e.g. IEC-0516043811" value={form.refNumber} onChange={e => set("refNumber", e.target.value)} />
            </div>
            <div>
              <label className="field-label">Status</label>
              <select className="field-input" value={form.status} onChange={e => set("status", e.target.value)} style={{ appearance: "none" }}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="field-label">Valid From</label>
              <input className="field-input" type="date" value={form.validFrom} onChange={e => set("validFrom", e.target.value)} disabled={form.isLifetime} />
            </div>
            <div>
              <label className="field-label">Valid Till</label>
              <input className="field-input" type="date" value={form.validTill} onChange={e => set("validTill", e.target.value)} disabled={form.isLifetime} />
            </div>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, color: "#a38a5d" }}>
            <input type="checkbox" checked={form.isLifetime} onChange={e => set("isLifetime", e.target.checked)} style={{ width: 16, height: 16 }} />
            Lifetime / No Expiry (e.g. IEC Code)
          </label>

          <div>
            <label className="field-label">Notes (optional)</label>
            <textarea className="field-input" rows={2} style={{ resize: "none" }} placeholder="Any additional notes…" value={form.notes} onChange={e => set("notes", e.target.value)} />
          </div>

          {err && <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 13 }}>⚠️ {err}</div>}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="button" className="btn-ghost" style={{ flex: 1, justifyContent: "center", padding: "12px" }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-gold" style={{ flex: 2, justifyContent: "center", padding: "12px" }} disabled={saving}>
              {saving ? "⏳ Saving…" : "📑 Add Document"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Print-to-PDF helper using real doc data ────────────────────────── */
function printDocPdf(doc, user) {
  const w = window.open("", "_blank");
  if (!w) return alert("Please allow pop-ups to print/download the certificate.");

  const validity = doc.isLifetime
    ? "Lifetime Authorization"
    : doc.validTill
      ? `Valid till ${fmtDate(doc.validTill)}`
      : "No expiry set";

  w.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${doc.title} — AgroConnect 360</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Space+Grotesk:wght@700;800&display=swap');
    body{font-family:'Inter',sans-serif;padding:40px;color:#1e293b;background:#fff;}
    .hdr{border-bottom:3px solid #d97706;padding-bottom:20px;margin-bottom:30px;display:flex;justify-content:space-between;align-items:flex-start;}
    .logo{font-family:'Space Grotesk',sans-serif;font-size:22px;font-weight:800;color:#b45309;}
    .sub{font-size:12px;color:#64748b;margin-top:4px;}
    h1{font-family:'Space Grotesk',sans-serif;font-size:20px;font-weight:800;text-transform:uppercase;margin-bottom:16px;}
    .badge{display:inline-block;background:#ecfdf5;color:#047857;border:1px solid #a7f3d0;padding:5px 14px;border-radius:20px;font-weight:700;font-size:12px;margin-bottom:24px;}
    table{width:100%;border-collapse:collapse;margin:20px 0;}
    th,td{border:1px solid #cbd5e1;padding:11px 14px;font-size:13px;text-align:left;}
    th{background:#f8fafc;font-weight:700;color:#334155;}
    .ftr{margin-top:48px;border-top:1px solid #e2e8f0;padding-top:18px;display:flex;justify-content:space-between;font-size:11px;color:#94a3b8;}
    .seal{border:2px dashed #b45309;padding:10px 18px;border-radius:10px;color:#b45309;font-weight:800;font-size:12px;}
    @media print{@page{size:A4;margin:1cm}}
  </style>
</head>
<body>
  <div class="hdr">
    <div><div class="logo">🚢 AGROCONNECT 360</div><div class="sub">Export Compliance Document</div></div>
    <div style="text-align:right;font-size:12px;">
      <div><strong>Ref:</strong> ${doc.refNumber || "—"}</div>
      <div style="color:#64748b;">Date: ${new Date().toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}</div>
    </div>
  </div>
  <h1>${doc.title}</h1>
  <div class="badge">● ${doc.status}</div>
  <table>
    <thead><tr><th>Field</th><th>Details</th></tr></thead>
    <tbody>
      <tr><td>Document Type</td><td>${doc.docType}</td></tr>
      <tr><td>Issuing Authority</td><td>${doc.authority || "—"}</td></tr>
      <tr><td>Reference / Licence No.</td><td>${doc.refNumber || "—"}</td></tr>
      <tr><td>Validity</td><td>${validity}</td></tr>
      <tr><td>Exporter</td><td>${user?.name || "—"}</td></tr>
      ${doc.notes ? `<tr><td>Notes</td><td>${doc.notes}</td></tr>` : ""}
    </tbody>
  </table>
  <div class="ftr">
    <div>This document is recorded in the AgroConnect 360 Export Compliance Vault.<br/>Always carry the original government-issued certificate during customs inspection.</div>
    <div class="seal">AGROCONNECT 360<br/>COMPLIANCE RECORD</div>
  </div>
  <script>window.onload=()=>setTimeout(()=>window.print(),300);<\/script>
</body></html>`);
  w.document.close();
}

/* ─── Main Component ─────────────────────────────────────────────────── */
export default function ExportCompliance() {
  const user = JSON.parse(localStorage.getItem("agroconnect_user") || "{}");

  const [docs,         setDocs]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showAdd,      setShowAdd]      = useState(false);
  const [toast,        setToast]        = useState("");
  const [deleteConfId, setDeleteConfId] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/compliance`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("agroconnect_token")}` },
      });
      const d = await r.json();
      if (d.success) setDocs(d.docs || []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onSaved = (doc) => {
    setDocs(p => [doc, ...p]);
    setShowAdd(false);
    showToast("✅ Document added successfully");
  };

  const changeStatus = async (id, status) => {
    setStatusUpdating(id);
    try {
      const r = await fetch(`${API_URL}/api/compliance/${id}/status`, {
        method: "PATCH", headers: authH(),
        body: JSON.stringify({ status }),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.message);
      setDocs(p => p.map(doc => doc._id === id ? d.doc : doc));
    } catch (e) { showToast("⚠️ " + e.message); }
    finally { setStatusUpdating(null); }
  };

  const deleteDoc = async (id) => {
    try {
      const r = await fetch(`${API_URL}/api/compliance/${id}`, { method: "DELETE", headers: authH() });
      const d = await r.json();
      if (!d.success) throw new Error(d.message);
      setDocs(p => p.filter(doc => doc._id !== id));
      setDeleteConfId(null);
      showToast("✅ Document deleted");
    } catch (e) { showToast("⚠️ " + e.message); }
  };

  const renewalDue  = docs.filter(d => d.status === "RENEWAL DUE").length;
  const expired     = docs.filter(d => d.status === "EXPIRED").length;

  return (
    <>
      <style>{DS}</style>
      {showAdd && <AddDocModal onClose={() => setShowAdd(false)} onSaved={onSaved} />}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 28, right: 28, background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.28)", color: "#4ade80", padding: "12px 20px", borderRadius: 12, fontWeight: 700, fontSize: 14, zIndex: 99999 }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="pg-head">
        <div>
          <div className="eyebrow">Trade Compliance & Regulatory Vault</div>
          <h1 className="pg-title">📑 Export Customs & Certification Hub</h1>
          <p className="pg-sub">Manage phytosanitary, APEDA, FSSAI licences and customs clearance documents.</p>
        </div>
        <button className="btn-gold" onClick={() => setShowAdd(true)}>+ Add Document</button>
      </div>

      {/* Alerts */}
      {(renewalDue > 0 || expired > 0) && !loading && (
        <div style={{ marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
          {renewalDue > 0 && (
            <div style={{ flex: 1, minWidth: 200, padding: "12px 16px", borderRadius: 12, background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)", color: "#fbbf24", fontWeight: 700, fontSize: 13 }}>
              ⚠️ {renewalDue} document{renewalDue > 1 ? "s" : ""} due for renewal
            </div>
          )}
          {expired > 0 && (
            <div style={{ flex: 1, minWidth: 200, padding: "12px 16px", borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontWeight: 700, fontSize: 13 }}>
              🔴 {expired} document{expired > 1 ? "s" : ""} expired — update immediately
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "64px 0" }}>
          <div className="spinner" />
          <div style={{ marginTop: 14, fontSize: 14, color: "#a38a5d" }}>Loading compliance vault…</div>
        </div>
      ) : docs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "72px 24px" }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>📑</div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 8 }}>No Documents Yet</div>
          <div style={{ fontSize: 14, color: "#a38a5d", marginBottom: 28, maxWidth: 420, margin: "0 auto 28px" }}>
            Add your export licences and certificates — Phytosanitary, FSSAI, APEDA, IEC Code, Certificate of Origin, etc.
          </div>
          <button className="btn-gold" onClick={() => setShowAdd(true)}>📑 Add First Document</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18 }}>
          {docs.map(doc => {
            const cfg  = STATUS_CFG[doc.status] || STATUS_CFG["ACTIVE"];
            const icon = DOC_ICONS[doc.docType] || "📄";
            const days = doc.isLifetime ? null : daysLeft(doc.validTill);
            const isExpiring = days !== null && days <= 30 && days > 0;
            const isExpired  = days !== null && days <= 0;

            return (
              <div key={doc._id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 12 }}>
                {/* Top row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span style={{ fontSize: 30 }}>{icon}</span>
                  <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: cfg.bg, color: cfg.color, fontWeight: 700, border: `1px solid ${cfg.color}40` }}>
                    ● {doc.status}
                  </span>
                </div>

                {/* Title + authority */}
                <div>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 4 }}>{doc.title}</div>
                  {doc.authority && <div style={{ fontSize: 12, color: "#a38a5d" }}>Issuing Body: <strong style={{ color: "#fff" }}>{doc.authority}</strong></div>}
                  {doc.refNumber && <div style={{ fontSize: 11, color: "#a38a5d", marginTop: 2 }}>Ref: {doc.refNumber}</div>}
                </div>

                {/* Validity pill */}
                <div style={{ fontSize: 11, background: isExpired ? "rgba(239,68,68,0.1)" : isExpiring ? "rgba(251,191,36,0.1)" : "rgba(0,0,0,0.2)", padding: "8px 12px", borderRadius: 10, color: isExpired ? "#f87171" : isExpiring ? "#fbbf24" : "#a38a5d", fontWeight: isExpiring || isExpired ? 700 : 400 }}>
                  📅 {
                    doc.isLifetime ? "Lifetime License" :
                    doc.validTill  ? `Valid till ${fmtDate(doc.validTill)}${days !== null ? ` (${days > 0 ? `${days}d left` : "Expired"})` : ""}` :
                    "No expiry set"
                  }
                </div>

                {/* Status changer */}
                <div>
                  <label className="field-label" style={{ marginBottom: 4 }}>Update Status</label>
                  <select
                    className="field-input"
                    style={{ fontSize: 12, padding: "7px 12px", appearance: "none", opacity: statusUpdating === doc._id ? 0.5 : 1 }}
                    value={doc.status}
                    disabled={statusUpdating === doc._id}
                    onChange={e => changeStatus(doc._id, e.target.value)}
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="btn-ghost" style={{ flex: 1, justifyContent: "center", fontSize: 11 }} onClick={() => printDocPdf(doc, user)}>
                    🖨️ Print / PDF
                  </button>

                  {deleteConfId === doc._id ? (
                    <>
                      <button style={{ flex: 1, padding: "8px", borderRadius: 10, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171", fontWeight: 700, fontSize: 11, cursor: "pointer" }} onClick={() => deleteDoc(doc._id)}>
                        Yes, Delete
                      </button>
                      <button style={{ flex: 1, padding: "8px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#a38a5d", fontWeight: 600, fontSize: 11, cursor: "pointer" }} onClick={() => setDeleteConfId(null)}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button className="btn-ghost" style={{ flex: 1, justifyContent: "center", fontSize: 11, color: "#f87171", borderColor: "rgba(239,68,68,0.2)" }} onClick={() => setDeleteConfId(doc._id)}>
                      🗑 Delete
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
