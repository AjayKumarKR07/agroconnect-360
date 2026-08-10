import { useEffect, useState, useCallback } from "react";
import { API_URL } from "../../config/api";
import { DS } from "../../styles/ds";

/* ─── helpers ─────────────────────────────────────────────── */
const owmIcon = (code) =>
  `https://openweathermap.org/img/wn/${code}@2x.png`;

const getEmoji = (desc = "") => {
  const d = desc.toLowerCase();
  if (d.includes("thunder")) return "⛈️";
  if (d.includes("rain") || d.includes("drizzle")) return "🌧️";
  if (d.includes("snow")) return "❄️";
  if (d.includes("mist") || d.includes("fog") || d.includes("haze")) return "🌫️";
  if (d.includes("cloud")) return "☁️";
  if (d.includes("clear") || d.includes("sun")) return "☀️";
  return "🌤️";
};

const fmtTime = (unixSec) => {
  const d = new Date(unixSec * 1000);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

const fmtDay = (dateStr, short = false) => {
  const d = new Date(dateStr + "T12:00:00");
  const today = new Date();
  const diff = Math.round((d - today) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return short ? "Tmrw" : "Tomorrow";
  return d.toLocaleDateString("en-IN", { weekday: short ? "short" : "long", month: short ? undefined : "short", day: short ? undefined : "numeric" });
};

const fmtDate = (dateStr) => {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
};

const rainColor = (p) =>
  p >= 70 ? "#38bdf8" : p >= 40 ? "#7dd3fc" : p >= 20 ? "#bae6fd" : "#e0f7fa";

const tempGradient = (t) => {
  if (t >= 40) return "linear-gradient(135deg,#ef4444,#f97316)";
  if (t >= 35) return "linear-gradient(135deg,#f97316,#fbbf24)";
  if (t >= 28) return "linear-gradient(135deg,#fbbf24,#4ade80)";
  if (t >= 20) return "linear-gradient(135deg,#4ade80,#38bdf8)";
  return "linear-gradient(135deg,#38bdf8,#818cf8)";
};

/* ─── CSS ─────────────────────────────────────────────────── */
const WCSS = `
.w-tabs { display:flex; gap:8px; margin-bottom:28px; flex-wrap:wrap; }
.w-tab {
  padding:9px 20px; border-radius:40px; border:1px solid var(--border);
  background:var(--surface); color:var(--text2); font-size:13px; font-weight:600;
  cursor:pointer; transition:all .2s; white-space:nowrap;
}
.w-tab.active { background:var(--green); color:#fff; border-color:var(--green); }
.w-tab:hover:not(.active) { background:var(--surface2); color:var(--text); }
.w-hero {
  background:linear-gradient(135deg,rgba(56,189,248,.12) 0%,rgba(34,197,94,.07) 100%);
  border:1px solid rgba(56,189,248,.18); border-radius:20px;
  padding:32px 36px; margin-bottom:20px;
}
.w-stats-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(130px,1fr)); gap:12px; margin-top:20px; }
.w-stat { background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08); border-radius:14px; padding:16px 18px; text-align:center; }
.sun-bar { position:relative; height:6px; background:rgba(255,255,255,.08); border-radius:99px; margin:8px 0; }
.sun-fill { position:absolute; left:0; top:0; height:100%; background:linear-gradient(90deg,#fbbf24,#fb923c); border-radius:99px; }
.sun-dot { position:absolute; top:-5px; width:16px; height:16px; background:#fbbf24; border-radius:50%; border:2px solid #0f172a; box-shadow:0 0 8px #fbbf2488; transform:translateX(-50%); }
.fc-strip { display:flex; gap:10px; overflow-x:auto; padding-bottom:8px; margin-bottom:20px; }
.fc-strip::-webkit-scrollbar { height:4px; }
.fc-strip::-webkit-scrollbar-thumb { background:var(--border); border-radius:4px; }
.fc-day {
  flex:0 0 120px; background:var(--surface); border:1px solid var(--border);
  border-radius:16px; padding:16px 12px; text-align:center; cursor:pointer;
  transition:all .2s; position:relative; overflow:hidden;
}
.fc-day.sel { border-color:var(--green); background:rgba(34,197,94,.07); }
.fc-day:hover:not(.sel) { background:var(--surface2); transform:translateY(-2px); }
.fc-day .rbar { position:absolute; bottom:0; left:0; right:0; height:3px; border-radius:0 0 16px 16px; }
.fc-day.ext { opacity:.78; }
.fc-day.ext::after { content:"~"; position:absolute; top:6px; right:8px; font-size:10px; color:var(--text2); }
.fc-detail {
  background:linear-gradient(135deg,rgba(56,189,248,.08),rgba(34,197,94,.05));
  border:1px solid rgba(56,189,248,.15); border-radius:20px; padding:28px 32px; margin-bottom:20px;
}
.adv-item { display:flex; gap:10px; padding:12px 14px; background:var(--surface); border-radius:12px; border:1px solid var(--border); font-size:13px; color:var(--text); line-height:1.6; }
.hourly-scroll { display:flex; gap:10px; overflow-x:auto; padding-bottom:8px; }
.hourly-scroll::-webkit-scrollbar { height:4px; }
.hourly-scroll::-webkit-scrollbar-thumb { background:var(--border); border-radius:4px; }
.h-card { flex:0 0 90px; background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:12px 8px; text-align:center; transition:all .2s; }
.h-card:hover { background:var(--surface2); transform:translateY(-2px); }
.cal-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:12px; }
.cal-cell { background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:14px 16px; transition:all .2s; }
.cal-cell:hover { background:var(--surface2); transform:translateY(-2px); }
.cal-good { border-color:rgba(34,197,94,.3) !important; }
.cal-rain { border-color:rgba(56,189,248,.3) !important; }
.cal-hot  { border-color:rgba(251,146,60,.3) !important; }
.rpm-row { display:flex; align-items:center; gap:10px; margin:4px 0; }
.rpm-bg { flex:1; height:6px; background:rgba(255,255,255,.06); border-radius:99px; overflow:hidden; }
.rpm-fill { height:100%; border-radius:99px; }
.tips-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:14px; }
.tip-card { padding:20px; background:var(--surface); border:1px solid var(--border); border-radius:16px; transition:all .2s; }
.tip-card:hover { background:var(--surface2); transform:translateY(-2px); }
`;

const FARM_TIPS = [
  { e: "💧", title: "Irrigation Timing", tip: "Water in early morning (5–8 AM) or late evening to cut evaporation losses by up to 40%." },
  { e: "🌱", title: "Pre-Sowing Check", tip: "Check the 7-day rain forecast before sowing to avoid waterlogging or drought stress." },
  { e: "🐛", title: "Pest Pressure", tip: "Humidity >75% accelerates fungal growth — inspect crops every 2–3 days." },
  { e: "🌾", title: "Harvest Window", tip: "Harvest before predicted heavy rainfall. Grain moisture >16% risks storage losses." },
  { e: "🧪", title: "Spray Timing", tip: "Avoid agrochemical spraying when wind >10 km/h or rain probability >50%." },
  { e: "🌡️", title: "Heat Stress", tip: "Apply mulching & shade nets when temperatures exceed 35°C to protect root zones." },
];

const TABS = ["🌤️ Current", "📅 7-Day", "📆 15-Day", "📅 Calendar"];

/* ─── sub-components ──────────────────────────────────────── */
function SunBar({ sunrise, sunset }) {
  const now = Date.now() / 1000;
  const total = sunset - sunrise;
  const elapsed = Math.max(0, Math.min(now - sunrise, total));
  const pct = (elapsed / total) * 100;
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 24px", marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <div style={{ fontWeight: 700, color: "#fbbf24", fontSize: 14 }}>🌅 Sunrise / Sunset</div>
        <div style={{ fontSize: 11, color: "var(--text2)" }}>Daylight: {Math.round(total / 3600)}h {Math.round((total % 3600) / 60)}m</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text2)", marginBottom: 6 }}>
        <span>🌄 {fmtTime(sunrise)}</span>
        <span>🌇 {fmtTime(sunset)}</span>
      </div>
      <div className="sun-bar">
        <div className="sun-fill" style={{ width: `${pct}%` }} />
        <div className="sun-dot" style={{ left: `${pct}%` }} />
      </div>
      <div style={{ textAlign: "center", fontSize: 11, color: "var(--text2)", marginTop: 8 }}>
        {now < sunrise ? "Before sunrise" : now > sunset ? "After sunset" : `☀️ ${Math.round((sunset - now) / 3600)}h ${Math.round(((sunset - now) % 3600) / 60)}m until sunset`}
      </div>
    </div>
  );
}

function HourlyStrip({ hourly }) {
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="card-title" style={{ marginBottom: 14 }}>⏰ Next 24-Hour Forecast</div>
      <div className="hourly-scroll">
        {hourly.map((h, i) => {
          const t = new Date(h.time);
          const label = i === 0 ? "Now" : t.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
          return (
            <div key={h.time} className="h-card">
              <div style={{ fontSize: 10, color: "var(--text2)", marginBottom: 4 }}>{label}</div>
              <img src={owmIcon(h.icon)} alt={h.description} style={{ width: 40, height: 40 }} />
              <div style={{ fontWeight: 800, fontSize: 16, color: "#fff", margin: "2px 0" }}>{h.temp}°</div>
              <div style={{ fontSize: 10, color: "#38bdf8" }}>💧{h.rainProb}%</div>
              <div style={{ fontSize: 10, color: "var(--text2)", marginTop: 2 }}>💨{h.windSpeed}m/s</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FcStrip({ days, selected, onSelect, is15 }) {
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="card-title" style={{ marginBottom: 14 }}>
        {is15 ? "📆 15-Day Outlook" : "📅 7-Day Forecast"}
        {is15 && <span style={{ fontSize: 11, color: "var(--text2)", marginLeft: 10, fontWeight: 400 }}>days 6–15 are trend-based estimates</span>}
      </div>
      <div className="fc-strip">
        {days.map((d, i) => (
          <div key={d.date} className={`fc-day${selected === i ? " sel" : ""}${d.extrapolated ? " ext" : ""}`} onClick={() => onSelect(i)}>
            <div style={{ fontSize: 10, fontWeight: 700, color: selected === i ? "var(--green)" : "var(--text2)", marginBottom: 4 }}>{fmtDay(d.date, true)}</div>
            <img src={owmIcon(d.icon)} alt={d.description} style={{ width: 44, height: 44 }} />
            <div style={{ fontWeight: 800, fontSize: 15, color: "#fff" }}>{d.maxTemp}°</div>
            <div style={{ fontSize: 11, color: "var(--text2)" }}>{d.minTemp}°</div>
            <div style={{ fontSize: 10, color: rainColor(d.rainProb), marginTop: 4 }}>💧{d.rainProb}%</div>
            <div className="rbar" style={{ background: rainColor(d.rainProb), opacity: 0.5 + d.rainProb / 200 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function DayDetail({ day }) {
  if (!day) return null;
  return (
    <div className="fc-detail" style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>
            {fmtDate(day.date)}{day.extrapolated && <span style={{ marginLeft: 8, fontSize: 10, color: "#fbbf24" }}>~ estimate</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src={owmIcon(day.icon)} alt={day.description} style={{ width: 64, height: 64 }} />
            <div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 48, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{day.maxTemp}°C</div>
              <div style={{ fontSize: 13, color: "var(--text2)", textTransform: "capitalize" }}>{day.description}</div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>Low: {day.minTemp}°C</div>
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, minWidth: 240 }}>
          {[["💧","Humidity",`${day.avgHumidity}%`],["💨","Max Wind",`${day.maxWindSpeed} m/s`],["🌧️","Rain Chance",`${day.rainProb}%`],["🌡️","Temp Range",`${day.minTemp}°–${day.maxTemp}°C`]].map(([ic,lbl,val])=>(
            <div key={lbl} style={{ background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.08)", borderRadius:12, padding:"12px 14px" }}>
              <div style={{ fontSize:16, marginBottom:4 }}>{ic}</div>
              <div style={{ fontSize:10, color:"var(--text2)" }}>{lbl}</div>
              <div style={{ fontSize:15, fontWeight:700, color:"#fff", marginTop:2 }}>{val}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="rpm-row" style={{ marginTop: 16 }}>
        <span style={{ fontSize: 12, color: "var(--text2)", width: 80 }}>Rain chance</span>
        <div className="rpm-bg"><div className="rpm-fill" style={{ width:`${day.rainProb}%`, background:rainColor(day.rainProb) }} /></div>
        <span style={{ fontSize: 12, fontWeight: 700, color: rainColor(day.rainProb), width: 36 }}>{day.rainProb}%</span>
      </div>
      {day.advisories?.length > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginTop: 20, marginBottom: 8 }}>🌾 Farming Impact for This Day</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {day.advisories.map((a, i) => (
              <div key={i} className="adv-item"><span style={{ fontSize: 16, flexShrink: 0 }}>💡</span><span>{a}</span></div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TempChart({ days, selected, onSelect }) {
  const allMax = Math.max(...days.map((x) => x.maxTemp));
  const allMin = Math.min(...days.map((x) => x.minTemp));
  const range = allMax - allMin || 1;
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="card-title" style={{ marginBottom: 16 }}>🌡️ Temperature Trend</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 110 }}>
        {days.map((d, i) => {
          const barH = Math.max(8, ((d.maxTemp - allMin) / range) * 72 + 12);
          const minH = Math.max(4, ((d.minTemp - allMin) / range) * 72 + 12);
          return (
            <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "pointer" }} onClick={() => onSelect(i)}>
              <div style={{ fontSize: 9, color: "var(--text2)" }}>{d.maxTemp}°</div>
              <div style={{ width: "60%", height: `${barH - minH}px`, background: tempGradient(d.maxTemp), borderRadius: 4, minHeight: 8, opacity: selected === i ? 1 : 0.55 }} />
              <div style={{ fontSize: 9, color: "var(--text2)" }}>{d.minTemp}°</div>
              <div style={{ fontSize: 9, color: selected === i ? "var(--green)" : "var(--text2)", fontWeight: selected === i ? 700 : 400 }}>{fmtDay(d.date, true)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RainBars({ days, onSelect }) {
  return (
    <div className="card">
      <div className="card-title" style={{ marginBottom: 14 }}>🌧️ Rain Probability Overview</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {days.map((d, i) => (
          <div key={d.date} className="rpm-row" style={{ cursor: "pointer" }} onClick={() => onSelect(i)}>
            <span style={{ fontSize: 12, color: "var(--text2)", width: 70, flexShrink: 0 }}>{fmtDay(d.date, true)}</span>
            <div className="rpm-bg"><div className="rpm-fill" style={{ width: `${d.rainProb}%`, background: rainColor(d.rainProb) }} /></div>
            <span style={{ fontSize: 12, fontWeight: 700, color: rainColor(d.rainProb), width: 34, textAlign: "right", flexShrink: 0 }}>{d.rainProb}%</span>
            <span style={{ fontSize: 16, flexShrink: 0 }}>{d.rainProb >= 70 ? "🌧️" : d.rainProb >= 40 ? "🌦️" : "☀️"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeatherCalendar({ days }) {
  const badge = (d) => {
    if (d.rainProb >= 70) return { label: "Heavy Rain", color: "#38bdf8" };
    if (d.rainProb >= 40) return { label: "Rain Risk", color: "#7dd3fc" };
    if (d.maxTemp >= 38) return { label: "Very Hot", color: "#ef4444" };
    if (d.maxTemp >= 33) return { label: "Hot", color: "#fb923c" };
    return { label: "Good", color: "#4ade80" };
  };
  const cellClass = (d) => d.rainProb >= 50 ? "cal-cell cal-rain" : d.maxTemp >= 35 ? "cal-cell cal-hot" : "cal-cell cal-good";
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="card-title" style={{ marginBottom: 16 }}>📅 15-Day Farming Calendar</div>
      <div className="cal-grid">
        {days.map((d) => {
          const b = badge(d);
          return (
            <div key={d.date} className={cellClass(d)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{fmtDate(d.date)}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: b.color, padding: "2px 8px", background: b.color + "22", borderRadius: 99 }}>{b.label}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <img src={owmIcon(d.icon)} alt={d.description} style={{ width: 32, height: 32 }} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{d.maxTemp}°/{d.minTemp}°</div>
                  <div style={{ fontSize: 10, color: "var(--text2)", textTransform: "capitalize" }}>{d.description}</div>
                </div>
              </div>
              <div className="rpm-row" style={{ marginTop: 8 }}>
                <div className="rpm-bg"><div className="rpm-fill" style={{ width: `${d.rainProb}%`, background: rainColor(d.rainProb) }} /></div>
                <span style={{ fontSize: 10, color: rainColor(d.rainProb), minWidth: 28 }}>💧{d.rainProb}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── main component ──────────────────────────────────────── */
export default function Weather() {
  const user = JSON.parse(localStorage.getItem("agroconnect_user") || "{}");
  const [searchCity, setSearchCity] = useState(user.location || "Bengaluru");
  const [weather, setWeather] = useState(null);
  const [advisories, setAdvisories] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fcLoading, setFcLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState(0);
  const [selDay, setSelDay] = useState(0);

  const token = localStorage.getItem("agroconnect_token");

  const fetchWeather = useCallback(async (loc) => {
    setLoading(true); setError("");
    try {
      const r = await fetch(`${API_URL}/api/weather?city=${encodeURIComponent(loc)}`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Unable to fetch weather");
      setWeather(d.weather || d);
      setAdvisories(d.advisories || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [token]);

  const fetchForecast = useCallback(async (loc) => {
    setFcLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/weather/forecast?city=${encodeURIComponent(loc)}`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (r.ok) setForecast(d);
    } catch (_) { /* silently degrade */ }
    finally { setFcLoading(false); }
  }, [token]);

  const doSearch = (loc) => {
    if (!loc.trim()) return;
    setSelDay(0);
    fetchWeather(loc.trim());
    fetchForecast(loc.trim());
  };

  useEffect(() => { doSearch(searchCity); }, []);

  const handleSearch = (e) => { e.preventDefault(); doSearch(searchCity); };

  const activeDays = tab === 2 ? forecast?.forecast15 : forecast?.forecast7;

  return (
    <>
      <style>{DS}{WCSS}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Smart Advisory</div>
          <h1 className="pg-title">🌦️ Weather Advisory</h1>
          <p className="pg-sub">Hyperlocal forecasts · 7-day & 15-day outlooks · Farming advisories</p>
        </div>
      </div>

      <form onSubmit={handleSearch} style={{ display: "flex", gap: 10, marginBottom: 28, maxWidth: 480 }}>
        <input className="field-input" placeholder="📍  Enter city or district…" value={searchCity} onChange={(e) => setSearchCity(e.target.value)} style={{ flex: 1 }} />
        <button type="submit" className="btn-green" disabled={loading || fcLoading} id="weather-search-btn">
          {loading || fcLoading ? "…" : "🔍 Search"}
        </button>
      </form>

      {error && <div className="alert-error">⚠️ {error}</div>}
      {(loading || fcLoading) && <div className="loading-wrap"><div className="spinner" /><span>Fetching weather…</span></div>}

      {weather && !loading && (
        <div className="w-tabs">
          {TABS.map((t, i) => (
            <button key={t} id={`weather-tab-${i}`} className={`w-tab${tab === i ? " active" : ""}`} onClick={() => setTab(i)}>{t}</button>
          ))}
        </div>
      )}

      {/* ── TAB 0: CURRENT ── */}
      {tab === 0 && weather && !loading && (
        <>
          <div className="w-hero">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 24 }}>
              <div>
                <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 6 }}>📍 {weather.city || searchCity}, {weather.country || "IN"}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 72, lineHeight: 1 }}>{getEmoji(weather.description)}</div>
                  <div>
                    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 64, fontWeight: 900, background: tempGradient(weather.temperature), WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1 }}>
                      {Math.round(weather.temperature)}°C
                    </div>
                    <div style={{ fontSize: 16, color: "var(--text2)", textTransform: "capitalize" }}>{weather.description}</div>
                  </div>
                </div>
              </div>
              <div className="w-stats-grid" style={{ minWidth: 280 }}>
                {[
                  ["💧","Humidity",`${weather.humidity}%`],
                  ["💨","Wind",`${weather.windSpeed} m/s`],
                  ["🌡️","Feels Like",`${Math.round(weather.feelsLike)}°C`],
                  ["👁️","Visibility",`${((weather.visibility||10000)/1000).toFixed(1)} km`],
                  ["📊","Pressure",`${weather.pressure} hPa`],
                  ["☁️","Condition",weather.condition||"—"],
                ].map(([ic,lbl,val])=>(
                  <div key={lbl} className="w-stat">
                    <div style={{ fontSize:20, marginBottom:4 }}>{ic}</div>
                    <div style={{ fontSize:10, color:"var(--text2)" }}>{lbl}</div>
                    <div style={{ fontSize:16, fontWeight:700, color:"#fff", marginTop:2 }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {forecast?.sunrise && <SunBar sunrise={forecast.sunrise} sunset={forecast.sunset} />}
          {forecast?.hourly?.length > 0 && <HourlyStrip hourly={forecast.hourly} />}

          {advisories.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-title" style={{ marginBottom: 14 }}>🤖 AI Farming Advisories</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {advisories.map((a, i) => (
                  <div key={i} className="adv-item"><span style={{ fontSize: 18, flexShrink: 0 }}>💡</span><span style={{ fontSize: 13, lineHeight: 1.6 }}>{a}</span></div>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>🌾 Farming Best Practices</div>
            <div className="tips-grid">
              {FARM_TIPS.map(({ e, title, tip }) => (
                <div key={title} className="tip-card">
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{e}</div>
                  <div style={{ fontWeight: 700, color: "#fff", marginBottom: 6, fontSize: 13 }}>{title}</div>
                  <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.7 }}>{tip}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── TAB 1 & 2: FORECAST ── */}
      {(tab === 1 || tab === 2) && (
        <>
          {fcLoading && <div className="loading-wrap"><div className="spinner" /><span>Loading forecast…</span></div>}
          {!fcLoading && activeDays && (
            <>
              <FcStrip days={activeDays} selected={selDay} onSelect={setSelDay} is15={tab === 2} />
              <DayDetail day={activeDays[selDay]} />
              {tab === 1 && forecast?.hourly?.length > 0 && <HourlyStrip hourly={forecast.hourly} />}
              {forecast?.sunrise && <SunBar sunrise={forecast.sunrise} sunset={forecast.sunset} />}
              <TempChart days={activeDays} selected={selDay} onSelect={setSelDay} />
              <RainBars days={activeDays} onSelect={setSelDay} />
            </>
          )}
          {!fcLoading && !activeDays && (
            <div className="alert-error">⚠️ Could not load forecast. Please try again.</div>
          )}
        </>
      )}

      {/* ── TAB 3: CALENDAR ── */}
      {tab === 3 && (
        <>
          {fcLoading && <div className="loading-wrap"><div className="spinner" /><span>Loading calendar…</span></div>}
          {!fcLoading && forecast?.forecast15 && (
            <>
              <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                {[{ color: "#4ade80", label: "Good conditions" },{ color: "#38bdf8", label: "Rain risk" },{ color: "#fb923c", label: "High heat" }].map(({ color, label }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text2)" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />{label}
                  </div>
                ))}
              </div>
              <WeatherCalendar days={forecast.forecast15} />
            </>
          )}
          {!fcLoading && !forecast?.forecast15 && (
            <div className="alert-error">⚠️ Could not load calendar data. Please try again.</div>
          )}
        </>
      )}
    </>
  );
}