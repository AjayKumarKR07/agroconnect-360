const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  // Farmer
  createExportListing,
  getFarmerExportListings,
  updateExportListing,
  deleteExportListing,
  getFarmerInterestRequests,
  respondToInterest,
  farmerCounterOffer,
  farmerConfirmDeal,
  markFarmerInterestsRead,
  // Exporter
  getAllExportListings,
  getExportListingDetail,
  expressInterest,
  getExporterInterests,
  exporterCounterOffer,
  exporterConfirmDeal,
  // Shared
  getExportStats,
} = require("../controllers/exportController");

const router = express.Router();

// All routes require authentication
router.use(protect);

// ── Shared stats (farmer & exporter) ───────────────────────────────────
router.get("/stats", getExportStats);

// ── Public export listings (accessible to any logged-in user) ──────────
router.get("/listings",     getAllExportListings);
router.get("/listings/:id", getExportListingDetail);

// ── Farmer: manage own export listings ─────────────────────────────────
router.post(  "/listings",           createExportListing);
router.put(   "/listings/:id",       updateExportListing);
router.delete("/listings/:id",       deleteExportListing);

// ── Farmer: own listings list with interest counts ─────────────────────
router.get(  "/farmer/listings",     getFarmerExportListings);

// ── Farmer: incoming interest requests ─────────────────────────────────
router.get(  "/farmer/interests",    getFarmerInterestRequests);
router.put(  "/farmer/interests/read-all", markFarmerInterestsRead);

// ── Farmer: respond / counter / confirm ────────────────────────────────
router.patch("/interests/:id/respond",  respondToInterest);
router.patch("/interests/:id/counter",  farmerCounterOffer);
router.patch("/interests/:id/confirm",  farmerConfirmDeal);

// ── Exporter: express interest + own interests ──────────────────────────
router.post("/interests",                   expressInterest);
router.get( "/exporter/interests",          getExporterInterests);
router.patch("/interests/:id/counter-ex",   exporterCounterOffer);
router.patch("/interests/:id/confirm-ex",   exporterConfirmDeal);

module.exports = router;
