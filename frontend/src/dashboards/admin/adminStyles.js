// Shared Admin Design System — imported by all admin dashboard components
// Keeps DS_ADMIN in one place so changes propagate everywhere

export const DS_ADMIN = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');

  /* ── Layout ── */
  .pg-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
  .eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #4f46e5; margin-bottom: 4px; }
  .pg-title { font-family: 'Space Grotesk', sans-serif; font-size: 26px; font-weight: 800; color: #0f172a; line-height: 1.2; }
  .pg-sub { font-size: 14px; color: #64748b; margin-top: 4px; }

  /* ── Cards ── */
  .card {
    background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;
    padding: 20px 22px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);
  }
  .card-title { font-family: 'Space Grotesk', sans-serif; font-size: 16px; font-weight: 700; color: #0f172a; }

  /* ── Buttons ── */
  .btn-indigo {
    display: inline-flex; align-items: center; gap: 8px; padding: 9px 18px;
    border-radius: 10px; background: #4f46e5; color: #ffffff; font-weight: 600;
    font-size: 14px; border: none; cursor: pointer; text-decoration: none;
    font-family: 'Inter', sans-serif; transition: background 0.15s;
  }
  .btn-indigo:hover { background: #4338ca; }
  .btn-danger {
    display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px;
    border-radius: 9px; border: 1px solid #fecaca; background: #fef2f2;
    color: #dc2626; font-weight: 600; font-size: 13px; cursor: pointer;
    font-family: 'Inter', sans-serif; transition: background 0.15s;
  }
  .btn-danger:hover { background: #fee2e2; }
  .btn-success {
    display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px;
    border-radius: 9px; border: 1px solid #bbf7d0; background: #f0fdf4;
    color: #16a34a; font-weight: 600; font-size: 13px; cursor: pointer;
    font-family: 'Inter', sans-serif; transition: background 0.15s;
  }
  .btn-success:hover { background: #dcfce7; }

  /* ── Tabs ── */
  .tab-btn {
    padding: 7px 16px; border-radius: 8px; font-size: 12px; font-weight: 600;
    cursor: pointer; border: 1px solid #e2e8f0; background: #ffffff;
    color: #64748b; transition: all 0.15s; font-family: 'Inter', sans-serif;
  }
  .tab-btn:hover { background: #f8fafc; color: #0f172a; }
  .tab-btn.active { background: #e0e7ff; color: #4338ca; border-color: #c7d2fe; font-weight: 700; }

  /* ── Form fields ── */
  .field-label { display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.04em; }
  .field-input {
    width: 100%; padding: 10px 14px; border-radius: 10px; border: 1px solid #cbd5e1;
    background: #ffffff; color: #0f172a; font-size: 14px; font-family: 'Inter', sans-serif;
    outline: none; box-sizing: border-box; transition: border-color 0.15s;
  }
  .field-input:focus { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }
  .field-input option { background: #ffffff; color: #0f172a; }

  /* ── Spinner ── */
  .spinner { width: 22px; height: 22px; border: 3px solid #e2e8f0; border-top-color: #4f46e5; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; flex-shrink: 0; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-wrap { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 60px 0; color: #64748b; font-size: 14px; }

  /* ── Skeleton ── */
  .skeleton { background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 8px; }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  /* ── Toast / Alert ── */
  .toast-success { padding: 12px 18px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; color: #166534; font-weight: 600; font-size: 14px; margin-bottom: 20px; }
  .toast-error { padding: 12px 18px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; color: #991b1b; font-weight: 600; font-size: 14px; margin-bottom: 20px; }

  /* ── Error state ── */
  .error-state { text-align: center; padding: 40px 20px; }
  .error-state-icon { font-size: 40px; margin-bottom: 12px; }
  .error-state-msg { color: #dc2626; font-weight: 700; font-size: 15px; margin-bottom: 6px; }
  .error-state-sub { color: #64748b; font-size: 13px; margin-bottom: 16px; }

  /* ── Empty state ── */
  .empty-state { text-align: center; padding: 40px 20px; }
  .empty-state-icon { font-size: 40px; margin-bottom: 12px; }
  .empty-state-msg { color: #0f172a; font-weight: 700; font-size: 15px; margin-bottom: 4px; }
  .empty-state-sub { color: #64748b; font-size: 13px; }

  /* ── Modal overlay ── */
  .modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.6); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .modal-box { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 26px; max-width: 460px; width: 100%; box-shadow: 0 20px 40px rgba(0,0,0,0.12); }
  .modal-title { font-family: 'Space Grotesk', sans-serif; font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 10px; }
  .modal-body { font-size: 14px; color: #475569; margin-bottom: 20px; line-height: 1.6; }
  .modal-actions { display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }

  /* ── Pagination ── */
  .pagination { display: flex; align-items: center; gap: 6px; margin-top: 20px; justify-content: center; flex-wrap: wrap; }
  .page-btn { padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid #cbd5e1; background: #ffffff; color: #475569; font-family: 'Inter', sans-serif; transition: all 0.15s; }
  .page-btn:hover { background: #f8fafc; color: #0f172a; }
  .page-btn.active { background: #4f46e5; color: #ffffff; border-color: #4f46e5; }
  .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* ── Table ── */
  .admin-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
  .admin-table th { padding: 12px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; color: #64748b; text-transform: uppercase; font-size: 11px; font-weight: 700; white-space: nowrap; }
  .admin-table td { padding: 13px 16px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; color: #1e293b; }
  .admin-table tr:last-child td { border-bottom: none; }
  .admin-table tbody tr:hover { background: #f8fafc; }

  /* ── Badge ── */
  .badge { display: inline-block; padding: 3px 9px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
  .badge-active { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
  .badge-suspended { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }
  .badge-pending { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
  .badge-info { background: #e0e7ff; color: #4338ca; border: 1px solid #c7d2fe; }

  /* ── Responsive table wrapper ── */
  .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
`;

// Role color map (consistent across all admin components)
export const ROLE_COLOR = {
  farmer: "#16a34a",
  seller: "#7c3aed",
  user: "#0284c7",
  exporter: "#d97706",
  admin: "#dc2626",
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
