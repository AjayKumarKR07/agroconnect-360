import { DS } from "../../styles/ds";
import { Link } from "react-router-dom";

const EXPORT_CROPS = [
  { name: "Basmati Rice", grade: "Grade A", destination: "Middle East, EU", minQty: "10 MT", price: "₹4,500/q", flag: "🌾" },
  { name: "Fresh Mango (Alphonso)", grade: "Export Grade", destination: "UK, USA, UAE", minQty: "5 MT", price: "₹12,000/q", flag: "🥭" },
  { name: "Onion (Red)", grade: "Medium / Large", destination: "Malaysia, SL", minQty: "20 MT", price: "₹1,800/q", flag: "🧅" },
  { name: "Turmeric (Finger)", grade: "4-5% Curcumin", destination: "USA, Germany", minQty: "5 MT", price: "₹9,000/q", flag: "🌿" },
  { name: "Chilli (S4 Dry)", grade: "AGMARK", destination: "China, Bangladesh", minQty: "10 MT", price: "₹15,000/q", flag: "🌶️" },
  { name: "Peanuts (Bold)", grade: "HPS 40/50", destination: "Indonesia, EU", minQty: "20 MT", price: "₹6,500/q", flag: "🥜" },
];

const STEPS = [
  { step: "01", icon: "📋", title: "Register with APEDA", desc: "Get Agri-Export code from Agricultural and Processed Food Products Export Development Authority." },
  { step: "02", icon: "🧪", title: "Quality Certification", desc: "Obtain Phytosanitary Certificate from State Agriculture Dept and FSSAI license for food products." },
  { step: "03", icon: "📦", title: "Packaging Standards", desc: "Pack in export-grade materials with proper labeling per destination country's norms." },
  { step: "04", icon: "🚢", title: "Shipping & Logistics", desc: "Connect with CHA (Customs House Agent) and freight forwarder for sea/air shipment." },
  { step: "05", icon: "💰", title: "Payment & Insurance", desc: "Use Letter of Credit (LC) or advance payment; insure cargo via ECGC." },
];

export default function Export() {
  return (
    <>
      <style>{DS}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Global Trade</div>
          <h1 className="pg-title">🚢 Export Your Produce</h1>
          <p className="pg-sub">Connect with international buyers and export your agricultural produce globally.</p>
        </div>
        <a href="https://apeda.gov.in" target="_blank" rel="noreferrer" className="btn-green" style={{ fontSize: 13 }}>📋 Register with APEDA</a>
      </div>

      {/* Export Opportunity Cards */}
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
            <button className="btn-ghost" style={{ width: "100%", justifyContent: "center", marginTop: 14, fontSize: 13 }}>
              📩 Express Interest
            </button>
          </div>
        ))}
      </div>

      {/* Export Steps */}
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

      {/* Government Links */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: 16 }}>🔗 Useful Government Portals</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
          {[
            ["APEDA", "https://apeda.gov.in", "Agricultural export registration"],
            ["DGFT", "https://dgft.gov.in", "Import-Export Code (IEC)"],
            ["FSSAI", "https://fssai.gov.in", "Food safety license"],
            ["ECGC", "https://ecgc.in", "Export credit guarantee"],
          ].map(([name, url, desc]) => (
            <a key={name} href={url} target="_blank" rel="noreferrer" style={{ padding: "16px", background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)", textDecoration: "none", transition: "border-color 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(56,189,248,0.3)"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}
            >
              <div style={{ fontWeight: 700, color: "#38bdf8", marginBottom: 4 }}>{name} ↗</div>
              <div style={{ fontSize: 12, color: "var(--text2)" }}>{desc}</div>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
