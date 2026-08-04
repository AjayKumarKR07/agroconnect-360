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

module.exports = router;
