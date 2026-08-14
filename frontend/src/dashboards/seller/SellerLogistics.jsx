import { useEffect, useState, useCallback } from "react";
import { API_URL } from "../../config/api";
import { DS } from "../../styles/ds";

/* ── Real status config — derived from sellerController getSellerShipments ── */
const STATUS_CONFIG = {
  pending:    { label: "⏳ Pending",    bg: "rgba(251,191,36,0.1)",  color: "#fbbf24", step: 0 },
  dispatched: { label: "🚚 Dispatched", bg: "rgba(167,139,250,0.1)", color: "#a78bfa", step: 1 },
  in_transit: { label: "📍 In Transit", bg: "rgba(56,189,248,0.1)",  color: "#38bdf8", step: 2 },
  delivered:  { label: "✅ Delivered",  bg: "rgba(34,197,94,0.1)",   color: "#4ade80", step: 3 },
};

const STEPS = ["Order Placed", "Dispatched", "In Transit", "Delivered"];

const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("agroconnect_token")}` });

/* Skeleton row */
const SkRow = () => (
  <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "18px 20px" }}>
    <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
      {["60%","40%","30%"].map((w,i) => (
        <div key={i} style={{ height: 14, width: w, borderRadius: 6, background: "linear-gradient(90deg,rgba(167,139,250,0.06) 25%,rgba(167,139,250,0.12) 50%,rgba(167,139,250,0.06) 75%)", backgroundSize: "200% 100%", animation: "sklShimmer 1.6s ease infinite" }} />
      ))}
    </div>
  </div>
);

export default function SellerLogistics() {
  const [shipments, setShipments] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [filter,    setFilter]    = useState("all");
  const [selected,  setSelected]  = useState(null);
  const [search,    setSearch]    = useState("");

  const fetchShipments = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const r = await fetch(`${API_URL}/api/seller/shipments`, { headers: authH() });
      const d = await r.json();
      if (d.success) {
        setShipments(d.shipments || []);
      } else {
        setError(d.message || "Unable to load shipments");
      }
    } catch {
      setError("Network error — could not reach the server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchShipments(); }, [fetchShipments]);

  /* Counts */
  const counts = {
    all:        shipments.length,
    pending:    shipments.filter(s => s.status === "pending").length,
    dispatched: shipments.filter(s => s.status === "dispatched").length,
    in_transit: shipments.filter(s => s.status === "in_transit").length,
    delivered:  shipments.filter(s => s.status === "delivered").length,
  };

  const filtered = shipments.filter(s => {
    if (filter !== "all" && s.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !s.product?.toLowerCase().includes(q) &&
        !s.buyer?.toLowerCase().includes(q) &&
        !s.trackingNo?.includes(search)
      ) return false;
    }
    return true;
  });

  return (
    <>
      <style>{DS + `
        @keyframes sklShimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
        .log-tabs  { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:22px; }
        .log-tab   { padding:7px 16px; border-radius:10px; font-size:12px; font-weight:700; cursor:pointer; border:1px solid var(--border); background:var(--surface); color:var(--text2); transition:all 0.2s; font-family:'Inter',sans-serif; }
        .log-tab.active { background:rgba(167,139,250,0.1); color:#a78bfa; border-color:rgba(167,139,250,0.2); }
        .ship-card { background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:18px 20px; cursor:pointer; transition:all 0.2s; }
        .ship-card:hover { border-color:rgba(167,139,250,0.2); background:rgba(167,139,250,0.04); }
        .ship-card.sel  { border-color:rgba(167,139,250,0.35); background:rgba(167,139,250,0.06); }
        .tracker   { display:flex; align-items:center; gap:0; margin:20px 0; }
        .tr-dot    { width:28px; height:28px; border-radius:50%; border:2px solid var(--border); background:var(--surface); display:flex; align-items:center; justify-content:center; font-size:13px; transition:all 0.3s; flex-shrink:0; }
        .tr-dot.done { background:linear-gradient(135deg,#7c3aed,#a78bfa); border-color:#a78bfa; box-shadow:0 0 14px rgba(167,139,250,0.5); }
        .tr-dot.cur  { background:rgba(167,139,250,0.15); border-color:#a78bfa; animation:trPulse 1.5s ease infinite; }
        @keyframes trPulse { 0%,100%{box-shadow:0 0 8px rgba(167,139,250,0.4)} 50%{box-shadow:0 0 16px rgba(167,139,250,0.8)} }
        .tr-line   { flex:1; height:2px; background:var(--border); transition:background 0.3s; margin-top:-22px; }
        .tr-line.done { background:linear-gradient(90deg,#7c3aed,#a78bfa); }
        .tr-label  { font-size:10px; color:var(--text2); text-align:center; white-space:nowrap; }
        .tr-label.done,.tr-label.cur { color:#a78bfa; font-weight:700; }
      `}</style>

      {/* Header */}
      <div className="pg-head">
        <div>
          <div className="eyebrow">Fulfillment</div>
          <h1 className="pg-title">🚚 Logistics & Shipments</h1>
          <p className="pg-sub">Track and manage all deliveries for your orders.</p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 800, color: "#a78bfa" }}>{counts.in_transit}</div>
            <div style={{ fontSize: 11, color: "var(--text2)" }}>In Transit</div>
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        {[
          ["⏳", "Pending",    counts.pending,   "#fbbf24"],
          ["🚚", "Dispatched", counts.dispatched, "#a78bfa"],
          ["📍", "In Transit", counts.in_transit, "#38bdf8"],
          ["✅", "Delivered",  counts.delivered,  "#4ade80"],
        ].map(([icon, label, val, color]) => (
          <div key={label} className="card" style={{ padding: "16px 18px", cursor: "pointer", transition: "border-color 0.2s" }}
            onClick={() => setFilter(label === "In Transit" ? "in_transit" : label.toLowerCase())}
          >
            <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
            <div style={{ fontSize: 10, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 24, fontWeight: 800, color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Error state */}
      {error && !loading && (
        <div className="card" style={{ marginBottom: 24, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <span style={{ color: "#f87171", fontWeight: 600, fontSize: 14 }}>Unable to load shipments — {error}</span>
            </div>
            <button onClick={fetchShipments} className="btn-ghost" style={{ fontSize: 13, padding: "8px 16px" }}>🔄 Retry</button>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1,2,3].map(i => <SkRow key={i} />)}
        </div>
      )}

      {!loading && !error && (
        <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 380px" : "1fr", gap: 20, alignItems: "start" }}>
          {/* Shipment list */}
          <div>
            {/* Filter + Search */}
            <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
              <div className="log-tabs" style={{ marginBottom: 0 }}>
                {Object.entries(counts).map(([k, v]) => (
                  <button key={k} className={`log-tab ${filter === k ? "active" : ""}`} onClick={() => setFilter(k)}>
                    {k.charAt(0).toUpperCase() + k.slice(1).replace("_", " ")} ({v})
                  </button>
                ))}
              </div>
              <input
                className="field-input"
                placeholder="🔍 Search product, buyer, tracking…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ maxWidth: 280, marginLeft: "auto" }}
              />
            </div>

            {/* Empty state */}
            {filtered.length === 0 && (
              <div className="card empty-state">
                <div className="empty-emoji">🚚</div>
                <div className="empty-title">
                  {shipments.length === 0 ? "No shipments yet" : "No shipments match your filter"}
                </div>
                <div className="empty-sub">
                  {shipments.length === 0
                    ? "Shipments will appear here once orders are accepted and dispatched."
                    : "Try changing the filter or search term."}
                </div>
              </div>
            )}

            {/* Shipment cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map(s => {
                const st = STATUS_CONFIG[s.status] || STATUS_CONFIG.pending;
                return (
                  <div
                    key={s.id}
                    className={`ship-card ${selected?.id === s.id ? "sel" : ""}`}
                    onClick={() => setSelected(s.id === selected?.id ? null : s)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <div style={{ fontWeight: 800, color: "#fff", fontSize: 15 }}>{s.product || "Product"}</div>
                          <span style={{ padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color, whiteSpace: "nowrap" }}>{st.label}</span>
                        </div>
                        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                          <div style={{ fontSize: 12, color: "var(--text2)" }}>👤 <span style={{ color: "var(--text)" }}>{s.buyer || "Buyer"}</span></div>
                          <div style={{ fontSize: 12, color: "var(--text2)" }}>📦 <span style={{ color: "var(--text)" }}>{s.qty || "—"}</span></div>
                          {s.from && s.to && (
                            <div style={{ fontSize: 12, color: "var(--text2)" }}>📍 <span style={{ color: "var(--text)" }}>{s.from} → {s.to}</span></div>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 11, color: "#a78bfa", fontWeight: 700, fontFamily: "monospace" }}>
                          {s.trackingNo || "No tracking"}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 4 }}>
                          {s.orderId}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detail panel */}
          {selected && (() => {
            const st = STATUS_CONFIG[selected.status] || STATUS_CONFIG.pending;
            const stepIdx = st.step;
            return (
              <div className="card" style={{ position: "sticky", top: 80 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div>
                    <div className="card-title">{selected.product}</div>
                    <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>Order {selected.orderId}</div>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    style={{ background: "var(--surface)", border: "none", borderRadius: 8, padding: "6px 10px", color: "var(--text2)", cursor: "pointer", fontSize: 14 }}
                  >✕</button>
                </div>

                {/* Tracker */}
                <div className="tracker">
                  {STEPS.map((step, i) => (
                    <div key={step} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : 0 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                        <div className={`tr-dot ${i < stepIdx ? "done" : i === stepIdx ? "cur" : ""}`}>
                          {i < stepIdx ? "✓" : i === stepIdx ? "●" : ""}
                        </div>
                        <div className={`tr-label ${i <= stepIdx ? (i < stepIdx ? "done" : "cur") : ""}`}>{step}</div>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={`tr-line ${i < stepIdx ? "done" : ""}`} style={{ flex: 1 }} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Info rows */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    ["👤 Buyer",    selected.buyer    || "—"],
                    ["📦 Quantity", selected.qty      || "—"],
                    ["📍 Route",    selected.from && selected.to ? `${selected.from} → ${selected.to}` : "—"],
                    ["🔢 Order",    selected.orderId  || "—"],
                    ["🚛 Carrier",  selected.carrier  || "—"],
                    ["🔢 Tracking", selected.trackingNo || "Not yet assigned"],
                  ].filter(([, val]) => val !== "—").map(([label, val]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, paddingBottom: 10, borderBottom: "1px solid var(--border)" }}>
                      <span style={{ color: "var(--text2)" }}>{label}</span>
                      <span style={{ color: "#fff", fontWeight: 600, textAlign: "right", maxWidth: "60%" }}>{val}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 10, background: `${st.bg}`, border: `1px solid ${st.color}30`, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: st.color, fontWeight: 700, fontSize: 13 }}>{st.label}</span>
                  <span style={{ fontSize: 11, color: "var(--text2)" }}>current status</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </>
  );
}
