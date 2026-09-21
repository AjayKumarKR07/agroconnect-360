import { useState, useEffect, useCallback } from "react";
import { API_URL } from "../../config/api";
import { DS_ADMIN, relativeTime } from "./adminStyles";
import {
  Package, Wheat, Search, RefreshCw, Trash2,
  AlertTriangle, Loader2, Store,
  ChevronLeft, ChevronRight
} from "lucide-react";

const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("agroconnect_token")}` });

const STATUS_BADGE = {
  listed:    { cls: "badge-active",    label: "Listed" },
  available: { cls: "badge-active",    label: "Available" },
  sold:      { cls: "badge-suspended", label: "Sold" },
  pending:   { cls: "badge-pending",   label: "Pending" },
  inactive:  { cls: "badge-suspended", label: "Inactive" },
  active:    { cls: "badge-active",    label: "Active" },
};
const PAGE_SIZE = 12;

export default function AdminListings() {
  const [tab, setTab]             = useState("crops");
  const [crops, setCrops]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [err, setErr]             = useState("");
  const [search, setSearch]       = useState("");
  const [page, setPage]           = useState(1);
  const [delConfId, setDelConfId] = useState(null);
  const [deleting, setDeleting]   = useState(false);
  const [toast, setToast]         = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const load = useCallback(async () => {
    setLoading(true); setErr("");
    try {
      const r = await fetch(`${API_URL}/api/admin/crops`, { headers: authH() });
      const d = await r.json();
      if (d.success) setCrops(d.crops || []);
      else setErr(d.message || "Failed to load listings.");
    } catch { setErr("Network error loading listings."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      const r = await fetch(`${API_URL}/api/admin/crops/${id}`, { method: "DELETE", headers: authH() });
      const d = await r.json();
      if (d.success) { setCrops(p => p.filter(c => c._id !== id)); showToast("Crop listing deleted."); }
      else showToast(d.message || "Delete failed.");
    } catch { showToast("Network error."); }
    finally { setDeleting(false); setDelConfId(null); }
  };

  const filtered = crops.filter(c => {
    const q = search.toLowerCase();
    return !q || c.cropName?.toLowerCase().includes(q) || c.farmerName?.toLowerCase().includes(q) || c.location?.toLowerCase().includes(q);
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <style>{DS_ADMIN}</style>
      {toast && (
        <div style={{ position:"fixed", bottom:24, right:24, background:"#f0fdf4", border:"1px solid #bbf7d0", color:"#166534", padding:"12px 20px", borderRadius:12, fontWeight:700, fontSize:14, zIndex:9999 }}>{toast}</div>
      )}

      <div className="pg-head">
        <div>
          <div className="eyebrow">Platform Marketplace</div>
          <h1 className="pg-title" style={{ display:"flex", alignItems:"center", gap:8 }}><Package size={22} color="#4f46e5" />Listings Management</h1>
          <p className="pg-sub">Manage all crop and produce listings across the platform.</p>
        </div>
        <button className="btn-indigo" onClick={load} style={{ display:"inline-flex", alignItems:"center", gap:6 }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:20 }}>
        <button className={`tab-btn ${tab==="crops"?"active":""}`} onClick={() => { setTab("crops"); setPage(1); }}>
          <Wheat size={13} style={{ marginRight:5, verticalAlign:"middle" }} />Crop Listings
          <span style={{ marginLeft:6, background:"#e0e7ff", color:"#4338ca", borderRadius:20, padding:"1px 8px", fontSize:11, fontWeight:700 }}>{crops.length}</span>
        </button>
        <button className={`tab-btn ${tab==="products"?"active":""}`} onClick={() => setTab("products")} style={{ opacity:0.6 }}>
          <Store size={13} style={{ marginRight:5, verticalAlign:"middle" }} />Seller Products
        </button>
      </div>

      {tab === "products" ? (
        <div className="card" style={{ textAlign:"center", padding:"56px 24px" }}>
          <Store size={48} color="#cbd5e1" strokeWidth={1.5} style={{ marginBottom:12 }} />
          <div style={{ fontSize:16, fontWeight:700, color:"#0f172a", marginBottom:4 }}>Seller Products</div>
          <div style={{ fontSize:13, color:"#64748b" }}>Product listing management will be available soon.</div>
        </div>
      ) : (
        <>
          <div style={{ position:"relative", marginBottom:20, maxWidth:400 }}>
            <Search size={15} color="#94a3b8" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)" }} />
            <input className="field-input" style={{ paddingLeft:36 }} placeholder="Search by crop, farmer, location…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>

          {err && (
            <div style={{ padding:"12px 16px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, color:"#dc2626", display:"flex", gap:8, alignItems:"center", marginBottom:16, fontSize:13 }}>
              <AlertTriangle size={14} />{err}
            </div>
          )}

          <div className="card" style={{ padding:0, overflow:"hidden" }}>
            {loading ? (
              <div className="loading-wrap"><div className="spinner" /><span>Loading listings…</span></div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">??</div>
                <div className="empty-state-msg">No listings found</div>
                <div className="empty-state-sub">{search ? "Try a different search term." : "No crop listings have been added yet."}</div>
              </div>
            ) : (
              <div className="table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Crop</th><th>Farmer</th><th>Location</th><th>Price/Qt</th><th>Qty</th><th>Status</th><th>Listed</th><th style={{ textAlign:"right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map(c => {
                      const sb = STATUS_BADGE[c.status] || STATUS_BADGE["listed"];
                      const isDel = delConfId === c._id;
                      return (
                        <tr key={c._id}>
                          <td>
                            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <div style={{ width:30, height:30, borderRadius:8, background:"#f0fdf4", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                <Wheat size={13} color="#16a34a" />
                              </div>
                              <div>
                                <div style={{ fontWeight:700, color:"#0f172a", fontSize:13 }}>{c.cropName||"—"}</div>
                                <div style={{ fontSize:11, color:"#94a3b8" }}>{c.variety||""}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>{c.farmerName||c.farmer?.name||"—"}</td>
                          <td style={{ color:"#475569", fontSize:12 }}>{c.location||c.district||"—"}</td>
                          <td style={{ fontWeight:700, color:"#0f172a", fontSize:13 }}>?{c.pricePerQuintal||c.price||"—"}</td>
                          <td style={{ color:"#475569", fontSize:13 }}>{c.quantityAvailable!=null?`${c.quantityAvailable} Qt`:"—"}</td>
                          <td><span className={`badge ${sb.cls}`}>{sb.label}</span></td>
                          <td style={{ color:"#64748b", fontSize:12 }}>{relativeTime(c.createdAt)}</td>
                          <td style={{ textAlign:"right" }}>
                            {isDel ? (
                              <div style={{ display:"inline-flex", gap:6 }}>
                                <button className="btn-danger" style={{ fontSize:11, padding:"5px 10px" }} disabled={deleting} onClick={() => handleDelete(c._id)}>
                                  {deleting ? <Loader2 size={11} style={{ animation:"spin 1s linear infinite" }} /> : <><Trash2 size={11} /> Yes, Delete</>}
                                </button>
                                <button style={{ padding:"5px 10px", fontSize:11, borderRadius:7, border:"1px solid #e2e8f0", background:"#fff", color:"#0f172a", cursor:"pointer" }} onClick={() => setDelConfId(null)}>Cancel</button>
                              </div>
                            ) : (
                              <button className="btn-danger" style={{ fontSize:11, padding:"5px 10px" }} onClick={() => setDelConfId(c._id)}><Trash2 size={11} /> Delete</button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {!loading && filtered.length > PAGE_SIZE && (
            <div className="pagination">
              <button className="page-btn" disabled={page===1} onClick={() => setPage(p=>p-1)}><ChevronLeft size={13}/></button>
              {Array.from({length:Math.min(totalPages,7)},(_,i)=>i+1).map(n=>(
                <button key={n} className={`page-btn ${page===n?"active":""}`} onClick={() => setPage(n)}>{n}</button>
              ))}
              <button className="page-btn" disabled={page===totalPages} onClick={() => setPage(p=>p+1)}><ChevronRight size={13}/></button>
            </div>
          )}
        </>
      )}
    </>
  );
}