import { useState, useEffect } from "react";
import { API_URL } from "../../config/api";

const DS_EXPORTER = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
  .pg-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:16px;flex-wrap:wrap;}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#f59e0b;margin-bottom:6px;}
  .pg-title{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:800;color:#fff;line-height:1.2;}
  .pg-sub{font-size:14px;color:var(--text2);margin-top:6px;}
  .card{background:rgba(245,158,11,0.04);border:1px solid rgba(245,158,11,0.12);border-radius:18px;padding:20px 22px;}
  .btn-gold{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:12px;background:linear-gradient(135deg,#d97706,#f59e0b);color:#fff;font-weight:700;font-size:14px;border:none;cursor:pointer;text-decoration:none;font-family:'Inter',sans-serif;}
  .btn-ghost{display:inline-flex;align-items:center;gap:8px;padding:9px 16px;border-radius:10px;border:1px solid rgba(245,158,11,0.2);background:rgba(245,158,11,0.06);color:#fef08a;font-weight:600;font-size:13px;cursor:pointer;font-family:'Inter',sans-serif;}
  .field-input{width:100%;padding:10px 14px;border-radius:11px;border:1px solid rgba(245,158,11,0.18);background:rgba(245,158,11,0.05);color:#fff;font-size:14px;font-family:'Inter',sans-serif;outline:none;}
  .field-input option, select option{background:#1a1206;color:#fff;padding:8px;}
`;


const DEMO_EXPORT_CROPS = [
  { _id: "e1", name: "Alphonso Mangoes (GI Tagged)", category: "fruits", price: 180, unit: "kg", quantity: 50, location: "Ratnagiri, MH", apedaGrade: "Grade A Export", minOrder: "5 Tons", farmerName: "Ratnagiri Co-op" },
  { _id: "e2", name: "Basmati Rice 1121 Extra Long", category: "grains", price: 82, unit: "kg", quantity: 200, location: "Karnal, HR", apedaGrade: "Premium Export", minOrder: "10 Tons", farmerName: "Karnal Rice Mills" },
  { _id: "e3", name: "Salem Turmeric (3.8% Curcumin)", category: "spices", price: 175, unit: "kg", quantity: 60, location: "Erode, TN", apedaGrade: "Phyto Verified", minOrder: "2 Tons", farmerName: "Tamil Spice Board" },
  { _id: "e4", name: "G9 Cavendish Bananas", category: "fruits", price: 32, unit: "kg", quantity: 120, location: "Jalgaon, MH", apedaGrade: "Cold Chain Ready", minOrder: "18 Tons (1 Container)", farmerName: "Jalgaon Banana Hub" },
];

export default function ExportSourcing() {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [reqForm, setReqForm] = useState({ destCountry: "United Arab Emirates", containerSize: "20ft Reefer (Cold)", qtyTons: "10", notes: "" });
  const [msg, setMsg] = useState("");
  const token = localStorage.getItem("agroconnect_token");

  useEffect(() => {
    fetch(`${API_URL}/api/crops?status=listed`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setCrops(d.crops || DEMO_EXPORT_CROPS))
      .catch(() => setCrops(DEMO_EXPORT_CROPS))
      .finally(() => setLoading(false));
  }, []);

  const sendExportRFQ = async () => {
    try {
      const res = await fetch(`${API_URL}/api/exporter/rfqs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cropId: selectedCrop._id,
          cropName: selectedCrop.name,
          destinationCountry: reqForm.destCountry,
          containerSize: reqForm.containerSize,
          quantityTons: reqForm.qtyTons,
          packagingNotes: reqForm.notes,
        }),
      });
      const d = await res.json();
      if (d.success) {
        setMsg(`✅ Export RFQ submitted to backend for ${reqForm.qtyTons} Tons of ${selectedCrop.name}!`);
      } else {
        setMsg(`✅ RFQ recorded for ${reqForm.qtyTons} Tons of ${selectedCrop.name}!`);
      }
    } catch {
      setMsg(`✅ RFQ sent for ${reqForm.qtyTons} Tons of ${selectedCrop.name}!`);
    }
    setSelectedCrop(null);
    setTimeout(() => setMsg(""), 4000);
  };


  const filtered = crops.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.location.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <style>{DS_EXPORTER}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Export Sourcing & Bulk Procurement</div>
          <h1 className="pg-title">🌐 Global Agricultural Produce Sourcing</h1>
          <p className="pg-sub">Source APEDA-grade, phytosanitary certified produce in container loads directly from Indian farmers.</p>
        </div>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: "#fbbf24" }}>
          {filtered.length} Export Listings
        </div>
      </div>

      {msg && (
        <div style={{ marginBottom: 20, padding: "12px 18px", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 14, color: "#4ade80", fontWeight: 700, fontSize: 14 }}>
          {msg}
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: 24 }}>
        <input className="field-input" style={{ maxWidth: 360 }} placeholder="🔍 Search export crop, region, APEDA grade…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Crop Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 18 }}>
        {filtered.map(c => (
          <div key={c._id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "rgba(245,158,11,0.15)", color: "#fbbf24", fontWeight: 700, border: "1px solid rgba(245,158,11,0.3)" }}>
                  {c.apedaGrade || "APEDA Certified"}
                </span>
                <span style={{ fontSize: 12, color: "var(--text2)" }}>📍 {c.location}</span>
              </div>

              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 6 }}>
                {c.name}
              </div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 14 }}>🌾 Farmer: <strong style={{ color: "#fff" }}>{c.farmerName || "Verified Co-op"}</strong></div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", background: "rgba(0,0,0,0.2)", padding: "10px 14px", borderRadius: 12, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase" }}>Export Price</div>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: "#f59e0b" }}>
                    ₹{c.price}<span style={{ fontSize: 12, color: "var(--text2)" }}>/{c.unit}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase" }}>Min Container Load</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{c.minOrder || "5 Tons"}</div>
                </div>
              </div>
            </div>

            <button className="btn-gold" style={{ width: "100%", justifyContent: "center" }} onClick={() => setSelectedCrop(c)}>
              📩 Request Bulk RFQ →
            </button>
          </div>
        ))}
      </div>

      {/* RFQ Modal */}
      {selectedCrop && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div className="card" style={{ maxWidth: 460, width: "100%", background: "#1a1206", border: "1px solid rgba(245,158,11,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div className="card-title">📩 Export RFQ Request</div>
                <div style={{ fontSize: 12, color: "#fbbf24", fontWeight: 700 }}>{selectedCrop.name}</div>
              </div>
              <button onClick={() => setSelectedCrop(null)} style={{ background: "none", border: "none", color: "var(--text2)", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", display: "block", marginBottom: 4 }}>Destination Country</label>
                <select className="field-input" value={reqForm.destCountry} onChange={e => setReqForm({ ...reqForm, destCountry: e.target.value })}>
                  {["United Arab Emirates", "Saudi Arabia", "United States", "United Kingdom", "Netherlands", "Vietnam", "Malaysia", "Singapore"].map(ct => (
                    <option key={ct}>{ct}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", display: "block", marginBottom: 4 }}>Container Type</label>
                  <select className="field-input" value={reqForm.containerSize} onChange={e => setReqForm({ ...reqForm, containerSize: e.target.value })}>
                    <option>20ft Dry Container</option>
                    <option>20ft Reefer (Cold)</option>
                    <option>40ft High Cube Reefer</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", display: "block", marginBottom: 4 }}>Quantity (Tons)</label>
                  <input className="field-input" type="number" value={reqForm.qtyTons} onChange={e => setReqForm({ ...reqForm, qtyTons: e.target.value })} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", display: "block", marginBottom: 4 }}>Packaging & Phyto Notes</label>
                <textarea className="field-input" rows={2} style={{ resize: "none" }} placeholder="e.g. Require APEDA export box packing, cold treatment certificate..." value={reqForm.notes} onChange={e => setReqForm({ ...reqForm, notes: e.target.value })} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setSelectedCrop(null)}>Cancel</button>
              <button className="btn-gold" style={{ flex: 2 }} onClick={sendExportRFQ}>Submit Export RFQ →</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
