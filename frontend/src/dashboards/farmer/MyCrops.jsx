import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../../config/api";
import { DS } from "../../styles/ds";
import { Plus, Sprout, Search, CheckCircle2, Zap, XCircle, Package, DollarSign, MapPin, Calendar, Eye, Edit3, Trash2, AlertTriangle } from "lucide-react";

export default function MyCrops() {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("agroconnect_token");
    fetch(`${API_URL}/api/crops/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.crops) setCrops(d.crops); else setError(d.message || "Unable to load crops"); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (crop) => {
    if (!window.confirm(`Delete "${crop.name}"? This cannot be undone.`)) return;
    setDeletingId(crop._id);
    try {
      const token = localStorage.getItem("agroconnect_token");
      const r = await fetch(`${API_URL}/api/crops/${crop._id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Unable to delete");
      setCrops((c) => c.filter((x) => x._id !== crop._id));
    } catch (e) { setError(e.message); }
    finally { setDeletingId(null); }
  };

  const listForSale = async (crop) => {
    try {
      const token = localStorage.getItem("agroconnect_token");
      const r = await fetch(`${API_URL}/api/crops/${crop._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "listed" }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Failed to list");
      setCrops((prev) => prev.map((c) => c._id === crop._id ? { ...c, status: "listed" } : c));
    } catch (e) { setError(e.message); }
  };

  const filtered = crops.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.category?.toLowerCase().includes(search.toLowerCase())
  );

  const statusBadge = (s) => {
    if (s === "listed")  return <span className="badge badge-green" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><CheckCircle2 size={12} /> Listed</span>;
    if (s === "ready")   return <span className="badge badge-cyan" style={{ background: "rgba(56,189,248,0.12)", color: "#0369a1", borderColor: "rgba(56,189,248,0.2)", display: "inline-flex", alignItems: "center", gap: 5 }}><Zap size={12} /> Ready</span>;
    if (s === "sold")    return <span className="badge badge-red" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><XCircle size={12} /> Sold</span>;
    return <span className="badge badge-amber" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Sprout size={12} /> Growing</span>;
  };

  return (
    <>
      <style>{DS}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Farm Management</div>
          <h1 className="pg-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Sprout size={24} color="#16a34a" /> My Crops
          </h1>
          <p className="pg-sub">Manage your crop listings and agricultural produce.</p>
        </div>
        <Link to="/farmer/crops/add" className="btn-green" id="add-crop-btn" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Plus size={14} strokeWidth={2.5} /> Add New Crop</Link>
      </div>

      {/* Summary row */}
      {!loading && crops.length > 0 && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
          {[
            { label: "Total", count: crops.length, color: "#0369a1" },
            { label: "Listed", count: crops.filter(c => c.status === "listed").length, color: "#15803d" },
            { label: "Ready (unlisted)", count: crops.filter(c => c.status === "ready").length, color: "#0369a1" },
            { label: "Growing", count: crops.filter(c => c.status === "growing").length, color: "#b45309" },
            { label: "Sold", count: crops.filter(c => c.status === "sold").length, color: "#dc2626" },
          ].filter(x => x.count > 0).map(({ label, count, color }) => (
            <div key={label} style={{ padding: "6px 14px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)", fontSize: 12, fontWeight: 700, color }}>
              {count} {label}
            </div>
          ))}
        </div>
      )}

      {error && <div className="alert-error" style={{ display: "flex", alignItems: "center", gap: 8 }}><AlertTriangle size={16} /> {error}</div>}

      {/* Search bar */}
      {!loading && crops.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <input
            className="field-input"
            placeholder="Search crops by name or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 400 }}
          />
        </div>
      )}

      {loading && (
        <div className="loading-wrap"><div className="spinner" /><span>Loading your crops…</span></div>
      )}

      {!loading && crops.length === 0 && (
        <div className="card empty-state">
          <div className="empty-emoji"><Sprout size={40} strokeWidth={1.5} color="#bbf7d0" /></div>
          <div className="empty-title">No crops listed yet</div>
          <div className="empty-sub">Start by adding your first crop to reach buyers directly.</div>
          <Link to="/farmer/crops/add" className="btn-green" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Plus size={14} strokeWidth={2.5} /> Add Your First Crop</Link>
        </div>
      )}

      {!loading && filtered.length === 0 && crops.length > 0 && (
        <div className="card empty-state">
          <div className="empty-emoji"><Search size={40} strokeWidth={1.5} color="#bbf7d0" /></div>
          <div className="empty-title">No crops match "{search}"</div>
          <div className="empty-sub">Try a different search term.</div>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
          {filtered.map((crop) => (
            <div key={crop._id} className="card" style={{ padding: 0, overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
            >
              {/* Image */}
              {crop.image?.url ? (
                <div style={{ height: 180, overflow: "hidden" }}>
                  <img src={crop.image.url} alt={crop.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ) : (
                <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center", background: "#f0fdf4", borderBottom: "1px solid var(--border)" }}>
                  <Sprout size={56} color="#86efac" />
                </div>
              )}

              <div style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", fontFamily: "'Space Grotesk',sans-serif" }}>{crop.name}</div>
                    <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 2 }}>{crop.category}</div>
                  </div>
                  {statusBadge(crop.status)}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                  {[
                    { Icon: Package, lbl: "Qty", val: `${crop.quantity} ${crop.unit}` },
                    { Icon: DollarSign, lbl: "Price", val: `₹${crop.price}/${crop.unit}` },
                    { Icon: MapPin, lbl: "Location", val: crop.location },
                    { Icon: Calendar, lbl: "Harvest", val: crop.harvestDate ? new Date(crop.harvestDate).toLocaleDateString("en-IN") : "—" },
                  ].map(({ Icon, lbl, val }) => (
                    <div key={lbl} style={{ background: "var(--surface)", borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 3, display: "flex", alignItems: "center", gap: 4 }}>
                        <Icon size={12} color="#16a34a" /> {lbl}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{val}</div>
                    </div>
                  ))}
                </div>

                {crop.description && (
                  <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16, lineHeight: 1.6, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                    {crop.description.slice(0, 100)}{crop.description.length > 100 ? "…" : ""}
                  </p>
                )}

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {/* List for Sale — shown only when not yet listed */}
                  {(crop.status === "ready" || crop.status === "growing") && (
                    <button
                      onClick={() => listForSale(crop)}
                      className="btn-green"
                      style={{ flex: 1, justifyContent: "center", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 }}
                      title="Publish this crop to the buyer marketplace"
                    >
                      <CheckCircle2 size={13} /> List for Sale
                    </button>
                  )}
                  <button onClick={() => navigate(`/farmer/crops/${crop._id}`)} className="btn-ghost" style={{ flex: 1, justifyContent: "center", display: "inline-flex", alignItems: "center", gap: 5 }}><Eye size={13} /> View</button>
                  <button onClick={() => navigate(`/farmer/crops/${crop._id}/edit`)} className="btn-ghost" style={{ flex: 1, justifyContent: "center", display: "inline-flex", alignItems: "center", gap: 5, color: "#15803d", borderColor: "rgba(34,197,94,0.2)" }}><Edit3 size={13} /> Edit</button>
                  <button onClick={() => handleDelete(crop)} disabled={deletingId === crop._id} className="btn-danger" style={{ flex: 1, justifyContent: "center", display: "inline-flex", alignItems: "center", gap: 5 }}>
                    {deletingId === crop._id ? "…" : <Trash2 size={13} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}