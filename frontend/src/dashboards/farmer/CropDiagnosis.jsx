import { useEffect, useState } from "react";
import { API_URL } from "../../config/api";
import { DS } from "../../styles/ds";

export default function CropDiagnosis() {
  const [cropName, setCropName] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("scan");
  const [viewItem, setViewItem] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const token = localStorage.getItem("agroconnect_token");

  const fetchHistory = async () => {
    try {
      const r = await fetch(`${API_URL}/api/diagnosis/my`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (r.ok) setHistory(d.diagnoses || []);
    } catch (e) { console.error(e); }
    finally { setHistoryLoading(false); }
  };

  const deleteDiagnosis = async (id) => {
    if (!window.confirm("Delete this diagnosis record?")) return;
    setDeleting(id);
    try {
      const r = await fetch(`${API_URL}/api/diagnosis/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) {
        setHistory((prev) => prev.filter((h) => h._id !== id));
        if (viewItem?._id === id) setViewItem(null);
      } else {
        const d = await r.json();
        alert(d.message || "Delete failed");
      }
    } catch (e) { alert("Network error. Please try again."); }
    finally { setDeleting(null); }
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select a valid image."); return; }
    setImage(file); setPreview(URL.createObjectURL(file)); setResult(null); setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cropName.trim()) { setError("Please enter the crop name."); return; }
    if (!image) { setError("Please upload a crop or leaf image."); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const fd = new FormData();
      fd.append("cropName", cropName.trim());
      fd.append("symptoms", symptoms.trim());
      fd.append("image", image);
      const r = await fetch(`${API_URL}/api/diagnosis`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Unable to analyze crop image");
      setResult(d.diagnosis);
      await fetchHistory();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const severityBadge = (s) => {
    const m = { low: "badge-green", medium: "badge-amber", high: "badge-red", critical: "badge-red" };
    const e = { low: "✅", medium: "⚠️", high: "🔴", critical: "💀" };
    return <span className={`badge ${m[s] || "badge-blue"}`}>{e[s] || "ℹ️"} {s}</span>;
  };

  return (
    <>
      <style>{DS + `
        .diag-tabs{display:flex;gap:0;margin-bottom:24px;background:var(--surface);border-radius:12px;padding:4px;border:1px solid var(--border);width:fit-content;}
        .diag-tab{padding:9px 22px;border-radius:9px;font-size:14px;font-weight:600;cursor:pointer;border:none;background:none;color:var(--text2);font-family:'Inter',sans-serif;transition:all 0.2s;}
        .diag-tab.active{background:var(--green-dim);color:#4ade80;border:1px solid rgba(34,197,94,0.2);}
        /* Modal */
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.78);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(8px);}
        .modal-box{background:#07111a;border:1px solid rgba(255,255,255,0.1);border-radius:24px;padding:0;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;animation:fadeIn 0.2s ease;}
        @keyframes fadeIn{from{opacity:0;transform:scale(0.96);}to{opacity:1;transform:scale(1);}}
        .modal-img{width:100%;height:220px;object-fit:cover;border-radius:20px 20px 0 0;}
        .modal-body{padding:24px 28px;}
        .modal-title{font-family:'Space Grotesk',sans-serif;font-size:22px;font-weight:800;color:#fff;margin-bottom:4px;}
        .modal-row{display:flex;flex-direction:column;gap:6px;padding:14px 0;border-bottom:1px solid var(--border);}
        .modal-row:last-child{border-bottom:none;}
        .modal-lbl{font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:0.06em;}
        .modal-val{font-size:14px;color:var(--text);line-height:1.7;}
        /* History buttons */
        .hist-btns{display:flex;gap:8px;}
        .btn-view{padding:7px 16px;border-radius:9px;border:1px solid rgba(56,189,248,0.25);background:rgba(56,189,248,0.07);color:#38bdf8;font-size:12px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;transition:all 0.2s;white-space:nowrap;}
        .btn-view:hover{background:rgba(56,189,248,0.14);}
        .btn-del{padding:7px 14px;border-radius:9px;border:1px solid rgba(239,68,68,0.25);background:rgba(239,68,68,0.07);color:#f87171;font-size:12px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;transition:all 0.2s;white-space:nowrap;}
        .btn-del:hover{background:rgba(239,68,68,0.14);}
        .btn-del:disabled{opacity:0.4;cursor:not-allowed;}
      `}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">AI-Powered Tools</div>
          <h1 className="pg-title">🔬 Crop Disease Detection</h1>
          <p className="pg-sub">Upload a leaf or crop photo for instant AI diagnosis and treatment advice.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="diag-tabs">
        <button className={`diag-tab ${activeTab === "scan" ? "active" : ""}`} onClick={() => setActiveTab("scan")}>🔍 New Scan</button>
        <button className={`diag-tab ${activeTab === "history" ? "active" : ""}`} onClick={() => setActiveTab("history")}>
          📋 History {history.length > 0 && <span style={{ marginLeft: 4, background: "rgba(34,197,94,0.2)", padding: "1px 7px", borderRadius: 10, fontSize: 11 }}>{history.length}</span>}
        </button>
      </div>

      {/* ── SCAN TAB ── */}
      {activeTab === "scan" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 20 }}>📷 Upload Crop Image</div>
            {error && <div className="alert-error">⚠️ {error}</div>}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label className="field-label">Crop Name *</label>
                <input className="field-input" placeholder="e.g. Tomato, Wheat, Rice" value={cropName} onChange={(e) => setCropName(e.target.value)} required />
              </div>
              <div>
                <label className="field-label">Symptoms (optional)</label>
                <textarea className="field-input" rows={3} placeholder="Describe what you see — yellowing, spots, wilting…" value={symptoms} onChange={(e) => setSymptoms(e.target.value)} style={{ resize: "vertical" }} />
              </div>
              <div>
                <label className="field-label">Leaf / Crop Photo *</label>
                {preview ? (
                  <div style={{ position: "relative" }}>
                    <img src={preview} alt="Preview" style={{ width: "100%", height: 220, objectFit: "cover", borderRadius: 12, border: "1px solid var(--border)" }} />
                    <button type="button" onClick={() => { setImage(null); setPreview(""); setResult(null); }} style={{ position: "absolute", top: 8, right: 8, background: "rgba(239,68,68,0.9)", border: "none", borderRadius: 8, padding: "4px 10px", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>✕ Remove</button>
                  </div>
                ) : (
                  <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "32px 16px", borderRadius: 12, border: "2px dashed var(--border2)", background: "var(--surface)", cursor: "pointer", transition: "border-color 0.2s" }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(167,139,250,0.4)"}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border2)"}
                  >
                    <span style={{ fontSize: 44 }}>🔬</span>
                    <span style={{ fontSize: 14, color: "var(--text2)", textAlign: "center" }}>Click to upload a leaf or crop photo<br /><span style={{ fontSize: 12 }}>JPG, PNG — clear, well-lit image preferred</span></span>
                    <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
                  </label>
                )}
              </div>
              <button type="submit" className="btn-green" disabled={loading || !image || !cropName} style={{ width: "100%", justifyContent: "center", padding: "16px" }}>
                {loading ? <><span style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} /> Analyzing with AI…</> : "🤖 Run AI Diagnosis"}
              </button>
            </form>
          </div>

          {/* Result panel */}
          <div>
            {loading && (
              <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🧠</div>
                <div className="loading-wrap" style={{ padding: 0 }}><div className="spinner" /><span>AI is analyzing your crop image…</span></div>
                <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 12 }}>This may take 10-20 seconds</div>
              </div>
            )}

            {result && !loading && (
              <div className="card" style={{ background: result.isHealthy ? "rgba(34,197,94,0.04)" : "rgba(239,68,68,0.04)", borderColor: result.isHealthy ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div className="card-title">{result.isHealthy ? "✅ Healthy Crop!" : "⚠️ Disease Detected"}</div>
                  {result.severity && severityBadge(result.severity)}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {result.disease && (
                    <div style={{ padding: "14px 16px", background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)" }}>
                      <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>DISEASE IDENTIFIED</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{result.disease}</div>
                    </div>
                  )}
                  {result.cause && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Cause</div>
                      <div style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.7 }}>{result.cause}</div>
                    </div>
                  )}
                  {result.treatment && (
                    <div style={{ background: "rgba(34,197,94,0.06)", borderRadius: 12, padding: "14px 16px", border: "1px solid rgba(34,197,94,0.15)" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#4ade80", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>💊 Treatment Recommendation</div>
                      <div style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.7 }}>{result.treatment}</div>
                    </div>
                  )}
                  {result.prevention && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>🛡️ Prevention</div>
                      <div style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.7 }}>{result.prevention}</div>
                    </div>
                  )}
                  {typeof result.confidence === "number" && (
                    <div>
                      <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 6 }}>Confidence Score</div>
                      <div style={{ height: 8, background: "var(--surface)", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${result.confidence}%`, background: "linear-gradient(90deg,#16a34a,#4ade80)", borderRadius: 4, transition: "width 1s ease" }} />
                      </div>
                      <div style={{ fontSize: 12, color: "#4ade80", marginTop: 4 }}>{result.confidence}%</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!loading && !result && (
              <div className="card" style={{ padding: "40px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 60, marginBottom: 16 }}>🌿</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 8 }}>AI Disease Scanner Ready</div>
                <div style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.7 }}>Upload a clear photo of a diseased leaf or crop. The AI will identify the disease, its cause, and provide treatment recommendations.</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {activeTab === "history" && (
        <div>
          {historyLoading && <div className="loading-wrap"><div className="spinner" /><span>Loading history…</span></div>}
          {!historyLoading && history.length === 0 && (
            <div className="card empty-state">
              <div className="empty-emoji">📋</div>
              <div className="empty-title">No scan history</div>
              <div className="empty-sub">Your past diagnosis results will appear here.</div>
              <button className="btn-green" onClick={() => setActiveTab("scan")}>🔬 Run First Scan</button>
            </div>
          )}
          {!historyLoading && history.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {history.map((h, i) => (
                <div key={h._id || i} className="card" style={{ padding: "16px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                    {/* Left: image + info */}
                    <div style={{ display: "flex", gap: 14, alignItems: "center", flex: 1, minWidth: 0 }}>
                      {h.imageUrl
                        ? <img src={h.imageUrl} alt={h.cropName} style={{ width: 54, height: 54, borderRadius: 10, objectFit: "cover", border: "1px solid var(--border)", flexShrink: 0 }} />
                        : <div style={{ width: 54, height: 54, borderRadius: 10, background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0, border: "1px solid var(--border)" }}>🌿</div>
                      }
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: "#fff", fontSize: 15 }}>{h.cropName}</div>
                        <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 2 }}>{h.disease || "Healthy"}</div>
                        <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>📅 {new Date(h.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                      </div>
                    </div>
                    {/* Right: badges + buttons */}
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", flexShrink: 0 }}>
                      {h.severity && severityBadge(h.severity)}
                      {h.isHealthy && <span className="badge badge-green">✅ Healthy</span>}
                      <div className="hist-btns">
                        <button className="btn-view" onClick={() => setViewItem(h)}>👁️ View</button>
                        <button className="btn-del" disabled={deleting === h._id} onClick={() => deleteDiagnosis(h._id)}>
                          {deleting === h._id ? "⏳" : "🗑️ Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── VIEW DETAIL MODAL ── */}
      {viewItem && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setViewItem(null)}>
          <div className="modal-box">
            {viewItem.imageUrl
              ? <img src={viewItem.imageUrl} alt={viewItem.cropName} className="modal-img" />
              : <div style={{ height: 100, background: "var(--surface)", borderRadius: "20px 20px 0 0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52 }}>🌿</div>
            }
            <div className="modal-body">
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div className="modal-title">{viewItem.cropName}</div>
                  <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 2 }}>
                    📅 {new Date(viewItem.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </div>
                </div>
                <button onClick={() => setViewItem(null)} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, padding: "6px 12px", color: "var(--text2)", cursor: "pointer", fontSize: 16 }}>✕</button>
              </div>

              {/* Status badges */}
              <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                {viewItem.severity && severityBadge(viewItem.severity)}
                {viewItem.isHealthy && <span className="badge badge-green">✅ Healthy Crop</span>}
                {typeof viewItem.confidence === "number" && (
                  <span className="badge badge-blue">🎯 {viewItem.confidence}% confidence</span>
                )}
              </div>

              {viewItem.disease && (
                <div className="modal-row">
                  <div className="modal-lbl">🦠 Disease Identified</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: viewItem.isHealthy ? "#4ade80" : "#f87171" }}>{viewItem.disease}</div>
                </div>
              )}

              {viewItem.symptoms && (
                <div className="modal-row">
                  <div className="modal-lbl">📝 Reported Symptoms</div>
                  <div className="modal-val">{viewItem.symptoms}</div>
                </div>
              )}

              {viewItem.cause && (
                <div className="modal-row">
                  <div className="modal-lbl">🔍 Cause</div>
                  <div className="modal-val">{viewItem.cause}</div>
                </div>
              )}

              {viewItem.treatment && (
                <div style={{ background: "rgba(34,197,94,0.05)", borderRadius: 12, padding: "14px 16px", border: "1px solid rgba(34,197,94,0.12)", margin: "8px 0" }}>
                  <div className="modal-lbl" style={{ color: "#4ade80" }}>💊 Treatment Recommendation</div>
                  <div className="modal-val" style={{ marginTop: 6 }}>{viewItem.treatment}</div>
                </div>
              )}

              {viewItem.prevention && (
                <div className="modal-row">
                  <div className="modal-lbl">🛡️ Prevention Tips</div>
                  <div className="modal-val">{viewItem.prevention}</div>
                </div>
              )}

              {typeof viewItem.confidence === "number" && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text2)", marginBottom: 6 }}>
                    <span>AI Confidence</span>
                    <span style={{ color: "#4ade80", fontWeight: 700 }}>{viewItem.confidence}%</span>
                  </div>
                  <div style={{ height: 8, background: "var(--surface)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${viewItem.confidence}%`, background: "linear-gradient(90deg,#16a34a,#4ade80)", borderRadius: 4 }} />
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
                <button className="btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={() => setViewItem(null)}>← Close</button>
                <button
                  className="btn-del"
                  style={{ flex: 1, justifyContent: "center", padding: "12px", borderRadius: 12 }}
                  disabled={deleting === viewItem._id}
                  onClick={() => deleteDiagnosis(viewItem._id)}
                >
                  {deleting === viewItem._id ? "⏳ Deleting…" : "🗑️ Delete Record"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}