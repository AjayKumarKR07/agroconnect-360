const {
  fetch,
  Agent,
} = require("undici");

const {
  syncCatalogRecords,
  getLocalStates,
  getLocalDistricts,
  getLocalMarkets,
  getLocalCommodities,
} = require(
  "./mandiCatalogSyncService"
);

const MandiCatalogSyncStatus = require(
  "../models/MandiCatalogSyncStatus"
);

const RESOURCE_ID =
  "35985678-0d79-46b4-9ed6-6f13308a1d24";

const agent = new Agent({
  connectTimeout: 30000,
});

const sleep = (ms) =>
  new Promise((resolve) =>
    setTimeout(resolve, ms)
  );


// ==========================================
// SIMPLE MEMORY CACHE
// ==========================================

const cache = new Map();

const CACHE_TTL =
  30 * 60 * 1000; // 30 minutes

const getCached = (key) => {
  const item = cache.get(key);

  if (!item) {
    return null;
  }

  if (
    Date.now() - item.createdAt >
    CACHE_TTL
  ) {
    cache.delete(key);
    return null;
  }

  return item.data;
};

const setCached = (key, data) => {
  cache.set(key, {
    data,
    createdAt: Date.now(),
  });
};


// ==========================================
// FETCH ONE GOVERNMENT API PAGE
// ==========================================

const fetchCatalogPage = async (url) => {
  const MAX_RETRIES = 3;

  for (
    let attempt = 1;
    attempt <= MAX_RETRIES;
    attempt++
  ) {
    try {
      console.log(
        `Mandi catalog attempt ${attempt}/${MAX_RETRIES}`
      );

      const response = await fetch(url, {
        dispatcher: agent,

        signal:
          AbortSignal.timeout(90000),

        headers: {
          Accept: "application/json",
          "User-Agent":
            "AgroConnect360/1.0",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Government API returned ${response.status}`
        );
      }

      return await response.json();

    } catch (error) {
      console.error(
        `Mandi catalog attempt ${attempt} failed:`,
        error.message
      );

      if (attempt === MAX_RETRIES) {
        throw new Error(
          "Government mandi catalog is temporarily unavailable"
        );
      }

      const delay =
        attempt * 3000;

      console.log(
        `Retrying catalog request in ${
          delay / 1000
        } seconds...`
      );

      await sleep(delay);
    }
  }
};


// ==========================================
// PAGINATED GOVERNMENT REQUEST
// ==========================================

const requestAllGovernmentData = async (
  filters = {},
  maxRecords = 10000
) => {
  const apiKey =
    process.env.DATA_GOV_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Data.gov API key is not configured"
    );
  }

  const PAGE_SIZE = 250;

  let offset = 0;
  let total = null;

  const allRecords = [];

  while (
    allRecords.length < maxRecords
  ) {
    const params =
      new URLSearchParams({
        "api-key": apiKey,
        format: "json",
        limit: String(PAGE_SIZE),
        offset: String(offset),
      });

    Object.entries(filters).forEach(
      ([key, value]) => {
        if (value) {
          params.append(
            `filters[${key}]`,
            value
          );
        }
      }
    );

    const url =
      `https://api.data.gov.in/resource/` +
      `${RESOURCE_ID}?` +
      params.toString();

    console.log(
      `Catalog page offset=${offset}`
    );

    const data =
      await fetchCatalogPage(url);

    const records =
      data.records || [];

    if (total === null) {
      total = Number(
        data.total || 0
      );

      console.log(
        `Catalog total matching records: ${total}`
      );
    }

    allRecords.push(
  ...records
);

// Save this government page into MongoDB catalog
if (records.length > 0) {
  try {
    const syncResult =
      await syncCatalogRecords(
        records
      );

    console.log(
      `Catalog MongoDB sync: inserted=${syncResult.inserted || 0}, updated=${syncResult.updated || 0}, skipped=${syncResult.skipped || 0}`
    );
  } catch (error) {
    // Catalog fetching should continue even if
    // MongoDB synchronization has a temporary issue.
    console.error(
      "Catalog MongoDB sync failed:",
      error.message
    );
  }
}

console.log(
  `Catalog received ${records.length}; accumulated ${allRecords.length}`
);

    if (records.length === 0) {
      break;
    }

    offset += records.length;

    if (
      total > 0 &&
      offset >= total
    ) {
      break;
    }

    if (
      records.length < PAGE_SIZE
    ) {
      break;
    }
  }

  return {
    total:
      total ?? allRecords.length,

    records:
      allRecords.slice(
        0,
        maxRecords
      ),
  };
};


// ==========================================
// UNIQUE + SORT
// ==========================================

const uniqueSorted = (
  records,
  field
) => {
  return [
    ...new Set(
      records
        .map(
          (record) =>
            record[field]
        )
        .filter(Boolean)
        .map(
          (value) =>
            String(value).trim()
        )
    ),
  ].sort((a, b) =>
    a.localeCompare(b)
  );
};


// ==========================================
// STATES
// ==========================================

const getGovernmentStates =
  async () => {
    const cacheKey =
      "catalog:states";

    const cached =
      getCached(cacheKey);

    if (cached) {
      console.log(
        "Using cached states catalog"
      );

      return cached;
    }

    const data =
      await requestAllGovernmentData(
        {},
        3000
      );

    const states =
      uniqueSorted(
        data.records || [],
        "State"
      );

    setCached(
      cacheKey,
      states
    );

    return states;
  };


// ==========================================
// DISTRICTS
// ==========================================

const getGovernmentDistricts =
  async (state) => {
    const cacheKey =
      `catalog:districts:${state}`;

    const cached =
      getCached(cacheKey);

    if (cached) {
      console.log(
        `Using cached districts: ${state}`
      );

      return cached;
    }

    const data =
      await requestAllGovernmentData(
        {
          State: state,
        },
        10000
      );

    const districts =
      uniqueSorted(
        data.records || [],
        "District"
      );

    setCached(
      cacheKey,
      districts
    );

    return districts;
  };


// ==========================================
// MARKETS
// ==========================================

const getGovernmentMarkets =
  async (
    state,
    district
  ) => {
    const cacheKey =
      `catalog:markets:${state}:${district}`;

    const cached =
      getCached(cacheKey);

    if (cached) {
      console.log(
        `Using cached markets: ${state}/${district}`
      );

      return cached;
    }

    const data =
      await requestAllGovernmentData(
        {
          State: state,
          District: district,
        },
        10000
      );

    const markets =
      uniqueSorted(
        data.records || [],
        "Market"
      );

    setCached(
      cacheKey,
      markets
    );

    return markets;
  };


// ==========================================
// COMMODITIES
// ==========================================

const getGovernmentCommodities =
  async (
    state,
    district,
    market
  ) => {
    const cacheKey =
      `catalog:commodities:${state}:${district}:${market}`;

    const cached =
      getCached(cacheKey);

    if (cached) {
      console.log(
        `Using cached commodities: ${market}`
      );

      return cached;
    }

    const data =
      await requestAllGovernmentData(
        {
          State: state,
          District: district,
          Market: market,
        },
        10000
      );

    const commodities =
      uniqueSorted(
        data.records || [],
        "Commodity"
      );

    setCached(
      cacheKey,
      commodities
    );

    return commodities;
  };
// ==========================================
// CHECK WHETHER A CATALOG SCOPE IS SYNCED
// ==========================================

const isCatalogScopeSynced = async ({
  type,
  state,
  district = "",
  market = "",
}) => {
  const status =
    await MandiCatalogSyncStatus.findOne({
      type,
      state,
      district,
      market,
      synced: true,
    }).lean();

  return Boolean(status);
};


// ==========================================
// MARK CATALOG SCOPE AS SYNCED
// ==========================================

const markCatalogScopeSynced = async ({
  type,
  state,
  district = "",
  market = "",
  recordCount = 0,
}) => {
  await MandiCatalogSyncStatus.findOneAndUpdate(
    {
      type,
      state,
      district,
      market,
    },
    {
      $set: {
        synced: true,
        recordCount,
        lastSyncedAt: new Date(),
        source: "data.gov.in",
      },
    },
    {
  upsert: true,
  returnDocument: "after",
  setDefaultsOnInsert: true,
}
  );
};
  // ==========================================
// HYBRID DISTRICTS
// MongoDB first -> Government fallback
// ==========================================

const getHybridDistricts = async (
  state
) => {
  // ------------------------------------------
  // 1. CHECK LOCAL MONGODB FIRST
  // ------------------------------------------

  const localDistricts =
    await getLocalDistricts(state);

  const synced =
    await isCatalogScopeSynced({
      type: "districts",
      state,
    });

  // If this scope was already fully synced,
  // always use MongoDB.
  if (
    synced &&
    localDistricts.length > 0
  ) {
    console.log(
      `Using fully synced local districts: ${state}`
    );

    return {
      source: "mongodb",
      districts: localDistricts,
    };
  }

  // ------------------------------------------
  // 2. TRY GOVERNMENT API
  // ------------------------------------------

  console.log(
    `District catalog not fully synced for ${state}. Checking data.gov.in...`
  );

  try {
    const data =
      await requestAllGovernmentData(
        {
          State: state,
        },
        10000
      );

    const districts =
      await getLocalDistricts(state);

    // Only mark it synced if government
    // request completed successfully.
    await markCatalogScopeSynced({
      type: "districts",
      state,
      recordCount:
        data.records.length,
    });

    return {
      source: "data.gov.in+mongodb",
      districts,
    };
  } catch (error) {
    console.error(
      `Government district catalog failed for ${state}:`,
      error.message
    );

    // ----------------------------------------
    // 3. FALLBACK TO EXISTING MONGODB DATA
    // ----------------------------------------

    const fallbackDistricts =
      await getLocalDistricts(state);

    if (
      fallbackDistricts.length > 0
    ) {
      console.log(
        `Using MongoDB fallback districts: ${state} (${fallbackDistricts.length})`
      );

      return {
        source: "mongodb-fallback",
        districts:
          fallbackDistricts,
      };
    }

    // Nothing exists locally either.
    throw error;
  }
};

// ==========================================
// HYBRID MARKETS
// MongoDB first -> Government fallback
// ==========================================

const getHybridMarkets = async (
  state,
  district
) => {
  const synced =
    await isCatalogScopeSynced({
      type: "markets",
      state,
      district,
    });

  if (synced) {
    console.log(
      `Using fully synced local markets: ${state}/${district}`
    );

    const markets =
      await getLocalMarkets(
        state,
        district
      );

    return {
      source: "mongodb",
      markets,
    };
  }

  console.log(
    `Market catalog not fully synced for ${state}/${district}. Checking data.gov.in...`
  );

  const data =
    await requestAllGovernmentData(
      {
        State: state,
        District: district,
      },
      10000
    );

  const markets =
    await getLocalMarkets(
      state,
      district
    );

  await markCatalogScopeSynced({
    type: "markets",
    state,
    district,
    recordCount: data.records.length,
  });

  return {
    source: "data.gov.in+mongodb",
    markets,
  };
};


// ==========================================
// HYBRID COMMODITIES
// MongoDB first -> Government fallback
// ==========================================

const getHybridCommodities = async (
  state,
  district,
  market
) => {
  const synced =
    await isCatalogScopeSynced({
      type: "commodities",
      state,
      district,
      market,
    });

  if (synced) {
    console.log(
      `Using fully synced local commodities: ${state}/${district}/${market}`
    );

    const commodities =
      await getLocalCommodities(
        state,
        district,
        market
      );

    return {
      source: "mongodb",
      commodities,
    };
  }

  console.log(
    `Commodity catalog not fully synced for ${state}/${district}/${market}. Checking data.gov.in...`
  );

  const data =
    await requestAllGovernmentData(
      {
        State: state,
        District: district,
        Market: market,
      },
      10000
    );

  const commodities =
    await getLocalCommodities(
      state,
      district,
      market
    );

  await markCatalogScopeSynced({
    type: "commodities",
    state,
    district,
    market,
    recordCount: data.records.length,
  });

  return {
    source: "data.gov.in+mongodb",
    commodities,
  };
};

module.exports = {
  getGovernmentStates,
  getGovernmentDistricts,
  getGovernmentMarkets,
  getGovernmentCommodities,

  getHybridDistricts,
  getHybridMarkets,
  getHybridCommodities,
};