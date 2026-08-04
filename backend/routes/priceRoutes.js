const express = require("express");

const {
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
} = require("../controllers/priceController");

const {
  protect,
} = require(
  "../middleware/authMiddleware"
);

const router = express.Router();


// ==========================================
// LIVE MANDI PRICES
// GET /api/prices/live
// ==========================================

router.get(
  "/live",
  protect,
  getLivePrices
);


// ==========================================
// HISTORICAL MANDI PRICES
// GET /api/prices/history
// ==========================================

router.get(
  "/history",
  protect,
  getHistoricalPrices
);


// ==========================================
// SYNC HISTORICAL MANDI PRICES
// POST /api/prices/history/sync
// ==========================================

router.post(
  "/history/sync",
  protect,
  syncHistoricalPrices
);


// ==========================================
// STANDARD PRICE PREDICTION
// ==========================================

router.get(
  "/predict",
  protect,
  getPricePrediction
);


// ==========================================
// DYNAMIC ML PRICE PREDICTION
// ==========================================

router.get(
  "/predict-dynamic",
  protect,
  getDynamicPricePrediction
);

// ==========================================
// DISTRICT MARKET INSIGHTS
// ==========================================


router.get(
  "/district-insights",
  protect,
  getDistrictInsights
);
// ==========================================
// MARKET TRENDS
// ==========================================

router.get(
  "/market-trends",
  protect,
  getMarketTrends
);

// ==========================================
// OLD PRICE OPTIONS
// Keep these routes for compatibility
// ==========================================

router.get(
  "/options/states",
  protect,
  getPriceStates
);

router.get(
  "/options/districts",
  protect,
  getPriceDistricts
);

router.get(
  "/options/markets",
  protect,
  getPriceMarkets
);

router.get(
  "/options/commodities",
  protect,
  getPriceCommodities
);


// ==========================================
// FULL MANDI CATALOG
// ==========================================

router.get(
  "/catalog/states",
  protect,
  getCatalogStates
);

router.get(
  "/catalog/districts",
  protect,
  getCatalogDistricts
);

router.get(
  "/catalog/markets",
  protect,
  getCatalogMarkets
);

router.get(
  "/catalog/commodities",
  protect,
  getCatalogCommodities
);


module.exports = router;