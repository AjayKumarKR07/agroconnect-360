import { useState, useEffect, useCallback } from "react";
import { API_URL } from "../../config/api";

/* ── Exporter design tokens (matching ExporterLayout) ──────────────── */
const DSX = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
  .pg-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:16px;flex-wrap:wrap;}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#f59e0b;margin-bottom:6px;}
  .pg-title{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:800;color:#fff;line-height:1.2;}
  .pg-sub{font-size:14px;color:var(--text2);margin-top:6px;}
  .card{background:rgba(245,158,11,0.04);border:1px solid rgba(245,158,11,0.12);border-radius:18px;padding:20px 22px;}
  .btn-gold{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:12px;background:linear-gradient(135deg,#d97706,#f59e0b);color:#fff;font-weight:700;font-size:14px;border:none;cursor:pointer;font-family:'Inter',sans-serif;transition:opacity 0.18s;}
  .btn-gold:hover{opacity:0.88;}
  .btn-ghost{display:inline-flex;align-items:center;gap:8px;padding:9px 16px;border-radius:10px;border:1px solid rgba(245,158,11,0.2);background:rgba(245,158,11,0.06);color:#fef08a;font-weight:600;font-size:13px;cursor:pointer;font-family:'Inter',sans-serif;transition:all 0.18s;}
  .btn-ghost:hover{border-color:rgba(245,158,11,0.4);background:rgba(245,158,11,0.12);}
  .field-input{width:100%;padding:10px 14px;border-radius:11px;border:1px solid rgba(245,158,11,0.18);background:rgba(245,158,11,0.05);color:#fff;font-size:14px;font-family:'Inter',sans-serif;outline:none;box-sizing:border-box;}
  .field-input:focus{border-color:rgba(245,158,11,0.4);}
  select.field-input option, .field-input option{background:#1a1206;color:#fff;}
  .field-label{display:block;font-size:12px;font-weight:700;color:#a38a5d;margin-bottom:5px;}

  .badge{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:6px;font-size:11px;font-weight:600;}
  .badge-gold{background:rgba(245,158,11,0.15);color:#fbbf24;border:1px solid rgba(245,158,11,0.25);}
  .badge-green{background:rgba(34,197,94,0.12);color:#4ade80;border:1px solid rgba(34,197,94,0.2);}
  .badge-red{background:rgba(239,68,68,0.12);color:#f87171;border:1px solid rgba(239,68,68,0.2);}

  .toast{position:fixed;bottom:28px;right:28px;background:rgba(34,197,94,0.14);border:1px solid rgba(34,197,94,0.3);color:#4ade80;padding:12px 20px;border-radius:12px;font-size:14px;font-weight:600;z-index:99999;backdrop-filter:blur(12px);animation:slideUp 0.3s ease;}
  @keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}

  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.78);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(8px);}
  .modal-box{background:#1a1206;border:1px solid rgba(245,158,11,0.25);border-radius:24px;padding:28px;width:100%;max-height:90vh;overflow-y:auto;animation:fadeIn 0.2s ease;}
  @keyframes fadeIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
  .modal-title{font-family:'Space Grotesk',sans-serif;font-size:20px;font-weight:800;color:#fff;margin-bottom:4px;}
  .modal-sub{font-size:13px;color:#a38a5d;margin-bottom:20px;}

  .listing-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:18px;}
  @media(max-width:640px){.listing-grid{grid-template-columns:1fr;}}

  .lcard{background:rgba(245,158,11,0.04);border:1px solid rgba(245,158,11,0.12);border-radius:18px;padding:20px;display:flex;flex-direction:column;gap:10px;transition:border-color 0.2s,transform 0.2s;}
  .lcard:hover{border-color:rgba(245,158,11,0.3);transform:translateY(-2px);}

  .filter-bar{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;align-items:flex-end;}
  .filter-item{display:flex;flex-direction:column;gap:4px;min-width:160px;flex:1;}
`;

const DESTINATIONS = ["UAE","USA","UK","Saudi Arabia","Germany","Netherlands","Singapore","Malaysia","China","Bangladesh","Sri Lanka","Other"];

const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("agroconnect_token")}`, "Content-Type": "application/json" });
const fmt   = (n) => n != null ? `₹${Number(n).toLocaleString("en-IN")}` : "—";

/* ═══════════════════════════════════════════════════════════════════
   INTEREST MODAL
═══════════════════════════════════════════════════════════════════ */
function InterestModal({ listing, onClose, onSubmitted }) {
  const [form, setForm] = useState({
    requestedQty: "",
    offeredPrice: listing.expectedExportPrice || "",
    destination:  listing.preferredDestination || "",
    message:      "",
  });
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState("");

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.requestedQty || Number(form.requestedQty) <= 0) return setErr("Requested quantity must be > 0");
    if (!form.offeredPrice || Number(form.offeredPrice) < 0)  return setErr("Offered price required");
    setErr(""); setSaving(true);
    try {
      const r = await fetch(`${API_URL}/api/export/interests`, {
        method: "POST", headers: authH(),
        body: JSON.stringify({ listingId: listing._id, ...form, requestedQty: Number(form.requestedQty), offeredPrice: Number(form.offeredPrice) }),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.message);
      onSubmitted(d.interest);
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 480 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <div className="modal-title">📩 Express Interest</div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, color: "#a38a5d", cursor: "pointer", width: 30, height: 30, fontSize: 18 }}>×</button>
        </div>
        <div className="modal-sub">
          {listing.name} · {listing.exportGrade || "—"} · {listing.location}
        </div>

        {/* Listing summary */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
          {[
            ["Farmer",    listing.farmer?.name || "—"],
            ["Available", `${listing.exportQuantity} ${listing.exportUnit}`],
            ["Asking",    listing.expectedExportPrice ? `${fmt(listing.expectedExportPrice)}/${listing.exportUnit}` : "Negotiable"],
            ["Destination", listing.preferredDestination || "Open"],
          ].map(([k, v]) => (
            <div key={k} style={{ background: "rgba(245,158,11,0.06)", borderRadius: 8, padding: "8px 12px" }}>
              <div style={{ fontSize: 10, color: "#a38a5d", textTransform: "uppercase", marginBottom: 2 }}>{k}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{v}</div>
            </div>
          ))}
        </div>

        {err && <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", marginBottom: 14, fontSize: 13 }}>⚠️ {err}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label className="field-label">Requested Qty ({listing.exportUnit || "MT"}) *</label>
                <input className="field-input" type="number" min="0.1" step="0.1" required value={form.requestedQty} onChange={e => f("requestedQty", e.target.value)} placeholder={`Max ${listing.exportQuantity}`} />
              </div>
              <div>
                <label className="field-label">Offered Price (₹/{listing.exportUnit || "MT"}) *</label>
                <input className="field-input" type="number" min="0" required value={form.offeredPrice} onChange={e => f("offeredPrice", e.target.value)} placeholder="Your offered price" />
              </div>
            </div>
            <div>
              <label className="field-label">Preferred Destination</label>
              <select className="field-input" value={form.destination} onChange={e => f("destination", e.target.value)}>
                <option value="">Select…</option>
                {DESTINATIONS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Message to Farmer (optional)</label>
              <textarea className="field-input" rows={3} style={{ resize: "none" }} placeholder="Introduce yourself, mention your trade experience, requirements…" value={form.message} onChange={e => f("message", e.target.value)} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-gold" style={{ flex: 2, justifyContent: "center" }} disabled={saving}>
              {saving ? "⏳ Sending…" : "📩 Send Interest"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Detail Modal ────────────────────────────────────────────────── */
function DetailModal({ listing, onClose, onExpress }) {
  const f = listing;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 500 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div className="modal-title" style={{ fontSize: 18 }}>{f.name}</div>
            <div style={{ fontSize: 12, color: "#fbbf24", fontWeight: 700, marginTop: 2 }}>{f.exportGrade || "—"}</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, color: "#a38a5d", cursor: "pointer", width: 30, height: 30, fontSize: 18 }}>×</button>
        </div>
        {[
          ["Farmer",        f.farmer?.name || "—"],
          ["Location",      f.location || "—"],
          ["Quantity",      `${f.exportQuantity} ${f.exportUnit}`],
          ["Grade",         f.exportGrade || "—"],
          ["Expected Price",f.expectedExportPrice ? `${fmt(f.expectedExportPrice)}/${f.exportUnit}` : "Negotiable"],
          ["Available From",f.availableFrom ? new Date(f.availableFrom).toLocaleDateString("en-IN",{month:"long",year:"numeric"}) : "—"],
          ["Destination",   f.preferredDestination || "Open / Negotiable"],
          ["Listed On",     new Date(f.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(245,158,11,0.1)", fontSize: 13 }}>
            <span style={{ color: "#a38a5d" }}>{k}</span>
            <span style={{ color: "#fff", fontWeight: 600, maxWidth: "60%", textAlign: "right" }}>{v}</span>
          </div>
        ))}
        {f.description && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(245,158,11,0.05)", borderRadius: 10, fontSize: 13, color: "#a38a5d", lineHeight: 1.6 }}>
            {f.description}
          </div>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button className="btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={onClose}>Close</button>
          <button className="btn-gold" style={{ flex: 2, justifyContent: "center" }} onClick={() => { onClose(); onExpress(listing); }}>
            📩 Express Interest
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */
export default function ExportSourcing() {
  const [listings,  setListings]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [toast,     setToast]     = useState("");
  const [interestTarget, setInterestTarget] = useState(null);
  const [detailTarget,   setDetailTarget]   = useState(null);

  // Filters
  const [search,   setSearch]   = useState("");
  const [location, setLocation] = useState("");
  const [grade,    setGrade]    = useState("");
  const [dest,     setDest]     = useState("");
  const [sort,     setSort]     = useState("newest");

  // My interests (to mark already-expressed)
  const [myInterestListingIds, setMyInterestListingIds] = useState(new Set());

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const loadListings = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams();
      if (search)   params.set("crop",        search);
      if (location) params.set("location",    location);
      if (grade)    params.set("grade",       grade);
      if (dest)     params.set("destination", dest);
      if (sort)     params.set("sort",        sort);
      const r = await fetch(`${API_URL}/api/export/listings?${params}`, { headers: authH() });
      const d = await r.json();
      if (!d.success) throw new Error(d.message);
      setListings(d.listings || []);
    } catch (e) { setError(e.message || "Failed to load listings"); }
    finally { setLoading(false); }
  }, [search, location, grade, dest, sort]);

  const loadMyInterests = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/api/export/exporter/interests`, { headers: authH() });
      const d = await r.json();
      if (d.success) {
        const active = new Set(
          (d.interests || [])
            .filter(i => ["pending","accepted","negotiating"].includes(i.status))
            .map(i => i.listing?._id || i.listing)
        );
        setMyInterestListingIds(active);
      }
    } catch {}
  }, []);

  useEffect(() => { loadListings(); }, [loadListings]);
  useEffect(() => { loadMyInterests(); }, [loadMyInterests]);

  const onInterestSubmitted = (interest) => {
    const listingId = interest.listing?._id || interest.listing;
    setMyInterestListingIds(prev => new Set([...prev, listingId]));
    setInterestTarget(null);
    showToast("✅ Interest submitted! The farmer will be notified.");
    loadMyInterests();
  };

  return (
    <>
      <style>{DSX}</style>
      {toast && <div className="toast">{toast}</div>}
      {detailTarget   && <DetailModal   listing={detailTarget}   onClose={() => setDetailTarget(null)}   onExpress={l => setInterestTarget(l)} />}
      {interestTarget && <InterestModal listing={interestTarget} onClose={() => setInterestTarget(null)} onSubmitted={onInterestSubmitted} />}

      <div className="pg-head">
        <div>
          <div className="eyebrow">Direct Farmer Marketplace</div>
          <h1 className="pg-title">🌾 Available Farmer Produce</h1>
          <p className="pg-sub">Browse export-ready produce listed directly by Indian farmers. Express interest to connect.</p>
        </div>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: "#fbbf24" }}>
          {listings.length} Listing{listings.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────────── */}
      <div className="filter-bar">
        <div className="filter-item">
          <label className="field-label">Search Crop</label>
          <input className="field-input" placeholder="e.g. Mango, Rice, Onion…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="filter-item" style={{ minWidth: 130 }}>
          <label className="field-label">Location</label>
          <input className="field-input" placeholder="State / District" value={location} onChange={e => setLocation(e.target.value)} />
        </div>
        <div className="filter-item" style={{ minWidth: 130 }}>
          <label className="field-label">Grade</label>
          <input className="field-input" placeholder="Export Grade…" value={grade} onChange={e => setGrade(e.target.value)} />
        </div>
        <div className="filter-item" style={{ minWidth: 140 }}>
          <label className="field-label">Destination</label>
          <select className="field-input" value={dest} onChange={e => setDest(e.target.value)}>
            <option value="">All destinations</option>
            {DESTINATIONS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div className="filter-item" style={{ minWidth: 140 }}>
          <label className="field-label">Sort By</label>
          <select className="field-input" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="qty_high">Highest Quantity</option>
            <option value="qty_low">Lowest Quantity</option>
            <option value="price">Price (Low to High)</option>
          </select>
        </div>
        {(search || location || grade || dest) && (
          <button className="btn-ghost" style={{ alignSelf: "flex-end" }}
            onClick={() => { setSearch(""); setLocation(""); setGrade(""); setDest(""); }}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* ── Error ────────────────────────────────────────────────────── */}
      {error && (
        <div style={{ padding: "12px 18px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, color: "#f87171", marginBottom: 20 }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── Loading ───────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#a38a5d" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          Loading farmer listings…
        </div>
      ) : listings.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌾</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 8 }}>No export listings found</div>
          <div style={{ fontSize: 14, color: "#a38a5d" }}>
            {search || location || grade || dest
              ? "Try adjusting your search filters."
              : "Farmers haven't listed any export produce yet. Check back soon."}
          </div>
        </div>
      ) : (
        <div className="listing-grid">
          {listings.map(l => {
            const alreadyExpressed = myInterestListingIds.has(l._id);
            return (
              <div key={l._id} className="lcard">
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 16, fontWeight: 800, color: "#fff" }}>{l.name}</div>
                  <span className="badge badge-gold">{l.exportGrade || "Export Ready"}</span>
                </div>

                <div style={{ fontSize: 12, color: "#a38a5d" }}>📍 {l.location}</div>
                <div style={{ fontSize: 12, color: "#a38a5d" }}>🌾 Farmer: <strong style={{ color: "#fff" }}>{l.farmer?.name || "Verified Farmer"}</strong></div>

                {/* Stats */}
                <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(0,0,0,0.2)", padding: "10px 14px", borderRadius: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: "#a38a5d", textTransform: "uppercase" }}>Quantity</div>
                    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 800, color: "#fff" }}>
                      {l.exportQuantity} <span style={{ fontSize: 12, color: "#a38a5d" }}>{l.exportUnit}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, color: "#a38a5d", textTransform: "uppercase" }}>Price</div>
                    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 800, color: "#f59e0b" }}>
                      {l.expectedExportPrice ? `${fmt(l.expectedExportPrice)}` : "Negotiate"}
                      {l.expectedExportPrice && <span style={{ fontSize: 11, color: "#a38a5d" }}>/{l.exportUnit}</span>}
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {l.preferredDestination && (
                    <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 6, background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)", color: "#38bdf8" }}>
                      🌍 {l.preferredDestination}
                    </span>
                  )}
                  {l.availableFrom && (
                    <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 6, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)", color: "#fbbf24" }}>
                      📅 {new Date(l.availableFrom).toLocaleDateString("en-IN",{month:"short",year:"numeric"})}
                    </span>
                  )}
                </div>

                {/* Action */}
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button className="btn-ghost" style={{ flex: 1, justifyContent: "center", fontSize: 12 }} onClick={() => setDetailTarget(l)}>
                    👁 View Details
                  </button>
                  {alreadyExpressed ? (
                    <button className="btn-ghost" style={{ flex: 1, justifyContent: "center", fontSize: 12, opacity: 0.55 }} disabled title="Already expressed interest">
                      ✓ Interest Sent
                    </button>
                  ) : (
                    <button className="btn-gold" style={{ flex: 1, justifyContent: "center", fontSize: 12 }} onClick={() => setInterestTarget(l)}>
                      📩 Express Interest
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
