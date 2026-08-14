import { useEffect, useState, useCallback } from "react";
import { DS } from "../../styles/ds";
import { API_URL } from "../../config/api";
import { useLocation } from "react-router-dom";

/* ─── static reference data (preserved exactly) ─────────────────────── */
const EXPORT_CROPS = [
  { name: "Basmati Rice",         grade: "Grade A",       destination: "Middle East, EU", minQty: "10 MT", price: "₹4,500/q",  flag: "🌾" },
  { name: "Fresh Mango (Alphonso)",grade: "Export Grade",  destination: "UK, USA, UAE",    minQty: "5 MT",  price: "₹12,000/q", flag: "🥭" },
  { name: "Onion (Red)",           grade: "Medium / Large",destination: "Malaysia, SL",    minQty: "20 MT", price: "₹1,800/q",  flag: "🧅" },
  { name: "Turmeric (Finger)",     grade: "4-5% Curcumin", destination: "USA, Germany",    minQty: "5 MT",  price: "₹9,000/q",  flag: "🌿" },
  { name: "Chilli (S4 Dry)",       grade: "AGMARK",        destination: "China, Bangladesh",minQty:"10 MT", price: "₹15,000/q", flag: "🌶️" },
  { name: "Peanuts (Bold)",        grade: "HPS 40/50",     destination: "Indonesia, EU",   minQty: "20 MT", price: "₹6,500/q",  flag: "🥜" },
];
const STEPS = [
  { step: "01", icon: "📋", title: "Register with APEDA", desc: "Get Agri-Export code from Agricultural and Processed Food Products Export Development Authority." },
  { step: "02", icon: "🧪", title: "Quality Certification", desc: "Obtain Phytosanitary Certificate from State Agriculture Dept and FSSAI license for food products." },
  { step: "03", icon: "📦", title: "Packaging Standards", desc: "Pack in export-grade materials with proper labeling per destination country's norms." },
  { step: "04", icon: "🚢", title: "Shipping & Logistics", desc: "Connect with CHA (Customs House Agent) and freight forwarder for sea/air shipment." },
  { step: "05", icon: "💰", title: "Payment & Insurance", desc: "Use Letter of Credit (LC) or advance payment; insure cargo via ECGC." },
];
const GOVT_LINKS = [
  ["APEDA", "https://apeda.gov.in",  "Agricultural export registration"],
  ["DGFT",  "https://dgft.gov.in",   "Import-Export Code (IEC)"],
  ["FSSAI", "https://fssai.gov.in",  "Food safety license"],
  ["ECGC",  "https://ecgc.in",       "Export credit guarantee"],
];
const GRADES      = ["Export Grade","Grade A","Grade B","AGMARK","HPS 40/50","Premium","Organic Certified","Other"];
const UNITS       = ["MT","quintal","kg"];
const DESTINATIONS= ["UAE","USA","UK","Saudi Arabia","Germany","Netherlands","France","Singapore","Malaysia","China","Bangladesh","Sri Lanka","Other"];
const STATUS_CFG  = {
  pending:     { label: "Pending",     cls: "badge-amber" },
  accepted:    { label: "Accepted",    cls: "badge-green" },
  rejected:    { label: "Rejected",    cls: "badge-red"   },
  negotiating: { label: "Negotiating", cls: "badge-blue"  },
  confirmed:   { label: "Confirmed",   cls: "badge-green" },
  cancelled:   { label: "Cancelled",   cls: "badge-red"   },
  completed:   { label: "Completed",   cls: "badge-green" },
};

const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("agroconnect_token")}`, "Content-Type": "application/json" });
const fmt   = (n) => n != null ? `₹${Number(n).toLocaleString("en-IN")}` : "—";

/* ─── Status Badge ───────────────────────────────────────────────────── */
const SBadge = ({ status }) => {
  const cfg = STATUS_CFG[status] || { label: status, cls: "badge-amber" };
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
};

/* ─── Empty state ────────────────────────────────────────────────────── */
const Empty = ({ emoji, title, sub }) => (
  <div className="empty-state">
    <div className="empty-emoji">{emoji}</div>
    <div className="empty-title">{title}</div>
    {sub && <div className="empty-sub">{sub}</div>}
  </div>
);

/* ─── Create / Edit Modal ────────────────────────────────────────────── */
function ListingModal({ editing, onClose, onSaved, farmerUser }) {
  const isEdit = !!editing;
  const [form, setForm] = useState(isEdit ? {
    name:                editing.name || "",
    exportGrade:         editing.exportGrade || "",
    exportQuantity:      editing.exportQuantity || "",
    exportUnit:          editing.exportUnit || "MT",
    expectedExportPrice: editing.expectedExportPrice || "",
    location:            editing.location || "",
    availableFrom:       editing.availableFrom ? editing.availableFrom.slice(0, 10) : "",
    preferredDestination:editing.preferredDestination || "",
    description:         editing.description || "",
  } : {
    name: "", exportGrade: "", exportQuantity: "", exportUnit: "MT",
    expectedExportPrice: "", location: [farmerUser.district, farmerUser.state].filter(Boolean).join(", ") || farmerUser.location || "",
    availableFrom: "", preferredDestination: "", description: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim())          return setError("Crop / produce name is required");
    if (!form.exportQuantity || Number(form.exportQuantity) <= 0) return setError("Quantity must be > 0");
    if (!form.exportGrade.trim())   return setError("Quality / Grade is required");
    if (form.expectedExportPrice && Number(form.expectedExportPrice) < 0) return setError("Price cannot be negative");
    setError(""); setSaving(true);
    try {
      const url    = isEdit ? `${API_URL}/api/export/listings/${editing._id}` : `${API_URL}/api/export/listings`;
      const method = isEdit ? "PUT" : "POST";
      const r      = await fetch(url, { method, headers: authH(), body: JSON.stringify(form) });
      const d      = await r.json();
      if (!d.success) throw new Error(d.message);
      onSaved(d.listing);
    } catch (err) {
      setError(err.message || "Failed to save listing");
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 540 }}>
        <div className="modal-title">{isEdit ? "✏️ Edit Export Listing" : "🌍 List Produce for Export"}</div>
        <div className="modal-sub">Fill in the details to list your produce for international buyers.</div>
        {error && <div className="alert-error" style={{ marginBottom: 14 }}>⚠️ {error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <label className="field-label">Crop / Produce Name *</label>
              <input className="field-input" required value={form.name} onChange={e => f("name", e.target.value)} placeholder="e.g. Alphonso Mango, Basmati Rice" />
            </div>
            <div>
              <label className="field-label">Quality / Grade *</label>
              <select className="field-input" value={form.exportGrade} onChange={e => f("exportGrade", e.target.value)}>
                <option value="">Select grade…</option>
                {GRADES.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Preferred Destination</label>
              <select className="field-input" value={form.preferredDestination} onChange={e => f("preferredDestination", e.target.value)}>
                <option value="">Any / Open</option>
                {DESTINATIONS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Export Quantity *</label>
              <input className="field-input" type="number" min="0.1" step="0.1" required value={form.exportQuantity} onChange={e => f("exportQuantity", e.target.value)} placeholder="e.g. 8" />
            </div>
            <div>
              <label className="field-label">Unit</label>
              <select className="field-input" value={form.exportUnit} onChange={e => f("exportUnit", e.target.value)}>
                {UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Expected Price (₹/unit)</label>
              <input className="field-input" type="number" min="0" value={form.expectedExportPrice} onChange={e => f("expectedExportPrice", e.target.value)} placeholder="e.g. 12000" />
            </div>
            <div>
              <label className="field-label">Available From</label>
              <input className="field-input" type="date" value={form.availableFrom} onChange={e => f("availableFrom", e.target.value)} />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label className="field-label">Farm Location</label>
              <input className="field-input" value={form.location} onChange={e => f("location", e.target.value)} placeholder="e.g. Kolar, Karnataka" />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label className="field-label">Description (optional)</label>
              <textarea className="field-input" rows={2} style={{ resize: "none" }} value={form.description} onChange={e => f("description", e.target.value)} placeholder="Quality notes, certifications, packaging info…" />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={onClose}>Cancel</button>
            <button type="submit"  className="btn-green" style={{ flex: 2, justifyContent: "center", padding: "13px" }} disabled={saving}>
              {saving ? "⏳ Saving…" : isEdit ? "✅ Update Listing" : "🌍 List for Export"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Interest Detail / Action Modal ────────────────────────────────── */
function InterestModal({ interest, onClose, onUpdated }) {
  const [action,  setAction]  = useState(null); // "accept"|"reject"|"counter"|"confirm"
  const [counter, setCounter] = useState("");
  const [notes,   setNotes]   = useState("");
  const [agreePrice, setAgreePrice] = useState(interest.exporterCounter || interest.offeredPrice || "");
  const [agreeQty,   setAgreeQty]   = useState(interest.requestedQty || "");
  const [terms,   setTerms]   = useState("");
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState("");

  const doAction = async () => {
    setSaving(true); setErr("");
    try {
      let url, body;
      if (action === "accept")  { url = `/api/export/interests/${interest._id}/respond`;  body = { status: "accepted" }; }
      if (action === "reject")  { url = `/api/export/interests/${interest._id}/respond`;  body = { status: "rejected" }; }
      if (action === "counter") { url = `/api/export/interests/${interest._id}/counter`;  body = { farmerCounter: Number(counter), negotiationNotes: notes }; }
      if (action === "confirm") { url = `/api/export/interests/${interest._id}/confirm`;  body = { agreedPrice: Number(agreePrice), agreedQty: Number(agreeQty), agreedUnit: interest.requestedUnit || "MT", shipmentTerms: terms }; }
      const r = await fetch(`${API_URL}${url}`, { method: "PATCH", headers: authH(), body: JSON.stringify(body) });
      const d = await r.json();
      if (!d.success) throw new Error(d.message);
      onUpdated(d.interest);
      onClose();
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const exp = interest.exporter || {};
  const lst = interest.listing  || {};

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 500 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div className="modal-title" style={{ fontSize: 17 }}>📩 Export Interest</div>
            <SBadge status={interest.status} />
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, color: "#7a8fa6", cursor: "pointer", width: 30, height: 30, fontSize: 18 }}>×</button>
        </div>

        {/* Info rows */}
        {[
          ["Crop",               lst.name || "—"],
          ["Exporter",           exp.name || "—"],
          ["Location",           exp.location || exp.state || "—"],
          ["Requested Qty",      `${interest.requestedQty} ${interest.requestedUnit || "MT"}`],
          ["Offered Price",      fmt(interest.offeredPrice) + (interest.requestedUnit ? `/${interest.requestedUnit}` : "")],
          ["Destination",        interest.destination || "—"],
          ["Farmer Counter",     interest.farmerCounter ? fmt(interest.farmerCounter) : "—"],
          ["Exporter Counter",   interest.exporterCounter ? fmt(interest.exporterCounter) : "—"],
          ["Message",            interest.message || "—"],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
            <span style={{ color: "var(--text2)" }}>{k}</span>
            <span style={{ color: "#fff", fontWeight: 600, maxWidth: "60%", textAlign: "right" }}>{v}</span>
          </div>
        ))}

        {err && <div className="alert-error" style={{ margin: "12px 0" }}>⚠️ {err}</div>}

        {/* Pending: Accept or Reject only */}
        {interest.status === "pending" && !action && (
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 10, padding: "8px 12px", borderRadius: 8, background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.15)" }}>
              ℹ️ Accept the interest first. You can counter-offer after accepting.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-ghost" style={{ flex: 1, justifyContent: "center", color: "#f87171", borderColor: "rgba(239,68,68,0.2)" }} onClick={() => setAction("reject")}>✕ Reject</button>
              <button className="btn-green" style={{ flex: 1, justifyContent: "center" }} onClick={() => setAction("accept")}>✓ Accept</button>
            </div>
          </div>
        )}

        {["accepted","negotiating"].includes(interest.status) && !action && (
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <button className="btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={() => setAction("counter")}>💬 Counter Offer</button>
            <button className="btn-green" style={{ flex: 1, justifyContent: "center" }} onClick={() => setAction("confirm")}>🤝 Confirm Deal</button>
          </div>
        )}

        {/* Confirm/reject sub-form */}
        {action === "accept" && (
          <div style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 12, color: "#4ade80", fontWeight: 600 }}>Accept this interest request?</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-ghost" onClick={() => setAction(null)} style={{ flex: 1, justifyContent: "center" }}>Back</button>
              <button className="btn-green" onClick={doAction} disabled={saving} style={{ flex: 2, justifyContent: "center" }}>{saving ? "⏳…" : "✓ Confirm Accept"}</button>
            </div>
          </div>
        )}
        {action === "reject" && (
          <div style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 12, color: "#f87171", fontWeight: 600 }}>Reject this interest request?</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-ghost" onClick={() => setAction(null)} style={{ flex: 1, justifyContent: "center" }}>Back</button>
              <button style={{ flex: 2, padding: "12px", borderRadius: 10, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontWeight: 700, cursor: "pointer" }} onClick={doAction} disabled={saving}>{saving ? "⏳…" : "✕ Confirm Reject"}</button>
            </div>
          </div>
        )}
        {action === "counter" && (
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label className="field-label">Your Counter Price (₹/{interest.requestedUnit || "MT"})</label>
              <input className="field-input" type="number" min="0" value={counter} onChange={e => setCounter(e.target.value)} placeholder="Your expected price" />
            </div>
            <div>
              <label className="field-label">Notes (optional)</label>
              <textarea className="field-input" rows={2} style={{ resize: "none" }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Reason for counter offer, quality notes…" />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-ghost" onClick={() => setAction(null)} style={{ flex: 1, justifyContent: "center" }}>Back</button>
              <button className="btn-green" onClick={doAction} disabled={saving || !counter} style={{ flex: 2, justifyContent: "center" }}>{saving ? "⏳…" : "💬 Send Counter"}</button>
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
              <label className="field-label">Shipment Terms (optional)</label>
              <input className="field-input" value={terms} onChange={e => setTerms(e.target.value)} placeholder="e.g. FOB Nhava Sheva, delivery Aug 2026" />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-ghost" onClick={() => setAction(null)} style={{ flex: 1, justifyContent: "center" }}>Back</button>
              <button className="btn-green" onClick={doAction} disabled={saving} style={{ flex: 2, justifyContent: "center" }}>{saving ? "⏳…" : "🤝 Confirm Deal"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════ */
export default function ExportPage() {
  const [tab,          setTab]          = useState("market");   // market|listings|interests|create
  const [listings,     setListings]     = useState([]);
  const [interests,    setInterests]    = useState([]);
  const [loadL,        setLoadL]        = useState(false);
  const [loadI,        setLoadI]        = useState(false);
  const [stats,        setStats]        = useState({});
  const [toast,        setToast]        = useState("");
  const [editTarget,   setEditTarget]   = useState(null);  // for edit modal
  const [showCreate,   setShowCreate]   = useState(false);
  const [viewInterest, setViewInterest] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null); // inline delete confirm

  const user = JSON.parse(localStorage.getItem("agroconnect_user") || "{}");
  const location = useLocation();

  // Read navigation state from FarmerDashboard (tab=listings, openCreate)
  useEffect(() => {
    const state = location.state;
    if (!state) return;
    if (state.tab) setTab(state.tab);
    if (state.openCreate) setShowCreate(true);
  }, []); // eslint-disable-line

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  /* ── Load stats ──────────────────────────────────────────────────── */
  const loadStats = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/api/export/stats`, { headers: authH() });
      const d = await r.json();
      if (d.success) setStats(d);
    } catch {}
  }, []);

  /* ── Load farmer listings ─────────────────────────────────────────── */
  const loadListings = useCallback(async () => {
    setLoadL(true);
    try {
      const r = await fetch(`${API_URL}/api/export/farmer/listings`, { headers: authH() });
      const d = await r.json();
      if (d.success) setListings(d.listings);
    } catch {}
    finally { setLoadL(false); }
  }, []);

  /* ── Load interest requests ───────────────────────────────────────── */
  const loadInterests = useCallback(async () => {
    setLoadI(true);
    try {
      const r = await fetch(`${API_URL}/api/export/farmer/interests`, { headers: authH() });
      const d = await r.json();
      if (d.success) setInterests(d.interests);
    } catch {}
    finally { setLoadI(false); }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { if (tab === "listings")  loadListings();  }, [tab, loadListings]);
  useEffect(() => {
    if (tab === "interests") {
      loadInterests();
      // silently mark all interest requests as read so badge clears
      fetch(`${API_URL}/api/export/farmer/interests/read-all`, { method: "PUT", headers: authH() })
        .then(() => loadStats())
        .catch(() => {});
    }
  }, [tab, loadInterests, loadStats]);

  /* ── Delete listing ───────────────────────────────────────────────── */
  const deleteListing = async (id) => {
    try {
      const r = await fetch(`${API_URL}/api/export/listings/${id}`, { method: "DELETE", headers: authH() });
      const d = await r.json();
      if (!d.success) throw new Error(d.message);
      setListings(prev => prev.filter(l => l._id !== id));
      setDeleteConfirmId(null);
      loadStats();
      showToast("✅ Listing removed");
    } catch (e) { showToast("⚠️ " + e.message); }
  };

  /* ── Handle saved listing (create / edit) ─────────────────────────── */
  const onListingSaved = (saved) => {
    setListings(prev => {
      const idx = prev.findIndex(l => l._id === saved._id);
      return idx >= 0 ? prev.map(l => l._id === saved._id ? saved : l) : [saved, ...prev];
    });
    setShowCreate(false);
    setEditTarget(null);
    loadStats();
    showToast("✅ Export listing saved");
    setTab("listings");
  };

  /* ── Handle interest update ───────────────────────────────────────── */
  const onInterestUpdated = (updated) => {
    setInterests(prev => prev.map(i => i._id === updated._id ? { ...i, ...updated } : i));
    loadStats();
  };

  /* ──────────────────────────────────────────────────────────────────── */
  const TABS = [
    { id: "market",    label: "🌍 Market Info",       badge: null },
    { id: "listings",  label: "📋 My Export Listings", badge: stats.listingCount || null },
    { id: "interests", label: "📩 Interest Requests",  badge: stats.pendingInterests || null },
  ];

  return (
    <>
      <style>{DS + `
        .exp-tabs { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:24px; }
        .exp-tab {
          padding:8px 18px; border-radius:10px; font-size:13px; font-weight:600;
          cursor:pointer; border:1px solid var(--border);
          background:var(--surface); color:var(--text2); transition:all 0.18s;
          display:flex; align-items:center; gap:8px; position:relative;
        }
        .exp-tab.active { background:var(--green-dim); color:#4ade80; border-color:rgba(34,197,94,0.2); }
        .exp-tab:hover:not(.active) { border-color:var(--border2); color:var(--text); }
        .tab-badge {
          min-width:18px; height:18px; border-radius:9px; font-size:10px; font-weight:800;
          background:#4ade80; color:#000; display:flex; align-items:center; justify-content:center; padding:0 4px;
        }

        .badge { display:inline-flex; align-items:center; gap:4px; padding:3px 9px; border-radius:6px; font-size:11px; font-weight:600; }
        .badge-green  { background:rgba(34,197,94,0.12);  color:#4ade80; border:1px solid rgba(34,197,94,0.2);  }
        .badge-amber  { background:rgba(251,191,36,0.12); color:#fbbf24; border:1px solid rgba(251,191,36,0.2); }
        .badge-red    { background:rgba(239,68,68,0.12);  color:#f87171; border:1px solid rgba(239,68,68,0.2);  }
        .badge-blue   { background:rgba(56,189,248,0.12); color:#38bdf8; border:1px solid rgba(56,189,248,0.2); }

        .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.75); z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(6px); }
        .modal-box { background:#080d12; border:1px solid rgba(255,255,255,0.10); border-radius:24px; padding:28px; width:100%; max-height:90vh; overflow-y:auto; animation:fadeIn 0.2s ease; }
        @keyframes fadeIn { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }
        .modal-title { font-family:'Space Grotesk',sans-serif; font-size:20px; font-weight:800; color:#fff; margin-bottom:4px; }
        .modal-sub { font-size:13px; color:var(--text2); margin-bottom:20px; }

        .toast { position:fixed; bottom:28px; right:28px; background:rgba(34,197,94,0.14); border:1px solid rgba(34,197,94,0.3); color:#4ade80; padding:12px 20px; border-radius:12px; font-size:14px; font-weight:600; z-index:99999; backdrop-filter:blur(12px); animation:slideUp 0.3s ease; }
        @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }

        .listing-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:16px; }
        .interest-list { display:flex; flex-direction:column; gap:14px; }
        .icard { background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:18px; transition:border-color 0.18s; }
        .icard:hover { border-color:rgba(34,197,94,0.25); }
      `}</style>

      {toast && <div className="toast">{toast}</div>}
      {(showCreate || editTarget) && (
        <ListingModal
          editing={editTarget}
          onClose={() => { setShowCreate(false); setEditTarget(null); }}
          onSaved={onListingSaved}
          farmerUser={user}
        />
      )}
      {viewInterest && (
        <InterestModal
          interest={viewInterest}
          onClose={() => setViewInterest(null)}
          onUpdated={onInterestUpdated}
        />
      )}

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="pg-head">
        <div>
          <div className="eyebrow">Global Trade</div>
          <h1 className="pg-title">🚢 Export Your Produce</h1>
          <p className="pg-sub">Connect with international buyers and export your agricultural produce globally.</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
          <a href="https://apeda.gov.in" target="_blank" rel="noreferrer" className="btn-ghost" style={{ fontSize: 13 }}>📋 APEDA</a>
          <button className="btn-green" style={{ fontSize: 13 }} onClick={() => { setShowCreate(true); setTab("listings"); }}>
            + List Produce
          </button>
        </div>
      </div>

      {/* ── Quick stats bar ───────────────────────────────────────────── */}
      {(stats.listingCount > 0 || stats.pendingInterests > 0) && (
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          {[
            ["📋", "Export Listings",    stats.listingCount      || 0, "#4ade80"],
            ["📩", "Pending Requests",   stats.pendingInterests  || 0, "#fbbf24"],
            ["📬", "Unread Updates",     stats.unreadInterests   || 0, "#f87171"],
          ].map(([e, l, v, c]) => (
            <div key={l} style={{ padding: "10px 18px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, display: "flex", gap: 8, alignItems: "center" }}>
              <span>{e}</span>
              <span style={{ fontSize: 12, color: "var(--text2)" }}>{l}</span>
              <span style={{ fontWeight: 800, color: c, fontSize: 16 }}>{v}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <div className="exp-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`exp-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
            {t.badge > 0 && <span className="tab-badge">{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          TAB: MARKET INFO (preserved exactly)
      ═══════════════════════════════════════════════════════════════ */}
      {tab === "market" && (
        <>
          <div className="card-title" style={{ marginBottom: 16 }}>🌍 High-Demand Export Commodities</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16, marginBottom: 28 }}>
            {EXPORT_CROPS.map((c) => (
              <div key={c.name} className="card" style={{ padding: "20px 22px", borderColor: "rgba(56,189,248,0.1)" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>{c.flag}</div>
                <div style={{ fontWeight: 800, color: "#fff", fontSize: 16, marginBottom: 4 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 12 }}>Grade: {c.grade}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "var(--text2)" }}>Destinations</span>
                    <span style={{ color: "#38bdf8", fontWeight: 600 }}>{c.destination}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "var(--text2)" }}>Min Quantity</span>
                    <span style={{ color: "#fff", fontWeight: 600 }}>{c.minQty}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "var(--text2)" }}>Export Price</span>
                    <span style={{ color: "#4ade80", fontWeight: 800, fontSize: 15 }}>{c.price}</span>
                  </div>
                </div>
                <button className="btn-ghost" style={{ width: "100%", justifyContent: "center", marginTop: 14, fontSize: 13 }}
                  onClick={() => { setShowCreate(true); }}>
                  📩 List this Produce
                </button>
              </div>
            ))}
          </div>

          {/* Divider before farmer listings preview */}
          <div style={{ padding: "14px 20px", borderRadius: 14, background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 700, color: "#4ade80", marginBottom: 2 }}>🌾 Ready to Export Your Produce?</div>
              <div style={{ fontSize: 13, color: "var(--text2)" }}>List your produce and connect directly with international exporters.</div>
            </div>
            <button className="btn-green" style={{ fontSize: 13, whiteSpace: "nowrap" }} onClick={() => { setShowCreate(true); }}>
              + List Produce for Export
            </button>
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-title" style={{ marginBottom: 20 }}>📋 How to Start Exporting — Step by Step</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {STEPS.map((s) => (
                <div key={s.step} style={{ display: "flex", gap: 16, padding: "16px 20px", background: "var(--surface)", borderRadius: 14, border: "1px solid var(--border)" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: 11, color: "#38bdf8", fontWeight: 700, marginBottom: 4 }}>STEP {s.step}</div>
                    <div style={{ fontWeight: 700, color: "#fff", marginBottom: 4 }}>{s.title}</div>
                    <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>🔗 Useful Government Portals</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
              {GOVT_LINKS.map(([name, url, desc]) => (
                <a key={name} href={url} target="_blank" rel="noreferrer"
                  style={{ padding: "16px", background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)", textDecoration: "none", transition: "border-color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(56,189,248,0.3)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
                >
                  <div style={{ fontWeight: 700, color: "#38bdf8", marginBottom: 4 }}>{name} ↗</div>
                  <div style={{ fontSize: 12, color: "var(--text2)" }}>{desc}</div>
                </a>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB: MY EXPORT LISTINGS
      ═══════════════════════════════════════════════════════════════ */}
      {tab === "listings" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>My Export Listings ({listings.length})</div>
            <button className="btn-green" style={{ fontSize: 13 }} onClick={() => setShowCreate(true)}>+ New Listing</button>
          </div>

          {loadL ? (
            <div className="loading-wrap"><div className="spinner" /><span>Loading listings…</span></div>
          ) : listings.length === 0 ? (
            <Empty emoji="📦" title="No export listings yet" sub="Click '+ New Listing' to list your produce for international buyers." />
          ) : (
            <div className="listing-grid">
              {listings.map(l => (
                <div key={l._id} className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "#fff" }}>{l.name}</div>
                    <SBadge status={l.exportStatus || "available"} />
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text2)" }}>📍 {l.location}</div>
                  {[
                    ["Grade",      l.exportGrade || "—"],
                    ["Quantity",   `${l.exportQuantity} ${l.exportUnit}`],
                    ["Price",      l.expectedExportPrice ? fmt(l.expectedExportPrice) + `/${l.exportUnit}` : "—"],
                    ["Destination",l.preferredDestination || "Open"],
                    ["Available",  l.availableFrom ? new Date(l.availableFrom).toLocaleDateString("en-IN",{month:"short",year:"numeric"}) : "—"],
                  ].map(([k,v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: "var(--text2)" }}>{k}</span>
                      <span style={{ color: "#fff", fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                  {(l._pendingInterests > 0) && (
                    <div style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)", fontSize: 12, color: "#fbbf24", fontWeight: 600 }}>
                      📩 {l._pendingInterests} pending interest{l._pendingInterests > 1 ? "s" : ""}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <button className="btn-ghost" style={{ flex: 1, justifyContent: "center", fontSize: 12 }} onClick={() => setEditTarget(l)}>✏️ Edit</button>
                    {deleteConfirmId === l._id ? (
                      <>
                        <button
                          style={{ flex: 1, padding: "8px", borderRadius: 10, background: "rgba(239,68,68,0.18)", border: "1px solid rgba(239,68,68,0.35)", color: "#f87171", fontWeight: 700, fontSize: 12, cursor: "pointer" }}
                          onClick={() => deleteListing(l._id)}
                        >Yes, Remove</button>
                        <button
                          style={{ flex: 1, padding: "8px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text2)", fontWeight: 600, fontSize: 12, cursor: "pointer" }}
                          onClick={() => setDeleteConfirmId(null)}
                        >Cancel</button>
                      </>
                    ) : (
                      <button className="btn-ghost" style={{ flex: 1, justifyContent: "center", fontSize: 12, color: "#f87171", borderColor: "rgba(239,68,68,0.2)" }} onClick={() => setDeleteConfirmId(l._id)}>🗑 Remove</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB: INTEREST REQUESTS
      ═══════════════════════════════════════════════════════════════ */}
      {tab === "interests" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Export Interest Requests ({interests.length})</div>
          </div>

          {loadI ? (
            <div className="loading-wrap"><div className="spinner" /><span>Loading requests…</span></div>
          ) : interests.length === 0 ? (
            <Empty emoji="📩" title="No interest requests yet" sub="When exporters express interest in your listings, they will appear here." />
          ) : (
            <div className="interest-list">
              {interests.map(i => {
                const exp = i.exporter || {};
                const lst = i.listing  || {};
                return (
                  <div key={i._id} className="icard">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>{exp.name || "Exporter"}</div>
                        <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>📍 {exp.location || exp.state || "—"}</div>
                      </div>
                      <SBadge status={i.status} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                      {[
                        ["Crop",        lst.name || "—"],
                        ["Requested",   `${i.requestedQty} ${i.requestedUnit || "MT"}`],
                        ["Offered",     fmt(i.offeredPrice) + `/${i.requestedUnit || "MT"}`],
                        ["Destination", i.destination || "—"],
                      ].map(([k, v]) => (
                        <div key={k} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "8px 12px" }}>
                          <div style={{ fontSize: 10, color: "var(--text2)", textTransform: "uppercase", marginBottom: 2 }}>{k}</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    {i.message && (
                      <div style={{ fontSize: 12, color: "var(--text2)", fontStyle: "italic", marginBottom: 12, padding: "8px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
                        "{i.message}"
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 10 }}>
                      {new Date(i.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                    <button className="btn-green" style={{ width: "100%", justifyContent: "center", fontSize: 13 }} onClick={() => setViewInterest(i)}>
                      {i.status === "pending" ? "📩 View & Respond" : "👁 View Details"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </>
  );
}
