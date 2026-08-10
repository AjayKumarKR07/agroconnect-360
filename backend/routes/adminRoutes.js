const express = require("express");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  getAdminStats,
  getAdminUsers,
  patchAdminUserStatus,
  getAdminOrders,
  patchAdminOrderStatus,
  getAdminCrops,
  deleteAdminCrop,
  getAdminRFQs,
  patchAdminRFQStatus,
  getAdminShipments,
} = require("../controllers/adminController");

const router = express.Router();

// All admin routes require login + admin role
router.use(protect, adminOnly);

// Dashboard stats
router.get("/stats", getAdminStats);

// User management
router.get("/users", getAdminUsers);
router.patch("/users/:id/status", patchAdminUserStatus);

// Order management
router.get("/orders", getAdminOrders);
router.patch("/orders/:id/status", patchAdminOrderStatus);

// Crop moderation
router.get("/crops", getAdminCrops);
router.delete("/crops/:id", deleteAdminCrop);

// Export RFQs
router.get("/rfqs", getAdminRFQs);
router.patch("/rfqs/:id/status", patchAdminRFQStatus);

// Export Shipments
router.get("/shipments", getAdminShipments);

module.exports = router;
