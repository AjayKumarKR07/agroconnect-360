import { useEffect, useState, useCallback } from "react";
import { API_URL } from "../../config/api";
import { DS } from "../../styles/ds";
import { 
  RefreshCw, 
  Truck, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  User, 
  Package, 
  Hash, 
  Layers 
} from "lucide-react";

/* ── Real status config — derived from sellerController getSellerShipments ── */
const STATUS_CONFIG = {
  pending:    { label: "Pending",    icon: Clock,        bg: "rgba(251,191,36,0.1)",  color: "#b45309", step: 0 },
  dispatched: { label: "Dispatched", icon: Truck,        bg: "rgba(167,139,250,0.1)", color: "#7c3aed", step: 1 },
  in_transit: { label: "In Transit", icon: MapPin,       bg: "rgba(56,189,248,0.1)",  color: "#0369a1", step: 2 },
  delivered:  { label: "Delivered",  icon: CheckCircle2, bg: "rgba(34,197,94,0.1)",   color: "#15803d", step: 3 },
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
      if (!r.ok) throw new Error(d.message || "Failed to fetch shipments");
      setShipments(d.shipments || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchShipments(); }, [fetchShipments]);

  // Derived counts
  const counts = {
    all:        shipments.length,
    pending:    shipments.filter(s => s.status === "pending").length,
    dispatched: shipments.filter(s => s.status === "dispatched").length,
    in_transit: shipments.filter(s => s.status === "in_transit").length,
    delivered:  shipments.filter(s => s.status === "delivered").length,
  };

  const filtered = shipments
    .filter(s => filter === "all" ? true : s.status === filter)
    .filter(s => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (s.product || "").toLowerCase().includes(q) ||
        (s.buyer || "").toLowerCase().includes(q) ||
        (s.orderId || "").toLowerCase().includes(q) ||
        (s.trackingNo || "").toLowerCase().includes(q)
      );
    });

  return (
    <>
      <style>{DS + `
        @keyframes sklShimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
        .ship-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 18px 20px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .ship-card:hover { border-color: rgba(167,139,250,0.3); }
        .ship-card.sel   { border-color: #a78bfa; background: rgba(167,139,250,0.03); }
        .log-tabs { display:flex; gap:8px; margin-bottom:20px; flex-wrap:wrap; }
        .log-tab {
          padding: 8px 18px; border-radius: 10px; font-size: 13px; font-weight: 700;
          cursor: pointer; border: 1px solid var(--border);
          background: var(--surface); color: var(--text2);
          transition: all 0.2s; font-family: 'Inter', sans-serif;
        }
        .log-tab.active { background: rgba(167,139,250,0.1); color: #7c3aed; border-color: rgba(167,139,250,0.25); }
        .tracker { display:flex; align-items:center; margin: 20px 0; }
        .tr-dot    { width:28px; height:28px; border-radius:50%; background:var(--surface); border:2px solid var(--border); display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:800; color:var(--text2); flex-shrink:0; }
        .tr-dot.done { background:#7c3aed; border-color:#7c3aed; color:#0f172a; }
        .tr-dot.cur  { border-color:#a78bfa; color:#a78bfa; }
        .tr-line   { height:3px; flex:1; background:var(--border); }
        .tr-line.done { background:#7c3aed; }
        .tr-label  { font-size:10px; color:var(--text2); text-align:center; white-space:nowrap; }
        .tr-label.done,.tr-label.cur { color:#7c3aed; font-weight:700; }
      `}</style>

      {/* Header */}
      <div className="pg-head">
        <div>
          <div className="eyebrow">Fulfillment</div>
          <h1 className="pg-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Truck size={24} color="#7c3aed" /> Logistics & Shipments
          </h1>
          <p className="pg-sub">Track and manage all deliveries for your orders.</p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 800, color: "#7c3aed" }}>{counts.in_transit}</div>
            <div style={{ fontSize: 11, color: "var(--text2)" }}>In Transit</div>
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        {[
          [Clock,        "Pending",    counts.pending,   "#fbbf24"],
          [Truck,        "Dispatched", counts.dispatched, "#a78bfa"],
          [MapPin,       "In Transit", counts.in_transit, "#38bdf8"],
          [CheckCircle2, "Delivered",  counts.delivered,  "#4ade80"],
        ].map(([IconComponent, label, val, color]) => (
          <div key={label} className="card" style={{ padding: "16px 18px", cursor: "pointer", transition: "border-color 0.2s" }}
            onClick={() => setFilter(label === "In Transit" ? "in_transit" : label.toLowerCase())}
          >
            <div style={{ marginBottom: 6, display: "flex", alignItems: "center" }}>
              <IconComponent size={20} color={color} />
            </div>
            <div style={{ fontSize: 10, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 24, fontWeight: 800, color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Error state */}
      {error && !loading && (
        <div className="card" style={{ marginBottom: 24, border: "1px solid rgba(239,68,68,0.2)", background: "#fef2f2" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <AlertTriangle size={20} color="#dc2626" />
              <span style={{ color: "#dc2626", fontWeight: 600, fontSize: 14 }}>Unable to load shipments — {error}</span>
            </div>
            <button onClick={fetchShipments} className="btn-ghost" style={{ fontSize: 13, padding: "8px 16px", display: "inline-flex", alignItems: "center", gap: 5 }}><RefreshCw size={13} strokeWidth={2} />Retry</button>
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
              <div style={{ position: "relative", maxWidth: 280, marginLeft: "auto", width: "100%" }}>
                <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text2)" }} />
                <input
                  className="field-input"
                  placeholder="Search product, buyer, tracking…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ paddingLeft: 36, width: "100%" }}
                />
              </div>
            </div>

            {/* Empty state */}
            {filtered.length === 0 && (
              <div className="card empty-state">
                <div className="empty-emoji"><Truck size={40} strokeWidth={1.5} color="#ddd6fe" /></div>
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
                const StIcon = st.icon;
                return (
                  <div
                    key={s.id}
                    className={`ship-card ${selected?.id === s.id ? "sel" : ""}`}
                    onClick={() => setSelected(s.id === selected?.id ? null : s)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 15 }}>{s.product || "Product"}</div>
                          <span style={{ padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <StIcon size={12} />
                            <span>{st.label}</span>
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                          <div style={{ fontSize: 12, color: "var(--text2)", display: "flex", alignItems: "center", gap: 5 }}>
                            <User size={13} /> <span style={{ color: "var(--text)" }}>{s.buyer || "Buyer"}</span>
                          </div>
                          <div style={{ fontSize: 12, color: "var(--text2)", display: "flex", alignItems: "center", gap: 5 }}>
                            <Package size={13} /> <span style={{ color: "var(--text)" }}>{s.qty || "—"}</span>
                          </div>
                          {s.from && s.to && (
                            <div style={{ fontSize: 12, color: "var(--text2)", display: "flex", alignItems: "center", gap: 5 }}>
                              <MapPin size={13} /> <span style={{ color: "var(--text)" }}>{s.from} → {s.to}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 11, color: "#7c3aed", fontWeight: 700, fontFamily: "monospace" }}>
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
            const StIcon = st.icon;
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
                    { label: "Buyer",    icon: User,    val: selected.buyer    || "—" },
                    { label: "Quantity", icon: Package, val: selected.qty      || "—" },
                    { label: "Route",    icon: MapPin,  val: selected.from && selected.to ? `${selected.from} → ${selected.to}` : "—" },
                    { label: "Order",    icon: Hash,    val: selected.orderId  || "—" },
                    { label: "Carrier",  icon: Truck,   val: selected.carrier  || "—" },
                    { label: "Tracking", icon: Layers,  val: selected.trackingNo || "Not yet assigned" },
                  ].filter(r => r.val !== "—").map(r => {
                    const RowIcon = r.icon;
                    return (
                      <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, paddingBottom: 10, borderBottom: "1px solid var(--border)" }}>
                        <span style={{ color: "var(--text2)", display: "flex", alignItems: "center", gap: 6 }}>
                          <RowIcon size={14} /> {r.label}
                        </span>
                        <span style={{ color: "#0f172a", fontWeight: 600, textAlign: "right", maxWidth: "60%" }}>{r.val}</span>
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 10, background: `${st.bg}`, border: `1px solid ${st.color}30`, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: st.color, fontWeight: 700, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <StIcon size={13} /> {st.label}
                  </span>
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
