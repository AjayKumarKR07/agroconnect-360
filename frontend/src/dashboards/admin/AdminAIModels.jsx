import { DS_ADMIN } from "./adminStyles";

const AI_FEATURES = [
  {
    emoji: "🔬",
    name: "Crop Disease Diagnosis",
    provider: "Google Gemini Vision",
    route: "/api/diagnosis",
    status: "active",
    description: "Farmers upload crop images; Gemini Vision classifies disease, suggests treatment, and stores results per-crop.",
    stats: "Available to all farmers · Integrated in Farmer Dashboard",
  },
  {
    emoji: "🤖",
    name: "AI Farm Assistant",
    provider: "Google Gemini 1.5 Flash",
    route: "/api/assistant",
    status: "active",
    description: "Context-aware agricultural chatbot with farmer profile, crop, and order context injected into each Gemini call.",
    stats: "Available in Farmer Portal · Conversational memory per session",
  },
  {
    emoji: "🌱",
    name: "Smart Farm Plan Generator",
    provider: "Google Gemini",
    route: "/api/farmer/smart-farm-plan",
    status: "active",
    description: "Generates full season-specific AI farming plans including fertilizer schedule, pest management, and market timing. Saved to MongoDB per farmer.",
    stats: "Plans stored in SmartFarmPlan collection · Per farmer history",
  },
  {
    emoji: "📊",
    name: "Market Price Intelligence",
    provider: "Data.gov.in API + Mandi Catalog",
    route: "/api/prices",
    status: "active",
    description: "Real-time mandi rates from government data. Syncs to MandiCatalog collection. Used for price trend charts and crop valuation.",
    stats: "Government data source · MandiCatalogSyncStatus tracked",
  },
];

const FUTURE_FEATURES = [
  {
    emoji: "🌍",
    name: "Export Demand Forecasting",
    description: "Predict which crops will see international buyer demand based on historical RFQ patterns. Not yet implemented.",
  },
  {
    emoji: "📈",
    name: "AI-Powered Price Prediction",
    description: "Use crop lifecycle, weather, and market data to predict price 4-8 weeks ahead. Not yet implemented.",
  },
  {
    emoji: "🛡️",
    name: "Fraud Detection (Listings)",
    description: "Flag suspicious crop listings with duplicate images or inflated prices. Not yet implemented.",
  },
];

export default function AdminAIModels() {
  return (
    <>
      <style>{DS_ADMIN}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Artificial Intelligence — Platform Integration Status</div>
          <h1 className="pg-title">🤖 AI Models &amp; Services</h1>
          <p className="pg-sub">Overview of all AI features integrated into AgroConnect 360. No simulated model metrics — only real integrations are listed.</p>
        </div>
      </div>

      {/* Info Banner */}
      <div style={{ marginBottom: 24, padding: "14px 18px", background: "rgba(99,102,241,0.08)", borderRadius: 14, border: "1px solid rgba(99,102,241,0.2)", fontSize: 13, color: "#a5b4fc" }}>
        💡 <strong style={{ color: "#c7d2fe" }}>Transparency Notice:</strong> AgroConnect 360 does not run proprietary ML models internally. AI capabilities are powered by external APIs (Google Gemini, Data.gov.in). Model performance metrics such as accuracy, loss curves, and training runs are <strong style={{ color: "#c7d2fe" }}>not available</strong> as this platform does not host or train its own models.
      </div>

      {/* Active AI Features */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title" style={{ marginBottom: 18 }}>✅ Active AI Integrations</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {AI_FEATURES.map((feat) => (
            <div key={feat.name} style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: "16px 18px", background: "rgba(34,197,94,0.04)", borderRadius: 14, border: "1px solid rgba(34,197,94,0.12)" }}>
              <span style={{ fontSize: 28, flexShrink: 0, marginTop: 2 }}>{feat.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                  <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 16, fontWeight: 800, color: "#fff" }}>{feat.name}</span>
                  <span style={{ fontSize: 11, padding: "2px 9px", borderRadius: 6, background: "rgba(34,197,94,0.15)", color: "#4ade80", fontWeight: 800 }}>● ACTIVE</span>
                  <span style={{ fontSize: 11, padding: "2px 9px", borderRadius: 6, background: "rgba(99,102,241,0.12)", color: "#c7d2fe", fontWeight: 700 }}>{feat.provider}</span>
                </div>
                <p style={{ fontSize: 13, color: "#a5b4fc", margin: 0, marginBottom: 8, lineHeight: 1.6 }}>{feat.description}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: "#818cf8", fontFamily: "monospace" }}>{feat.route}</span>
                  <span style={{ fontSize: 12, color: "#a5b4fc" }}>{feat.stats}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Future Features Roadmap */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: 18 }}>🗺️ Future AI Roadmap (Not Yet Implemented)</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {FUTURE_FEATURES.map((f) => (
            <div key={f.name} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "14px 16px", background: "rgba(99,102,241,0.04)", borderRadius: 14, border: "1px solid rgba(99,102,241,0.1)", opacity: 0.7 }}>
              <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{f.emoji}</span>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <span style={{ fontWeight: 800, color: "#a5b4fc", fontSize: 14 }}>{f.name}</span>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: "rgba(251,191,36,0.1)", color: "#fbbf24", fontWeight: 800 }}>PLANNED</span>
                </div>
                <p style={{ fontSize: 13, color: "#818cf8", margin: 0, lineHeight: 1.5 }}>{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
