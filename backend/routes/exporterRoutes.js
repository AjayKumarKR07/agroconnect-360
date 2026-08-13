const express = require("express");
const {
  getExporterStats,
  getExporterShipments,
  createExportShipment,
  updateShipmentStatus,
  deleteShipment,
  getExporterRFQs,
  createExportRFQ,
} = require("../controllers/exporterController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Require login
router.use(protect);

router.get("/stats", getExporterStats);

router.get("/shipments",              getExporterShipments);
router.post("/shipments",             createExportShipment);
router.patch("/shipments/:id/status", updateShipmentStatus);
router.delete("/shipments/:id",       deleteShipment);

router.get("/rfqs",  getExporterRFQs);
router.post("/rfqs", createExportRFQ);

module.exports = router;

