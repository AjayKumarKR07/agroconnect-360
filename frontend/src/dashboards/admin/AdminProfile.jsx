import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../../config/api";
import { DS_ADMIN, relativeTime } from "./adminStyles";
import { ALL_INDIA_STATES, getDistrictsForState } from "../../utils/indiaData";
import {
  ShieldCheck, User, Lock, Zap, RefreshCw,
  Users, Wheat, Package, Ship, IndianRupee, Scale, Megaphone, FileText, Bot,
  AlertTriangle, MapPin, Save, CheckCircle2
} from "lucide-react";

const PRIVILEGES = [
  { module: "User Lifecycle", perm: "Read, Update, Suspend, Activate", Icon: Users },
  { module: "Crop Moderation", perm: "Delete, Verify, Moderate", Icon: Wheat },
  { module: "Domestic Orders", perm: "Status Override, Dispute Mediation", Icon: Package },
  { module: "Export Marketplace", perm: "RFQ Review, Shipment Oversight", Icon: Ship },
  { module: "Financial Engine", perm: "GMV Aggregation, Commission Audit", Icon: IndianRupee },
  { module: "Dispute Arbitration", perm: "Binding Resolution & Rejection", Icon: Scale },
  { module: "Global Broadcasts", perm: "Platform-Wide Push Notifications", Icon: Megaphone },
  { module: "Audit Logging", perm: "Full Security Trail Access", Icon: FileText },
  { module: "System Telemetry", perm: "Health Checks, Diagnostics", Icon: Zap },
  { module: "AI Models & OCR", perm: "Service Monitoring & Tuning", Icon: Bot },
];

export default function AdminProfile() {
  const navigate = useNavigate();
  const token = localStorage.getItem("agroconnect_token");
  const cachedUser = JSON.parse(localStorage.getItem("agroconnect_user") || "{}");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    name: cachedUser.name || "",
    email: cachedUser.email || "",
    phone: cachedUser.phone || "",
    location: cachedUser.location || "",
    district: cachedUser.district || "",
    state: cachedUser.state || "",
    role: cachedUser.role || "admin",
    createdAt: cachedUser.createdAt || "",
    profileCompleted: cachedUser.profileCompleted || true,
  });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch fresh profile from backend
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`${API_URL}/api/profile/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = await res.json();
        if (d.success && d.user) {
          setFormData((prev) => ({
            ...prev,
            name: d.user.name || "",
            email: d.user.email || "",
            phone: d.user.phone || "",
            location: d.user.location || "",
            district: d.user.district || "",
            state: d.user.state || "",
            role: d.user.role || "admin",
            createdAt: d.user.createdAt || prev.createdAt,
            profileCompleted: d.user.profileCompleted ?? true,
          }));
          localStorage.setItem("agroconnect_user", JSON.stringify({ ...cachedUser, ...d.user }));
        }
      } catch (err) {
        console.error("Failed to load admin profile:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [token]);

  const availableDistricts = useMemo(() => {
    return getDistrictsForState(formData.state);
  }, [formData.state]);

  const handleChange = (field, value) => {
    let sanitized = value;
    if (field === "phone") {
      // Keep only digits and limit to exactly 10 digits
      sanitized = value.replace(/\D/g, "").slice(0, 10);
    }

    setFormData((prev) => {
      const updated = { ...prev, [field]: sanitized };
      if (field === "state") {
        const validDistricts = getDistrictsForState(sanitized);
        if (!validDistricts.includes(prev.district)) {
          updated.district = "";
        }
      }
      return updated;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast("Administrator name is required", "error");
      return;
    }

    if (formData.phone && formData.phone.length > 0 && formData.phone.length !== 10) {
      showToast("Please enter a valid 10-digit mobile number", "error");
      return;
    }

    setSaving(true);
    try {
      const locationStr = formData.location.trim() || [formData.district, formData.state].filter(Boolean).join(", ");
      const res = await fetch(`${API_URL}/api/profile/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          location: locationStr,
          district: formData.district,
          state: formData.state,
        }),
      });

      const d = await res.json();
      if (d.success && d.user) {
        setFormData((prev) => ({ ...prev, ...d.user }));
        localStorage.setItem("agroconnect_user", JSON.stringify({ ...cachedUser, ...d.user }));
        showToast("Admin profile updated successfully!");
      } else {
        showToast(d.message || "Failed to update profile", "error");
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const initials = (formData.name || "Admin")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <style>{DS_ADMIN}</style>

      {/* ── Page Header ── */}
      <div className="pg-head">
        <div>
          <div className="eyebrow">Governance & Security</div>
          <h1 className="pg-title"><ShieldCheck size={22} strokeWidth={2} style={{ marginRight: 8, color: "#4f46e5", verticalAlign: "middle" }} />Administrative Profile & Access</h1>
          <p className="pg-sub">
            Manage your command center contact credentials, jurisdiction limits, and administrative privileges.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link to="/admin/dashboard" className="tab-btn" style={{ textDecoration: "none" }}>
            ← Control Center
          </Link>
          <Link to="/admin/audit-logs" className="tab-btn" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <FileText size={13} /> Audit Trail
          </Link>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={toast.type === "error" ? "toast-error" : "toast-success"}>
          {toast.msg}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 20 }}>
          <div className="skeleton" style={{ height: 420, borderRadius: 18 }} />
          <div className="skeleton" style={{ height: 420, borderRadius: 18 }} />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 24 }}>
          {/* ── LEFT COLUMN: EDIT FORM ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <div className="card-title"><User size={15} strokeWidth={1.75} style={{ marginRight: 6, color: "#4f46e5", verticalAlign: "middle" }} />Identity & Contact Credentials</div>
                <span className="badge badge-active" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><ShieldCheck size={11} /> SUPERADMIN</span>
              </div>

              <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label className="field-label">Administrator Full Name *</label>
                  <input
                    type="text"
                    className="field-input"
                    placeholder="e.g. Master Admin / Ajay Kumar"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label className="field-label">Email Address (Fixed Account)</label>
                    <input
                      type="email"
                      className="field-input"
                      value={formData.email}
                      disabled
                      style={{ opacity: 0.7, cursor: "not-allowed", background: "rgba(99,102,241,0.02)" }}
                    />
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <label className="field-label">Official Contact Phone (10 Digits)</label>
                      {formData.phone ? (
                        <span style={{ fontSize: 11, color: formData.phone.length === 10 ? "#4ade80" : "#fbbf24", fontWeight: 700 }}>
                          {formData.phone.length}/10
                        </span>
                      ) : null}
                    </div>
                    <input
                      type="tel"
                      className="field-input"
                      placeholder="e.g. 9876543210"
                      maxLength={10}
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                    />
                    {formData.phone && formData.phone.length > 0 && formData.phone.length !== 10 && (
                      <div style={{ fontSize: 11, color: "#b45309", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                        <AlertTriangle size={12} /> Enter exactly 10 digits ({formData.phone.length}/10)
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="field-label">Administrative Headquarters / Location</label>
                  <input
                    type="text"
                    className="field-input"
                    placeholder="e.g. AgroConnect Command Center, New Delhi"
                    value={formData.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label className="field-label">State / Union Territory</label>
                    <select
                      className="field-input"
                      style={{ cursor: "pointer", background: "rgba(99,102,241,0.06)" }}
                      value={formData.state}
                      onChange={(e) => handleChange("state", e.target.value)}
                    >
                      <option value="" style={{ background: "#0c0f24", color: "#a5b4fc" }}>
                        -- Select State --
                      </option>
                      {ALL_INDIA_STATES.map((st) => (
                        <option key={st} value={st} style={{ background: "#0c0f24", color: "#0f172a" }}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="field-label">District / Region</label>
                    <select
                      className="field-input"
                      style={{ cursor: "pointer", background: "rgba(99,102,241,0.06)" }}
                      value={formData.district}
                      onChange={(e) => handleChange("district", e.target.value)}
                      disabled={!formData.state}
                    >
                      <option value="" style={{ background: "#0c0f24", color: "#a5b4fc" }}>
                        {formData.state ? "-- Select District --" : "-- Select State first --"}
                      </option>
                      {availableDistricts.map((dst) => (
                        <option key={dst} value={dst} style={{ background: "#0c0f24", color: "#0f172a" }}>
                          {dst}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                  <div style={{ fontSize: 12, color: "#a5b4fc" }}>
                    {formData.state && formData.district ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><MapPin size={12} /> Jurisdiction: <strong style={{ color: "#15803d" }}>{formData.district}, {formData.state}</strong></span>
                    ) : (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><MapPin size={12} /> Select state &amp; district to configure your jurisdiction</span>
                    )}
                  </div>
                  <button type="submit" className="btn-indigo" disabled={saving} style={{ padding: "12px 28px", display: "inline-flex", alignItems: "center", gap: 6 }}>
                    {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Save size={14} />} Save Changes
                  </button>
                </div>
              </form>
            </div>

            {/* Security Protocol Card */}
            <div className="card">
              <div className="card-title" style={{ marginBottom: 12 }}><Lock size={15} strokeWidth={1.75} style={{ marginRight: 6, color: "#4f46e5", verticalAlign: "middle" }} />Security & Session Parameters</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13, color: "#a5b4fc" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "rgba(99,102,241,0.04)", borderRadius: 10 }}>
                  <span>Authentication Protocol:</span>
                  <strong style={{ color: "#15803d" }}>JWT Bearer (Signed)</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "rgba(99,102,241,0.04)", borderRadius: 10 }}>
                  <span>Role Authorization:</span>
                  <strong style={{ color: "#818cf8" }}>adminOnly Protected Route Middleware</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "rgba(99,102,241,0.04)", borderRadius: 10 }}>
                  <span>Audit Logging:</span>
                  <strong style={{ color: "#0369a1" }}>Active (All mutations committed to MongoDB)</strong>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: PRIVILEGE MATRIX & BADGE ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Identity Badge Card */}
            <div className="card" style={{ textAlign: "center", padding: "26px 20px" }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #4f46e5, #6366f1)",
                  color: "#0f172a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 26,
                  fontWeight: 800,
                  margin: "0 auto 14px",
                  boxShadow: "0 8px 24px rgba(99,102,241,0.4)",
                  border: "2px solid rgba(255,255,255,0.2)",
                }}
              >
                {initials}
              </div>

              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>
                {formData.name || "Administrator"}
              </h2>
              <div style={{ fontSize: 13, color: "#a5b4fc", marginBottom: 12 }}>{formData.email}</div>

              <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 16 }}>
                <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "rgba(248,113,113,0.15)", color: "#dc2626", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <ShieldCheck size={11} /> SUPERADMIN
                </span>
                <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "rgba(74,222,128,0.15)", color: "#15803d", fontWeight: 800 }}>
                  ● ACTIVE
                </span>
              </div>

              <div style={{ borderTop: "1px solid rgba(99,102,241,0.12)", paddingTop: 14, fontSize: 12, color: "#a5b4fc", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 10, textTransform: "uppercase", color: "#6366f1", fontWeight: 700 }}>Jurisdiction</div>
                  <div style={{ color: "#15803d", fontWeight: 700, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {formData.district && formData.state ? `${formData.district}, ${formData.state}` : "All India (Super)"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, textTransform: "uppercase", color: "#6366f1", fontWeight: 700 }}>Joined</div>
                  <div style={{ color: "#0f172a", fontWeight: 700, marginTop: 2 }}>{relativeTime(formData.createdAt)}</div>
                </div>
              </div>
            </div>

            {/* Administrative Privileges Matrix */}
            <div className="card">
              <div className="card-title" style={{ marginBottom: 14 }}><Zap size={15} strokeWidth={1.75} style={{ marginRight: 6, color: "#4f46e5", verticalAlign: "middle" }} />Administrative Authority Matrix</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {PRIVILEGES.map((p) => (
                  <div
                    key={p.module}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      background: "rgba(99,102,241,0.03)",
                      borderRadius: 10,
                      border: "1px solid rgba(99,102,241,0.08)",
                      gap: 10,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <span style={{ display: "flex", alignItems: "center", color: "#4f46e5" }}>{p.Icon && <p.Icon size={16} strokeWidth={1.75} />}</span>
                      <span style={{ fontWeight: 700, color: "#0f172a", fontSize: 13 }}>{p.module}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#15803d", fontWeight: 700, flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 3 }}>
                      <CheckCircle2 size={11} /> Granted
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Switch Role Card */}
            <div className="card" style={{ borderColor: "rgba(99,102,241,0.2)" }}>
              <div className="card-title" style={{ marginBottom: 10, color: "#818cf8" }}><RefreshCw size={15} strokeWidth={1.75} style={{ marginRight: 6, color: "#818cf8", verticalAlign: "middle" }} />Switch Role</div>
              <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 14, lineHeight: 1.6 }}>
                Need to view AgroConnect 360 as a farmer, buyer, seller, or exporter?
              </p>
              <button
                className="btn-ghost"
                style={{
                  width: "100%", justifyContent: "center", color: "#818cf8",
                  borderColor: "rgba(99,102,241,0.3)", padding: "12px", borderRadius: 12,
                  fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8
                }}
                onClick={() => navigate("/select-role", { state: { isNewUser: false } })}
              >
                <RefreshCw size={14} /> Change My Role
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
