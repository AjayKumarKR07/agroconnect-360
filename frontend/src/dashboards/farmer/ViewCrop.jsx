import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_URL } from "../../config/api";
import { DS } from "../../styles/ds";

const LIFECYCLE_STAGES = [
  { key: "sowing",        label: "Sowing",        icon: "🌱", color: "#22c55e"  },
  { key: "growing",       label: "Growing",        icon: "🌿", color: "#16a34a"  },
  { key: "flowering",     label: "Flowering",      icon: "🌸", color: "#a78bfa"  },
  { key: "harvest_ready", label: "Harvest Ready",  icon: "🌾", color: "#fbbf24"  },
  { key: "harvested",     label: "Harvested",      icon: "🏆", color: "#fb923c"  },
  { key: "listed",        label: "Listed",         icon: "🛒", color: "#38bdf8"  },
  { key: "sold",          label: "Sold",           icon: "✅", color: "#4ade80"  },
];

// Map existing status → lifecycle stage (backward compat)
const statusToStage = s => {
  if (s === "ready")  return "harvest_ready";
  if (s === "listed") return "listed";
  if (s === "sold")   return "sold";
  return "growing";
};

function LifecycleTracker({ stage }) {
  const activeIdx = LIFECYCLE_STAGES.findIndex(s => s.key === stage);
  return (
    <div style={{ margin: "28px 0 0", paddingTop: 28, borderTop: "1px solid var(--border)" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 20 }}>
        🔄 Crop Lifecycle Stage
      </div>
      {/* Track */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 0 }}>
        {/* Connecting line */}
        <div style={{ position: "absolute", top: "50%", left: "4%", right: "4%", height: 2, background: "rgba(255,255,255,0.06)", transform: "translateY(-50%)", zIndex: 0 }} />
        {/* Progress fill */}
        <div style={{
          position: "absolute", top: "50%", left: "4%",
          width: activeIdx >= 0 ? `${(activeIdx / (LIFECYCLE_STAGES.length - 1)) * 92}%` : "0%",
          height: 2, background: "linear-gradient(90deg, #22c55e, #fbbf24)", transform: "translateY(-50%)", zIndex: 1, transition: "width 0.6s ease"
        }} />

        {LIFECYCLE_STAGES.map((s, i) => {
          const isDone    = i < activeIdx;
          const isActive  = i === activeIdx;
          const isFuture  = i > activeIdx;
          return (
            <div key={s.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, zIndex: 2 }}>
              <div style={{
                width: isActive ? 52 : 40, height: isActive ? 52 : 40, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: isActive ? 22 : 16,
                background: isActive ? s.color : isDone ? `${s.color}30` : "rgba(255,255,255,0.04)",
                border: `2px solid ${isActive ? s.color : isDone ? `${s.color}60` : "rgba(255,255,255,0.1)"}`,
                boxShadow: isActive ? `0 0 20px ${s.color}50` : "none",
                opacity: isFuture ? 0.4 : 1,
                transition: "all 0.3s ease",
              }}>
                {s.icon}
              </div>
              <div style={{ fontSize: 10, fontWeight: isActive ? 800 : 500, color: isActive ? s.color : isDone ? "#94a3b8" : "#64748b", textAlign: "center", lineHeight: 1.3 }}>
                {s.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ViewCrop() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [crop, setCrop]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [stageSaving, setStageSaving] = useState(false);
  const [stageSuccess, setStageSuccess] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("agroconnect_token");
    fetch(`${API_URL}/api/crops/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.crop) setCrop(d.crop); else setError(d.message || "Unable to load crop"); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const currentStage = crop?.lifecycleStage || statusToStage(crop?.status);

  const updateStage = async (newStage) => {
    setStageSaving(true); setStageSuccess("");
    try {
      const token = localStorage.getItem("agroconnect_token");
      const r = await fetch(`${API_URL}/api/crops/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ lifecycleStage: newStage }),
      });
      const d = await r.json();
      if (d.crop || d.success) {
        setCrop(p => ({ ...p, lifecycleStage: newStage }));
        setStageSuccess("✅ Lifecycle stage updated!");
        setTimeout(() => setStageSuccess(""), 3000);
      } else {
        setError(d.message || "Update failed");
      }
    } catch (e) { setError(e.message); }
    finally { setStageSaving(false); }
  };

  const statusBadge = (s) => {
    const map = { growing: "badge-green", ready: "badge-amber", listed: "badge-green", sold: "badge-red" };
    return <span className={`badge ${map[s] || "badge-amber"}`}>● {s}</span>;
  };

  return (
    <>
      <style>{DS + `
        .stage-btn { padding:8px 14px; border-radius:20px; border:1px solid var(--border); background:transparent; color:var(--text2); cursor:pointer; font-size:12px; font-weight:600; transition:all .2s; }
        .stage-btn:hover { border-color:rgba(34,197,94,0.3); color:#4ade80; }
        .stage-btn.active-stage { background:rgba(34,197,94,0.12); border-color:rgba(34,197,94,0.4); color:#4ade80; }
      `}</style>

      <button onClick={() => navigate("/farmer/crops")} className="btn-ghost" style={{ marginBottom: 24, fontSize: 13 }}>← Back to My Crops</button>

      {loading && <div className="loading-wrap"><div className="spinner" /><span>Loading crop details…</span></div>}
      {error   && <div className="alert-error">⚠️ {error}</div>}

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
                  ["📅", "Sowing",     crop.sowingDate  ? new Date(crop.sowingDate).toLocaleDateString("en-IN")  : "—"],
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

              {/* ── Lifecycle Tracker ── */}
              <LifecycleTracker stage={currentStage} />

              {/* Stage selector */}
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 10, fontWeight: 600 }}>Update Lifecycle Stage:</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {LIFECYCLE_STAGES.map(s => (
                    <button
                      key={s.key}
                      className={`stage-btn ${currentStage === s.key ? "active-stage" : ""}`}
                      onClick={() => updateStage(s.key)}
                      disabled={stageSaving || currentStage === s.key}
                    >
                      {s.icon} {s.label}
                    </button>
                  ))}
                </div>
                {stageSuccess && <div style={{ fontSize: 13, color: "#4ade80", marginTop: 10 }}>{stageSuccess}</div>}
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
              <button onClick={() => navigate("/farmer/smart-farm-planner")} className="btn-ghost" style={{ color: "#22c55e", borderColor: "rgba(34,197,94,0.2)" }}>🌾 Smart Planner</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
