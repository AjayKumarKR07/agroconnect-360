/* ── AgroConnect 360 — Clean Modern Agriculture Dashboard Styles ──────── */
/* Import this in any dashboard page for consistent clean light primitives */

export const DS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');

  :root {
    --bg: #f8fafc;
    --bg2: #f1f5f9;
    --surface: #ffffff;
    --surface2: #f8fafc;
    --border: #e2e8f0;
    --border2: #cbd5e1;
    --text: #0f172a;
    --text2: #64748b;
    --green: #16a34a;
    --green-dim: #ecfdf5;
    --green-text: #15803d;
    --red: #fef2f2;
    --red-text: #dc2626;
    --amber: #fffbeb;
    --amber-text: #d97706;
    --blue: #f0f9ff;
    --blue-text: #0284c7;
    --purple: #faf5ff;
    --purple-text: #7c3aed;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); }

  /* Page header */
  .pg-head { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; }
  .pg-title { font-family: 'Space Grotesk', sans-serif; font-size: clamp(22px, 3vw, 28px); font-weight: 800; color: var(--text); letter-spacing: -0.02em; }
  .pg-sub { font-size: 14px; color: var(--text2); margin-top: 4px; }

  /* Section header inside a card */
  .section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; gap: 12px; flex-wrap: wrap; }
  .section-title { font-family: 'Space Grotesk', sans-serif; font-size: 16px; font-weight: 700; color: var(--text); }
  .section-sub { font-size: 13px; color: var(--text2); margin-top: 2px; }

  /* Stat cards */
  .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
  .stat-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 16px; padding: 20px 22px;
    position: relative; overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02);
    transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
  }
  .stat-card:hover { transform: translateY(-2px); border-color: var(--border2); box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
  .stat-emoji { font-size: 26px; margin-bottom: 10px; }
  .stat-icon { display: flex; align-items: center; margin-bottom: 10px; }
  .stat-val { font-family: 'Space Grotesk', sans-serif; font-size: 30px; font-weight: 800; color: var(--text); }
  .stat-lbl { font-size: 13px; color: var(--text2); margin-top: 4px; font-weight: 500; }
  .stat-trend { font-size: 12px; font-weight: 600; margin-top: 6px; display: flex; align-items: center; gap: 4px; }
  .stat-glow { display: none; }

  /* Card / Panel */
  .card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 16px; padding: 22px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.03);
  }
  .card-title { font-family: 'Space Grotesk', sans-serif; font-size: 17px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
  .card-sub { font-size: 13px; color: var(--text2); }

  /* Buttons */
  .btn-green {
    display: inline-flex; align-items: center; gap: 8px;
    background: #16a34a;
    color: #ffffff; font-weight: 600; font-size: 14px;
    padding: 10px 20px; border-radius: 10px; border: none; cursor: pointer;
    box-shadow: 0 2px 4px rgba(22,163,74,0.18);
    transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
    font-family: 'Inter', sans-serif; text-decoration: none;
  }
  .btn-green:hover { background: #15803d; transform: translateY(-1px); box-shadow: 0 4px 10px rgba(22,163,74,0.25); }
  .btn-green:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

  .btn-ghost {
    display: inline-flex; align-items: center; gap: 8px;
    background: var(--surface); border: 1px solid var(--border2);
    color: #334155; font-weight: 600; font-size: 14px;
    padding: 9px 18px; border-radius: 10px;
    cursor: pointer; transition: background 0.15s, border-color 0.15s;
    font-family: 'Inter', sans-serif; text-decoration: none;
  }
  .btn-ghost:hover { background: var(--bg2); border-color: #94a3b8; }

  .btn-danger {
    display: inline-flex; align-items: center; gap: 8px;
    background: #fef2f2; border: 1px solid #fecaca;
    color: #dc2626; font-weight: 600; font-size: 14px;
    padding: 9px 18px; border-radius: 10px;
    cursor: pointer; transition: background 0.15s;
    font-family: 'Inter', sans-serif;
  }
  .btn-danger:hover { background: #fee2e2; }

  .btn-sm {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 12px; font-weight: 600; padding: 6px 12px;
    border-radius: 8px; cursor: pointer;
    font-family: 'Inter', sans-serif; border: none;
    transition: all 0.15s;
  }

  /* Badges */
  .badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em; }
  .badge-green  { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
  .badge-amber  { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
  .badge-red    { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }
  .badge-blue   { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
  .badge-purple { background: #f3e8ff; color: #7e22ce; border: 1px solid #e9d5ff; }
  .badge-gray   { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }

  /* Form elements */
  .field-label { font-size: 12px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 6px; display: block; }
  .field-input {
    width: 100%; background: #ffffff; border: 1px solid var(--border2);
    border-radius: 10px; padding: 11px 14px; color: var(--text);
    font-size: 14px; font-family: 'Inter', sans-serif; outline: none;
    transition: border-color 0.2s, box-shadow 0.2s; box-sizing: border-box;
  }
  .field-input::placeholder { color: #94a3b8; }
  .field-input:focus { border-color: #16a34a; box-shadow: 0 0 0 3px rgba(22,163,74,0.12); }
  .field-select { appearance: none; }

  /* Info row (label: value pairs) */
  .info-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f1f5f9; gap: 16px; }
  .info-row:last-child { border-bottom: none; }
  .info-label { font-size: 13px; color: var(--text2); font-weight: 500; }
  .info-value { font-size: 13px; color: var(--text); font-weight: 600; text-align: right; }

  /* Action row (button group at top of card) */
  .action-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }

  /* Table */
  .data-table { width: 100%; border-collapse: collapse; }
  .data-table th { text-align: left; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; padding: 12px 16px; border-bottom: 1px solid var(--border); background: #f8fafc; white-space: nowrap; }
  .data-table td { padding: 14px 16px; font-size: 14px; color: #1e293b; border-bottom: 1px solid var(--border); vertical-align: middle; }
  .data-table tr:last-child td { border-bottom: none; }
  .data-table tbody tr:hover { background: #f8fafc; }

  /* Scrollable table wrapper */
  .table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }

  /* Tabs */
  .tab-row { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 20px; padding: 4px; background: #f1f5f9; border-radius: 12px; width: fit-content; }
  .tab-btn {
    padding: 7px 16px; border-radius: 9px; font-size: 13px; font-weight: 600;
    cursor: pointer; border: none; background: transparent;
    color: #64748b; transition: all 0.15s; font-family: 'Inter', sans-serif;
  }
  .tab-btn:hover { color: #0f172a; background: rgba(255,255,255,0.7); }
  .tab-btn.active { background: #ffffff; color: #0f172a; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }

  /* Alerts */
  .alert-error   { display: flex; align-items: flex-start; gap: 10px; padding: 12px 16px; border-radius: 10px; background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; font-size: 14px; margin-bottom: 16px; }
  .alert-success { display: flex; align-items: flex-start; gap: 10px; padding: 12px 16px; border-radius: 10px; background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; font-size: 14px; margin-bottom: 16px; }
  .alert-warn    { display: flex; align-items: flex-start; gap: 10px; padding: 12px 16px; border-radius: 10px; background: #fffbeb; border: 1px solid #fde68a; color: #92400e; font-size: 14px; margin-bottom: 16px; }
  .alert-info    { display: flex; align-items: flex-start; gap: 10px; padding: 12px 16px; border-radius: 10px; background: #f0f9ff; border: 1px solid #bae6fd; color: #075985; font-size: 14px; margin-bottom: 16px; }

  /* Modal */
  .modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.55); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .modal-box { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 28px; max-width: 480px; width: 100%; box-shadow: 0 20px 40px rgba(0,0,0,0.12); }
  .modal-title { font-family: 'Space Grotesk', sans-serif; font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
  .modal-body { font-size: 14px; color: #475569; margin-bottom: 22px; line-height: 1.6; }
  .modal-actions { display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }

  /* Pagination */
  .pagination { display: flex; align-items: center; gap: 6px; margin-top: 20px; flex-wrap: wrap; justify-content: center; }
  .page-btn { padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid #e2e8f0; background: #ffffff; color: #475569; font-family: 'Inter', sans-serif; transition: all 0.15s; }
  .page-btn:hover { background: #f8fafc; color: #0f172a; }
  .page-btn.active { background: #16a34a; color: #ffffff; border-color: #16a34a; }
  .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* Skeleton loader */
  .skeleton { background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 8px; }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  /* Empty state */
  .empty-state { text-align: center; padding: 56px 20px; }
  .empty-emoji { font-size: 48px; margin-bottom: 14px; }
  .empty-title { font-size: 19px; font-weight: 700; color: var(--text); margin-bottom: 6px; font-family: 'Space Grotesk', sans-serif; }
  .empty-sub { font-size: 14px; color: var(--text2); margin-bottom: 20px; }

  /* Error state */
  .error-state { text-align: center; padding: 40px 20px; }
  .error-state-icon { font-size: 40px; margin-bottom: 12px; }
  .error-state-msg { color: #dc2626; font-weight: 700; font-size: 15px; margin-bottom: 6px; }
  .error-state-sub { color: #64748b; font-size: 13px; margin-bottom: 16px; }

  /* Loading spinner */
  .spinner { width: 28px; height: 28px; border: 3px solid #e2e8f0; border-top-color: var(--green); border-radius: 50%; animation: spin 0.7s linear infinite; margin: 0 auto; flex-shrink: 0; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 56px; gap: 14px; color: var(--text2); font-size: 14px; }

  /* Divider */
  .divider { height: 1px; background: var(--border); margin: 20px 0; }

  /* Section eyebrow */
  .eyebrow { font-size: 11px; font-weight: 700; color: var(--green); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }

  /* Scroll wrapper */
  .scroll-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; border-radius: 12px; }
`;
