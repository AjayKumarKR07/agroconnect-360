import { useState } from "react";

const DS_EXPORTER = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');
  .pg-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:16px;flex-wrap:wrap;}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#f59e0b;margin-bottom:6px;}
  .pg-title{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:800;color:#fff;line-height:1.2;}
  .pg-sub{font-size:14px;color:var(--text2);margin-top:6px;}
  .card{background:rgba(245,158,11,0.04);border:1px solid rgba(245,158,11,0.12);border-radius:18px;padding:20px 22px;}
  .btn-gold{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:12px;background:linear-gradient(135deg,#d97706,#f59e0b);color:#fff;font-weight:700;font-size:14px;border:none;cursor:pointer;font-family:'Inter',sans-serif;}
  .btn-ghost{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:10px;border:1px solid rgba(245,158,11,0.2);background:rgba(245,158,11,0.06);color:#fef08a;font-weight:600;font-size:12px;cursor:pointer;font-family:'Inter',sans-serif;}
`;

const DOCUMENTS = [
  { id: "doc-1", title: "Phytosanitary Certificate", authority: "Plant Quarantine Dept of India", status: "VERIFIED", expiry: "Valid till Sep 2026", color: "#4ade80", icon: "🌱" },
  { id: "doc-2", title: "Certificate of Origin", authority: "Indian Chamber of Commerce", status: "VERIFIED", expiry: "Valid till Dec 2026", color: "#4ade80", icon: "📜" },
  { id: "doc-3", title: "APEDA Registration (RCMC)", authority: "Ministry of Commerce & Industry", status: "ACTIVE", expiry: "Valid till Mar 2028", color: "#38bdf8", icon: "🏛️" },
  { id: "doc-4", title: "FSSAI Export License", authority: "FSSAI Food Safety Board", status: "ACTIVE", expiry: "Valid till Nov 2027", color: "#38bdf8", icon: "🛡️" },
  { id: "doc-5", title: "IEC Code (Import Export Code)", authority: "DGFT Directorate General", status: "VERIFIED", expiry: "Lifetime License", color: "#4ade80", icon: "📑" },
  { id: "doc-6", title: "GlobalGAP Certification", authority: "Control Union Inspections", status: "RENEWAL DUE", expiry: "Expiring in 14 days", color: "#fbbf24", icon: "⚠️" },
];

export default function ExportCompliance() {
  const [docs, setDocs] = useState(DOCUMENTS);
  const [downloadMsg, setDownloadMsg] = useState("");

  const downloadDoc = (title) => {
    setDownloadMsg(`📄 Generating Official PDF for ${title}…`);

    const pdfWindow = window.open("", "_blank");
    if (!pdfWindow) {
      alert("Please allow popups to download the PDF certificate.");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title} - AgroConnect 360 Export Compliance</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Space+Grotesk:wght@700;800&display=swap');
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; background: #fff; }
          .header { border-bottom: 3px solid #d97706; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
          .logo { font-family: 'Space Grotesk', sans-serif; font-size: 24px; font-weight: 800; color: #b45309; }
          .sub { font-size: 12px; color: #64748b; margin-top: 4px; }
          .title { font-family: 'Space Grotesk', sans-serif; font-size: 22px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin-bottom: 20px; }
          .badge { display: inline-block; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 13px; margin-bottom: 30px; }
          .table { width: 100%; border-collapse: collapse; margin: 24px 0; }
          .table th, .table td { border: 1px solid #cbd5e1; padding: 12px 16px; text-align: left; font-size: 13px; }
          .table th { background: #f8fafc; font-weight: 700; color: #334155; }
          .footer { margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 20px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #94a3b8; }
          .seal { border: 2px dashed #b45309; padding: 10px 18px; border-radius: 10px; color: #b45309; font-weight: 800; font-size: 12px; }
          @media print {
            body { padding: 20px; }
            @page { margin: 1cm; size: A4; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">🚢 AGROCONNECT 360</div>
            <div class="sub">Ministry of Commerce & Industry · Govt of India Authorized Portal</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px; font-weight: 700;">Ref No: AC360-EXP-${Math.floor(100000 + Math.random() * 900000)}</div>
            <div style="font-size: 11px; color: #64748b;">Date: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</div>
          </div>
        </div>

        <div class="title">${title}</div>
        <div class="badge">✓ VERIFIED & CUSTOMS CLEARED</div>

        <p style="font-size: 14px; line-height: 1.6; color: #334155;">
          This official document certifies that the agricultural shipment detailed below satisfies all mandatory regulatory, quality, and phytosanitary requirements stipulated by the <strong>Agricultural and Processed Food Products Export Development Authority (APEDA)</strong> and Indian Customs Authorities.
        </p>

        <table class="table">
          <thead>
            <tr>
              <th>Certificate / License</th>
              <th>Issuing Authority</th>
              <th>Validity & Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Phytosanitary Certificate</strong></td>
              <td>Plant Quarantine Dept of India</td>
              <td>Valid till Sep 2026 (Active)</td>
            </tr>
            <tr>
              <td><strong>Certificate of Origin</strong></td>
              <td>Indian Chamber of Commerce</td>
              <td>Valid till Dec 2026 (Verified)</td>
            </tr>
            <tr>
              <td><strong>APEDA RCMC Registration</strong></td>
              <td>Ministry of Commerce & Industry</td>
              <td>Valid till Mar 2028 (Active)</td>
            </tr>
            <tr>
              <td><strong>FSSAI Export Food License</strong></td>
              <td>Food Safety Board of India</td>
              <td>Valid till Nov 2027 (Active)</td>
            </tr>
            <tr>
              <td><strong>Import Export Code (IEC)</strong></td>
              <td>DGFT Directorate General</td>
              <td>Lifetime Authorization</td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          <div>
            <div>Authorized Signatory: <strong>Customs Officer & APEDA Auditor</strong></div>
            <div>Digital Verification Hash: SHA256-${Math.random().toString(36).substring(2, 12).toUpperCase()}</div>
          </div>
          <div class="seal">
            OFFICIAL STAMP<br/>AGROCONNECT 360 EXPORT
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    pdfWindow.document.write(htmlContent);
    pdfWindow.document.close();

    setTimeout(() => setDownloadMsg(""), 3500);
  };



  return (
    <>
      <style>{DS_EXPORTER}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Trade Compliance & Regulatory Vault</div>
          <h1 className="pg-title">📑 Export Customs & Certification Hub</h1>
          <p className="pg-sub">Manage mandatory phytosanitary, APEDA, FSSAI licenses, and customs clearance documents.</p>
        </div>
        <button className="btn-gold" onClick={() => downloadDoc("Export Clearance Package")}>
          📥 Download Full Compliance Vault
        </button>
      </div>

      {downloadMsg && (
        <div style={{ marginBottom: 20, padding: "12px 18px", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 14, color: "#fef08a", fontWeight: 700, fontSize: 14 }}>
          {downloadMsg}
        </div>
      )}

      {/* Compliance Overview Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18 }}>
        {docs.map(d => (
          <div key={d.id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <span style={{ fontSize: 32 }}>{d.icon}</span>
                <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: `${d.color}20`, color: d.color, fontWeight: 700, border: `1px solid ${d.color}40` }}>
                  ● {d.status}
                </span>
              </div>

              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 4 }}>
                {d.title}
              </div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 12 }}>
                Issuing Body: <strong style={{ color: "#fff" }}>{d.authority}</strong>
              </div>

              <div style={{ fontSize: 11, color: "var(--text2)", background: "rgba(0,0,0,0.2)", padding: "8px 12px", borderRadius: 10, marginBottom: 16 }}>
                📅 {d.expiry}
              </div>
            </div>

            <button className="btn-ghost" style={{ width: "100%", justifyContent: "center" }} onClick={() => downloadDoc(d.title)}>
              📥 View & Download Certificate PDF
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
