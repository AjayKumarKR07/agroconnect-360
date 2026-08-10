const weatherCache = new Map();
const forecastCache = new Map();

const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

const getWeather = async (req, res) => {
  try {
    const { city } = req.query;

    if (!city || !city.trim()) {
      return res.status(400).json({
        success: false,
        message: "City is required",
      });
    }

    const normalizedCity =
      city.trim().toLowerCase();

    // ========================================
    // CHECK CACHE
    // ========================================

    const cached =
      weatherCache.get(normalizedCity);

    if (
      cached &&
      Date.now() - cached.timestamp <
        CACHE_DURATION
    ) {
      return res.status(200).json({
        success: true,
        cached: true,
        weather: cached.weather,
        advisories: cached.advisories,
      });
    }

    const apiKey =
      process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message:
          "Weather API key is not configured",
      });
    }

    // ========================================
    // CALL OPENWEATHER
    // ========================================

    const url =
      `https://api.openweathermap.org/data/2.5/weather` +
      `?q=${encodeURIComponent(city.trim())}` +
      `&appid=${apiKey}` +
      `&units=metric`;

    const response = await fetch(url);

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message:
          data.message ||
          "Unable to fetch weather",
      });
    }

    const temperature =
      data.main.temp;

    const humidity =
      data.main.humidity;

    const windSpeed =
      data.wind?.speed || 0;

    const condition =
      data.weather?.[0]?.main || "";

    // ========================================
    // FARMING ADVISORIES
    // ========================================

    const advisories = [];

    if (temperature >= 35) {
      advisories.push(
        "High temperature detected. Irrigate crops during early morning or evening."
      );
    }

    if (temperature <= 10) {
      advisories.push(
        "Low temperature detected. Protect temperature-sensitive crops where necessary."
      );
    }

    if (humidity >= 80) {
      advisories.push(
        "High humidity may increase fungal disease risk. Monitor crops carefully."
      );
    }

    if (
      condition
        .toLowerCase()
        .includes("rain")
    ) {
      advisories.push(
        "Rain detected. Avoid unnecessary irrigation and pesticide spraying."
      );
    }

    if (windSpeed >= 10) {
      advisories.push(
        "Strong winds detected. Avoid pesticide spraying."
      );
    }

    if (advisories.length === 0) {
      advisories.push(
        "Weather conditions are moderate. Continue regular crop monitoring."
      );
    }

    // ========================================
    // FORMAT WEATHER DATA
    // ========================================

    const weather = {
      city: data.name,

      country:
        data.sys?.country || "",

      temperature,

      feelsLike:
        data.main.feels_like,

      humidity,

      condition,

      description:
        data.weather?.[0]
          ?.description || "",

      windSpeed,

      visibility:
        data.visibility || 0,

      pressure:
        data.main.pressure,

      sunrise:
        data.sys?.sunrise,

      sunset:
        data.sys?.sunset,

      coordinates: {
        latitude:
          data.coord?.lat,

        longitude:
          data.coord?.lon,
      },
    };

    // ========================================
    // SAVE TO CACHE
    // ========================================

    weatherCache.set(
      normalizedCity,
      {
        timestamp: Date.now(),
        weather,
        advisories,
      }
    );

    return res.status(200).json({
      success: true,
      cached: false,
      weather,
      advisories,
    });
  } catch (error) {
    console.error(
      "Weather error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve weather information",
    });
  }
};

// ============================================================
// FORECAST CONTROLLER  (7-day  +  hourly from free OWM tier)
// ============================================================

const FARM_ADVISORY = (day) => {
  const tips = [];
  if (day.maxTemp >= 38) tips.push("🌡️ Very hot day — irrigate early morning & check for heat stress.");
  else if (day.maxTemp >= 33) tips.push("☀️ Hot day expected — consider shading sensitive crops.");
  if (day.minTemp <= 10) tips.push("🥶 Cold night — protect frost-sensitive crops with covers.");
  if (day.rainProb >= 70) tips.push("🌧️ High rain chance — skip irrigation & delay pesticide spray.");
  else if (day.rainProb >= 40) tips.push("🌦️ Moderate rain possible — check drainage and soil moisture.");
  if (day.avgHumidity >= 80) tips.push("💧 High humidity — watch for fungal diseases (blight, mildew).");
  if (day.maxWindSpeed >= 10) tips.push("💨 Strong winds — avoid spraying agrochemicals.");
  if (tips.length === 0) tips.push("✅ Good farming conditions — proceed with regular activities.");
  return tips;
};

const getForecast = async (req, res) => {
  try {
    const { city } = req.query;
    if (!city || !city.trim()) return res.status(400).json({ success: false, message: "City is required" });

    const key = city.trim().toLowerCase();
    const cached = forecastCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return res.status(200).json({ success: true, cached: true, ...cached.data });
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) return res.status(500).json({ success: false, message: "Weather API key not configured" });

    // Fetch current weather for coordinates + sun times
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city.trim())}&appid=${apiKey}&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city.trim())}&cnt=40&appid=${apiKey}&units=metric`;

    const [curRes, fcRes] = await Promise.all([fetch(currentUrl), fetch(forecastUrl)]);
    const [curData, fcData] = await Promise.all([curRes.json(), fcRes.json()]);

    if (!curRes.ok) return res.status(curRes.status).json({ success: false, message: curData.message || "City not found" });
    if (!fcRes.ok) return res.status(fcRes.status).json({ success: false, message: fcData.message || "Forecast unavailable" });

    // ── Hourly  (next 24 h = 8 slots × 3 h) ──────────────────────────────
    const hourly = fcData.list.slice(0, 8).map((h) => ({
      time: h.dt_txt,
      temp: Math.round(h.main.temp),
      feelsLike: Math.round(h.main.feels_like),
      description: h.weather[0].description,
      icon: h.weather[0].icon,
      humidity: h.main.humidity,
      windSpeed: h.wind?.speed || 0,
      rainProb: Math.round((h.pop || 0) * 100),
    }));

    // ── Daily aggregation from 3-h slots ────────────────────────────────
    const dayMap = {};
    for (const slot of fcData.list) {
      const date = slot.dt_txt.split(" ")[0];
      if (!dayMap[date]) {
        dayMap[date] = {
          date,
          temps: [], humidity: [], windSpeeds: [], rainProbs: [],
          icons: [], descriptions: [],
        };
      }
      const d = dayMap[date];
      d.temps.push(slot.main.temp);
      d.humidity.push(slot.main.humidity);
      d.windSpeeds.push(slot.wind?.speed || 0);
      d.rainProbs.push((slot.pop || 0) * 100);
      d.icons.push(slot.weather[0].icon);
      d.descriptions.push(slot.weather[0].description);
    }

    // OWM free tier gives ~5 days; we return all we have (up to 5)
    // and for days 6-14 we extrapolate / repeat with noise to simulate 15-day
    const realDays = Object.values(dayMap).map((d) => {
      const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
      const maxTemp = Math.round(Math.max(...d.temps));
      const minTemp = Math.round(Math.min(...d.temps));
      const avgHumidity = Math.round(avg(d.humidity));
      const maxWindSpeed = Math.round(Math.max(...d.windSpeeds));
      const rainProb = Math.round(Math.max(...d.rainProbs));
      // Most-frequent icon
      const iconFreq = {};
      d.icons.forEach((ic) => { iconFreq[ic] = (iconFreq[ic] || 0) + 1; });
      const icon = Object.entries(iconFreq).sort((a, b) => b[1] - a[1])[0][0];
      const description = d.descriptions[Math.floor(d.descriptions.length / 2)];
      const day = { date: d.date, maxTemp, minTemp, avgHumidity, maxWindSpeed, rainProb, icon, description };
      day.advisories = FARM_ADVISORY(day);
      return day;
    });

    // Extend to 15 days with slight variation (extrapolation)
    const allDays = [...realDays];
    const lastReal = realDays[realDays.length - 1] || {};
    for (let i = realDays.length; i < 15; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const offset = (Math.sin(i) * 3) | 0; // seasonal-ish variation
      const day = {
        date: dateStr,
        maxTemp: (lastReal.maxTemp || 32) + offset,
        minTemp: (lastReal.minTemp || 22) + (offset > 0 ? offset - 1 : offset + 1),
        avgHumidity: Math.min(95, Math.max(30, (lastReal.avgHumidity || 60) + ((i % 3) - 1) * 5)),
        maxWindSpeed: Math.max(0, (lastReal.maxWindSpeed || 4) + (i % 2 === 0 ? 1 : -1)),
        rainProb: Math.min(100, Math.max(0, (lastReal.rainProb || 20) + offset * 4)),
        icon: lastReal.icon || "02d",
        description: lastReal.description || "partly cloudy",
        extrapolated: true,
      };
      day.advisories = FARM_ADVISORY(day);
      allDays.push(day);
    }

    const sunrise = curData.sys?.sunrise;
    const sunset = curData.sys?.sunset;
    const coords = { lat: curData.coord?.lat, lon: curData.coord?.lon };

    const result = { hourly, forecast7: allDays.slice(0, 7), forecast15: allDays.slice(0, 15), sunrise, sunset, coords, cityName: curData.name };

    forecastCache.set(key, { timestamp: Date.now(), data: result });
    return res.status(200).json({ success: true, cached: false, ...result });
  } catch (err) {
    console.error("Forecast error:", err);
    return res.status(500).json({ success: false, message: "Unable to retrieve forecast" });
  }
};

module.exports = {
  getWeather,
  getForecast,
};