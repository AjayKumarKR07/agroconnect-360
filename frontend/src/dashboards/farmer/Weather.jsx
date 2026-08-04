import { useEffect, useState } from "react";
import { API_URL } from "../../config/api";
import { DS } from "../../styles/ds";

export default function Weather() {
  const user = JSON.parse(localStorage.getItem("agroconnect_user") || "{}");
  const [searchCity, setSearchCity] = useState(user.location || "Bengaluru");
  const [weather, setWeather] = useState(null);
  const [advisories, setAdvisories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchWeather = async (loc) => {
    setLoading(true); setError("");
    try {
      const token = localStorage.getItem("agroconnect_token");
      const r = await fetch(`${API_URL}/api/weather?city=${encodeURIComponent(loc)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Unable to fetch weather");
      setWeather(d.weather || d);
      setAdvisories(d.advisories || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchWeather(searchCity); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchCity.trim()) fetchWeather(searchCity.trim());
  };

  const getWeatherEmoji = (desc = "") => {
    const d = desc.toLowerCase();
    if (d.includes("rain")) return "🌧️";
    if (d.includes("cloud")) return "☁️";
    if (d.includes("sun") || d.includes("clear")) return "☀️";
    if (d.includes("storm") || d.includes("thunder")) return "⛈️";
    if (d.includes("wind")) return "💨";
    if (d.includes("mist") || d.includes("fog")) return "🌫️";
    return "🌤️";
  };

  const FARM_TIPS = [
    { emoji: "💧", title: "Irrigation", tip: "Water in early morning or late evening to minimize evaporation." },
    { emoji: "🌱", title: "Sowing", tip: "Check rain forecast before sowing to avoid waterlogging." },
    { emoji: "🐛", title: "Pest Watch", tip: "Humid conditions increase pest risk — inspect crops regularly." },
    { emoji: "🌾", title: "Harvest", tip: "Harvest before heavy rainfall to prevent crop damage." },
  ];

  return (
    <>
      <style>{DS}</style>

      <div className="pg-head">
        <div>
          <div className="eyebrow">Smart Advisory</div>
          <h1 className="pg-title">🌦️ Weather Advisory</h1>
          <p className="pg-sub">Hyperlocal weather forecasts and farming advisories.</p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ display: "flex", gap: 10, marginBottom: 28, maxWidth: 480 }}>
        <input
          className="field-input"
          placeholder="📍  Enter city or district…"
          value={searchCity}
          onChange={(e) => setSearchCity(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn-green" disabled={loading}>
          {loading ? "…" : "🔍 Search"}
        </button>
      </form>

      {error && <div className="alert-error">⚠️ {error}</div>}

      {loading && <div className="loading-wrap"><div className="spinner" /><span>Fetching weather…</span></div>}

      {weather && !loading && (
        <>
          {/* Main weather card */}
          <div className="card" style={{
            background: "linear-gradient(135deg, rgba(56,189,248,0.08) 0%, rgba(34,197,94,0.05) 100%)",
            borderColor: "rgba(56,189,248,0.15)", marginBottom: 20,
            padding: "32px 36px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 24 }}>
              <div>
                <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 6 }}>
                  📍 {weather.name || weather.city || searchCity}, India
                </div>
                <div style={{ fontSize: 72, lineHeight: 1, marginBottom: 12 }}>
                  {getWeatherEmoji(weather.description || weather.weather?.[0]?.description)}
                </div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 60, fontWeight: 800, color: "#fff", lineHeight: 1 }}>
                  {Math.round(weather.temperature || weather.main?.temp || 0)}°C
                </div>
                <div style={{ fontSize: 16, color: "var(--text2)", marginTop: 8, textTransform: "capitalize" }}>
                  {weather.description || weather.weather?.[0]?.description || "Partly Cloudy"}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, minWidth: 260 }}>
                {[
                  ["💧", "Humidity",   `${weather.humidity || weather.main?.humidity || "—"}%`],
                  ["💨", "Wind",       `${weather.windSpeed || weather.wind?.speed || "—"} km/h`],
                  ["🌡️", "Feels Like", `${Math.round(weather.feelsLike || weather.main?.feels_like || 0)}°C`],
                  ["👁️", "Visibility", `${(weather.visibility || 10000) / 1000} km`],
                ].map(([icon, label, val]) => (
                  <div key={label} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 14, padding: "16px 18px", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
                    <div style={{ fontSize: 11, color: "var(--text2)" }}>{label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginTop: 2 }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Advisories */}
          {advisories.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-title" style={{ marginBottom: 16 }}>🤖 AI Farming Advisories</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {advisories.map((a, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, padding: "14px 16px", background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>💡</span>
                    <span style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.6 }}>{a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* General tips (always visible) */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: 16 }}>🌾 General Farming Tips</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
          {FARM_TIPS.map(({ emoji, title, tip }) => (
            <div key={title} style={{ padding: "18px", background: "var(--surface)", borderRadius: 14, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{emoji}</div>
              <div style={{ fontWeight: 700, color: "#fff", marginBottom: 6, fontSize: 14 }}>{title}</div>
              <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>{tip}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}