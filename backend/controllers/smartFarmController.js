/**
 * AgroConnect 360 — Smart Farm Planner Controller
 * POST /api/farmer/smart-farm-plan
 *
 * Orchestrates:
 *   1. Weather fetch (OpenWeatherMap — same key as weatherController)
 *   2. Market data (MarketPrice model + data.gov fallback — same as priceController)
 *   3. Crop recommendation engine (rule-based, ML-ready boundary)
 *   4. Groq AI explanation (same client as assistantRoutes)
 */

const MarketPrice = require("../models/MarketPrice");
const { getLiveMandiPrices } = require("../services/mandiService");
const Groq = require("groq-sdk");

// ============================================================
// GROQ CLIENT (same pattern as assistantRoutes.js)
// ============================================================
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const groqChatWithRetry = async (params, maxAttempts = 3) => {
  let lastErr;
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      return await groq.chat.completions.create(params);
    } catch (err) {
      lastErr = err;
      const code = err.status || err?.error?.code;
      if ((code === 429 || code === 503) && i < maxAttempts) {
        await sleep(i * 3000);
      } else throw err;
    }
  }
  throw lastErr;
};

const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768",
];

// ============================================================
// RECOMMENDATION ENGINE WEIGHTS
// These are configurable constants — swap for ML model later
// Service boundary: calculateCropRecommendation()
// ============================================================
const WEIGHTS = {
  agriculturalSuitability: 0.30,
  weatherSuitability:      0.25,
  marketTrend:             0.20,
  expectedProfit:          0.15,
  waterRequirement:        0.10,
};

// ============================================================
// CROP KNOWLEDGE BASE (~20 common Indian crops)
// ============================================================
const CROP_KNOWLEDGE_BASE = [
  {
    name: "Tomato",
    seasons: ["Kharif", "Rabi", "Zaid"],
    soils: ["Loamy", "Sandy", "Red Soil"],
    waterNeed: "Moderate",
    preferredIrrigation: ["Available", "Limited"],
    tempMin: 18, tempMax: 30,
    yieldPerAcre: 80,   // quintals/acre
    costPerAcre: 25000, // INR/acre
    risk: "Medium",
    duration: "90–120 days",
    sowingPeriod: "Jun–Jul (Kharif), Nov–Dec (Rabi), Feb–Mar (Zaid)",
    mandiKeywords: ["tomato"],
    fertilizer: "DAP + MOP + NPK (19:19:19)",
    cultivation: "Transplant seedlings, stake plants, regular irrigation",
  },
  {
    name: "Potato",
    seasons: ["Rabi"],
    soils: ["Loamy", "Sandy", "Clay"],
    waterNeed: "Moderate",
    preferredIrrigation: ["Available", "Limited"],
    tempMin: 10, tempMax: 25,
    yieldPerAcre: 100,
    costPerAcre: 30000,
    risk: "Low",
    duration: "90–120 days",
    sowingPeriod: "Oct–Nov",
    mandiKeywords: ["potato"],
    fertilizer: "Urea + DAP + MOP at planting",
    cultivation: "Deep loamy soil; earthing-up at 30 days; avoid water-logging",
  },
  {
    name: "Onion",
    seasons: ["Rabi", "Kharif"],
    soils: ["Loamy", "Sandy", "Red Soil"],
    waterNeed: "Moderate",
    preferredIrrigation: ["Available", "Limited"],
    tempMin: 15, tempMax: 28,
    yieldPerAcre: 60,
    costPerAcre: 20000,
    risk: "Medium",
    duration: "100–120 days",
    sowingPeriod: "Oct–Nov (Rabi), Jun–Jul (Kharif)",
    mandiKeywords: ["onion"],
    fertilizer: "NPK + micronutrients; avoid excess nitrogen",
    cultivation: "Transplant 6-week seedlings; stop irrigation 15 days before harvest",
  },
  {
    name: "Rice",
    seasons: ["Kharif"],
    soils: ["Clay", "Black Soil", "Loamy"],
    waterNeed: "High",
    preferredIrrigation: ["Available"],
    tempMin: 22, tempMax: 35,
    yieldPerAcre: 20,
    costPerAcre: 15000,
    risk: "Low",
    duration: "110–150 days",
    sowingPeriod: "Jun–Jul",
    mandiKeywords: ["rice", "paddy", "dhan"],
    fertilizer: "Urea (split application), DAP, ZnSO4",
    cultivation: "Transplant at 25 days; maintain 5 cm standing water; dry intermittently",
  },
  {
    name: "Wheat",
    seasons: ["Rabi"],
    soils: ["Loamy", "Clay", "Black Soil"],
    waterNeed: "Moderate",
    preferredIrrigation: ["Available", "Limited"],
    tempMin: 10, tempMax: 25,
    yieldPerAcre: 16,
    costPerAcre: 12000,
    risk: "Low",
    duration: "120–150 days",
    sowingPeriod: "Nov–Dec",
    mandiKeywords: ["wheat"],
    fertilizer: "Urea + DAP at sowing; top-dress urea at tillering",
    cultivation: "Seed treatment with fungicide; 4–6 irrigations; harvest at full maturity",
  },
  {
    name: "Maize",
    seasons: ["Kharif", "Zaid"],
    soils: ["Loamy", "Sandy", "Red Soil"],
    waterNeed: "Moderate",
    preferredIrrigation: ["Available", "Limited"],
    tempMin: 20, tempMax: 32,
    yieldPerAcre: 25,
    costPerAcre: 10000,
    risk: "Low",
    duration: "80–110 days",
    sowingPeriod: "Jun–Jul (Kharif), Feb–Mar (Zaid)",
    mandiKeywords: ["maize", "corn"],
    fertilizer: "NPK at sowing + Urea side-dressing",
    cultivation: "Row spacing 60 cm; earthing-up at 30 days; intercrop with legumes",
  },
  {
    name: "Cotton",
    seasons: ["Kharif"],
    soils: ["Black Soil", "Loamy", "Clay"],
    waterNeed: "Low",
    preferredIrrigation: ["Available", "Limited", "Rainfed"],
    tempMin: 25, tempMax: 35,
    yieldPerAcre: 8,
    costPerAcre: 18000,
    risk: "Medium",
    duration: "150–180 days",
    sowingPeriod: "May–Jun",
    mandiKeywords: ["cotton"],
    fertilizer: "DAP + Urea + MOP in splits; avoid excess N",
    cultivation: "Rainfed or light irrigation; monitor bollworm; pick mature bolls",
  },
  {
    name: "Groundnut",
    seasons: ["Kharif", "Rabi"],
    soils: ["Sandy", "Red Soil", "Loamy"],
    waterNeed: "Low",
    preferredIrrigation: ["Available", "Limited", "Rainfed"],
    tempMin: 20, tempMax: 30,
    yieldPerAcre: 10,
    costPerAcre: 12000,
    risk: "Low",
    duration: "100–130 days",
    sowingPeriod: "Jun–Jul (Kharif), Nov–Dec (Rabi)",
    mandiKeywords: ["groundnut", "peanut"],
    fertilizer: "DAP + Gypsum; minimal nitrogen (fixes own N)",
    cultivation: "Good drainage; peg zone earthing; dig test before harvest",
  },
  {
    name: "Turmeric",
    seasons: ["Kharif"],
    soils: ["Loamy", "Clay", "Red Soil"],
    waterNeed: "High",
    preferredIrrigation: ["Available"],
    tempMin: 20, tempMax: 30,
    yieldPerAcre: 20,
    costPerAcre: 25000,
    risk: "Low",
    duration: "270–300 days",
    sowingPeriod: "May–Jun",
    mandiKeywords: ["turmeric", "haldi"],
    fertilizer: "FYM + NPK + ZnSO4",
    cultivation: "Raised beds; mulch with green leaves; 15–20 irrigations",
  },
  {
    name: "Chilli",
    seasons: ["Kharif", "Rabi"],
    soils: ["Loamy", "Red Soil", "Sandy"],
    waterNeed: "Moderate",
    preferredIrrigation: ["Available", "Limited"],
    tempMin: 20, tempMax: 32,
    yieldPerAcre: 12,
    costPerAcre: 20000,
    risk: "Medium",
    duration: "120–150 days",
    sowingPeriod: "Jun–Jul (Kharif), Nov–Dec (Rabi)",
    mandiKeywords: ["chilli", "chili", "pepper"],
    fertilizer: "DAP + Urea + micronutrients; foliar sprays",
    cultivation: "Stake plants; remove infected fruits immediately; drip irrigation preferred",
  },
  {
    name: "Brinjal",
    seasons: ["Kharif", "Rabi", "Zaid"],
    soils: ["Loamy", "Clay", "Red Soil"],
    waterNeed: "Moderate",
    preferredIrrigation: ["Available", "Limited"],
    tempMin: 18, tempMax: 32,
    yieldPerAcre: 80,
    costPerAcre: 15000,
    risk: "Low",
    duration: "90–120 days",
    sowingPeriod: "Year-round (season-dependent transplanting)",
    mandiKeywords: ["brinjal", "eggplant"],
    fertilizer: "NPK (15:15:15) + FYM",
    cultivation: "Transplant at 30 days; harvest every 5–7 days; check for shoot borer",
  },
  {
    name: "Bitter Gourd",
    seasons: ["Kharif", "Zaid"],
    soils: ["Loamy", "Sandy"],
    waterNeed: "Moderate",
    preferredIrrigation: ["Available", "Limited"],
    tempMin: 25, tempMax: 38,
    yieldPerAcre: 30,
    costPerAcre: 18000,
    risk: "Low",
    duration: "90–100 days",
    sowingPeriod: "Jun–Jul (Kharif), Feb–Mar (Zaid)",
    mandiKeywords: ["bitter gourd", "karela"],
    fertilizer: "DAP + Urea + K₂O",
    cultivation: "Trellis support; harvest every 2–3 days at immature stage",
  },
  {
    name: "Cabbage",
    seasons: ["Rabi"],
    soils: ["Loamy", "Clay"],
    waterNeed: "Moderate",
    preferredIrrigation: ["Available", "Limited"],
    tempMin: 10, tempMax: 22,
    yieldPerAcre: 100,
    costPerAcre: 15000,
    risk: "Low",
    duration: "90–120 days",
    sowingPeriod: "Sep–Oct (transplant Nov–Dec)",
    mandiKeywords: ["cabbage"],
    fertilizer: "High N requirement; Urea + DAP",
    cultivation: "Cool weather crop; 8–10 irrigations; monitor caterpillars",
  },
  {
    name: "Cauliflower",
    seasons: ["Rabi"],
    soils: ["Loamy", "Clay"],
    waterNeed: "Moderate",
    preferredIrrigation: ["Available", "Limited"],
    tempMin: 12, tempMax: 22,
    yieldPerAcre: 80,
    costPerAcre: 18000,
    risk: "Low",
    duration: "90–120 days",
    sowingPeriod: "Aug–Oct (staggered nursery)",
    mandiKeywords: ["cauliflower"],
    fertilizer: "DAP + MOP + boron foliar spray",
    cultivation: "Tie outer leaves over curd when 5 cm; harvest before over-maturity",
  },
  {
    name: "Soybean",
    seasons: ["Kharif"],
    soils: ["Loamy", "Clay", "Black Soil"],
    waterNeed: "Moderate",
    preferredIrrigation: ["Available", "Limited", "Rainfed"],
    tempMin: 20, tempMax: 32,
    yieldPerAcre: 10,
    costPerAcre: 8000,
    risk: "Low",
    duration: "90–110 days",
    sowingPeriod: "Jun–Jul",
    mandiKeywords: ["soybean", "soya", "soyabean"],
    fertilizer: "DAP + Rhizobium seed inoculant; minimal N",
    cultivation: "Row spacing 45 cm; ISB variety selection; harvest at 95% moisture",
  },
  {
    name: "Sugarcane",
    seasons: ["Kharif", "Zaid"],
    soils: ["Loamy", "Clay", "Black Soil"],
    waterNeed: "High",
    preferredIrrigation: ["Available"],
    tempMin: 22, tempMax: 38,
    yieldPerAcre: 300,
    costPerAcre: 35000,
    risk: "Low",
    duration: "300–365 days",
    sowingPeriod: "Feb–Mar (Spring), Oct–Nov (Autumn)",
    mandiKeywords: ["sugarcane", "sugar cane"],
    fertilizer: "FYM + NPK in splits; Urea at intervals",
    cultivation: "Furrow planting; 3–4 week irrigation; detrash; use trash mulching",
  },
  {
    name: "French Beans",
    seasons: ["Kharif", "Rabi", "Zaid"],
    soils: ["Loamy", "Sandy"],
    waterNeed: "Moderate",
    preferredIrrigation: ["Available", "Limited"],
    tempMin: 15, tempMax: 28,
    yieldPerAcre: 20,
    costPerAcre: 15000,
    risk: "Low",
    duration: "60–80 days",
    sowingPeriod: "Year-round with irrigation",
    mandiKeywords: ["beans", "french beans"],
    fertilizer: "DAP at sowing; minimal N (fixes own)",
    cultivation: "Bush variety; harvest at tender green stage; drip-friendly",
  },
  {
    name: "Sunflower",
    seasons: ["Rabi", "Kharif"],
    soils: ["Loamy", "Sandy", "Red Soil"],
    waterNeed: "Low",
    preferredIrrigation: ["Available", "Limited", "Rainfed"],
    tempMin: 20, tempMax: 32,
    yieldPerAcre: 6,
    costPerAcre: 10000,
    risk: "Low",
    duration: "90–110 days",
    sowingPeriod: "Nov–Dec (Rabi), Jun–Jul (Kharif)",
    mandiKeywords: ["sunflower"],
    fertilizer: "DAP + MOP + boron",
    cultivation: "Cross-pollination; hand pollenation for seed crop; harvest dry",
  },
  {
    name: "Bengal Gram",
    seasons: ["Rabi"],
    soils: ["Loamy", "Sandy", "Red Soil", "Black Soil"],
    waterNeed: "Low",
    preferredIrrigation: ["Available", "Limited", "Rainfed"],
    tempMin: 15, tempMax: 28,
    yieldPerAcre: 6,
    costPerAcre: 8000,
    risk: "Low",
    duration: "90–110 days",
    sowingPeriod: "Oct–Nov",
    mandiKeywords: ["bengal gram", "chickpea", "gram", "tur"],
    fertilizer: "DAP + Rhizobium inoculant",
    cultivation: "Minimal irrigation; 1 light irrigation at flowering helps yield",
  },
  {
    name: "Cucumber",
    seasons: ["Kharif", "Zaid"],
    soils: ["Loamy", "Sandy"],
    waterNeed: "Moderate",
    preferredIrrigation: ["Available", "Limited"],
    tempMin: 20, tempMax: 35,
    yieldPerAcre: 50,
    costPerAcre: 15000,
    risk: "Low",
    duration: "60–70 days",
    sowingPeriod: "Jun–Jul (Kharif), Feb–Mar (Zaid)",
    mandiKeywords: ["cucumber", "kheera"],
    fertilizer: "NPK + foliar micronutrients",
    cultivation: "Trellis or ground trailing; harvest every 2–3 days; regular watering",
  },
];

// ============================================================
// SEASON DETECTION
// ============================================================
const getCurrentSeason = () => {
  const m = new Date().getMonth() + 1;
  if (m >= 6 && m <= 9) return "Kharif";
  if (m >= 10 || m <= 2) return "Rabi";
  return "Zaid";
};

// ============================================================
// SCORE CALCULATORS
// ============================================================

const calcAgriScore = (crop, { soilType, irrigation, season }) => {
  const activeSeason = season === "Current Season" ? getCurrentSeason() : season;
  let score = 0;

  // Season match — 40 pts
  if (crop.seasons.includes(activeSeason)) score += 40;
  else if (crop.seasons.length >= 2) score += 10; // multi-season, partial

  // Soil match — 35 pts
  if (crop.soils.includes(soilType)) score += 35;
  else if (soilType === "Other") score += 18;

  // Irrigation match — 25 pts
  if (crop.preferredIrrigation.includes(irrigation)) score += 25;
  else if (irrigation === "Limited" && crop.preferredIrrigation.includes("Available")) score += 10;
  else if (irrigation === "Available") score += 15; // available is always usable

  return Math.min(100, score);
};

const calcWeatherScore = (crop, weatherData) => {
  if (!weatherData) return 50;
  const { temperature, humidity, condition } = weatherData;
  let score = 0;

  // Temperature fit — 60 pts
  if (temperature >= crop.tempMin && temperature <= crop.tempMax) {
    score += 60;
  } else {
    const diff = temperature < crop.tempMin
      ? crop.tempMin - temperature
      : temperature - crop.tempMax;
    score += Math.max(0, 60 - diff * 5);
  }

  // Rain/humidity fit — 40 pts
  const isRainy = (condition || "").toLowerCase().includes("rain") || humidity > 75;
  const waterMap = {
    High:     { rainy: 40, dry: 12 },
    Moderate: { rainy: 28, dry: 32 },
    Low:      { rainy: 15, dry: 40 },
  };
  const wm = waterMap[crop.waterNeed] || waterMap.Moderate;
  score += isRainy ? wm.rainy : wm.dry;

  return Math.min(100, Math.max(0, score));
};

const findCropInMarket = (crop, list = []) => {
  if (!list.length) return null;
  const lower = crop.name.toLowerCase();
  const keywords = crop.mandiKeywords || [lower];
  return list.find((m) => {
    const cm = (m.commodity || "").toLowerCase();
    return keywords.some((k) => cm.includes(k) || k.includes(cm));
  }) || null;
};

const calcMarketScore = (crop, marketData) => {
  if (!marketData) return 50;
  const { highest = [], lowest = [] } = marketData;

  const inHighest = findCropInMarket(crop, highest);
  if (inHighest) {
    const max = highest[0]?.maxPrice || 1;
    return Math.min(100, Math.round((inHighest.maxPrice / max) * 100));
  }
  const inLowest = findCropInMarket(crop, lowest);
  if (inLowest) return 20;

  // Not found in market data — neutral score
  return 42;
};

const calcWaterScore = (crop, { irrigation }) => {
  const matrix = {
    High:     { Available: 100, Limited: 40, Rainfed: 15 },
    Moderate: { Available: 90,  Limited: 75, Rainfed: 50 },
    Low:      { Available: 80,  Limited: 88, Rainfed: 100 },
  };
  return matrix[crop.waterNeed]?.[irrigation] ?? 50;
};

const calcProfitScore = (crop, areaInAcres, marketData) => {
  let mPrice = 0;
  if (marketData?.highest) {
    const found = findCropInMarket(crop, marketData.highest);
    if (found) mPrice = found.maxPrice;
  }
  if (!mPrice) return 50; // no market data — neutral

  const revenue = crop.yieldPerAcre * areaInAcres * mPrice; // ₹ (yieldPerAcre in q, mPrice in ₹/q)
  const cost    = crop.costPerAcre  * areaInAcres;
  const profit  = revenue - cost;
  const roi     = (profit / (cost || 1)) * 100; // ROI %

  // ROI 200% → 100 pts; 0% → 50 pts; negative → lower
  return Math.min(100, Math.max(0, Math.round(50 + roi / 5)));
};

// ============================================================
// MAIN RECOMMENDATION ENGINE — clean service boundary
// Future: replace body with call to Python FastAPI ML endpoint
// ============================================================
const calculateCropRecommendation = (farmInput, weatherData, marketData) => {
  const { farmArea, soilType, irrigation, waterSource, season } = farmInput;
  const areaInAcres = farmInput.areaInAcres || Number(farmArea) || 1;

  return CROP_KNOWLEDGE_BASE
    .map((crop) => {
      const raw = {
        agri:    calcAgriScore(crop, { soilType, irrigation, season }),
        weather: calcWeatherScore(crop, weatherData),
        market:  calcMarketScore(crop, marketData),
        profit:  calcProfitScore(crop, areaInAcres, marketData),
        water:   calcWaterScore(crop, { irrigation }),
      };

      const totalScore = Math.round(
        raw.agri    * WEIGHTS.agriculturalSuitability +
        raw.weather * WEIGHTS.weatherSuitability +
        raw.market  * WEIGHTS.marketTrend +
        raw.profit  * WEIGHTS.expectedProfit +
        raw.water   * WEIGHTS.waterRequirement
      );

      // Financial calculation
      let mPrice = 0, mPriceSource = "Not available";
      const found = findCropInMarket(crop, marketData?.highest || []);
      if (found) { mPrice = found.maxPrice; mPriceSource = "APMC District Data"; }

      const estimatedRevenue = mPrice
        ? Math.round(crop.yieldPerAcre * areaInAcres * mPrice)
        : null;
      const estimatedCost    = Math.round(crop.costPerAcre * areaInAcres);
      const estimatedProfit  = estimatedRevenue !== null ? estimatedRevenue - estimatedCost : null;
      const profitPerAcre    = estimatedProfit !== null ? Math.round(estimatedProfit / areaInAcres) : null;
      const breakEvenPrice   = mPrice
        ? Math.round(estimatedCost / (crop.yieldPerAcre * areaInAcres))
        : null;

      const weatherFit = raw.weather >= 75 ? "High" : raw.weather >= 50 ? "Moderate" : "Low";
      const marketTrend = raw.market >= 70 ? "Rising" : raw.market >= 40 ? "Stable" : "Declining";

      return {
        crop: crop.name,
        totalScore,
        breakdown: {
          agriSuitability: {
            score:    Math.round(raw.agri * WEIGHTS.agriculturalSuitability),
            rawScore: raw.agri,
            maxScore: Math.round(100 * WEIGHTS.agriculturalSuitability),
          },
          weatherSuitability: {
            score:    Math.round(raw.weather * WEIGHTS.weatherSuitability),
            rawScore: raw.weather,
            maxScore: Math.round(100 * WEIGHTS.weatherSuitability),
          },
          marketTrend: {
            score:    Math.round(raw.market * WEIGHTS.marketTrend),
            rawScore: raw.market,
            maxScore: Math.round(100 * WEIGHTS.marketTrend),
          },
          expectedProfit: {
            score:    Math.round(raw.profit * WEIGHTS.expectedProfit),
            rawScore: raw.profit,
            maxScore: Math.round(100 * WEIGHTS.expectedProfit),
          },
          waterRequirement: {
            score:    Math.round(raw.water * WEIGHTS.waterRequirement),
            rawScore: raw.water,
            maxScore: Math.round(100 * WEIGHTS.waterRequirement),
          },
        },
        yield: {
          perAcre: crop.yieldPerAcre,
          total:   Math.round(crop.yieldPerAcre * areaInAcres),
          unit:    "quintals",
        },
        financial: {
          estimatedRevenue,
          estimatedCost,
          estimatedProfit,
          profitPerAcre,
          breakEvenPrice,
          marketPrice: mPrice || null,
          marketPriceUnit: "₹/quintal",
          marketPriceSource: mPriceSource,
        },
        risk:       crop.risk,
        duration:   crop.duration,
        sowingPeriod: crop.sowingPeriod,
        weatherFit,
        marketTrend,
        farmingRequirements: {
          soilSuitability:      crop.soils.join(", "),
          tempRange:            `${crop.tempMin}–${crop.tempMax}°C`,
          waterRequirement:     crop.waterNeed,
          irrigationRequirement: crop.preferredIrrigation.join(" / "),
          sowingPeriod:         crop.sowingPeriod,
          duration:             crop.duration,
          fertilizer:           crop.fertilizer,
          cultivationPractices: crop.cultivation,
          risk:                 crop.risk,
        },
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 5)
    .map((r, i) => ({ ...r, rank: i + 1 }));
};

// ============================================================
// WEATHER FETCH (OpenWeatherMap — same key + pattern as weatherController)
// ============================================================
const fetchWeatherForLocation = async (locationQuery) => {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) return null;

  try {
    const url =
      `https://api.openweathermap.org/data/2.5/weather` +
      `?q=${encodeURIComponent(locationQuery.trim())}` +
      `&appid=${apiKey}&units=metric`;

    const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!resp.ok) return null;
    const d = await resp.json();

    const temperature = d.main?.temp;
    const humidity    = d.main?.humidity;
    const windSpeed   = d.wind?.speed || 0;
    const condition   = d.weather?.[0]?.main || "";
    const description = d.weather?.[0]?.description || "";

    // Weather suitability score (0-100)
    let suitability = 80;
    if (temperature > 40) suitability -= 25;
    else if (temperature < 10) suitability -= 20;
    if (humidity > 85) suitability -= 10;
    if (windSpeed > 15) suitability -= 5;
    if (condition.toLowerCase().includes("storm")) suitability -= 20;
    suitability = Math.max(0, Math.min(100, suitability));

    const suitabilityLabel =
      suitability >= 75 ? "Suitable" :
      suitability >= 50 ? "Moderate" : "Unfavorable";

    return {
      city:       d.name,
      country:    d.sys?.country || "",
      temperature,
      feelsLike:  d.main?.feels_like,
      humidity,
      condition,
      description,
      windSpeed,
      pressure:   d.main?.pressure,
      visibility: d.visibility || 0,
      suitabilityScore: suitability,
      suitabilityLabel,
    };
  } catch {
    return null;
  }
};

// ============================================================
// MARKET DATA FETCH (same pattern as getDistrictInsights + getMarketTrends)
// ============================================================
const fetchMarketDataForDistrict = async (state, district) => {
  // 1. Try local MongoDB first
  let prices = await MarketPrice.find({ state, district }).lean();

  // 2. Fallback: live data.gov.in
  if (!prices.length) {
    try {
      const liveRecords = await getLiveMandiPrices({ state, district, limit: 300 });
      if (liveRecords?.length) {
        prices = liveRecords.map((item) => ({
          commodity:  item.commodity  || item.Commodity  || "Crop",
          variety:    item.variety    || item.Variety    || "",
          market:     item.market     || item.Market     || "APMC",
          district:   item.district   || item.District   || district,
          state:      item.state      || item.State      || state,
          minPrice:   Number(item.min_price   || item.Min_Price   || 0),
          maxPrice:   Number(item.max_price   || item.Max_Price   || 0),
          modalPrice: Number(item.modal_price || item.Modal_Price || 0),
        }));
      }
    } catch { /* live fetch failed — return empty */ }
  }

  if (!prices.length) return null;

  // De-duplicate: group by commodity+variety+market
  const grouped = {};
  prices.forEach((item) => {
    const key = `${item.commodity}-${item.variety}-${item.market}`;
    if (!grouped[key]) {
      grouped[key] = { ...item };
    } else {
      grouped[key].maxPrice  = Math.max(grouped[key].maxPrice,  item.maxPrice);
      grouped[key].minPrice  = Math.min(grouped[key].minPrice,  item.minPrice);
      grouped[key].modalPrice = item.modalPrice || grouped[key].modalPrice;
    }
  });

  const records  = Object.values(grouped);
  const highest  = [...records].sort((a, b) => b.maxPrice  - a.maxPrice).slice(0, 10);
  const lowest   = [...records].sort((a, b) => a.minPrice  - b.minPrice).slice(0, 10);
  const byAvg    = [...records].sort((a, b) => b.modalPrice - a.modalPrice).slice(0, 15);

  return { highest, lowest, byAvg, totalRecords: records.length };
};

// ============================================================
// BEST MARKET FOR TOP CROP
// ============================================================
const getBestMarket = (marketData, topCropName) => {
  if (!marketData || !topCropName) return null;
  const all = [...(marketData.highest || []), ...(marketData.byAvg || [])];
  const lower = topCropName.toLowerCase();
  const matches = all.filter((m) =>
    (m.commodity || "").toLowerCase().includes(lower) ||
    lower.includes((m.commodity || "").toLowerCase().split(" ")[0])
  );
  if (!matches.length) return null;
  matches.sort((a, b) => b.maxPrice - a.maxPrice);
  return {
    crop:     topCropName,
    market:   matches[0].market,
    price:    matches[0].maxPrice,
    minPrice: matches[0].minPrice,
    district: matches[0].district,
    note:     "Highest observed market price.",
  };
};

// ============================================================
// SELLING RECOMMENDATION
// ============================================================
const getSellingRecommendation = (topRec, weatherData, marketData) => {
  if (!topRec) return null;
  const signals = [];
  let signal = "neutral";

  if (topRec.totalScore >= 75) { signals.push("Strong crop suitability score"); signal = "favorable"; }
  if (topRec.marketTrend === "Rising") { signals.push(`Market trend for ${topRec.crop} is rising`); signal = "favorable"; }
  if (weatherData?.suitabilityLabel === "Suitable") { signals.push("Weather conditions are currently suitable"); }
  if (topRec.financial?.estimatedProfit > 0) {
    signals.push(`Positive profit margin estimated at ₹${(topRec.financial.estimatedProfit).toLocaleString("en-IN")}`);
  }

  const headline =
    signal === "favorable"
      ? `Current conditions are favorable for growing ${topRec.crop}.`
      : `Conditions for ${topRec.crop} are moderate — consider local expert advice.`;

  return {
    signal,
    headline,
    details: signals.join(". ") + ".",
    disclaimer: "Recommended based on available data. Market prices and weather are subject to change.",
  };
};

// ============================================================
// AI EXPLANATION (Groq — same models as assistantRoutes.js)
// ============================================================
const getAIExplanation = async ({ farmInput, weatherData, marketData, recommendations }) => {
  if (!process.env.GROQ_API_KEY) return "AI explanation unavailable — GROQ_API_KEY not configured.";

  const top = recommendations?.[0];
  if (!top) return "No crop recommendation available to explain.";

  const marketSummary = marketData?.highest?.slice(0, 5)
    .map((m) => `  • ${m.commodity} (${m.market}): ₹${m.maxPrice}/quintal`)
    .join("\n") || "  No market data available.";

  const weatherSummary = weatherData
    ? `Temperature: ${weatherData.temperature}°C, Humidity: ${weatherData.humidity}%, Condition: ${weatherData.condition}, Wind: ${weatherData.windSpeed} m/s`
    : "Weather data unavailable.";

  const prompt = `You are AgroConnect AI, an expert agricultural advisor for Indian farmers.

Based on the following CALCULATED DATA from AgroConnect 360's Smart Farm Planner, provide a comprehensive farm planning explanation.

FARM DETAILS:
- Location: ${farmInput.district}, ${farmInput.state}
- Farm Area: ${farmInput.farmArea} ${farmInput.areaUnit} (${farmInput.areaInAcres?.toFixed(2)} acres)
- Soil Type: ${farmInput.soilType}
- Irrigation: ${farmInput.irrigation}
- Water Source: ${farmInput.waterSource}
- Season: ${farmInput.season}
${farmInput.budget ? `- Budget: ₹${farmInput.budget}` : ""}
${farmInput.previousCrop ? `- Previous Crop: ${farmInput.previousCrop}` : ""}

WEATHER DATA (actual OpenWeatherMap readings):
${weatherSummary}

TOP RECOMMENDED CROP: ${top.crop} (Score: ${top.totalScore}/100)
  - Agricultural Suitability: ${top.breakdown.agriSuitability.score}/${top.breakdown.agriSuitability.maxScore}
  - Weather Suitability:      ${top.breakdown.weatherSuitability.score}/${top.breakdown.weatherSuitability.maxScore}
  - Market Trend:             ${top.breakdown.marketTrend.score}/${top.breakdown.marketTrend.maxScore}
  - Expected Profit:          ${top.breakdown.expectedProfit.score}/${top.breakdown.expectedProfit.maxScore}
  - Water Requirement:        ${top.breakdown.waterRequirement.score}/${top.breakdown.waterRequirement.maxScore}
  - Expected Yield: ${top.yield.total} quintals total
  - Estimated Revenue: ${top.financial.estimatedRevenue ? `₹${top.financial.estimatedRevenue.toLocaleString("en-IN")}` : "Data unavailable"}
  - Estimated Cost: ₹${top.financial.estimatedCost?.toLocaleString("en-IN")}
  - Risk Level: ${top.risk}
  - Crop Duration: ${top.duration}
  - Sowing Period: ${top.sowingPeriod}

ACTUAL MARKET PRICES (from APMC District Data):
${marketSummary}

Provide a practical, clear advisory (4–5 paragraphs) covering:
1. Why ${top.crop} is the top recommendation for this specific farm
2. Current market situation based on the actual data provided above
3. Key farming requirements and best practices for ${farmInput.soilType} soil with ${farmInput.irrigation} irrigation
4. Major risks and how to mitigate them
5. Suggested next steps for the farmer

IMPORTANT RULES:
- Use ONLY the actual data provided above. Do NOT invent prices or weather values.
- Use Indian farming terminology: quintal (100 kg), acre, ₹, KVK, APMC
- Be practical and farmer-friendly; avoid jargon
- If relevant, mention PM-KISAN, Fasal Bima Yojana, or Soil Health Card schemes`;

  let explanation = "";
  let lastErr = null;

  for (const model of GROQ_MODELS) {
    try {
      const resp = await groqChatWithRetry({
        model,
        messages: [
          { role: "system", content: "You are AgroConnect AI, an expert agricultural consultant for Indian farmers. Respond in clear, practical English." },
          { role: "user", content: prompt },
        ],
        max_tokens: 1200,
        temperature: 0.6,
      });
      explanation = resp.choices?.[0]?.message?.content || "";
      if (explanation) break;
    } catch (err) {
      lastErr = err;
      const code = err.status || err?.error?.code;
      if (code !== 429 && code !== 503) break;
      await sleep(1000);
    }
  }

  if (!explanation) {
    const code = lastErr?.status || lastErr?.error?.code;
    if (code === 429) return "⏳ AI explanation is temporarily unavailable due to high demand. The recommendation scores above are calculated from real market and weather data.";
    return "AI explanation unavailable at this time. Please refer to the recommendation scores and market data above.";
  }

  return explanation;
};

// ============================================================
// MAIN CONTROLLER — POST /api/farmer/smart-farm-plan
// ============================================================
const generateSmartFarmPlan = async (req, res) => {
  try {
    const {
      state, district, location, farmArea, areaUnit,
      soilType, irrigation, waterSource, season, budget, previousCrop,
    } = req.body;

    // ── Validation ──────────────────────────────────────────
    if (!state || !district) {
      return res.status(400).json({ success: false, message: "State and district are required." });
    }
    const rawArea = parseFloat(farmArea);
    if (!rawArea || rawArea <= 0) {
      return res.status(400).json({ success: false, message: "Valid farm area is required." });
    }

    const areaInAcres = areaUnit === "Hectare" ? rawArea * 2.471 : rawArea;

    // ── Fetch weather + market in parallel ─────────────────
    const weatherCity = (location || district || state).trim();
    const [weatherResult, marketResult] = await Promise.allSettled([
      fetchWeatherForLocation(weatherCity),
      fetchMarketDataForDistrict(state, district),
    ]);

    const weatherData = weatherResult.status === "fulfilled" ? weatherResult.value : null;
    const marketData  = marketResult.status  === "fulfilled" ? marketResult.value  : null;

    const farmInput = {
      state, district, location: weatherCity, farmArea: rawArea, areaUnit,
      areaInAcres, soilType, irrigation, waterSource, season, budget, previousCrop,
    };

    // ── Crop Recommendation Engine ─────────────────────────
    const recommendations = calculateCropRecommendation(farmInput, weatherData, marketData);

    // ── AI Explanation ──────────────────────────────────────
    const aiExplanation = await getAIExplanation({
      farmInput,
      weatherData,
      marketData,
      recommendations: recommendations.slice(0, 3),
    });

    // ── Best Market + Selling Recommendation ───────────────
    const bestMarket = getBestMarket(marketData, recommendations[0]?.crop);
    const sellingRecommendation = getSellingRecommendation(recommendations[0], weatherData, marketData);

    return res.status(200).json({
      success: true,
      farmDetails:  farmInput,
      weather:      weatherData  || { unavailable: true, message: "Weather data could not be retrieved. Check your OpenWeatherMap API key." },
      market:       marketData   || { unavailable: true, message: "Market data not available for this district. Try a larger nearby city." },
      recommendations,
      bestMarket:   bestMarket   || null,
      sellingRecommendation: sellingRecommendation || null,
      aiExplanation,
      meta: {
        weights: WEIGHTS,
        engine: "AgroConnect Rule-Based Crop Scorer v1.0 (ML-ready boundary)",
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[SmartFarm] Unexpected error:", error?.message || error);
    return res.status(500).json({
      success: false,
      message: "Unable to generate smart farm plan. Please try again.",
    });
  }
};

module.exports = { generateSmartFarmPlan, savePlan, getSavedPlans, getSavedPlanById, deleteSavedPlan };

// ============================================================
// SAVE A GENERATED PLAN
// POST /api/farmer/smart-farm-plans
// ============================================================
const SmartFarmPlan = require("../models/SmartFarmPlan");
const Notification  = require("../models/Notification");

async function savePlan(req, res) {
  try {
    const { farmDetails, recommendations, weather, market, bestMarket, sellingRecommendation, aiExplanation, meta } = req.body;

    if (!farmDetails) {
      return res.status(400).json({ success: false, message: "Plan data is required" });
    }

    const top = Array.isArray(recommendations) ? recommendations[0] : null;
    const title = top
      ? `${top.crop} Plan — ${farmDetails.district || ""}, ${farmDetails.state || ""}`.trim()
      : `Farm Plan — ${farmDetails.district || ""}, ${farmDetails.state || ""}`.trim();

    const plan = await SmartFarmPlan.create({
      farmer: req.user._id,
      title,
      topCrop:  top?.crop  || "",
      topScore: top?.totalScore || 0,
      location: `${farmDetails.district || ""}, ${farmDetails.state || ""}`.trim(),
      farmArea: `${farmDetails.farmArea} ${farmDetails.areaUnit}`,
      farmDetails,
      recommendations: recommendations || [],
      weather:  weather  || {},
      market:   market   || {},
      bestMarket:           bestMarket           || null,
      sellingRecommendation: sellingRecommendation || null,
      aiExplanation: aiExplanation || "",
      meta:     meta     || {},
    });

    // Create a notification for this plan save
    try {
      await Notification.create({
        farmer:  req.user._id,
        type:    "plan",
        title:   `🌾 Smart Farm Plan saved`,
        message: `${title} has been saved. Top recommendation: ${top?.crop || "—"} (Score: ${top?.totalScore || 0}/100).`,
        link:    "/farmer/saved-plans",
        metadata: { planId: plan._id.toString() },
      });
    } catch (notifErr) {
      console.warn("[SmartFarm] Notification create failed:", notifErr.message);
    }

    return res.status(201).json({ success: true, message: "Farm plan saved successfully", plan: { _id: plan._id, title: plan.title, topCrop: plan.topCrop, topScore: plan.topScore, location: plan.location, farmArea: plan.farmArea, createdAt: plan.createdAt } });
  } catch (error) {
    console.error("[SmartFarm] savePlan error:", error?.message);
    return res.status(500).json({ success: false, message: "Unable to save farm plan" });
  }
}

// ============================================================
// LIST SAVED PLANS
// GET /api/farmer/smart-farm-plans
// ============================================================
async function getSavedPlans(req, res) {
  try {
    const plans = await SmartFarmPlan.find({ farmer: req.user._id })
      .select("title topCrop topScore location farmArea createdAt farmDetails.district farmDetails.state")
      .sort({ createdAt: -1 })
      .limit(50);
    return res.status(200).json({ success: true, count: plans.length, plans });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to load saved plans" });
  }
}

// ============================================================
// GET ONE PLAN (for PDF re-download)
// GET /api/farmer/smart-farm-plans/:id
// ============================================================
async function getSavedPlanById(req, res) {
  try {
    const plan = await SmartFarmPlan.findOne({ _id: req.params.id, farmer: req.user._id });
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });
    return res.status(200).json({ success: true, plan });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to load plan" });
  }
}

// ============================================================
// DELETE A PLAN
// DELETE /api/farmer/smart-farm-plans/:id
// ============================================================
async function deleteSavedPlan(req, res) {
  try {
    const plan = await SmartFarmPlan.findOneAndDelete({ _id: req.params.id, farmer: req.user._id });
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });
    return res.status(200).json({ success: true, message: "Plan deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to delete plan" });
  }
}
