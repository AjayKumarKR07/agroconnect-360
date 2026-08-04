const express = require("express");


const {
  getFarmerOrders,
  getFarmerOrderById,
  updateFarmerOrderStatus,
  createTestOrder,
  getFarmerIncome,
  getFarmerDashboardStats,
  getSellerOrders,
  getBuyerOrders,
  createOrder,
} = require("../controllers/orderController");



const {
  protect,
} = require("../middleware/authMiddleware");

const router = express.Router();

// All order routes require login
router.use(protect);

router.post("/test", createTestOrder);

// Buyer checkout
router.post("/", createOrder);

// Farmer routes
router.get("/farmer",                  getFarmerOrders);
router.get("/farmer/income",           getFarmerIncome);
router.get("/farmer/dashboard-stats",  getFarmerDashboardStats);
router.get("/farmer/:id",              getFarmerOrderById);
router.patch("/farmer/:id/status",     updateFarmerOrderStatus);

// Seller routes
router.get("/seller",                  getSellerOrders);

// Buyer routes
router.get("/buyer",                   getBuyerOrders);

// Generic status update — PATCH & PUT both supported
router.patch("/:id/status",            updateFarmerOrderStatus);
router.put("/:id/status",              updateFarmerOrderStatus);

module.exports = router;