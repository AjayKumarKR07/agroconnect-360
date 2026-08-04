/* ── AgroConnect 360 — Shared Dashboard Styles ────────────────────────── */
/* Import this in any dashboard page for consistent dark-theme primitives  */

export const DS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');

  :root{
    --bg:#050a0e; --bg2:#080d12;
    --surface:rgba(255,255,255,0.04); --surface2:rgba(255,255,255,0.07);
    --border:rgba(255,255,255,0.07); --border2:rgba(255,255,255,0.12);
    --text:#f0f6ff; --text2:#7a8fa6;
    --green:#22c55e; --green-dim:rgba(34,197,94,0.12);
    --red:rgba(239,68,68,0.1); --red-text:#f87171;
    --amber:rgba(251,191,36,0.1); --amber-text:#fde68a;
    --blue:rgba(56,189,248,0.1); --blue-text:#7dd3fc;
    --purple:rgba(167,139,250,0.1); --purple-text:#c4b5fd;
  }

  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text);}

  /* Page header */
  .pg-head{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:16px;margin-bottom:28px;}
  .pg-title{font-family:'Space Grotesk',sans-serif;font-size:clamp(22px,3vw,30px);font-weight:800;color:#fff;letter-spacing:-0.02em;}
  .pg-sub{font-size:14px;color:var(--text2);margin-top:4px;}

  /* Stat cards */
  .stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:28px;}
  .stat-card{
    background:var(--surface);border:1px solid var(--border);
    border-radius:18px;padding:22px 24px;
    position:relative;overflow:hidden;
    transition:transform 0.2s,border-color 0.2s,box-shadow 0.2s;
  }
  .stat-card:hover{transform:translateY(-2px);border-color:var(--border2);box-shadow:0 12px 32px rgba(0,0,0,0.4);}
  .stat-card::before{content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);width:60%;height:1px;background:linear-gradient(90deg,transparent,rgba(34,197,94,0.35),transparent);}
  .stat-emoji{font-size:26px;margin-bottom:12px;}
  .stat-val{font-family:'Space Grotesk',sans-serif;font-size:32px;font-weight:800;color:#fff;}
  .stat-lbl{font-size:13px;color:var(--text2);margin-top:4px;}
  .stat-trend{font-size:12px;font-weight:600;margin-top:6px;display:flex;align-items:center;gap:4px;}
  .stat-glow{position:absolute;width:80px;height:80px;border-radius:50%;filter:blur(24px);top:-20px;right:-20px;opacity:0.25;}

  /* Card / Panel */
  .card{background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:24px;}
  .card-title{font-family:'Space Grotesk',sans-serif;font-size:17px;font-weight:700;color:#fff;margin-bottom:4px;}
  .card-sub{font-size:13px;color:var(--text2);}

  /* Buttons */
  .btn-green{
    display:inline-flex;align-items:center;gap:8px;
    background:linear-gradient(135deg,#16a34a,#059669);
    color:#fff;font-weight:700;font-size:14px;
    padding:11px 22px;border-radius:12px;border:none;cursor:pointer;
    box-shadow:0 6px 20px rgba(34,197,94,0.25);
    transition:transform 0.2s,box-shadow 0.2s;
    font-family:'Inter',sans-serif; text-decoration:none;
  }
  .btn-green:hover{transform:translateY(-1px);box-shadow:0 12px 32px rgba(34,197,94,0.35);}

  .btn-ghost{
    display:inline-flex;align-items:center;gap:8px;
    background:var(--surface);border:1px solid var(--border2);
    color:var(--text);font-weight:600;font-size:14px;
    padding:10px 18px;border-radius:12px;border:1px solid var(--border2);
    cursor:pointer;transition:background 0.2s;
    font-family:'Inter',sans-serif; text-decoration:none;
  }
  .btn-ghost:hover{background:var(--surface2);}

  .btn-danger{
    display:inline-flex;align-items:center;gap:8px;
    background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);
    color:#f87171;font-weight:600;font-size:14px;
    padding:10px 18px;border-radius:12px;
    cursor:pointer;transition:background 0.2s;
    font-family:'Inter',sans-serif;
  }
  .btn-danger:hover{background:rgba(239,68,68,0.18);}

  /* Badges */
  .badge{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:6px;font-size:12px;font-weight:600;}
  .badge-green{background:rgba(34,197,94,0.12);color:#4ade80;border:1px solid rgba(34,197,94,0.2);}
  .badge-amber{background:rgba(251,191,36,0.12);color:#fde68a;border:1px solid rgba(251,191,36,0.2);}
  .badge-red{background:rgba(239,68,68,0.12);color:#f87171;border:1px solid rgba(239,68,68,0.2);}
  .badge-blue{background:rgba(56,189,248,0.12);color:#7dd3fc;border:1px solid rgba(56,189,248,0.2);}
  .badge-purple{background:rgba(167,139,250,0.12);color:#c4b5fd;border:1px solid rgba(167,139,250,0.2);}

  /* Form elements */
  .field-label{font-size:12px;font-weight:600;color:var(--text2);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;display:block;}
  .field-input{
    width:100%;background:var(--surface);border:1px solid var(--border2);
    border-radius:12px;padding:12px 16px;color:var(--text);
    font-size:14px;font-family:'Inter',sans-serif;outline:none;
    transition:border-color 0.2s,box-shadow 0.2s;
  }
  .field-input::placeholder{color:var(--text2);}
  .field-input:focus{border-color:rgba(34,197,94,0.4);box-shadow:0 0 0 4px rgba(34,197,94,0.07);}
  .field-select{appearance:none;}

  /* Table */
  .data-table{width:100%;border-collapse:collapse;}
  .data-table th{text-align:left;font-size:12px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:0.06em;padding:0 16px 12px;border-bottom:1px solid var(--border);}
  .data-table td{padding:14px 16px;font-size:14px;color:var(--text);border-bottom:1px solid var(--border);}
  .data-table tr:last-child td{border-bottom:none;}
  .data-table tbody tr:hover{background:var(--surface);}

  /* Alerts */
  .alert-error{display:flex;align-items:center;gap:10px;padding:14px 16px;border-radius:12px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);color:#fca5a5;font-size:14px;margin-bottom:20px;}
  .alert-success{display:flex;align-items:center;gap:10px;padding:14px 16px;border-radius:12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);color:#86efac;font-size:14px;margin-bottom:20px;}
  .alert-warn{display:flex;align-items:center;gap:10px;padding:14px 16px;border-radius:12px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.2);color:#fde68a;font-size:14px;margin-bottom:20px;}

  /* Empty state */
  .empty-state{text-align:center;padding:64px 24px;}
  .empty-emoji{font-size:56px;margin-bottom:16px;}
  .empty-title{font-size:20px;font-weight:700;color:#fff;margin-bottom:8px;font-family:'Space Grotesk',sans-serif;}
  .empty-sub{font-size:14px;color:var(--text2);margin-bottom:24px;}

  /* Loading spinner */
  .spinner{width:32px;height:32px;border:3px solid rgba(255,255,255,0.1);border-top-color:var(--green);border-radius:50%;animation:spin 0.7s linear infinite;margin:0 auto;}
  @keyframes spin{to{transform:rotate(360deg)}}
  .loading-wrap{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:64px;gap:16px;color:var(--text2);font-size:14px;}

  /* Divider */
  .divider{height:1px;background:var(--border);margin:24px 0;}

  /* Section eyebrow */
  .eyebrow{font-size:11px;font-weight:700;color:var(--green);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;}
`;
