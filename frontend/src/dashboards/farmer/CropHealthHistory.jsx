import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../../config/api";
import { DS } from "../../styles/ds";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("agroconnect_token")}`,
  "Content-Type": "application/json",
});

const SEV_COLOR = { low: "#4ade80", medium: "#fbbf24", high: "#f87171", critical: "#ef4444", unknown: "#94a3b8" };
const SEV_BG    = { low: "rgba(34,197,94,0.08)", medium: "rgba(251,191,36,0.08)", high: "rgba(239,68,68,0.08)", critical: "rgba(239,68,68,0.12)", unknown: "rgba(148,163,184,0.06)" };

export default function CropHealthHistory() {
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [selected, setSelected]   = useState(null);
  const [deleting, setDeleting]   = useState(null);

  const load = () => {
    setLoading(true);
    fetch(`${API_URL}/api/diagnosis/my`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => {
        if (d.diagnoses) setDiagnoses(d.diagnoses);
        else setError(d.message || "Unable to load diagnosis history");
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this diagnosis record?")) return;
    setDeleting(id);
    try {
      const r = await fetch(`${API_URL}/api/diagnosis/${id}`, { method: "DELETE", headers: authHeaders() });
      const d = await r.json();
      if (d.success) setDiagnoses(p => p.filter(x => x._id !== id));
      else setError(d.message || "Delete failed");
    } catch { setError("Delete failed"); }
    finally { setDeleting(null); }
  };

  const fmt = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "—");

  return (
    <>
      <style>{DS + `
        .chh-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:16px; }
        .chh-card { border-radius:16px; border:1px solid var(--border); background:var(--surface); padding:0; overflow:hidden; transition:border-color .2s,transform .2s; }
        .chh-card:hover { border-color:rgba(167,139,250,0.3); transform:translateY(-2px); }
        .chh-img { width:100%; height:140px; object-fit:cover; }
        .chh-img-placeholder { width:100%; height:140px; display:flex; align-items:center; justify-content:center; background:rgba(167,139,250,0.05); border-bottom:1px solid var(--border); font-size:48px; }
        .chh-body { padding:16px; }
        .chh-crop { font-size:16px; font-weight:700; color:#fff; margin-bottom:4px; }
        .chh-disease { font-size:13px; color:var(--text2); margin-bottom:10px; }
        .chh-meta { display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:12px; }
        .chh-sev { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; }
        .chh-date { font-size:11px; color:var(--text2); }
        .chh-actions { display:flex; gap:8px; }
        .chh-detail { background:var(--surface2); border:1px solid var(--border); border-radius:14px; padding:18px; margin-bottom:14px; }
        .chh-section-lbl { font-size:11px; font-weight:700; color:var(--text2); text-transform:uppercase; letter-spacing:.06em; margin-bottom:6px; }
        .chh-list-item { font-size:13px; color:var(--text); padding:4px 0; padding-left:12px; position:relative; }
        .chh-list-item::before { content:"•"; position:absolute; left:0; color:var(--text2); }
      `}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">AI Disease Detection</div>
          <h1 className="pg-title">🩺 Crop Health History</h1>
          <p className="pg-sub">Previous AI diagnosis results for your crops.</p>
        </div>
        <Link to="/farmer/disease-detection" className="btn-green">🔬 New Diagnosis</Link>
      </div>

      {error && <div className="alert-error">⚠️ {error}</div>}

      {loading ? (
        <div className="loading-wrap"><div className="spinner" /><span>Loading diagnosis history…</span></div>
      ) : diagnoses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-emoji">🩺</div>
          <div className="empty-title">No diagnoses yet</div>
          <div className="empty-sub">Run your first AI crop disease detection to see results here.</div>
          <Link to="/farmer/disease-detection" className="btn-green" style={{ marginTop: 16, display: "inline-flex" }}>🔬 Scan a Crop</Link>
        </div>
      ) : (
        <>
          {/* Summary bar */}
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            {[
              { label: "Total Scans",    value: diagnoses.length,                                                    color: "#a78bfa" },
              { label: "Diseases Found", value: diagnoses.filter(d => !d.isHealthy).length,                          color: "#f87171" },
              { label: "Healthy",        value: diagnoses.filter(d => d.isHealthy).length,                           color: "#4ade80" },
              { label: "High/Critical",  value: diagnoses.filter(d => ["high","critical"].includes(d.severity)).length, color: "#fb923c" },
            ].map(({ label, value, color }) => (
              <div key={label} className="stat-card" style={{ flex: "1 1 120px", minWidth: 120 }}>
                <div className="stat-glow" style={{ background: color }} />
                <div className="stat-val" style={{ fontSize: 22, color }}>{value}</div>
                <div className="stat-lbl">{label}</div>
              </div>
            ))}
          </div>

          <div className="chh-grid">
            {diagnoses.map(diag => (
              <div key={diag._id} className="chh-card">
                {diag.imageUrl
                  ? <img src={diag.imageUrl} alt={diag.cropName} className="chh-img" />
                  : <div className="chh-img-placeholder">🌿</div>
                }
                <div className="chh-body">
                  <div className="chh-crop">{diag.cropName}</div>
                  <div className="chh-disease">{diag.isHealthy ? "✅ Healthy" : `🦠 ${diag.disease}`}</div>

                  <div className="chh-meta">
                    {diag.severity && diag.severity !== "—" && (
                      <span className="chh-sev" style={{ background: SEV_BG[diag.severity] || SEV_BG.unknown, color: SEV_COLOR[diag.severity] || SEV_COLOR.unknown }}>
                        ● {fmt(diag.severity)} Severity
                      </span>
                    )}
                    {diag.confidence > 0 && (
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>
                        {Math.round(diag.confidence)}% confidence
                      </span>
                    )}
                    <span className="chh-date">{new Date(diag.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>

                  <div className="chh-actions">
                    <button
                      className="btn-ghost"
                      style={{ fontSize: 12, padding: "7px 14px", color: "#a78bfa", borderColor: "rgba(167,139,250,0.2)" }}
                      onClick={() => setSelected(selected?._id === diag._id ? null : diag)}
                    >
                      {selected?._id === diag._id ? "▲ Hide" : "▼ View Details"}
                    </button>
                    <button
                      className="btn-ghost"
                      style={{ fontSize: 12, padding: "7px 14px", color: "#f87171", borderColor: "rgba(239,68,68,0.2)" }}
                      onClick={() => handleDelete(diag._id)}
                      disabled={deleting === diag._id}
                    >
                      {deleting === diag._id ? "…" : "🗑️"}
                    </button>
                  </div>

                  {selected?._id === diag._id && (
                    <div style={{ marginTop: 14 }}>
                      {diag.symptoms && (
                        <div className="chh-detail">
                          <div className="chh-section-lbl">Reported Symptoms</div>
                          <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.7 }}>{diag.symptoms}</p>
                        </div>
                      )}
                      {diag.treatment && (
                        <div className="chh-detail">
                          <div className="chh-section-lbl">💊 Treatment</div>
                          <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.7 }}>{diag.treatment}</p>
                        </div>
                      )}
                      {diag.prevention && (
                        <div className="chh-detail">
                          <div className="chh-section-lbl">🛡️ Prevention</div>
                          <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.7 }}>{diag.prevention}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
