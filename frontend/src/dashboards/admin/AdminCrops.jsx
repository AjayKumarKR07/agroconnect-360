import { useState, useEffect } from "react";
import { API_URL } from "../../config/api";

const DS_ADMIN = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
  .pg-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:16px;flex-wrap:wrap;}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#818cf8;margin-bottom:6px;}
  .pg-title{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:800;color:#fff;line-height:1.2;}
  .pg-sub{font-size:14px;color:#a5b4fc;margin-top:6px;}
  .card{background:rgba(99,102,241,0.04);border:1px solid rgba(99,102,241,0.12);border-radius:18px;padding:20px 22px;}
  .tab-btn{padding:7px 16px;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;border:1px solid rgba(99,102,241,0.15);background:rgba(99,102,241,0.04);color:#a5b4fc;transition:all 0.2s;}
  .tab-btn.active{background:rgba(99,102,241,0.2);color:#fff;border-color:#6366f1;}
  .spinner{width:22px;height:22px;border:3px solid rgba(99,102,241,0.15);border-top-color:#818cf8;border-radius:50%;animation:spin 0.8s linear infinite;}
  @keyframes spin{to{transform:rotate(360deg)}}
  .loading-wrap{display:flex;align-items:center;justify-content:center;gap:12px;padding:60px 0;color:#a5b4fc;}
`;

const STATUS_FILTER = ["all", "growing", "ready", "listed", "sold"];

const STATUS_STYLE = {
  listed:  { bg: "rgba(34,197,94,0.15)",  color: "#4ade80"  },
  growing: { bg: "rgba(251,191,36,0.15)", color: "#fbbf24"  },
  ready:   { bg: "rgba(56,189,248,0.15)", color: "#38bdf8"  },
  sold:    { bg: "rgba(167,139,250,0.15)",color: "#a78bfa"  },
};

export default function AdminCrops() {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleting, setDeleting] = useState(null);
  const token = localStorage.getItem("agroconnect_token");

  const loadCrops = async (status) => {
    setLoading(true);
    try {
      const params = status && status !== "all" ? `?status=${status}` : "";
      const r = await fetch(`${API_URL}/api/admin/crops${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (d.success) setCrops(d.crops || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadCrops(statusFilter); }, [statusFilter]);

  const deleteCrop = async (id) => {
    if (!window.confirm("Delete this crop permanently?")) return;
    setDeleting(id);
    try {
      const r = await fetch(`${API_URL}/api/admin/crops/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (d.success) setCrops(prev => prev.filter(c => c._id !== id));
    } catch { alert("Failed to delete crop."); }
    finally { setDeleting(null); }
  };

  const stStyle = (s) => STATUS_STYLE[s] || { bg: "rgba(255,255,255,0.05)", color: "#a5b4fc" };

  return (
    <>
      <style>{DS_ADMIN}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Catalog Moderation & Quality Inspection</div>
          <h1 className="pg-title">🌾 Crop Moderation Queue</h1>
          <p className="pg-sub">View and remove agricultural listings across all farmers and sellers.</p>
        </div>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: "#818cf8" }}>
          {crops.length} Crops
        </div>
      </div>

      {/* Status filter */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
        {STATUS_FILTER.map(f => (
          <button key={f} className={`tab-btn ${statusFilter === f ? "active" : ""}`} onClick={() => setStatusFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading && <div className="loading-wrap"><div className="spinner" /><span>Loading crops…</span></div>}

      {!loading && crops.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🌾</div>
          <div style={{ color: "#fff", fontWeight: 700 }}>No crops found</div>
          <div style={{ color: "#a5b4fc", fontSize: 13, marginTop: 6 }}>No listings match the selected status.</div>
        </div>
      )}

      {!loading && crops.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 18 }}>
          {crops.map(c => {
            const ss = stStyle(c.status);
            return (
              <div key={c._id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: ss.bg, color: ss.color, fontWeight: 800 }}>
                      ● {(c.status || "unknown").toUpperCase()}
                    </span>
                    <span style={{ fontSize: 12, color: "#a5b4fc" }}>📍 {c.location || "—"}</span>
                  </div>

                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 4 }}>
                    {c.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#a5b4fc", marginBottom: 4 }}>
                    🏷️ {c.category || "—"}
                  </div>
                  <div style={{ fontSize: 12, color: "#a5b4fc", marginBottom: 12 }}>
                    👨‍🌾 <strong style={{ color: "#fff" }}>{c.farmerName || "Farmer"}</strong>
                    {c.farmerEmail && <span> · {c.farmerEmail}</span>}
                  </div>

                  <div style={{ background: "rgba(0,0,0,0.2)", padding: "10px 14px", borderRadius: 12, marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#a5b4fc", textTransform: "uppercase" }}>Price</div>
                      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 800, color: "#818cf8" }}>₹{c.price}/{c.unit}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: "#a5b4fc", textTransform: "uppercase" }}>Quantity</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{c.quantity} {c.unit}</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => deleteCrop(c._id)}
                  disabled={deleting === c._id}
                  style={{ width: "100%", padding: "9px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#f87171", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: deleting === c._id ? 0.5 : 1, fontFamily: "'Inter',sans-serif" }}
                >
                  {deleting === c._id ? "⏳ Deleting…" : "🗑️ Remove Listing"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
