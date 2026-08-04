import { useState, useEffect } from "react";
import { API_URL } from "../../config/api";

const DS_ADMIN = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
  .pg-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:16px;flex-wrap:wrap;}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#818cf8;margin-bottom:6px;}
  .pg-title{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:800;color:#fff;line-height:1.2;}
  .pg-sub{font-size:14px;color:#a5b4fc;margin-top:6px;}
  .card{background:rgba(99,102,241,0.04);border:1px solid rgba(99,102,241,0.12);border-radius:18px;padding:20px 22px;}
`;

const DEMO_CROPS = [
  { _id: "c1", name: "Fresh Tomatoes", farmerName: "Ajaykumar2005", price: 28, unit: "kg", quantity: 500, location: "Nashik, MH", status: "listed" },
  { _id: "c2", name: "Alphonso Mangoes", farmerName: "Ajaykumar2005", price: 200, unit: "kg", quantity: 50, location: "Ratnagiri, MH", status: "listed" },
  { _id: "c3", name: "Basmati Rice 1121", farmerName: "Ajaykumar2005", price: 85, unit: "kg", quantity: 200, location: "Karnal, HR", status: "listed" },
  { _id: "c4", name: "Raw Cotton (Unprocessed)", farmerName: "Suresh Singh", price: 65, unit: "kg", quantity: 1200, location: "Gujarat", status: "pending_review" },
];

export default function AdminCrops() {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("agroconnect_token");

  useEffect(() => {
    fetch(`${API_URL}/api/crops?status=listed`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setCrops(d.crops || DEMO_CROPS))
      .catch(() => setCrops(DEMO_CROPS))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = (id, newStatus) => {
    setCrops(prev => prev.map(c => c._id === id ? { ...c, status: newStatus } : c));
  };

  return (
    <>
      <style>{DS_ADMIN}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Catalog Moderation & Quality Inspection</div>
          <h1 className="pg-title">🌾 Crop Moderation & Approval Queue</h1>
          <p className="pg-sub">Approve or reject agricultural listings before they are published to the public marketplace.</p>
        </div>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: "#818cf8" }}>
          {crops.length} Listed Crops
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 18 }}>
        {crops.map(c => (
          <div key={c._id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: c.status === "listed" ? "rgba(34,197,94,0.15)" : "rgba(251,191,36,0.15)", color: c.status === "listed" ? "#4ade80" : "#fbbf24", fontWeight: 800 }}>
                  ● {c.status.toUpperCase()}
                </span>
                <span style={{ fontSize: 12, color: "#a5b4fc" }}>📍 {c.location}</span>
              </div>

              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 4 }}>
                {c.name}
              </div>
              <div style={{ fontSize: 12, color: "#a5b4fc", marginBottom: 12 }}>👨‍🌾 Farmer: <strong style={{ color: "#fff" }}>{c.farmerName || "Verified Farmer"}</strong></div>

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

            <div style={{ display: "flex", gap: 8 }}>
              {c.status !== "listed" && (
                <button onClick={() => updateStatus(c._id, "listed")}
                  style={{ flex: 1, padding: "8px", borderRadius: 10, border: "1px solid rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.12)", color: "#4ade80", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                  ✅ Approve
                </button>
              )}
              <button onClick={() => updateStatus(c._id, "rejected")}
                style={{ flex: 1, padding: "8px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#f87171", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                🚫 Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
