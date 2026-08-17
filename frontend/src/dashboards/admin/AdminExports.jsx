import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { API_URL } from "../../config/api";
import { DS_ADMIN, relativeTime } from "./adminStyles";

const RFQ_STATUSES = ["all", "pending", "accepted", "quoted", "rejected"];
const SHIPMENT_STATUSES = ["farm_packed", "cfs_cold_storage", "port_gate_in", "customs_cleared", "onboard_vessel", "delivered", "cancelled"];

const RFQ_STYLE = {
  pending:  { bg: "rgba(251,191,36,0.12)", color: "#fbbf24" },
  accepted: { bg: "rgba(34,197,94,0.12)",  color: "#4ade80" },
  quoted:   { bg: "rgba(56,189,248,0.12)", color: "#38bdf8" },
  rejected: { bg: "rgba(239,68,68,0.12)",  color: "#f87171" },
};

const SHIPMENT_STEP_LABEL = {
  farm_packed:      { label: "Farm Packed",      emoji: "📦", step: 0 },
  cfs_cold_storage: { label: "CFS/Cold Storage", emoji: "🏭", step: 1 },
  port_gate_in:     { label: "Port Gate-In",     emoji: "🏗️", step: 2 },
  customs_cleared:  { label: "Customs Cleared",  emoji: "📋", step: 3 },
  onboard_vessel:   { label: "Onboard Vessel",   emoji: "🚢", step: 4 },
  delivered:        { label: "Delivered",         emoji: "✅", step: 5 },
  cancelled:        { label: "Cancelled",         emoji: "❌", step: -1 },
};

function ConfirmModal({ message, detail, warning, onConfirm, onCancel, loading }) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="exports-modal-title">
      <div className="modal-box">
        <div className="modal-title" id="exports-modal-title">Confirm Action</div>
        <div className="modal-body">
          <div style={{ marginBottom: detail ? 12 : 0 }}>{message}</div>
          {detail && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              {detail.map((d, i) => (
                <div key={i} style={{ padding: "9px 12px", borderRadius: 10, background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.12)" }}>
                  <div style={{ fontSize: 10, color: "#a5b4fc", fontWeight: 800, textTransform: "uppercase", marginBottom: 4 }}>{d.label}</div>
                  <div style={{ fontSize: 13, color: d.color || "#c7d2fe", fontWeight: 800 }}>{d.value}</div>
                </div>
              ))}
            </div>
          )}
          {warning && (
            <div style={{ padding: "9px 12px", borderRadius: 10, background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.2)", fontSize: 12, color: "#fbbf24", fontWeight: 600 }}>
              ⚠️ {warning}
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button className="tab-btn" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="btn-indigo" onClick={onConfirm} disabled={loading} aria-disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminExports() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get("tab") === "shipments" ? "shipments" : "rfqs");
  const [rfqs, setRfqs] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [rfqLoading, setRfqLoading] = useState(true);
  const [shipmentLoading, setShipmentLoading] = useState(true);
  const [rfqError, setRfqError] = useState(null);
  const [shipmentError, setShipmentError] = useState(null);
  const [rfqFilter, setRfqFilter] = useState(searchParams.get("status") || "all");
  const [confirm, setConfirm] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [toast, setToast] = useState(null);
  const token = localStorage.getItem("agroconnect_token");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadRFQs = useCallback(async () => {
    setRfqLoading(true);
    setRfqError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/rfqs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setRfqs(data.rfqs || []);
      } else {
        throw new Error(data.message || "Failed to load RFQs");
      }
    } catch (e) {
      setRfqError(e.message || "Unable to load RFQs");
    } finally {
      setRfqLoading(false);
    }
  }, [token]);

  const loadShipments = useCallback(async () => {
    setShipmentLoading(true);
    setShipmentError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/shipments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setShipments(data.shipments || []);
      } else {
        throw new Error(data.message || "Failed to load shipments");
      }
    } catch (e) {
      setShipmentError(e.message || "Unable to load shipments");
    } finally {
      setShipmentLoading(false);
    }
  }, [token]);

  const loadAll = useCallback(() => {
    loadRFQs();
    loadShipments();
  }, [loadRFQs, loadShipments]);

  // Synchronize when URL search parameters change
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "shipments" || tabParam === "rfqs") {
      setTab(tabParam);
    }
    const statusParam = searchParams.get("status");
    if (statusParam) {
      setRfqFilter(statusParam);
    }
  }, [searchParams]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const updateRFQStatus = async (id, status) => {
    setUpdating(id);
    try {
      const r = await fetch(`${API_URL}/api/admin/rfqs/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const d = await r.json();
      if (d.success) {
        setRfqs((prev) => prev.map((r) => r._id === id ? { ...r, status } : r));
        showToast(`RFQ marked ${status}`);
      } else showToast(d.message || "Failed", "error");
    } catch { showToast("Network error", "error"); }
    finally { setUpdating(null); setConfirm(null); }
  };

  const updateShipmentStatus = async (id, status) => {
    const stepInfo = SHIPMENT_STEP_LABEL[status];
    setUpdating(id);
    try {
      const r = await fetch(`${API_URL}/api/admin/shipments/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, statusStep: stepInfo?.step ?? 0 }),
      });
      const d = await r.json();
      if (d.success) {
        setShipments((prev) => prev.map((s) => s._id === id ? { ...s, status, statusStep: stepInfo?.step ?? s.statusStep } : s));
        showToast(`Shipment updated to ${status}`);
      } else showToast(d.message || "Failed", "error");
    } catch { showToast("Network error", "error"); }
    finally { setUpdating(null); setConfirm(null); }
  };

  const filteredRFQs = rfqFilter === "all" ? rfqs : rfqs.filter((r) => r.status === rfqFilter);
  const isRefreshing = rfqLoading || shipmentLoading;

  return (
    <>
      <style>{DS_ADMIN}</style>

      {confirm && (
        <ConfirmModal
          message={confirm.message}
          detail={confirm.detail}
          warning={confirm.warning}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
          loading={!!updating}
        />
      )}

      <div className="pg-head">
        <div>
          <div className="eyebrow">International Trade Management</div>
          <h1 className="pg-title">🚢 Export Hub</h1>
          <p className="pg-sub">Manage export RFQs and shipment tracking. Status changes are recorded in the audit log.</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="btn-indigo" onClick={loadAll} disabled={isRefreshing}>
            {isRefreshing ? <span className="spinner" style={{ width: 14, height: 14 }} /> : "🔄"} Refresh
          </button>
        </div>
      </div>

      {toast && <div className={toast.type === "error" ? "toast-error" : "toast-success"}>{toast.msg}</div>}

      {/* Top tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <button className={`tab-btn ${tab === "rfqs" ? "active" : ""}`} onClick={() => setTab("rfqs")}>
          📋 Export RFQs {rfqLoading ? "…" : `(${rfqs.length})`}
        </button>
        <button className={`tab-btn ${tab === "shipments" ? "active" : ""}`} onClick={() => setTab("shipments")}>
          🚢 Shipments {shipmentLoading ? "…" : `(${shipments.length})`}
        </button>
      </div>

      {/* ── RFQ Tab ── */}
      {tab === "rfqs" && (
        <>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            {RFQ_STATUSES.map((s) => (
              <button key={s} className={`tab-btn ${rfqFilter === s ? "active" : ""}`} onClick={() => setRfqFilter(s)}>
                {s === "all" ? "🌐 All" : s}
              </button>
            ))}
          </div>

          {rfqLoading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 14 }} />)}
            </div>
          )}

          {!rfqLoading && rfqError && (
            <div className="card error-state">
              <div className="error-state-icon">⚠️</div>
              <div className="error-state-msg">Unable to load RFQ data</div>
              <div className="error-state-sub">{rfqError}</div>
              <button className="btn-indigo" onClick={loadRFQs}>Retry RFQs</button>
            </div>
          )}

          {!rfqLoading && !rfqError && filteredRFQs.length === 0 && (
            <div className="card empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-msg">No RFQs found</div>
              <div className="empty-state-sub">{rfqFilter !== "all" ? `No ${rfqFilter} RFQs.` : "No export RFQs yet."}</div>
            </div>
          )}

          {!rfqLoading && !rfqError && filteredRFQs.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div className="table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Crop</th>
                      <th>Exporter</th>
                      <th>Destination</th>
                      <th>Container</th>
                      <th>Qty (Tons)</th>
                      <th>Target USD</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Update</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRFQs.map((rfq) => {
                      const sc = RFQ_STYLE[rfq.status] || RFQ_STYLE.pending;
                      return (
                        <tr key={rfq._id}>
                          <td style={{ fontWeight: 700, color: "#fff" }}>{rfq.cropName}</td>
                          <td>
                            <div style={{ fontSize: 13, color: "#fff" }}>{rfq.exporter?.name || "—"}</div>
                            <div style={{ fontSize: 11, color: "#a5b4fc" }}>{rfq.exporter?.email}</div>
                          </td>
                          <td style={{ fontSize: 13, color: "#a5b4fc" }}>{rfq.destinationCountry}</td>
                          <td style={{ fontSize: 12, color: "#a5b4fc" }}>{rfq.containerSize}</td>
                          <td style={{ fontWeight: 700, color: "#fff" }}>{rfq.quantityTons}</td>
                          <td style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, color: "#4ade80" }}>
                            {rfq.targetPriceUsd ? `$${rfq.targetPriceUsd}` : "—"}
                          </td>
                          <td style={{ fontSize: 12, color: "#a5b4fc", whiteSpace: "nowrap" }}>{relativeTime(rfq.createdAt)}</td>
                          <td>
                            <span style={{ padding: "3px 9px", borderRadius: 7, background: sc.bg, color: sc.color, fontSize: 12, fontWeight: 800 }}>
                              {rfq.status}
                            </span>
                          </td>
                          <td>
                            <select
                              className="field-input"
                              style={{ padding: "5px 8px", fontSize: 12, width: "auto" }}
                              value={rfq.status}
                              disabled={updating === rfq._id}
                              onChange={(e) => {
                                const ns = e.target.value;
                                const nsc = RFQ_STYLE[ns] || RFQ_STYLE.pending;
                                const csc = RFQ_STYLE[rfq.status] || RFQ_STYLE.pending;
                                setConfirm({
                                  message: `Update status for RFQ: "${rfq.cropName}" → ${rfq.destinationCountry}`,
                                  detail: [
                                    { label: "Current Status", value: rfq.status.toUpperCase(), color: csc.color },
                                    { label: "New Status",     value: ns.toUpperCase(),        color: nsc.color },
                                    { label: "Exporter",       value: rfq.exporter?.name || "—" },
                                    { label: "Quantity",        value: `${rfq.quantityTons} Tons` },
                                  ],
                                  warning: "The exporter will see this updated RFQ status in their dashboard.",
                                  onConfirm: () => updateRFQStatus(rfq._id, ns),
                                });
                              }}
                            >
                              {["pending", "accepted", "quoted", "rejected"].map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Shipments Tab ── */}
      {tab === "shipments" && (
        <>
          {shipmentLoading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 14 }} />)}
            </div>
          )}

          {!shipmentLoading && shipmentError && (
            <div className="card error-state">
              <div className="error-state-icon">⚠️</div>
              <div className="error-state-msg">Unable to load shipment data</div>
              <div className="error-state-sub">{shipmentError}</div>
              <button className="btn-indigo" onClick={loadShipments}>Retry Shipments</button>
            </div>
          )}

          {!shipmentLoading && !shipmentError && shipments.length === 0 && (
            <div className="card empty-state">
              <div className="empty-state-icon">🚢</div>
              <div className="empty-state-msg">No shipments found</div>
              <div className="empty-state-sub">Export shipments will appear here once exporters create them.</div>
            </div>
          )}

          {!shipmentLoading && !shipmentError && shipments.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {shipments.map((s) => {
                const stepInfo = SHIPMENT_STEP_LABEL[s.status] || { label: s.status, emoji: "📦", step: 0 };
                const steps = Object.values(SHIPMENT_STEP_LABEL).filter((x) => x.step >= 0).sort((a, b) => a.step - b.step);
                return (
                  <div key={s._id} className="card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
                      <div>
                        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 4 }}>
                          {stepInfo.emoji} {s.cargo} · {s.containerNo}
                        </div>
                        <div style={{ fontSize: 13, color: "#a5b4fc" }}>
                          ⚓ {s.portOfOrigin} → 🌍 {s.destPort}, {s.destinationCountry} · {s.quantityTons}T · 🚢 {s.vessel}
                        </div>
                        <div style={{ fontSize: 12, color: "#818cf8", marginTop: 4 }}>
                          👤 {s.exporter?.name || "—"} · Added {relativeTime(s.createdAt)}
                        </div>
                      </div>
                      <select
                        className="field-input"
                        style={{ padding: "7px 10px", fontSize: 12, width: "auto" }}
                        value={s.status}
                        disabled={updating === s._id}
                        onChange={(e) => {
                          const ns = e.target.value;
                          const prev = SHIPMENT_STEP_LABEL[s.status] || { label: s.status };
                          const next = SHIPMENT_STEP_LABEL[ns] || { label: ns };
                          setConfirm({
                            message: `Update shipment ${s.containerNo} (${s.cargo})`,
                            detail: [
                              { label: "Current Status", value: prev.label, color: "#a5b4fc" },
                              { label: "New Status",     value: next.label, color: "#4ade80" },
                              { label: "Container",      value: s.containerNo },
                              { label: "Exporter",       value: s.exporter?.name || "—" },
                            ],
                            warning: "The exporter will see this updated shipment status in their dashboard.",
                            onConfirm: () => updateShipmentStatus(s._id, ns),
                          });
                        }}
                      >
                        {SHIPMENT_STATUSES.map((st) => (
                          <option key={st} value={st}>{SHIPMENT_STEP_LABEL[st]?.label || st}</option>
                        ))}
                      </select>
                    </div>

                    {/* Progress stepper */}
                    {s.status !== "cancelled" && (
                      <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 0 }}>
                        {steps.map((step, idx) => {
                          const done = (s.statusStep ?? 0) >= step.step;
                          return (
                            <div key={step.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                              {idx > 0 && (
                                <div style={{ position: "absolute", left: "-50%", top: 10, width: "100%", height: 2, background: done ? "#6366f1" : "rgba(99,102,241,0.15)", zIndex: 0 }} />
                              )}
                              <div style={{ width: 22, height: 22, borderRadius: "50%", background: done ? "#6366f1" : "rgba(99,102,241,0.1)", border: `2px solid ${done ? "#6366f1" : "rgba(99,102,241,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, position: "relative", zIndex: 1, transition: "all 0.3s" }}>
                                {done ? "✓" : <span style={{ opacity: 0.4 }}>{step.step + 1}</span>}
                              </div>
                              <div style={{ fontSize: 9, color: done ? "#c7d2fe" : "#818cf8", marginTop: 5, textAlign: "center", lineHeight: 1.3, maxWidth: 55 }}>{step.label}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </>
  );
}
