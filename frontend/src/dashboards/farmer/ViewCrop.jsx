import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_URL } from "../../config/api";
import { DS } from "../../styles/ds";

export default function ViewCrop() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [crop, setCrop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("agroconnect_token");
    fetch(`${API_URL}/api/crops/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.crop) setCrop(d.crop); else setError(d.message || "Unable to load crop"); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const statusBadge = (s) => {
    const map = { available: "badge-green", sold: "badge-red", inactive: "badge-amber" };
    return <span className={`badge ${map[s] || "badge-amber"}`}>● {s}</span>;
  };

  return (
    <>
      <style>{DS}</style>

      <button onClick={() => navigate("/farmer/crops")} className="btn-ghost" style={{ marginBottom: 24, fontSize: 13 }}>← Back to My Crops</button>

      {loading && <div className="loading-wrap"><div className="spinner" /><span>Loading crop details…</span></div>}
      {error && <div className="alert-error">⚠️ {error}</div>}

      {crop && (
        <div style={{ maxWidth: 900, display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Hero card */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {crop.image?.url ? (
              <div style={{ height: 320, overflow: "hidden" }}>
                <img src={crop.image.url} alt={crop.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ) : (
              <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(34,197,94,0.05)", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 80 }}>🌿</span>
              </div>
            )}

            <div style={{ padding: "28px 32px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
                <div>
                  {statusBadge(crop.status)}
                  <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 36, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", marginTop: 10 }}>{crop.name}</h1>
                  <div style={{ color: "var(--text2)", marginTop: 4 }}>{crop.category}</div>
                </div>
                <button onClick={() => navigate(`/farmer/crops/${crop._id}/edit`)} className="btn-green">✏️ Edit Crop</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
                {[
                  ["📦", "Quantity",   `${crop.quantity} ${crop.unit}`],
                  ["💰", "Price",      `₹${crop.price}/${crop.unit}`],
                  ["📍", "Location",   crop.location],
                  ["📅", "Sowing",     crop.sowingDate ? new Date(crop.sowingDate).toLocaleDateString("en-IN") : "—"],
                  ["🌾", "Harvest",    crop.harvestDate ? new Date(crop.harvestDate).toLocaleDateString("en-IN") : "—"],
                  ["📊", "Listed On",  new Date(crop.createdAt).toLocaleDateString("en-IN")],
                ].map(([icon, label, val]) => (
                  <div key={label} style={{ background: "var(--surface)", borderRadius: 14, padding: "16px 18px", border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 18, marginBottom: 6 }}>{icon}</div>
                    <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginTop: 3 }}>{val}</div>
                  </div>
                ))}
              </div>

              {crop.description && (
                <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Description</div>
                  <p style={{ fontSize: 15, color: "var(--text)", lineHeight: 1.8 }}>{crop.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Action card */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>⚡ Quick Actions</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button onClick={() => navigate(`/farmer/crops/${crop._id}/edit`)} className="btn-green">✏️ Edit Listing</button>
              <button onClick={() => navigate("/farmer/disease-detection")} className="btn-ghost" style={{ color: "#a78bfa", borderColor: "rgba(167,139,250,0.2)" }}>🔬 Diagnose Disease</button>
              <button onClick={() => navigate("/farmer/price-prediction")} className="btn-ghost" style={{ color: "#38bdf8", borderColor: "rgba(56,189,248,0.2)" }}>📈 Check Prices</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}