import { useState, useEffect } from "react";
import { API_URL } from "../../config/api";

const DS_ADMIN = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
  .pg-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:16px;flex-wrap:wrap;}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#818cf8;margin-bottom:6px;}
  .pg-title{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:800;color:#fff;line-height:1.2;}
  .pg-sub{font-size:14px;color:#a5b4fc;margin-top:6px;}
  .card{background:rgba(99,102,241,0.04);border:1px solid rgba(99,102,241,0.12);border-radius:18px;padding:20px 22px;}
  .btn-indigo{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:12px;background:linear-gradient(135deg,#4f46e5,#6366f1);color:#fff;font-weight:700;font-size:14px;border:none;cursor:pointer;font-family:'Inter',sans-serif;}
  .field-input{width:100%;padding:10px 14px;border-radius:11px;border:1px solid rgba(99,102,241,0.18);background:rgba(99,102,241,0.05);color:#fff;font-size:14px;font-family:'Inter',sans-serif;outline:none;}
  .tab-btn{padding:7px 16px;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;border:1px solid rgba(99,102,241,0.15);background:rgba(99,102,241,0.04);color:#a5b4fc;transition:all 0.2s;}
  .tab-btn.active{background:rgba(99,102,241,0.2);color:#fff;border-color:#6366f1;}
  .spinner{width:22px;height:22px;border:3px solid rgba(99,102,241,0.15);border-top-color:#818cf8;border-radius:50%;animation:spin 0.8s linear infinite;}
  @keyframes spin{to{transform:rotate(360deg)}}
  .loading-wrap{display:flex;align-items:center;justify-content:center;gap:12px;padding:60px 0;color:#a5b4fc;}
`;

const ROLE_COLOR = {
  farmer: "#4ade80", seller: "#a78bfa", user: "#38bdf8", exporter: "#fbbf24", admin: "#f87171",
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [toggling, setToggling] = useState(null);
  const token = localStorage.getItem("agroconnect_token");

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter !== "all") params.append("role", roleFilter);
      if (search) params.append("search", search);
      const r = await fetch(`${API_URL}/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (d.success) setUsers(d.users || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadUsers(); }, [roleFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadUsers();
  };

  const toggleStatus = async (id, currentActive) => {
    setToggling(id);
    try {
      const r = await fetch(`${API_URL}/api/admin/users/${id}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (d.success) {
        setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: d.isActive } : u));
      }
    } catch { alert("Failed to update user status."); }
    finally { setToggling(null); }
  };

  return (
    <>
      <style>{DS_ADMIN}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">User Directory & Role Moderation</div>
          <h1 className="pg-title">👥 User Management & Verification</h1>
          <p className="pg-sub">Manage platform accounts across all roles, verify KYC credentials, or suspend non-compliant users.</p>
        </div>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: "#818cf8" }}>
          {users.length} Users
        </div>
      </div>

      {/* Role Filter Tabs & Search */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["all", "farmer", "seller", "user", "exporter", "admin"].map(r => (
            <button key={r} className={`tab-btn ${roleFilter === r ? "active" : ""}`} onClick={() => setRoleFilter(r)}>
              {r === "all" ? "🌐 All Roles" : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 8 }}>
          <input
            className="field-input"
            placeholder="🔍 Search name, email, phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 240 }}
          />
          <button type="submit" className="btn-indigo" style={{ padding: "10px 16px", fontSize: 13 }}>Search</button>
        </form>
      </div>

      {loading && (
        <div className="loading-wrap"><div className="spinner" /><span>Loading users…</span></div>
      )}

      {!loading && users.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
          <div style={{ color: "#fff", fontWeight: 700 }}>No users found</div>
          <div style={{ color: "#a5b4fc", fontSize: 13, marginTop: 6 }}>Try adjusting the filters.</div>
        </div>
      )}

      {/* User List Table */}
      {!loading && users.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "rgba(99,102,241,0.08)", borderBottom: "1px solid rgba(99,102,241,0.14)", color: "#a5b4fc", textTransform: "uppercase", fontSize: 11 }}>
                <th style={{ padding: "14px 18px" }}>User</th>
                <th style={{ padding: "14px 18px" }}>Role</th>
                <th style={{ padding: "14px 18px" }}>Location</th>
                <th style={{ padding: "14px 18px" }}>Joined</th>
                <th style={{ padding: "14px 18px" }}>Status</th>
                <th style={{ padding: "14px 18px", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => (
                <tr key={u._id} style={{ borderBottom: idx < users.length - 1 ? "1px solid rgba(99,102,241,0.08)" : "none" }}>
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ fontWeight: 800, color: "#fff", fontSize: 14 }}>{u.name || "Unnamed"}</div>
                    <div style={{ fontSize: 11, color: "#a5b4fc" }}>{u.email} {u.phone ? `· 📞 ${u.phone}` : ""}</div>
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <span style={{ padding: "3px 9px", borderRadius: 8, background: `${ROLE_COLOR[u.role] || "#818cf8"}20`, color: ROLE_COLOR[u.role] || "#818cf8", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: "14px 18px", color: "#a5b4fc" }}>
                    📍 {[u.location, u.district, u.state].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td style={{ padding: "14px 18px", color: "#a5b4fc", fontSize: 12 }}>
                    {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: u.isActive ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color: u.isActive ? "#4ade80" : "#f87171", fontWeight: 800 }}>
                      ● {u.isActive ? "ACTIVE" : "SUSPENDED"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 18px", textAlign: "right" }}>
                    <button
                      disabled={toggling === u._id}
                      onClick={() => toggleStatus(u._id, u.isActive)}
                      style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${u.isActive ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`, background: u.isActive ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)", color: u.isActive ? "#f87171" : "#4ade80", fontWeight: 700, fontSize: 12, cursor: "pointer", opacity: toggling === u._id ? 0.5 : 1 }}
                    >
                      {toggling === u._id ? "⏳" : u.isActive ? "🚫 Suspend" : "✅ Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
