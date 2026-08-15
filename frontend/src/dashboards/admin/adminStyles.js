// Shared Admin Design System — imported by all admin dashboard components
// Keeps DS_ADMIN in one place so changes propagate everywhere

export const DS_ADMIN = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');

  /* ── Layout ── */
  .pg-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:16px;flex-wrap:wrap;}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#818cf8;margin-bottom:6px;}
  .pg-title{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:800;color:#fff;line-height:1.2;}
  .pg-sub{font-size:14px;color:#a5b4fc;margin-top:6px;}

  /* ── Cards ── */
  .card{background:rgba(99,102,241,0.04);border:1px solid rgba(99,102,241,0.12);border-radius:18px;padding:20px 22px;}
  .card-title{font-family:'Space Grotesk',sans-serif;font-size:16px;font-weight:800;color:#fff;}

  /* ── Buttons ── */
  .btn-indigo{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:12px;background:linear-gradient(135deg,#4f46e5,#6366f1);color:#fff;font-weight:700;font-size:14px;border:none;cursor:pointer;text-decoration:none;font-family:'Inter',sans-serif;}
  .btn-indigo:hover{opacity:0.9;}
  .btn-danger{display:inline-flex;align-items:center;gap:8px;padding:8px 16px;border-radius:10px;border:1px solid rgba(239,68,68,0.3);background:rgba(239,68,68,0.08);color:#f87171;font-weight:700;font-size:13px;cursor:pointer;font-family:'Inter',sans-serif;}
  .btn-success{display:inline-flex;align-items:center;gap:8px;padding:8px 16px;border-radius:10px;border:1px solid rgba(34,197,94,0.3);background:rgba(34,197,94,0.08);color:#4ade80;font-weight:700;font-size:13px;cursor:pointer;font-family:'Inter',sans-serif;}

  /* ── Tabs ── */
  .tab-btn{padding:7px 16px;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;border:1px solid rgba(99,102,241,0.15);background:rgba(99,102,241,0.04);color:#a5b4fc;transition:all 0.2s;font-family:'Inter',sans-serif;}
  .tab-btn.active{background:rgba(99,102,241,0.2);color:#fff;border-color:#6366f1;}

  /* ── Form fields ── */
  .field-label{display:block;font-size:12px;font-weight:700;color:#a5b4fc;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.04em;}
  .field-input{width:100%;padding:10px 14px;border-radius:11px;border:1px solid rgba(99,102,241,0.18);background:rgba(99,102,241,0.05);color:#fff;font-size:14px;font-family:'Inter',sans-serif;outline:none;box-sizing:border-box;}
  .field-input:focus{border-color:rgba(99,102,241,0.4);}
  .field-input option{background:#0c0f24;color:#fff;}

  /* ── Spinner ── */
  .spinner{width:22px;height:22px;border:3px solid rgba(99,102,241,0.15);border-top-color:#818cf8;border-radius:50%;animation:spin 0.8s linear infinite;display:inline-block;flex-shrink:0;}
  @keyframes spin{to{transform:rotate(360deg)}}
  .loading-wrap{display:flex;align-items:center;justify-content:center;gap:12px;padding:60px 0;color:#a5b4fc;}

  /* ── Skeleton ── */
  .skeleton{background:linear-gradient(90deg,rgba(99,102,241,0.06) 25%,rgba(99,102,241,0.12) 50%,rgba(99,102,241,0.06) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:10px;}
  @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

  /* ── Toast / Alert ── */
  .toast-success{padding:12px 18px;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.25);border-radius:14px;color:#4ade80;font-weight:700;font-size:14px;margin-bottom:20px;}
  .toast-error{padding:12px 18px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);border-radius:14px;color:#f87171;font-weight:700;font-size:14px;margin-bottom:20px;}

  /* ── Error state ── */
  .error-state{text-align:center;padding:40px 20px;}
  .error-state-icon{font-size:40px;margin-bottom:12px;}
  .error-state-msg{color:#f87171;font-weight:700;font-size:15px;margin-bottom:8px;}
  .error-state-sub{color:#a5b4fc;font-size:13px;margin-bottom:16px;}

  /* ── Empty state ── */
  .empty-state{text-align:center;padding:40px 20px;}
  .empty-state-icon{font-size:40px;margin-bottom:12px;}
  .empty-state-msg{color:#fff;font-weight:700;font-size:15px;margin-bottom:6px;}
  .empty-state-sub{color:#a5b4fc;font-size:13px;}

  /* ── Modal overlay ── */
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(6px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;}
  .modal-box{background:#0c0f24;border:1px solid rgba(99,102,241,0.25);border-radius:20px;padding:28px;max-width:460px;width:100%;box-shadow:0 24px 60px rgba(0,0,0,0.5);}
  .modal-title{font-family:'Space Grotesk',sans-serif;font-size:18px;font-weight:800;color:#fff;margin-bottom:12px;}
  .modal-body{font-size:14px;color:#a5b4fc;margin-bottom:20px;line-height:1.6;}
  .modal-actions{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;}

  /* ── Pagination ── */
  .pagination{display:flex;align-items:center;gap:6px;margin-top:20px;justify-content:center;flex-wrap:wrap;}
  .page-btn{padding:6px 12px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;border:1px solid rgba(99,102,241,0.15);background:rgba(99,102,241,0.04);color:#a5b4fc;font-family:'Inter',sans-serif;transition:all 0.15s;}
  .page-btn:hover{background:rgba(99,102,241,0.12);color:#fff;}
  .page-btn.active{background:rgba(99,102,241,0.25);color:#fff;border-color:#6366f1;}
  .page-btn:disabled{opacity:0.4;cursor:not-allowed;}

  /* ── Table ── */
  .admin-table{width:100%;border-collapse:collapse;text-align:left;font-size:13px;}
  .admin-table th{padding:12px 16px;background:rgba(99,102,241,0.08);border-bottom:1px solid rgba(99,102,241,0.14);color:#a5b4fc;text-transform:uppercase;font-size:11px;font-weight:700;white-space:nowrap;}
  .admin-table td{padding:13px 16px;border-bottom:1px solid rgba(99,102,241,0.06);vertical-align:middle;}
  .admin-table tr:last-child td{border-bottom:none;}

  /* ── Badge ── */
  .badge{display:inline-block;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:800;text-transform:uppercase;}
  .badge-active{background:rgba(34,197,94,0.15);color:#4ade80;}
  .badge-suspended{background:rgba(239,68,68,0.15);color:#f87171;}
  .badge-pending{background:rgba(251,191,36,0.12);color:#fbbf24;}
  .badge-info{background:rgba(99,102,241,0.15);color:#c7d2fe;}

  /* ── Responsive table wrapper ── */
  .table-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;}
`;

// Role color map (consistent across all admin components)
export const ROLE_COLOR = {
  farmer: "#4ade80",
  seller: "#a78bfa",
  user: "#38bdf8",
  exporter: "#fbbf24",
  admin: "#f87171",
};

// Indian number formatter
export const fmtINR = (n) => {
  if (!n && n !== 0) return "—";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
};

// Short relative time
export const relativeTime = (dateStr) => {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};
