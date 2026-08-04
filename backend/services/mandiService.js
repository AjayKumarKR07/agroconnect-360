const RESOURCE_ID =
  process.env.DATA_GOV_RESOURCE_ID ||
  "9ef84268-d588-465a-a308-a864a43d0070";

// ==========================================
// SLEEP
// ==========================================

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// ==========================================
// FETCH WITH RETRY
// ==========================================

const fetchWithRetry = async (
  url,
  maxAttempts = 3
) => {
  let lastError;

  for (
    let attempt = 1;
    attempt <= maxAttempts;
    attempt++
  ) {
    try {
      console.log(
        `Mandi API request attempt ${attempt}/${maxAttempts}`
      );

      const response = await fetch(url, {
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        const text = await response.text();

        throw new Error(
          `Data.gov API returned ${response.status}: ${text}`
        );
      }

      return response;
    } catch (error) {
      lastError = error;

      console.error(
        `Mandi API attempt ${attempt} failed:`,
        error.message
      );

      if (attempt === maxAttempts) {
        break;
      }

      // 2 seconds, then 4 seconds
      const delay = attempt * 2000;

      console.log(
        `Retrying mandi API in ${delay / 1000}s...`
      );

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
  const apiKey =
    process.env.DATA_GOV_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Data.gov API key is not configured"
    );
  }

  const params = new URLSearchParams({
    "api-key": apiKey,
    format: "json",
    limit: String(limit),
  });

  if (state) {
    params.append(
      "filters[state]",
      state
    );
  }

  if (commodity) {
    params.append(
      "filters[commodity]",
      commodity
    );
  }

  if (district) {
    params.append(
      "filters[district]",
      district
    );
  }

  if (market) {
    params.append(
      "filters[market]",
      market
    );
  }

  const url =
    `https://api.data.gov.in/resource/${RESOURCE_ID}?${params.toString()}`;

  console.log(
    "Fetching mandi data:",
    {
      state,
      commodity,
      district,
      market,
    }
  );

  const response =
    await fetchWithRetry(url);

  const data =
    await response.json();

  return data.records || [];
};

module.exports = {
  getLiveMandiPrices,
};