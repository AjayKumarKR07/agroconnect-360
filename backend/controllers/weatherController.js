const weatherCache = new Map();

const CACHE_DURATION =
  15 * 60 * 1000; // 15 minutes

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

module.exports = {
  getWeather,
};