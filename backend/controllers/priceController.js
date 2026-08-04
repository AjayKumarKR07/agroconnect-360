

const {
  getHybridDistricts,
  getHybridMarkets,
  getHybridCommodities,
} = require(
  "../services/mandiCatalogService"
);

const {
  getLocalStates,
} = require(
  "../services/mandiCatalogSyncService"
);

const {
  ALL_INDIA_STATES,
  POPULAR_DISTRICTS,
} = require("../utils/indiaData");

const {
  generateDynamicPrediction,
} = require(
  "../services/dynamicPredictionService"
);

const {
  execFile,
} = require("child_process");

const path = require("path");

const MarketPrice = require(
  "../models/MarketPrice"
);

const {
  fetchHistoricalPrices,
} = require(
  "../services/historicalMandiService"
);

const {
  getLiveMandiPrices,
} = require(
  "../services/mandiService"
);


// ==========================================
// LIVE MANDI PRICES
// GET /api/prices/live
// ==========================================

const getLivePrices = async (
  req,
  res
) => {
  try {
    const {
      state = "Karnataka",
      commodity,
      district,
      market,
    } = req.query;

    if (!commodity) {
      return res.status(400).json({
        success: false,
        message:
          "Commodity is required",
      });
    }

    const records =
      await getLiveMandiPrices({
        state,
        commodity,
        district,
        market,
      });

    const prices = records.map(
      (record) => ({
        state: record.state,
        district: record.district,
        market: record.market,
        commodity: record.commodity,
        variety: record.variety,
        grade: record.grade,

        arrivalDate:
          record.arrival_date,

        minPrice:
          Number(record.min_price),

        maxPrice:
          Number(record.max_price),

        modalPrice:
          Number(record.modal_price),

        unit: "quintal",
      })
    );

   return res.status(200).json({
  success: true,
  state,
  district,
  highest: uniqueHighest,
  lowest: uniqueLowest,
});

  } catch (error) {
    console.error(
      "Live mandi price error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve live mandi prices",
    });
  }
};


// ==========================================
// SYNC HISTORICAL MANDI PRICES
// POST /api/prices/history/sync
// ==========================================

const syncHistoricalPrices = async (
  req,
  res
) => {
  try {
    const {
      state,
      district,
      commodity,
      market,
    } = req.body;

    if (
      !state ||
      !district ||
      !commodity ||
      !market
    ) {
      return res.status(400).json({
        success: false,
        message:
          "State, district, commodity and market are required",
      });
    }

    const result =
      await fetchHistoricalPrices({
        state,
        district,
        commodity,
        market,
        limit: 1000,
      });

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (
      const record of
      result.records
    ) {
      try {
        // Government API date:
        // DD/MM/YYYY

        const dateParts =
          record.Arrival_Date?.split(
            "/"
          );

        if (
          !dateParts ||
          dateParts.length !== 3
        ) {
          skipped++;
          continue;
        }

        const [
          day,
          month,
          year,
        ] = dateParts;

        const arrivalDate =
          new Date(
            Date.UTC(
              Number(year),
              Number(month) - 1,
              Number(day)
            )
          );

        const minPrice =
          Number(
            record.Min_Price
          );

        const maxPrice =
          Number(
            record.Max_Price
          );

        const modalPrice =
          Number(
            record.Modal_Price
          );

        if (
          Number.isNaN(
            minPrice
          ) ||
          Number.isNaN(
            maxPrice
          ) ||
          Number.isNaN(
            modalPrice
          ) ||
          Number.isNaN(
            arrivalDate.getTime()
          )
        ) {
          skipped++;
          continue;
        }

        const filter = {
          state:
            record.State,

          district:
            record.District,

          market:
            record.Market,

          commodity:
            record.Commodity,

          variety:
            record.Variety ||
            "",

          arrivalDate,
        };

        const existing =
          await MarketPrice.findOne(
            filter
          );

        if (existing) {
          existing.grade =
            record.Grade || "";

          existing.minPrice =
            minPrice;

          existing.maxPrice =
            maxPrice;

          existing.modalPrice =
            modalPrice;

          existing.source =
            "data.gov.in";

          await existing.save();

          updated++;

        } else {
          await MarketPrice.create({
            ...filter,

            grade:
              record.Grade ||
              "",

            minPrice,
            maxPrice,
            modalPrice,

            unit:
              "quintal",

            source:
              "data.gov.in",
          });

          inserted++;
        }

      } catch (
        recordError
      ) {
        console.error(
          "Historical record error:",
          recordError.message
        );

        skipped++;
      }
    }

    return res.status(200).json({
      success: true,

      message:
        "Historical mandi prices synced successfully",

      sourceRecords:
        result.records.length,

      inserted,
      updated,
      skipped,
    });

  } catch (error) {
    console.error(
      "Historical sync error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to sync historical mandi prices",
    });
  }
};


// ==========================================
// GET HISTORICAL MARKET PRICES
// GET /api/prices/history
// ==========================================

const getHistoricalPrices = async (
  req,
  res
) => {
  try {
    const {
      state,
      district,
      commodity,
      market,
    } = req.query;

    if (
      !state ||
      !district ||
      !commodity ||
      !market
    ) {
      return res.status(400).json({
        success: false,
        message:
          "State, district, commodity and market are required",
      });
    }

    const prices =
      await MarketPrice.find({
        state,
        district,
        commodity,
        market,
      })
        .sort({
          arrivalDate: 1,
        })
        .select(
          "state district market commodity variety grade arrivalDate minPrice maxPrice modalPrice unit"
        )
        .lean();

    return res.status(200).json({
      success: true,

      count:
        prices.length,

      filters: {
        state,
        district,
        commodity,
        market,
      },

      prices,
    });

  } catch (error) {
    console.error(
      "Get historical prices error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve historical prices",
    });
  }
};


// ==========================================
// ML PRICE PREDICTION
// GET /api/prices/predict
// ==========================================

const getPricePrediction = async (
  req,
  res
) => {
  try {
    const projectRoot =
      path.resolve(
        __dirname,
        "../.."
      );

    const scriptPath =
      path.join(
        projectRoot,
        "ml",
        "predict_price.py"
      );

    execFile(
      "python",
      [scriptPath],
      {
        cwd: projectRoot,
        timeout: 30000,
      },

      (
        error,
        stdout,
        stderr
      ) => {
        if (error) {
          console.error(
            "Price prediction Python error:",
            error
          );

          console.error(
            "Python stderr:",
            stderr
          );

          return res
            .status(500)
            .json({
              success:
                false,

              message:
                "Unable to generate price prediction",
            });
        }

        try {
          const prediction =
            JSON.parse(
              stdout
            );

          return res
            .status(200)
            .json({
              ...prediction,

              model: {
                algorithm:
                  "Random Forest Regressor",

                mae: 67.41,
                rmse: 99.47,
                r2: 0.9101,
              },
            });

        } catch (
          parseError
        ) {
          console.error(
            "Prediction JSON parse error:",
            parseError
          );

          console.error(
            "Python output:",
            stdout
          );

          return res
            .status(500)
            .json({
              success:
                false,

              message:
                "Invalid response from prediction model",
            });
        }
      }
    );

  } catch (error) {
    console.error(
      "Price prediction error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to generate price prediction",
    });
  }
};


// ==========================================
// DYNAMIC ML PRICE PREDICTION
// GET /api/prices/predict-dynamic
// ==========================================

const getDynamicPricePrediction =
  async (
    req,
    res
  ) => {
    try {
      const {
        state,
        district,
        market,
        commodity,
        days = 7,
      } = req.query;

      if (
        !state ||
        !district ||
        !market ||
        !commodity
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "State, district, market and commodity are required",
          });
      }

      const forecastDays =
        Number(days);

      if (
        !Number.isInteger(
          forecastDays
        ) ||
        forecastDays < 1 ||
        forecastDays > 14
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Prediction days must be between 1 and 14",
          });
      }

      const result =
        await generateDynamicPrediction(
          {
            state,
            district,
            market,
            commodity,

            days:
              forecastDays,
          }
        );

      if (!result.success) {
        if (
          result.reason ===
          "INSUFFICIENT_DATA"
        ) {
          return res
            .status(422)
            .json(
              result
            );
        }

        return res
          .status(400)
          .json(
            result
          );
      }

      return res
        .status(200)
        .json(
          result
        );

    } catch (error) {
      console.error(
        "Dynamic prediction controller error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to generate dynamic price prediction",
        });
    }
  };


// ==========================================
// OLD PRICE OPTIONS
// These continue using MarketPrice MongoDB
// ==========================================


// ==========================================
// GET AVAILABLE STATES
// GET /api/prices/options/states
// ==========================================

const getPriceStates = async (
  req,
  res
) => {
  try {
    const states =
      await MarketPrice.distinct(
        "state"
      );

    const cleanedStates =
      states
        .filter(Boolean)
        .sort(
          (a, b) =>
            a.localeCompare(b)
        );

    return res
      .status(200)
      .json({
        success: true,

        count:
          cleanedStates.length,

        states:
          cleanedStates,
      });

  } catch (error) {
    console.error(
      "Get price states error:",
      error
    );

    return res
      .status(500)
      .json({
        success: false,

        message:
          "Unable to retrieve states",
      });
  }
};


// ==========================================
// GET DISTRICTS BY STATE
// GET /api/prices/options/districts
// ==========================================

const getPriceDistricts =
  async (
    req,
    res
  ) => {
    try {
      const {
        state,
      } = req.query;

      if (!state) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "State is required",
          });
      }

      const districts =
        await MarketPrice.distinct(
          "district",
          {
            state,
          }
        );

      const cleanedDistricts =
        districts
          .filter(Boolean)
          .sort(
            (a, b) =>
              a.localeCompare(
                b
              )
          );

      return res
        .status(200)
        .json({
          success: true,

          state,

          count:
            cleanedDistricts.length,

          districts:
            cleanedDistricts,
        });

    } catch (error) {
      console.error(
        "Get price districts error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to retrieve districts",
        });
    }
  };


// ==========================================
// GET MARKETS BY STATE + DISTRICT
// GET /api/prices/options/markets
// ==========================================

const getPriceMarkets =
  async (
    req,
    res
  ) => {
    try {
      const {
        state,
        district,
      } = req.query;

      if (
        !state ||
        !district
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "State and district are required",
          });
      }

      const markets =
        await MarketPrice.distinct(
          "market",
          {
            state,
            district,
          }
        );

      const cleanedMarkets =
        markets
          .filter(Boolean)
          .sort(
            (a, b) =>
              a.localeCompare(
                b
              )
          );

      return res
        .status(200)
        .json({
          success: true,

          state,
          district,

          count:
            cleanedMarkets.length,

          markets:
            cleanedMarkets,
        });

    } catch (error) {
      console.error(
        "Get price markets error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to retrieve markets",
        });
    }
  };


// ==========================================
// GET COMMODITIES BY MARKET
// GET /api/prices/options/commodities
// ==========================================

const getPriceCommodities =
  async (
    req,
    res
  ) => {
    try {
      const {
        state,
        district,
        market,
      } = req.query;

      if (
        !state ||
        !district ||
        !market
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "State, district and market are required",
          });
      }

      const commodities =
        await MarketPrice.distinct(
          "commodity",
          {
            state,
            district,
            market,
          }
        );

      const cleanedCommodities =
        commodities
          .filter(Boolean)
          .sort(
            (a, b) =>
              a.localeCompare(
                b
              )
          );

      return res
        .status(200)
        .json({
          success: true,

          state,
          district,
          market,

          count:
            cleanedCommodities.length,

          commodities:
            cleanedCommodities,
        });

    } catch (error) {
      console.error(
        "Get price commodities error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to retrieve commodities",
        });
    }
  };


// ==========================================
// MANDI CATALOG - STATES
// MongoDB only
// GET /api/prices/catalog/states
// ==========================================

const getCatalogStates = async (req, res) => {
  try {
    const localStates = await getLocalStates();
    const allStates = [...new Set([...localStates, ...ALL_INDIA_STATES])].sort((a, b) =>
      a.localeCompare(b)
    );

    return res.status(200).json({
      success: true,
      source: "mongodb+allindia",
      count: allStates.length,
      states: allStates,
    });
  } catch (error) {
    console.error("Catalog states error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve states.",
    });
  }
};


// ==========================================
// MANDI CATALOG - DISTRICTS
// MongoDB first -> Government fallback
// GET /api/prices/catalog/districts
// ==========================================

const getCatalogDistricts = async (req, res) => {
  try {
    const { state } = req.query;

    if (!state) {
      return res.status(400).json({
        success: false,
        message: "State is required",
      });
    }

    let districts = [];
    try {
      const result = await getHybridDistricts(state);
      districts = result.districts || [];
    } catch (e) {
      console.log(`Hybrid districts check failed for ${state}, using defaults`);
    }

    const popular = POPULAR_DISTRICTS[state] || [];
    const combinedDistricts = [...new Set([...districts, ...popular])].sort((a, b) =>
      a.localeCompare(b)
    );

    return res.status(200).json({
      success: true,
      state,
      count: combinedDistricts.length,
      districts: combinedDistricts,
    });

    } catch (error) {
      console.error(
        "Catalog districts error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to retrieve districts.",
        });
    }
  };


// ==========================================
// MANDI CATALOG - MARKETS
// MongoDB first -> Government fallback
// GET /api/prices/catalog/markets
// ==========================================

const getCatalogMarkets =
  async (
    req,
    res
  ) => {
    try {
      const {
        state,
        district,
      } = req.query;

      if (
        !state ||
        !district
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "State and district are required",
          });
      }

      const result =
        await getHybridMarkets(
          state,
          district
        );

      const markets =
        result.markets;

      return res
        .status(200)
        .json({
          success: true,

          source:
            result.source,

          state,
          district,

          count:
            markets.length,

          markets,
        });

    } catch (error) {
      console.error(
        "Catalog markets error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to retrieve markets.",
        });
    }
  };


// ==========================================
// MANDI CATALOG - COMMODITIES
// MongoDB first -> Government fallback
// GET /api/prices/catalog/commodities
// ==========================================

const getCatalogCommodities =
  async (
    req,
    res
  ) => {
    try {
      const {
        state,
        district,
        market,
      } = req.query;

      if (
        !state ||
        !district ||
        !market
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "State, district and market are required",
          });
      }

      const result =
        await getHybridCommodities(
          state,
          district,
          market
        );

      const commodities =
        result.commodities;

      return res
        .status(200)
        .json({
          success: true,

          source:
            result.source,

          state,
          district,
          market,

          count:
            commodities.length,

          commodities,
        });

    } catch (error) {
      console.error(
        "Catalog commodities error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to retrieve commodities.",
        });
    }
  };


  // ==========================================
// DISTRICT MARKET INSIGHTS
// GET /api/prices/district-insights
// ==========================================

const getDistrictInsights = async (req, res) => {
  try {
    const { state, district } = req.query;

    if (!state || !district) {
      return res.status(400).json({
        success: false,
        message: "State and district are required",
      });
    }

    let prices = await MarketPrice.find({
      state,
      district,
    }).lean();

    // Live Fallback to data.gov.in if local DB has no records for this state & district
    if (!prices.length) {
      try {
        console.log(`No local DB records for ${district}, ${state}. Fetching live data from data.gov.in...`);
        const liveRecords = await getLiveMandiPrices({
          state,
          district,
          limit: 300,
        });

        if (liveRecords && liveRecords.length > 0) {
          const newDocs = [];
          liveRecords.forEach((item) => {
            const minP = Number(item.min_price || item.Min_Price || 0);
            const maxP = Number(item.max_price || item.Max_Price || 0);
            const modP = Number(item.modal_price || item.Modal_Price || 0);
            if (maxP > 0 || minP > 0 || modP > 0) {
              const doc = {
                state: item.state || item.State || state,
                district: item.district || item.District || district,
                market: item.market || item.Market || "APMC",
                commodity: item.commodity || item.Commodity || "Crop",
                variety: item.variety || item.Variety || "",
                grade: item.grade || item.Grade || "",
                arrivalDate: item.arrival_date ? new Date(item.arrival_date) : new Date(),
                minPrice: minP,
                maxPrice: maxP,
                modalPrice: modP,
                unit: "quintal",
                source: "data.gov.in",
              };
              newDocs.push(doc);
            }
          });

          if (newDocs.length > 0) {
            prices = newDocs;
            MarketPrice.insertMany(newDocs, { ordered: false }).catch(() => {});
          }
        }
      } catch (liveErr) {
        console.error(`Live Mandi fetch failed for ${district}, ${state}:`, liveErr.message);
      }
    }

    if (!prices.length) {
      return res.status(200).json({
        success: true,
        highest: [],
        lowest: [],
      });
    }

// Remove duplicate crop + market + variety
// Group records by commodity + variety + market
const grouped = {};

prices.forEach((item) => {
  const key = `${item.commodity}-${item.variety}-${item.market}`;

  if (!grouped[key]) {
    grouped[key] = {
      commodity: item.commodity,
      variety: item.variety,
      market: item.market,
      maxPrice: item.maxPrice,
      minPrice: item.minPrice,
    };
  } else {
    grouped[key].maxPrice = Math.max(
      grouped[key].maxPrice,
      item.maxPrice
    );

    grouped[key].minPrice = Math.min(
      grouped[key].minPrice,
      item.minPrice
    );
  }
});

const records = Object.values(grouped);

const highest = [...records]
  .sort((a, b) => b.maxPrice - a.maxPrice)
  .slice(0, 10);

const lowest = [...records]
  .sort((a, b) => a.minPrice - b.minPrice)
  .slice(0, 10);

return res.status(200).json({
  success: true,
  state,
  district,
  highest,
  lowest,
});

  } catch (error) {
    console.error("District Insights Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch district insights",
    });
  }
};

// ==========================================
// MARKET TRENDS
// GET /api/prices/market-trends
// ==========================================

const getMarketTrends = async (req, res) => {
  try {

    const { state, district } = req.query;

    // Build a base match stage for filtering
    const baseMatch = {};
    if (state) baseMatch.state = { $regex: new RegExp(`^${state}$`, "i") };
    if (district) baseMatch.district = { $regex: new RegExp(`^${district}$`, "i") };
    const matchStage = Object.keys(baseMatch).length > 0 ? [{ $match: baseMatch }] : [];

    // Top Highest Price Crops
    const topHighest = await MarketPrice.aggregate([
      ...matchStage,
      {
        $group: {
          _id: {
            commodity: "$commodity",
            variety: "$variety",
            market: "$market",
            district: "$district",
          },
          maxPrice: { $max: "$maxPrice" },
        },
      },
      {
        $project: {
          _id: 0,
          commodity: "$_id.commodity",
          variety: "$_id.variety",
          market: "$_id.market",
          district: "$_id.district",
          maxPrice: 1,
        },
      },
      { $sort: { maxPrice: -1 } },
      { $limit: 10 },
    ]);

    // Top Lowest Price Crops
    const topLowest = await MarketPrice.aggregate([
      ...matchStage,
      {
        $group: {
          _id: {
            commodity: "$commodity",
            variety: "$variety",
            market: "$market",
            district: "$district",
          },
          minPrice: { $min: "$minPrice" },
        },
      },
      {
        $project: {
          _id: 0,
          commodity: "$_id.commodity",
          variety: "$_id.variety",
          market: "$_id.market",
          district: "$_id.district",
          minPrice: 1,
        },
      },
      { $sort: { minPrice: 1 } },
      { $limit: 10 },
    ]);

    // Commodity Average
    const commodityAverage = await MarketPrice.aggregate([
      ...matchStage,
      {
        $group: {
          _id: "$commodity",
          averagePrice: { $avg: "$modalPrice" },
          records: { $sum: 1 },
        },
      },
      { $sort: { averagePrice: -1 } },
      { $limit: 20 },
    ]);

    // Market Statistics
    const marketStats = await MarketPrice.aggregate([
      ...matchStage,
      {
        $group: {
          _id: "$market",
          records: { $sum: 1 },
        },
      },
      { $sort: { records: -1 } },
      { $limit: 10 },
    ]);

    // District Statistics
    const districtStats = await MarketPrice.aggregate([
      ...matchStage,
      {
        $group: {
          _id: "$district",
          commodities: { $addToSet: "$commodity" },
          markets: { $addToSet: "$market" },
          avgPrice: { $avg: "$modalPrice" },
        },
      },
      {
        $project: {
          district: "$_id",
          cropCount: { $size: "$commodities" },
          marketCount: { $size: "$markets" },
          avgPrice: 1,
        },
      },
      { $sort: { cropCount: -1 } },
    ]);

    // Latest Prices
    const latestPrices = await MarketPrice.find(baseMatch)
      .sort({ arrivalDate: -1 })
      .limit(20)
      .select(
        "commodity variety market district state modalPrice minPrice maxPrice arrivalDate"
      )
      .lean();

    return res.status(200).json({
      success: true,
      topHighest,
      topLowest,
      commodityAverage,
      marketStats,
      districtStats,
      latestPrices,
    });

  } catch (error) {
    console.error("Market Trends Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load market trends",
    });
  }
};
// ==========================================
// EXPORTS
// ==========================================

module.exports = {

  getLivePrices,
  syncHistoricalPrices,
  getHistoricalPrices,

  getPricePrediction,
  getDynamicPricePrediction,

  getDistrictInsights,

  getMarketTrends,

  getPriceStates,
  getPriceDistricts,
  getPriceMarkets,
  getPriceCommodities,

  getCatalogStates,
  getCatalogDistricts,
  getCatalogMarkets,
  getCatalogCommodities,
};