import { useState } from "react";
import { DS_ADMIN } from "./adminStyles";
import { Settings, Shield, Bell, Globe, Palette, Database, Save, CheckCircle2 } from "lucide-react";

const SECTIONS = [
  {
    id: "general",
    icon: Globe,
    label: "General",
    color: "#4f46e5",
    settings: [
      { key:"siteName",      label:"Platform Name",          type:"text",   value:"AgroConnect 360",        hint:"Displayed in the browser tab and emails." },
      { key:"supportEmail",  label:"Support Email",          type:"email",  value:"support@agroconnect.in", hint:"Users will contact this address." },
      { key:"timezone",      label:"Default Timezone",       type:"select", value:"Asia/Kolkata",            options:["Asia/Kolkata","UTC","America/New_York","Europe/London"], hint:"Used for timestamps across the platform." },
      { key:"currency",      label:"Base Currency",          type:"select", value:"INR",                     options:["INR","USD","EUR","GBP"], hint:"Default currency for prices and transactions." },
    ],
  },
  {
    id: "security",
    icon: Shield,
    label: "Security",
    color: "#dc2626",
    settings: [
      { key:"otpExpiry",      label:"OTP Expiry (minutes)",   type:"number", value:"10",   hint:"Time before OTP codes expire." },
      { key:"sessionTimeout", label:"Session Timeout (hours)", type:"number", value:"24",  hint:"Inactive sessions expire after this period." },
      { key:"maxLoginAttempts",label:"Max Login Attempts",    type:"number", value:"5",    hint:"Account locked after this many failed attempts." },
    ],
  },
  {
    id: "notifications",
    icon: Bell,
    label: "Notifications",
    color: "#d97706",
    settings: [
      { key:"emailNotifs",    label:"Email Notifications",    type:"toggle", value:true,   hint:"Send system emails to users." },
      { key:"broadcastEnabled",label:"Admin Broadcast",       type:"toggle", value:true,   hint:"Allow admins to send platform-wide messages." },
      { key:"disputeAlerts",  label:"Dispute Alerts",         type:"toggle", value:true,   hint:"Notify admin on new disputes." },
    ],
  },
  {
    id: "platform",
    icon: Database,
    label: "Platform",
    color: "#0284c7",
    settings: [
      { key:"registrationOpen", label:"Open Registration",   type:"toggle", value:true,   hint:"Allow new users to register." },
      { key:"maintenanceMode",  label:"Maintenance Mode",    type:"toggle", value:false,  hint:"Show a maintenance page to all visitors." },
      { key:"maxCropsPerFarmer",label:"Max Crops per Farmer",type:"number", value:"50",   hint:"Maximum crop listings a farmer can create." },
    ],
  },
];

export default function AdminSettings() {
  const [activeSection, setActiveSection] = useState("general");
  const [saved, setSaved] = useState(false);
  const [values, setValues] = useState(() => {
    const init = {};
    SECTIONS.forEach(sec => sec.settings.forEach(s => { init[s.key] = s.value; }));
    return init;
  });

  const handleSave = () => {
    // In production this would call the settings API
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const sec = SECTIONS.find(s => s.id === activeSection);

  return (
    <>
      <style>{DS_ADMIN}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Administration</div>
          <h1 className="pg-title" style={{ display:"flex", alignItems:"center", gap:8 }}>
            <Settings size={22} color="#4f46e5" />Platform Settings
          </h1>
          <p className="pg-sub">Configure global platform behavior, security, and preferences.</p>
        </div>
        <button className="btn-indigo" onClick={handleSave} style={{ display:"inline-flex", alignItems:"center", gap:6 }}>
          {saved ? <><CheckCircle2 size={14} />Saved!</> : <><Save size={14} />Save Changes</>}
        </button>
      </div>

      {saved && (
        <div className="toast-success" style={{ marginBottom:20, display:"flex", alignItems:"center", gap:8 }}>
          <CheckCircle2 size={16} color="#166534" /> Settings saved successfully.
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"220px 1fr", gap:20 }}>
        {/* Sidebar nav */}
        <div className="card" style={{ padding:12, height:"fit-content" }}>
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              style={{
                display:"flex", alignItems:"center", gap:10, width:"100%", padding:"10px 12px",
                borderRadius:9, border:"none", cursor:"pointer", textAlign:"left", fontFamily:"'Inter',sans-serif",
                background: activeSection===s.id ? "#e0e7ff" : "transparent",
                color:      activeSection===s.id ? "#4338ca" : "#475569",
                fontWeight: activeSection===s.id ? 700 : 500,
                fontSize:13, marginBottom:2, transition:"all 0.15s",
              }}
            >
              <s.icon size={15} color={activeSection===s.id ? s.color : "#94a3b8"} />
              {s.label}
            </button>
          ))}
        </div>

        {/* Settings form */}
        {sec && (
          <div className="card">
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:24, paddingBottom:16, borderBottom:"1px solid #f1f5f9" }}>
              <div style={{ width:40, height:40, borderRadius:10, background:sec.color+"15", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <sec.icon size={18} color={sec.color} />
              </div>
              <div>
                <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:16, fontWeight:700, color:"#0f172a" }}>{sec.label} Settings</div>
                <div style={{ fontSize:12, color:"#64748b" }}>Configure {sec.label.toLowerCase()} preferences</div>
              </div>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              {sec.settings.map(s => (
                <div key={s.key}>
                  {s.type === "toggle" ? (
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 16px", borderRadius:10, border:"1px solid #e2e8f0", background:"#f8fafc" }}>
                      <div>
                        <div style={{ fontSize:14, fontWeight:600, color:"#0f172a", marginBottom:2 }}>{s.label}</div>
                        <div style={{ fontSize:12, color:"#64748b" }}>{s.hint}</div>
                      </div>
                      <button
                        onClick={() => setValues(p => ({ ...p, [s.key]: !p[s.key] }))}
                        style={{
                          width:44, height:24, borderRadius:12, border:"none", cursor:"pointer", flexShrink:0,
                          background: values[s.key] ? "#4f46e5" : "#e2e8f0",
                          position:"relative", transition:"background 0.2s",
                        }}
                      >
                        <span style={{
                          position:"absolute", top:2, left: values[s.key] ? 22 : 2,
                          width:20, height:20, borderRadius:"50%", background:"#ffffff",
                          transition:"left 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)",
                        }} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label className="field-label">{s.label}</label>
                      {s.type === "select" ? (
                        <select className="field-input" value={values[s.key]} onChange={e => setValues(p => ({ ...p, [s.key]: e.target.value }))}>
                          {s.options.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input className="field-input" type={s.type} value={values[s.key]} onChange={e => setValues(p => ({ ...p, [s.key]: e.target.value }))} />
                      )}
                      {s.hint && <div style={{ fontSize:11, color:"#94a3b8", marginTop:4 }}>{s.hint}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop:28, paddingTop:16, borderTop:"1px solid #f1f5f9", display:"flex", justifyContent:"flex-end" }}>
              <button className="btn-indigo" onClick={handleSave} style={{ display:"inline-flex", alignItems:"center", gap:6 }}>
                {saved ? <><CheckCircle2 size={14} />Saved!</> : <><Save size={14} />Save {sec.label} Settings</>}
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop:20, padding:"14px 18px", borderRadius:12, background:"#fffbeb", border:"1px solid #fde68a", display:"flex", gap:10, alignItems:"flex-start" }}>
        <Palette size={16} color="#d97706" style={{ flexShrink:0, marginTop:1 }} />
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:"#92400e" }}>Note on Settings</div>
          <div style={{ fontSize:12, color:"#b45309", marginTop:2 }}>
            These settings are currently stored locally and for demonstration. Backend persistence via <code>/api/admin/settings</code> can be wired when ready.
          </div>
        </div>
      </div>
    </>
  );
}