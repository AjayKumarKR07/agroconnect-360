const RESOURCE_ID =
  process.env.DATA_GOV_RESOURCE_ID ||
  "9ef84268-d588-465a-a308-a864a43d0070";

// ==========================================
// IN-MEMORY CACHE (30 min TTL)
// ==========================================

const MANDI_CACHE = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

const getCacheKey = ({ state, commodity, district, market }) =>
  `${(state || "").toLowerCase()}|${(commodity || "").toLowerCase()}|${(district || "").toLowerCase()}|${(market || "").toLowerCase()}`;

const getCached = (key) => {
  const entry = MANDI_CACHE.get(key);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    MANDI_CACHE.delete(key);
    return null;
  }
  return entry.records;
};

const setCache = (key, records) => {
  MANDI_CACHE.set(key, { records, cachedAt: Date.now() });
};

// ==========================================
// FALLBACK MOCK DATA
// ==========================================

const TODAY = new Date().toISOString().split("T")[0];

const FALLBACK_RECORDS = {
  tomato: [
    { state: "Karnataka", district: "Bengaluru", market: "Yeshwanthpur", commodity: "Tomato", variety: "Local", min_price: "1200", max_price: "2800", modal_price: "2000", arrival_date: TODAY },
    { state: "Karnataka", district: "Mysuru", market: "Mysuru", commodity: "Tomato", variety: "Hybrid", min_price: "1500", max_price: "3000", modal_price: "2200", arrival_date: TODAY },
    { state: "Maharashtra", district: "Nashik", market: "Lasalgaon", commodity: "Tomato", variety: "Local", min_price: "1000", max_price: "2500", modal_price: "1800", arrival_date: TODAY },
    { state: "Andhra Pradesh", district: "Chittoor", market: "Madanapalle", commodity: "Tomato", variety: "Hybrid", min_price: "1100", max_price: "2600", modal_price: "1900", arrival_date: TODAY },
  ],
  onion: [
    { state: "Maharashtra", district: "Nashik", market: "Lasalgaon", commodity: "Onion", variety: "Local", min_price: "800", max_price: "2200", modal_price: "1500", arrival_date: TODAY },
    { state: "Karnataka", district: "Bengaluru", market: "Yeshwanthpur", commodity: "Onion", variety: "Red", min_price: "900", max_price: "2400", modal_price: "1700", arrival_date: TODAY },
    { state: "Madhya Pradesh", district: "Indore", market: "Indore", commodity: "Onion", variety: "Local", min_price: "700", max_price: "2000", modal_price: "1400", arrival_date: TODAY },
  ],
  potato: [
    { state: "Uttar Pradesh", district: "Agra", market: "Agra", commodity: "Potato", variety: "Local", min_price: "600", max_price: "1600", modal_price: "1100", arrival_date: TODAY },
    { state: "West Bengal", district: "Hooghly", market: "Kolkata", commodity: "Potato", variety: "Jyoti", min_price: "700", max_price: "1800", modal_price: "1200", arrival_date: TODAY },
    { state: "Punjab", district: "Jalandhar", market: "Jalandhar", commodity: "Potato", variety: "Local", min_price: "650", max_price: "1700", modal_price: "1150", arrival_date: TODAY },
  ],
  wheat: [
    { state: "Punjab", district: "Ludhiana", market: "Ludhiana", commodity: "Wheat", variety: "Local", min_price: "2015", max_price: "2200", modal_price: "2100", arrival_date: TODAY },
    { state: "Haryana", district: "Karnal", market: "Karnal", commodity: "Wheat", variety: "Dara", min_price: "2015", max_price: "2250", modal_price: "2100", arrival_date: TODAY },
    { state: "Madhya Pradesh", district: "Bhopal", market: "Bhopal", commodity: "Wheat", variety: "Local", min_price: "1950", max_price: "2150", modal_price: "2050", arrival_date: TODAY },
  ],
  rice: [
    { state: "Punjab", district: "Amritsar", market: "Amritsar", commodity: "Rice", variety: "Basmati", min_price: "3500", max_price: "5500", modal_price: "4500", arrival_date: TODAY },
    { state: "West Bengal", district: "Bardhaman", market: "Kolkata", commodity: "Rice", variety: "Local", min_price: "2200", max_price: "3200", modal_price: "2700", arrival_date: TODAY },
    { state: "Andhra Pradesh", district: "Krishna", market: "Vijayawada", commodity: "Rice", variety: "Sona Masuri", min_price: "2800", max_price: "4000", modal_price: "3400", arrival_date: TODAY },
  ],
  maize: [
    { state: "Karnataka", district: "Davangere", market: "Davangere", commodity: "Maize", variety: "Local", min_price: "1500", max_price: "2200", modal_price: "1850", arrival_date: TODAY },
    { state: "Andhra Pradesh", district: "Guntur", market: "Guntur", commodity: "Maize", variety: "Hybrid", min_price: "1600", max_price: "2300", modal_price: "1950", arrival_date: TODAY },
    { state: "Bihar", district: "Muzaffarpur", market: "Muzaffarpur", commodity: "Maize", variety: "Local", min_price: "1400", max_price: "2100", modal_price: "1750", arrival_date: TODAY },
  ],
  mango: [
    { state: "Karnataka", district: "Bengaluru", market: "Yeshwanthpur", commodity: "Mango", variety: "Alphonso", min_price: "4000", max_price: "8000", modal_price: "6000", arrival_date: TODAY },
    { state: "Andhra Pradesh", district: "Krishna", market: "Vijayawada", commodity: "Mango", variety: "Banganapalli", min_price: "3000", max_price: "6000", modal_price: "4500", arrival_date: TODAY },
    { state: "Maharashtra", district: "Ratnagiri", market: "Ratnagiri", commodity: "Mango", variety: "Alphonso", min_price: "5000", max_price: "10000", modal_price: "7500", arrival_date: TODAY },
  ],
  banana: [
    { state: "Tamil Nadu", district: "Theni", market: "Theni", commodity: "Banana", variety: "Cavendish", min_price: "800", max_price: "2000", modal_price: "1400", arrival_date: TODAY },
    { state: "Karnataka", district: "Bengaluru", market: "Yeshwanthpur", commodity: "Banana", variety: "Local", min_price: "700", max_price: "1800", modal_price: "1250", arrival_date: TODAY },
    { state: "Andhra Pradesh", district: "Krishna", market: "Vijayawada", commodity: "Banana", variety: "Red Banana", min_price: "1200", max_price: "2500", modal_price: "1850", arrival_date: TODAY },
  ],
  cotton: [
    { state: "Gujarat", district: "Surendranagar", market: "Surendranagar", commodity: "Cotton", variety: "Long Staple", min_price: "5500", max_price: "7500", modal_price: "6500", arrival_date: TODAY },
    { state: "Maharashtra", district: "Akola", market: "Akola", commodity: "Cotton", variety: "Medium Staple", min_price: "5200", max_price: "7000", modal_price: "6100", arrival_date: TODAY },
    { state: "Telangana", district: "Warangal", market: "Warangal", commodity: "Cotton", variety: "Long Staple", min_price: "5400", max_price: "7200", modal_price: "6300", arrival_date: TODAY },
  ],
  soybean: [
    { state: "Madhya Pradesh", district: "Indore", market: "Indore", commodity: "Soybean", variety: "Yellow", min_price: "4000", max_price: "5500", modal_price: "4750", arrival_date: TODAY },
    { state: "Maharashtra", district: "Latur", market: "Latur", commodity: "Soybean", variety: "Local", min_price: "3800", max_price: "5200", modal_price: "4500", arrival_date: TODAY },
    { state: "Rajasthan", district: "Kota", market: "Kota", commodity: "Soybean", variety: "Yellow", min_price: "3900", max_price: "5300", modal_price: "4600", arrival_date: TODAY },
  ],
  sugarcane: [
    { state: "Uttar Pradesh", district: "Meerut", market: "Meerut", commodity: "Sugarcane", variety: "Local", min_price: "290", max_price: "350", modal_price: "315", arrival_date: TODAY },
    { state: "Maharashtra", district: "Pune", market: "Pune", commodity: "Sugarcane", variety: "Local", min_price: "280", max_price: "340", modal_price: "310", arrival_date: TODAY },
    { state: "Karnataka", district: "Belgaum", market: "Belgaum", commodity: "Sugarcane", variety: "Local", min_price: "270", max_price: "330", modal_price: "300", arrival_date: TODAY },
  ],
  garlic: [
    { state: "Madhya Pradesh", district: "Mandsaur", market: "Mandsaur", commodity: "Garlic", variety: "Local", min_price: "3000", max_price: "8000", modal_price: "5500", arrival_date: TODAY },
    { state: "Rajasthan", district: "Kota", market: "Kota", commodity: "Garlic", variety: "Desi", min_price: "2800", max_price: "7500", modal_price: "5100", arrival_date: TODAY },
    { state: "Gujarat", district: "Junagadh", market: "Junagadh", commodity: "Garlic", variety: "Bold", min_price: "3200", max_price: "8500", modal_price: "5800", arrival_date: TODAY },
  ],
};

// Generic fallback when commodity not in FALLBACK_RECORDS
const genericFallback = (commodity, state) => [
  {
    state: state || "Karnataka",
    district: "Bengaluru",
    market: "Yeshwanthpur",
    commodity: commodity || "Commodity",
    variety: "Local",
    min_price: "1000",
    max_price: "3000",
    modal_price: "2000",
    arrival_date: TODAY,
  },
  {
    state: state || "Maharashtra",
    district: "Pune",
    market: "Pune",
    commodity: commodity || "Commodity",
    variety: "Local",
    min_price: "900",
    max_price: "2800",
    modal_price: "1850",
    arrival_date: TODAY,
  },
];

const getFallbackRecords = (commodity, state) => {
  if (!commodity) return [];
  const key = commodity.toLowerCase().trim();
  // Try exact match
  if (FALLBACK_RECORDS[key]) {
    const rows = FALLBACK_RECORDS[key];
    // Filter by state if provided (case-insensitive), else return all
    if (state) {
      const filtered = rows.filter(
        (r) => r.state.toLowerCase() === state.toLowerCase()
      );
      return filtered.length > 0 ? filtered : rows;
    }
    return rows;
  }
  // Partial match (e.g. "mango" in "mangoes")
  for (const [fbKey, rows] of Object.entries(FALLBACK_RECORDS)) {
    if (key.includes(fbKey) || fbKey.includes(key)) {
      return rows;
    }
  }
  return genericFallback(commodity, state);
};

// ==========================================
// SLEEP
// ==========================================

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// ==========================================
// DETECT GATEWAY ERROR (no point retrying)
// ==========================================

const isGatewayError = (message) =>
  /502|503|504|Bad Gateway|Service Unavailable|Gateway Timeout/.test(message);

// ==========================================
// FETCH WITH RETRY
// ==========================================

const fetchWithRetry = async (url, maxAttempts = 3) => {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        const text = await response.text();
        const err = new Error(
          `Data.gov API returned ${response.status}: ${text}`
        );
        err.statusCode = response.status;
        throw err;
      }

      return response;
    } catch (error) {
      lastError = error;

      // Don't retry on gateway errors — they won't recover quickly
      if (isGatewayError(error.message)) {
        break;
      }

      if (attempt === maxAttempts) break;

      const delay = attempt * 2000;
      await sleep(delay);
    }
  }

  throw lastError;
};

// ==========================================
// GET LIVE MANDI PRICES
// ==========================================

const getLiveMandiPrices = async ({
  state,
  commodity,
  district,
  market,
  limit = 100,
}) => {
  const cacheKey = getCacheKey({ state, commodity, district, market });

  // 1. Check cache first
  const cached = getCached(cacheKey);
  if (cached) {
    return cached;
  }

  const apiKey = process.env.DATA_GOV_API_KEY;

  if (!apiKey) {
    console.warn("[mandiService] DATA_GOV_API_KEY not set — using fallback data");
    return getFallbackRecords(commodity, state);
  }

  const params = new URLSearchParams({
    "api-key": apiKey,
    format: "json",
    limit: String(limit),
  });

  if (state) params.append("filters[state]", state);
  if (commodity) params.append("filters[commodity]", commodity);
  if (district) params.append("filters[district]", district);
  if (market) params.append("filters[market]", market);

  const url = `https://api.data.gov.in/resource/${RESOURCE_ID}?${params.toString()}`;

  try {
    const response = await fetchWithRetry(url);
    const data = await response.json();
    const records = data.records || [];

    // Cache successful response
    if (records.length > 0) {
      setCache(cacheKey, records);
    }

    return records;
  } catch (error) {
    // Log once — not per retry attempt
    if (isGatewayError(error.message)) {
      console.warn(
        `[mandiService] Data.gov API unavailable (${error.message.match(/\d{3}/)?.[0] || "gateway error"}) — serving fallback data for "${commodity}"`
      );
    } else {
      console.error("[mandiService] Mandi API error:", error.message);
    }

    // 2. Return fallback data instead of throwing
    return getFallbackRecords(commodity, state);
  }
};

module.exports = {
  getLiveMandiPrices,
};
