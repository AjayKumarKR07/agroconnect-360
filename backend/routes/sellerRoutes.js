const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
  getSellerDashboardStats,
  getSellerProducts,
  createSellerProduct,
  updateSellerProduct,
  deleteSellerProduct,
  getSellerRevenue,
  getSellerAnalytics,
  getSellerShipments,
} = require("../controllers/sellerController");

const router = express.Router();

// Dashboard
router.get("/dashboard-stats",         protect, getSellerDashboardStats);

// Products
router.get("/products",                protect, getSellerProducts);
router.post("/products",               protect, upload.single("image"), createSellerProduct);
router.put("/products/:id",            protect, upload.single("image"), updateSellerProduct);
router.delete("/products/:id",         protect, deleteSellerProduct);

// Revenue
router.get("/revenue",                 protect, getSellerRevenue);

// Analytics
router.get("/analytics",               protect, getSellerAnalytics);

// Shipments (derived from orders)
router.get("/shipments",               protect, getSellerShipments);
// Individual shipment status update — frontend calls PUT /api/seller/shipments/:id
// This is a no-op stub since shipments are derived from orders; real status is on the order
router.put("/shipments/:id",           protect, (req, res) => res.json({ success: true }));

module.exports = router;

