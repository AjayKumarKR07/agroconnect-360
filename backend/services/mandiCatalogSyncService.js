const MandiCatalog = require(
  "../models/MandiCatalog"
);


// ==========================================
// NORMALIZE TEXT
// ==========================================

const cleanValue = (value) => {
  if (!value) {
    return "";
  }

  return String(value).trim();
};


// ==========================================
// SYNC GOVERNMENT RECORDS TO MONGODB
// ==========================================

const syncCatalogRecords = async (
  records = []
) => {
  if (
    !Array.isArray(records) ||
    records.length === 0
  ) {
    return {
      received: 0,
      valid: 0,
      insertedOrUpdated: 0,
      skipped: 0,
    };
  }

  let valid = 0;
  let skipped = 0;

  const operations = [];

  for (const record of records) {
    const state = cleanValue(
      record.State || record.state
    );

    const district = cleanValue(
      record.District || record.district
    );

    const market = cleanValue(
      record.Market || record.market
    );

    const commodity = cleanValue(
      record.Commodity || record.commodity
    );

    if (
      !state ||
      !district ||
      !market ||
      !commodity
    ) {
      skipped++;
      continue;
    }

    valid++;

    operations.push({
      updateOne: {
        filter: {
          state,
          district,
          market,
          commodity,
        },

        update: {
          $set: {
            source: "data.gov.in",
            lastSeenAt: new Date(),
          },

          $setOnInsert: {
            state,
            district,
            market,
            commodity,
          },
        },

        upsert: true,
      },
    });
  }

  if (operations.length === 0) {
    return {
      received: records.length,
      valid,
      insertedOrUpdated: 0,
      skipped,
    };
  }

  const result =
    await MandiCatalog.bulkWrite(
      operations,
      {
        ordered: false,
      }
    );

  const inserted =
    result.upsertedCount || 0;

  const modified =
    result.modifiedCount || 0;

  console.log(
    `Mandi catalog sync: received=${records.length}, valid=${valid}, inserted=${inserted}, updated=${modified}`
  );

  return {
    received: records.length,
    valid,
    inserted,
    updated: modified,

    insertedOrUpdated:
      inserted + modified,

    skipped,
  };
};


// ==========================================
// GET STATES FROM LOCAL CATALOG
// ==========================================

const getLocalStates = async () => {
  const states =
    await MandiCatalog.distinct(
      "state"
    );

  return states
    .filter(Boolean)
    .sort((a, b) =>
      a.localeCompare(b)
    );
};


// ==========================================
// GET DISTRICTS
// ==========================================

const getLocalDistricts = async (
  state
) => {
  const districts =
    await MandiCatalog.distinct(
      "district",
      {
        state,
      }
    );

  return districts
    .filter(Boolean)
    .sort((a, b) =>
      a.localeCompare(b)
    );
};


// ==========================================
// GET MARKETS
// ==========================================

const getLocalMarkets = async (
  state,
  district
) => {
  const markets =
    await MandiCatalog.distinct(
      "market",
      {
        state,
        district,
      }
    );

  return markets
    .filter(Boolean)
    .sort((a, b) =>
      a.localeCompare(b)
    );
};


// ==========================================
// GET COMMODITIES
// ==========================================

const getLocalCommodities = async (
  state,
  district,
  market
) => {
  const commodities =
    await MandiCatalog.distinct(
      "commodity",
      {
        state,
        district,
        market,
      }
    );

  return commodities
    .filter(Boolean)
    .sort((a, b) =>
      a.localeCompare(b)
    );
};


module.exports = {
  syncCatalogRecords,

  getLocalStates,
  getLocalDistricts,
  getLocalMarkets,
  getLocalCommodities,
};