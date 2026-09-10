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
// ACTIVE SYNC DEDUPLICATION GUARD
//
// If two users request the same unsynced scope
// at the same moment, this Map ensures only one
// government API download runs. The second
// caller reuses the same pending Promise.
// The entry is removed when the sync finishes
// (success or failure).
// ==========================================

const activeSyncs = new Map();
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
      `[Catalog] MongoDB cache hit — districts: ${state}`
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
    `[Catalog] MongoDB cache miss — districts: ${state}. Syncing from data.gov.in...`
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

    console.log(
      `[Catalog] Districts synced for ${state}: ${districts.length} entries`
    );

    return {
      source: "data.gov.in+mongodb",
      districts,
    };
  } catch (error) {
    console.error(
      `[Catalog] Government district sync failed for ${state}:`,
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
        `[Catalog] MongoDB fallback districts: ${state} (${fallbackDistricts.length})`
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
// Returns MongoDB data immediately.
// Triggers government sync in background
// if the scope is not yet fully synced.
// ==========================================

const getHybridMarkets = async (
  state,
  district
) => {
  // ------------------------------------------
  // 1. QUERY MONGODB FIRST
  // ------------------------------------------

  const localMarkets =
    await getLocalMarkets(
      state,
      district
    );

  const synced =
    await isCatalogScopeSynced({
      type: "markets",
      state,
      district,
    });

  // ------------------------------------------
  // 2. RETURN IMMEDIATELY IF DATA EXISTS
  //
  // Even if not yet marked "fully synced",
  // return whatever MongoDB has so the UI
  // loads instantly. Background sync will
  // keep the catalog growing.
  // ------------------------------------------

  if (localMarkets.length > 0) {
    console.log(
      `[Catalog] MongoDB cache hit — markets: ${state}/${district} (${localMarkets.length})`
    );

    if (!synced) {
      // Trigger background sync — do not await.
      const scopeKey = `markets:${state}:${district}`;

      if (activeSyncs.has(scopeKey)) {
        console.log(
          `[Catalog] Background markets sync already running: ${state}/${district}`
        );
      } else {
        console.log(
          `[Catalog] Background markets sync started: ${state}/${district}`
        );

        const syncPromise = requestAllGovernmentData(
          { State: state, District: district },
          10000
        )
          .then(async (data) => {
            await markCatalogScopeSynced({
              type: "markets",
              state,
              district,
              recordCount: data.records.length,
            });
            console.log(
              `[Catalog] Background markets sync completed: ${state}/${district}`
            );
          })
          .catch((err) => {
            console.error(
              `[Catalog] Background markets sync failed: ${state}/${district} —`,
              err.message
            );
          })
          .finally(() => {
            activeSyncs.delete(scopeKey);
          });

        activeSyncs.set(scopeKey, syncPromise);
      }
    }

    return {
      source: synced ? "mongodb" : "mongodb-partial",
      markets: localMarkets,
    };
  }

  // ------------------------------------------
  // 3. MONGODB HAS NO DATA — SYNC NOW
  //
  // First request for this scope; must wait
  // for government API to populate MongoDB.
  // Future requests will hit the cache.
  // ------------------------------------------

  const scopeKey = `markets:${state}:${district}`;

  // Deduplicate: reuse an existing sync promise
  // if one is already running for this scope.
  if (activeSyncs.has(scopeKey)) {
    console.log(
      `[Catalog] Reusing existing markets sync: ${state}/${district}`
    );
    await activeSyncs.get(scopeKey);
  } else {
    console.log(
      `[Catalog] MongoDB empty — fetching markets from data.gov.in: ${state}/${district}`
    );

    const syncPromise = requestAllGovernmentData(
      { State: state, District: district },
      10000
    )
      .then(async (data) => {
        await markCatalogScopeSynced({
          type: "markets",
          state,
          district,
          recordCount: data.records.length,
        });
        console.log(
          `[Catalog] Markets sync completed: ${state}/${district}`
        );
      })
      .catch((err) => {
        console.error(
          `[Catalog] Markets sync failed: ${state}/${district} —`,
          err.message
        );
        throw err;
      })
      .finally(() => {
        activeSyncs.delete(scopeKey);
      });

    activeSyncs.set(scopeKey, syncPromise);
    await syncPromise;
  }

  const markets = await getLocalMarkets(state, district);

  return {
    source: "data.gov.in+mongodb",
    markets,
  };
};


// ==========================================
// HYBRID COMMODITIES
// Returns MongoDB data immediately.
// Triggers government sync in background
// if the scope is not yet fully synced.
// ==========================================

const getHybridCommodities = async (
  state,
  district,
  market
) => {
  // ------------------------------------------
  // 1. QUERY MONGODB FIRST
  // ------------------------------------------

  const localCommodities =
    await getLocalCommodities(
      state,
      district,
      market
    );

  const synced =
    await isCatalogScopeSynced({
      type: "commodities",
      state,
      district,
      market,
    });

  // ------------------------------------------
  // 2. RETURN IMMEDIATELY IF DATA EXISTS
  // ------------------------------------------

  if (localCommodities.length > 0) {
    console.log(
      `[Catalog] MongoDB cache hit — commodities: ${state}/${district}/${market} (${localCommodities.length})`
    );

    if (!synced) {
      // Fire-and-forget background sync.
      const scopeKey = `commodities:${state}:${district}:${market}`;

      if (activeSyncs.has(scopeKey)) {
        console.log(
          `[Catalog] Background commodities sync already running: ${state}/${district}/${market}`
        );
      } else {
        console.log(
          `[Catalog] Background commodities sync started: ${state}/${district}/${market}`
        );

        const syncPromise = requestAllGovernmentData(
          { State: state, District: district, Market: market },
          10000
        )
          .then(async (data) => {
            await markCatalogScopeSynced({
              type: "commodities",
              state,
              district,
              market,
              recordCount: data.records.length,
            });
            console.log(
              `[Catalog] Background commodities sync completed: ${state}/${district}/${market}`
            );
          })
          .catch((err) => {
            console.error(
              `[Catalog] Background commodities sync failed: ${state}/${district}/${market} —`,
              err.message
            );
          })
          .finally(() => {
            activeSyncs.delete(scopeKey);
          });

        activeSyncs.set(scopeKey, syncPromise);
      }
    }

    return {
      source: synced ? "mongodb" : "mongodb-partial",
      commodities: localCommodities,
    };
  }

  // ------------------------------------------
  // 3. MONGODB HAS NO DATA — SYNC NOW
  // ------------------------------------------

  const scopeKey = `commodities:${state}:${district}:${market}`;

  if (activeSyncs.has(scopeKey)) {
    console.log(
      `[Catalog] Reusing existing commodities sync: ${state}/${district}/${market}`
    );
    await activeSyncs.get(scopeKey);
  } else {
    console.log(
      `[Catalog] MongoDB empty — fetching commodities from data.gov.in: ${state}/${district}/${market}`
    );

    const syncPromise = requestAllGovernmentData(
      { State: state, District: district, Market: market },
      10000
    )
      .then(async (data) => {
        await markCatalogScopeSynced({
          type: "commodities",
          state,
          district,
          market,
          recordCount: data.records.length,
        });
        console.log(
          `[Catalog] Commodities sync completed: ${state}/${district}/${market}`
        );
      })
      .catch((err) => {
        console.error(
          `[Catalog] Commodities sync failed: ${state}/${district}/${market} —`,
          err.message
        );
        throw err;
      })
      .finally(() => {
        activeSyncs.delete(scopeKey);
      });

    activeSyncs.set(scopeKey, syncPromise);
    await syncPromise;
  }

  const commodities = await getLocalCommodities(state, district, market);

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