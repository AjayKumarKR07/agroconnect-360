const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getFarmerAnalytics,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require("../controllers/farmerController");

const router = express.Router();

// Analytics
router.get("/analytics", protect, getFarmerAnalytics);

// Notifications
router.get("/notifications",             protect, getNotifications);
router.put("/notifications/read-all",    protect, markAllNotificationsRead);
router.put("/notifications/:id/read",    protect, markNotificationRead);

module.exports = router;
