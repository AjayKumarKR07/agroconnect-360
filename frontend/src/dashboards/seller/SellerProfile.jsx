import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_URL } from "../../config/api";
import { DS } from "../../styles/ds";

const tkn  = () => localStorage.getItem("agroconnect_token");
const authH = () => ({ Authorization: `Bearer ${tkn()}`, "Content-Type": "application/json" });

const EXTRA = `
  .sp-layout   { display:grid; grid-template-columns:1fr 300px; gap:20px; align-items:start; }
  .sp-avatar   { width:84px; height:84px; border-radius:22px; display:flex; align-items:center; justify-content:center; font-family:'Space Grotesk',sans-serif; font-size:30px; font-weight:800; color:#fff; flex-shrink:0; transition:transform 0.2s; }
  .sp-avatar:hover { transform:scale(1.05); }
  .sp-grid     { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  .sp-group    { display:flex; flex-direction:column; gap:5px; }
  .sp-group.full { grid-column:1/-1; }
  .sp-select   { width:100%; background:var(--surface); border:1px solid var(--border2); border-radius:12px; padding:12px 16px; color:var(--text); font-size:14px; font-family:'Inter',sans-serif; outline:none; appearance:none; transition:border-color .2s,box-shadow .2s; cursor:pointer; }
  .sp-select:focus { border-color:rgba(167,139,250,.4); box-shadow:0 0 0 4px rgba(167,139,250,.07); }
  .sp-select option { background:#0d1020; color:#f0eeff; }
  .sp-stat     { background:rgba(167,139,250,0.04); border:1px solid var(--border); border-radius:14px; padding:14px 16px; text-align:center; }
  .sp-stat-val { font-family:'Space Grotesk',sans-serif; font-size:22px; font-weight:800; margin-top:6px; }
  .sp-stat-lbl { font-size:10px; color:var(--text2); text-transform:uppercase; letter-spacing:0.06em; }
  .sp-info-row { display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid var(--border); font-size:13px; }
  .sp-info-row:last-child { border-bottom:none; }
  .sp-info-val { font-weight:600; color:#fff; text-align:right; max-width:170px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .sp-nav-link { display:flex; align-items:center; gap:10px; padding:10px 14px; border-radius:12px; border:1px solid var(--border); text-decoration:none; color:var(--text2); font-size:13px; font-weight:600; transition:all 0.18s; }
  .sp-nav-link:hover { background:rgba(167,139,250,0.06); border-color:rgba(167,139,250,0.2); color:#a78bfa; }
  .sp-badge-row { display:flex; gap:8px; flex-wrap:wrap; margin-top:10px; }
  .sp-badge    { display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:700; padding:4px 10px; border-radius:20px; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  .sp-fadein   { animation:fadeUp 0.35s ease; }
  @media(max-width:860px){ .sp-layout{grid-template-columns:1fr;} }
  @media(max-width:560px){ .sp-grid{grid-template-columns:1fr;} .sp-group.full{grid-column:1;} }
`;

const fmtINR = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const relTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export default function SellerProfile() {
  const navigate = useNavigate();
  const cached   = JSON.parse(localStorage.getItem("agroconnect_user") || "{}");

  // ── Form state ───────────────────────────────────────────
  const [form, setForm] = useState({
    name:     cached.name     || "",
    phone:    cached.phone    || "",
    district: cached.district || "",
    state:    cached.state    || "",
    location: cached.location || "",
  });
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState("");
  const [error,   setError]   = useState("");

  // ── Dropdowns ────────────────────────────────────────────
  const [states,    setStates]    = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loadingS,  setLoadingS]  = useState(true);
  const [loadingD,  setLoadingD]  = useState(false);

  // ── Business stats (from real APIs) ─────────────────────
  const [stats,    setStats]    = useState(null);
  const [allOrders,setAllOrders]= useState([]);
  const [products, setProducts] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // ── Load state list ──────────────────────────────────────
  useEffect(() => {
    fetch(`${API_URL}/api/prices/catalog/states`, { headers: authH() })
      .then(r => r.json())
      .then(d => { if (d.states?.length) setStates(d.states); })
      .catch(() => {})
      .finally(() => setLoadingS(false));
  }, []);

  // ── Load districts when state changes ───────────────────
  useEffect(() => {
    if (!form.state) { setDistricts([]); return; }
    setLoadingD(true);
    setDistricts([]);
    fetch(`${API_URL}/api/prices/catalog/districts?state=${encodeURIComponent(form.state)}`, { headers: authH() })
      .then(r => r.json())
      .then(d => { if (d.districts?.length) setDistricts(d.districts); })
      .catch(() => {})
      .finally(() => setLoadingD(false));
  }, [form.state]);

  // ── Load seller business stats ───────────────────────────
  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    const [dashRes, ordersRes, productsRes] = await Promise.allSettled([
      fetch(`${API_URL}/api/seller/dashboard-stats`, { headers: { Authorization: `Bearer ${tkn()}` } }),
      fetch(`${API_URL}/api/orders/seller`,           { headers: { Authorization: `Bearer ${tkn()}` } }),
      fetch(`${API_URL}/api/seller/products`,         { headers: { Authorization: `Bearer ${tkn()}` } }),
    ]);
    if (dashRes.status === "fulfilled") {
      try { const d = await dashRes.value.json(); if (d.success) setStats(d.stats); } catch {}
    }
    if (ordersRes.status === "fulfilled") {
      try { const d = await ordersRes.value.json(); if (d.success) setAllOrders(d.orders || []); } catch {}
    }
    if (productsRes.status === "fulfilled") {
      try { const d = await productsRes.value.json(); if (d.success) setProducts(d.products || []); } catch {}
    }
    setLoadingStats(false);
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  // ── Computed biz metrics ─────────────────────────────────
  const totalProcurement = allOrders.reduce((s, o) => s + (o.totalPrice || o.subtotal || 0), 0);
  const deliveredCount   = allOrders.filter(o => o.status === "delivered").length;
  const pendingCount     = allOrders.filter(o => o.status === "pending").length;
  const uniqueSuppliers  = new Set(allOrders.map(o => o.farmerName).filter(Boolean)).size;
  const activeProducts   = products.filter(p => p.status === "listed" || p.status === "ready").length;
  const memberSince      = relTime(cached.createdAt);

  // ── Handlers ────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    const sanitized = name === "phone"
      ? value.replace(/\D/g, "").slice(0, 10)
      : value;
    setForm(p => ({
      ...p,
      [name]: sanitized,
      ...(name === "state" ? { district: "" } : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(""); setSuccess("");
    try {
      const location = form.location?.trim()
        || [form.district?.trim(), form.state?.trim()].filter(Boolean).join(", ");
      const r = await fetch(`${API_URL}/api/profile/complete`, {
        method: "PUT",
        headers: authH(),
        body: JSON.stringify({ ...form, location, role: "seller" }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Update failed");
      localStorage.setItem("agroconnect_user", JSON.stringify(d.user));
      setSuccess("✅ Profile updated successfully!");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("agroconnect_token");
    localStorage.removeItem("agroconnect_user");
    navigate("/login", { replace: true });
  };

  const initials = (cached.name || "S").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
      <style>{DS + EXTRA}</style>

      {/* ── Page header ───────────────────────────────── */}
      <div className="pg-head">
        <div>
          <div className="eyebrow">Account Settings</div>
          <h1 className="pg-title">👤 Seller Profile</h1>
          <p className="pg-sub">Manage your personal details and business account.</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link to="/seller/dashboard" style={{ fontSize: 13, color: "#a78bfa", background: "rgba(167,139,250,0.07)", border: "1px solid rgba(167,139,250,0.15)", padding: "9px 16px", borderRadius: 11, textDecoration: "none", fontWeight: 700 }}>
            ← Dashboard
          </Link>
        </div>
      </div>

      {/* ── Business KPI strip ────────────────────────── */}
      {!loadingStats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 24 }} className="sp-fadein">
          {[
            { label: "Total Spend",    value: fmtINR(totalProcurement), color: "#4ade80", small: true },
            { label: "Orders",         value: allOrders.length,          color: "#38bdf8" },
            { label: "Delivered",      value: deliveredCount,            color: "#4ade80" },
            { label: "Suppliers",      value: uniqueSuppliers,           color: "#a78bfa" },
            { label: "My Products",    value: activeProducts,            color: "#fb923c" },
          ].map(s => (
            <div key={s.label} className="sp-stat">
              <div className="sp-stat-lbl">{s.label}</div>
              <div className="sp-stat-val" style={{ color: s.color, fontSize: s.small ? 17 : 22, wordBreak: "break-word" }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}
      {loadingStats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 24 }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} className="sp-stat" style={{ height: 68 }}>
              <div style={{ height: 10, borderRadius: 6, background: "rgba(167,139,250,0.08)", marginBottom: 8 }} />
              <div style={{ height: 20, borderRadius: 6, background: "rgba(167,139,250,0.05)" }} />
            </div>
          ))}
        </div>
      )}

      {/* ── Main layout ───────────────────────────────── */}
      <div className="sp-layout">

        {/* ── Left: Edit form ───────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Avatar & name banner */}
          <div className="card sp-fadein" style={{ padding: "22px 24px", background: "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(167,139,250,0.05))", borderColor: "rgba(167,139,250,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              <div className="sp-avatar"
                style={{ background: "linear-gradient(135deg,#7c3aed,#a78bfa)", boxShadow: "0 8px 28px rgba(124,58,237,0.45)" }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 24, fontWeight: 800, color: "#fff" }}>
                  {cached.name || "Seller"}
                </div>
                <div style={{ fontSize: 13, color: "rgba(167,139,250,0.7)", marginTop: 3 }}>{cached.email}</div>
                <div className="sp-badge-row">
                  <span className="sp-badge" style={{ background: "rgba(167,139,250,0.12)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.25)" }}>
                    🛍️ Seller
                  </span>
                  <span className="sp-badge" style={{ background: cached.profileCompleted ? "rgba(74,222,128,0.1)" : "rgba(251,191,36,0.1)", color: cached.profileCompleted ? "#4ade80" : "#fbbf24", border: `1px solid ${cached.profileCompleted ? "rgba(74,222,128,0.2)" : "rgba(251,191,36,0.2)"}` }}>
                    {cached.profileCompleted ? "✅ Profile Complete" : "⚠️ Incomplete"}
                  </span>
                  {cached.state && (
                    <span className="sp-badge" style={{ background: "rgba(56,189,248,0.08)", color: "#38bdf8", border: "1px solid rgba(56,189,248,0.15)" }}>
                      📍 {[cached.district, cached.state].filter(Boolean).join(", ")}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Member Since</div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 15, fontWeight: 700, color: "#a78bfa", marginTop: 3 }}>{memberSince}</div>
              </div>
            </div>
          </div>

          {/* Edit form */}
          <div className="card sp-fadein">
            <div className="card-title" style={{ marginBottom: 20 }}>✏️ Edit Personal Information</div>

            {success && (
              <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80", fontSize: 14, marginBottom: 16 }}>
                {success}
              </div>
            )}
            {error && (
              <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 14, marginBottom: 16 }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="sp-grid">

                {/* Full Name */}
                <div className="sp-group full">
                  <label className="field-label">Full Name *</label>
                  <input
                    name="name" value={form.name} onChange={handleChange}
                    required className="field-input"
                    placeholder="Your full name"
                  />
                </div>

                {/* Phone */}
                <div className="sp-group">
                  <label className="field-label">Mobile Number</label>
                  <input
                    name="phone" type="tel" value={form.phone} onChange={handleChange}
                    className="field-input" placeholder="9876543210" maxLength={10}
                  />
                </div>

                {/* Email (read-only) */}
                <div className="sp-group">
                  <label className="field-label">Email Address</label>
                  <input
                    value={cached.email || ""}
                    disabled className="field-input"
                    style={{ opacity: 0.45, cursor: "not-allowed" }}
                  />
                </div>

                {/* State — dynamic */}
                <div className="sp-group">
                  <label className="field-label">
                    State *{" "}
                    {loadingS && <span style={{ color: "var(--text2)", fontWeight: 400 }}>loading…</span>}
                  </label>
                  <select
                    name="state" value={form.state} onChange={handleChange}
                    className="sp-select" required
                  >
                    <option value="">— Select State —</option>
                    {states.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* District — dynamic */}
                <div className="sp-group">
                  <label className="field-label">
                    District *{" "}
                    {loadingD && <span style={{ color: "var(--text2)", fontWeight: 400 }}>loading…</span>}
                  </label>
                  {districts.length > 0 ? (
                    <select
                      name="district" value={form.district} onChange={handleChange}
                      className="sp-select" required
                    >
                      <option value="">— Select District —</option>
                      {districts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  ) : (
                    <input
                      name="district" value={form.district} onChange={handleChange}
                      className="field-input"
                      placeholder={form.state
                        ? (loadingD ? "Loading districts…" : "Type district name")
                        : "Select a state first"}
                    />
                  )}
                </div>

              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 22, flexWrap: "wrap" }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "12px 28px", borderRadius: 12, border: "none", cursor: saving ? "not-allowed" : "pointer",
                    background: saving ? "rgba(167,139,250,0.25)" : "linear-gradient(135deg,#7c3aed,#a78bfa)",
                    color: "#fff", fontWeight: 800, fontSize: 14, fontFamily: "'Inter',sans-serif",
                    boxShadow: saving ? "none" : "0 4px 16px rgba(124,58,237,0.4)",
                    transition: "all 0.2s",
                  }}
                >
                  {saving ? "💾 Saving…" : "💾 Save Changes"}
                </button>
                <button
                  type="button" onClick={() => { setSuccess(""); setError(""); setForm({ name: cached.name||"", phone: cached.phone||"", district: cached.district||"", state: cached.state||"", location: cached.location||"" }); }}
                  style={{ padding: "12px 20px", borderRadius: 12, border: "1px solid var(--border2)", background: "none", color: "var(--text2)", cursor: "pointer", fontWeight: 600, fontSize: 14, fontFamily: "'Inter',sans-serif" }}
                >
                  ↩ Reset
                </button>
              </div>
            </form>
          </div>

          {/* Recent procurement activity */}
          {allOrders.length > 0 && (
            <div className="card sp-fadein">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                <div className="card-title">📦 Recent Orders</div>
                <Link to="/seller/orders" style={{ fontSize: 12, color: "#a78bfa", textDecoration: "none", fontWeight: 700 }}>View All →</Link>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {allOrders.slice(0, 4).map((o, i) => {
                  const STATUS_COLOR = { pending:"#fbbf24", accepted:"#38bdf8", processing:"#a78bfa", shipped:"#fb923c", delivered:"#4ade80", rejected:"#f87171", cancelled:"#f87171" };
                  const stColor = STATUS_COLOR[o.status] || "#94a3b8";
                  return (
                    <div key={(o._id || "") + i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--surface)", borderRadius: 11, border: "1px solid var(--border)", flexWrap: "wrap", gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: "#fff", fontSize: 13 }}>{o.cropName || "Product"}</div>
                        <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>{o.quantity} {o.unit || "kg"} · {o.farmerName || "Farmer"}</div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#4ade80" }}>₹{Number(o.totalPrice || 0).toLocaleString("en-IN")}</div>
                        <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 6, background: `${stColor}15`, color: stColor, fontWeight: 700 }}>
                          {o.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Info panel ─────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Account details */}
          <div className="card sp-fadein">
            <div className="card-title" style={{ marginBottom: 14 }}>📋 Account Details</div>
            {[
              ["🆔", "User ID",       (cached._id || cached.id || "—").toString().slice(-8).toUpperCase()],
              ["📧", "Email",         cached.email       || "—"],
              ["📱", "Phone",         cached.phone       || "Not set"],
              ["📍", "District",      cached.district    || "Not set"],
              ["🗺️", "State",         cached.state       || "Not set"],
              ["🎭", "Role",          "Seller"],
              ["✅", "Profile",       cached.profileCompleted ? "Complete" : "Incomplete"],
            ].map(([icon, label, val]) => (
              <div key={label} className="sp-info-row">
                <span style={{ color: "var(--text2)", fontSize: 12 }}>{icon} {label}</span>
                <span className="sp-info-val" style={{ color: label === "Profile" ? (cached.profileCompleted ? "#4ade80" : "#fbbf24") : "#fff" }}>{val}</span>
              </div>
            ))}
          </div>

          {/* Business summary */}
          <div className="card sp-fadein" style={{ borderColor: "rgba(167,139,250,0.18)" }}>
            <div className="card-title" style={{ marginBottom: 14 }}>📊 Business Summary</div>
            {[
              ["💰", "Total Procurement", fmtINR(totalProcurement)],
              ["📦", "Total Orders",      allOrders.length],
              ["🎉", "Delivered",         deliveredCount],
              ["⏳", "Pending",           pendingCount],
              ["🌾", "Suppliers",         uniqueSuppliers],
              ["🛍️", "Active Products",  activeProducts],
            ].map(([icon, label, val]) => (
              <div key={label} className="sp-info-row">
                <span style={{ color: "var(--text2)", fontSize: 12 }}>{icon} {label}</span>
                <span className="sp-info-val">{val}</span>
              </div>
            ))}
          </div>

          {/* Quick navigation */}
          <div className="card sp-fadein">
            <div className="card-title" style={{ marginBottom: 12 }}>⚡ Quick Navigation</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {[
                { emoji: "🏠", label: "Dashboard",      to: "/seller/dashboard" },
                { emoji: "🛒", label: "Procurement",    to: "/seller/procurement" },
                { emoji: "📦", label: "Orders",         to: "/seller/orders" },
                { emoji: "🛍️", label: "My Products",   to: "/seller/products" },
                { emoji: "💰", label: "Revenue",        to: "/seller/revenue" },
                { emoji: "📈", label: "Analytics",      to: "/seller/analytics" },
                { emoji: "🚚", label: "Logistics",      to: "/seller/logistics" },
                { emoji: "🤖", label: "AI Assistant",   to: "/seller/assistant" },
              ].map(nav => (
                <Link key={nav.label} to={nav.to} className="sp-nav-link">
                  <span>{nav.emoji}</span>
                  <span>{nav.label}</span>
                  <span style={{ marginLeft: "auto", fontSize: 11, opacity: 0.4 }}>→</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Switch role */}
          <div className="card sp-fadein" style={{ borderColor: "rgba(56,189,248,0.12)" }}>
            <div className="card-title" style={{ marginBottom: 8 }}>🔄 Switch Role</div>
            <p style={{ fontSize: 12, color: "var(--text2)", marginBottom: 12, lineHeight: 1.6 }}>
              Want to use AgroConnect as a farmer, buyer, or exporter?
            </p>
            <button
              className="btn-ghost"
              style={{ width: "100%", justifyContent: "center", color: "#38bdf8", borderColor: "rgba(56,189,248,0.2)", fontSize: 13 }}
              onClick={() => navigate("/select-role", { state: { isNewUser: false } })}
            >
              🔄 Change My Role
            </button>
          </div>

          {/* Danger zone */}
          <div className="card sp-fadein" style={{ borderColor: "rgba(239,68,68,0.12)" }}>
            <div style={{ fontWeight: 700, color: "#f87171", marginBottom: 10, fontSize: 13 }}>⚠️ Danger Zone</div>
            <button
              onClick={handleLogout}
              style={{
                width: "100%", padding: "12px", borderRadius: 12,
                border: "1px solid rgba(239,68,68,0.2)",
                background: "rgba(239,68,68,0.06)",
                color: "#f87171", cursor: "pointer",
                fontWeight: 700, fontSize: 14,
                fontFamily: "'Inter',sans-serif",
                transition: "background 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.12)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.06)"}
            >
              🚪 Sign Out
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
