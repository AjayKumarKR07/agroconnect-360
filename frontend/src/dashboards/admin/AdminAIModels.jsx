import { useState } from "react";

const DS_ADMIN = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
  .pg-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:16px;flex-wrap:wrap;}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#818cf8;margin-bottom:6px;}
  .pg-title{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:800;color:#fff;line-height:1.2;}
  .pg-sub{font-size:14px;color:#a5b4fc;margin-top:6px;}
  .card{background:rgba(99,102,241,0.04);border:1px solid rgba(99,102,241,0.12);border-radius:18px;padding:22px;}
  .btn-indigo{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:12px;background:linear-gradient(135deg,#4f46e5,#6366f1);color:#fff;font-weight:700;font-size:14px;border:none;cursor:pointer;font-family:'Inter',sans-serif;}
`;

const MODELS = [
  { id: "ml-1", name: "Plant Disease Classifier (ResNet-50)", dataset: "Kaggle PlantVillage (54k images)", accuracy: "98.4%", status: "DEPLOYED", version: "v2.4", color: "#4ade80" },
  { id: "ml-2", name: "APMC Price Forecasting (LSTM Neural)", dataset: "Agmarknet Historical Prices (10 Yrs)", accuracy: "94.8%", status: "DEPLOYED", version: "v1.8", color: "#4ade80" },
  { id: "ml-3", name: "Crop Yield Predictor (XGBoost)", dataset: "Kaggle India Crop Production", accuracy: "92.1%", status: "RETRAINING", version: "v3.0-beta", color: "#fbbf24" },
  { id: "ml-4", name: "Exporter Credit Risk Scoring", dataset: "Global Trade Credit Dataset", accuracy: "89.5%", status: "DEPLOYED", version: "v1.2", color: "#4ade80" },
];

export default function AdminAIModels() {
  const [models, setModels] = useState(MODELS);
  const [msg, setMsg] = useState("");

  const triggerRetrain = (id, name) => {
    setModels(prev => prev.map(m => m.id === id ? { ...m, status: "RETRAINING", color: "#fbbf24" } : m));
    setMsg(`⚡ Training pipeline triggered for ${name}! Syncing latest Kaggle dataset…`);
    setTimeout(() => {
      setModels(prev => prev.map(m => m.id === id ? { ...m, status: "DEPLOYED", color: "#4ade80" } : m));
      setMsg(`✅ Model ${name} successfully retrained and deployed!`);
      setTimeout(() => setMsg(""), 3000);
    }, 2500);
  };

  return (
    <>
      <style>{DS_ADMIN}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Machine Learning & Kaggle Pipeline Control</div>
          <h1 className="pg-title">🤖 AI Models & Dataset Registry</h1>
          <p className="pg-sub">Manage custom ML models trained on Kaggle agricultural datasets, retrain pipelines, and monitor prediction accuracy.</p>
        </div>
      </div>

      {msg && (
        <div style={{ marginBottom: 20, padding: "12px 18px", background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 14, color: "#c7d2fe", fontWeight: 700, fontSize: 14 }}>
          {msg}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18 }}>
        {models.map(m => (
          <div key={m.id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: `${m.color}20`, color: m.color, fontWeight: 800 }}>
                  ● {m.status}
                </span>
                <span style={{ fontSize: 12, color: "#a5b4fc", fontFamily: "monospace" }}>{m.version}</span>
              </div>

              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 4 }}>
                {m.name}
              </div>
              <div style={{ fontSize: 12, color: "#a5b4fc", marginBottom: 14 }}>
                Dataset: <strong style={{ color: "#fff" }}>{m.dataset}</strong>
              </div>

              <div style={{ background: "rgba(0,0,0,0.2)", padding: "12px 14px", borderRadius: 12, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, color: "#a5b4fc", textTransform: "uppercase" }}>Model Accuracy</div>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color: "#4ade80" }}>{m.accuracy}</div>
                </div>
                <span style={{ fontSize: 28 }}>📊</span>
              </div>
            </div>

            <button className="btn-indigo" style={{ width: "100%", justifyContent: "center" }} onClick={() => triggerRetrain(m.id, m.name)}>
              ⚡ Trigger Kaggle Retrain Pipeline
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
