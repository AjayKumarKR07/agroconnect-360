import { useState, useEffect } from "react";

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
`;

const INITIAL_USERS = [
  { id: "u-1", name: "Ajaykumar2005", email: "vivekshetty659@gmail.com", role: "farmer", phone: "9876543210", location: "Nashik, MH", status: "VERIFIED", joined: "1 Aug 2026" },
  { id: "u-2", name: "Ajay G S", email: "gsajay18@gmail.com", role: "farmer", phone: "9876543211", location: "Karnal, HR", status: "VERIFIED", joined: "1 Aug 2026" },
  { id: "u-3", name: "Demo Exporter", email: "exporter@agroconnect.com", role: "exporter", phone: "9888877777", location: "Mumbai, MH", status: "VERIFIED", joined: "2 Aug 2026" },
  { id: "u-4", name: "Sunil Agro Seller", email: "seller@agroconnect.com", role: "seller", phone: "9777766666", location: "Pune, MH", status: "PENDING KYC", joined: "3 Aug 2026" },
  { id: "u-5", name: "Meena Consumer", email: "consumer@gmail.com", role: "user", phone: "9666655555", location: "Delhi", status: "VERIFIED", joined: "3 Aug 2026" },
];

export default function AdminUsers() {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");

  const toggleStatus = (id) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const next = u.status === "VERIFIED" ? "SUSPENDED" : "VERIFIED";
        return { ...u, status: next };
      }
      return u;
    }));
  };

  const filtered = users.filter(u => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      <style>{DS_ADMIN}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">User Directory & Role Moderation</div>
          <h1 className="pg-title">👥 User Management & Verification</h1>
          <p className="pg-sub">Manage platform accounts across all 5 roles, verify KYC credentials, or suspend non-compliant users.</p>
        </div>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: "#818cf8" }}>
          {users.length} Total Users
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

        <input className="field-input" placeholder="🔍 Search name, email, phone…" value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 280 }} />
      </div>

      {/* User List Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "rgba(99,102,241,0.08)", borderBottom: "1px solid rgba(99,102,241,0.14)", color: "#a5b4fc", textTransform: "uppercase", fontSize: 11 }}>
              <th style={{ padding: "14px 18px" }}>User</th>
              <th style={{ padding: "14px 18px" }}>Role</th>
              <th style={{ padding: "14px 18px" }}>Location</th>
              <th style={{ padding: "14px 18px" }}>Status</th>
              <th style={{ padding: "14px 18px", textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, idx) => (
              <tr key={u.id} style={{ borderBottom: idx < filtered.length - 1 ? "1px solid rgba(99,102,241,0.08)" : "none" }}>
                <td style={{ padding: "14px 18px" }}>
                  <div style={{ fontWeight: 800, color: "#fff", fontSize: 14 }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: "#a5b4fc" }}>{u.email} · 📞 {u.phone}</div>
                </td>
                <td style={{ padding: "14px 18px" }}>
                  <span style={{ padding: "3px 9px", borderRadius: 8, background: "rgba(99,102,241,0.15)", color: "#c7d2fe", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>
                    {u.role}
                  </span>
                </td>
                <td style={{ padding: "14px 18px", color: "#a5b4fc" }}>📍 {u.location}</td>
                <td style={{ padding: "14px 18px" }}>
                  <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: u.status === "VERIFIED" ? "rgba(34,197,94,0.15)" : u.status === "PENDING KYC" ? "rgba(251,191,36,0.15)" : "rgba(239,68,68,0.15)", color: u.status === "VERIFIED" ? "#4ade80" : u.status === "PENDING KYC" ? "#fbbf24" : "#f87171", fontWeight: 800 }}>
                    ● {u.status}
                  </span>
                </td>
                <td style={{ padding: "14px 18px", textAlign: "right" }}>
                  <button onClick={() => toggleStatus(u.id)}
                    style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${u.status === "VERIFIED" ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`, background: u.status === "VERIFIED" ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)", color: u.status === "VERIFIED" ? "#f87171" : "#4ade80", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                    {u.status === "VERIFIED" ? "🚫 Suspend" : "✅ Verify Account"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
