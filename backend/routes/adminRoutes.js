const express = require("express");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  getAdminStats,
  getAdminDashboardOverview,
  getAdminUsers,
  patchAdminUserStatus,
  getAdminOrders,
  patchAdminOrderStatus,
  getAdminCrops,
  deleteAdminCrop,
  getAdminRFQs,
  patchAdminRFQStatus,
  getAdminShipments,
  patchAdminShipmentStatus,
  getAdminFinance,
  getAdminDisputes,
  updateAdminDisputeStatus,
  getAdminAuditLogs,
  sendAdminBroadcast,
  getAdminBroadcastHistory,
  getAdminSystemHealth,
  getAdminNotifications,
  getAdminNotificationCount,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} = require("../controllers/adminController");

const router = express.Router();

// All admin routes require login + admin role
router.use(protect, adminOnly);

// ── Dashboard ──────────────────────────────────────────────────────────────
router.get("/stats", getAdminStats);
router.get("/dashboard-overview", getAdminDashboardOverview);

// ── User management ────────────────────────────────────────────────────────
router.get("/users", getAdminUsers);
router.patch("/users/:id/status", patchAdminUserStatus);

// ── Order management ───────────────────────────────────────────────────────
router.get("/orders", getAdminOrders);
router.patch("/orders/:id/status", patchAdminOrderStatus);

// ── Crop moderation ────────────────────────────────────────────────────────
router.get("/crops", getAdminCrops);
router.delete("/crops/:id", deleteAdminCrop);

// ── Export RFQs ────────────────────────────────────────────────────────────
router.get("/rfqs", getAdminRFQs);
router.patch("/rfqs/:id/status", patchAdminRFQStatus);

// ── Export Shipments ───────────────────────────────────────────────────────
router.get("/shipments", getAdminShipments);
router.patch("/shipments/:id/status", patchAdminShipmentStatus);

// ── Finance ────────────────────────────────────────────────────────────────
router.get("/finance", getAdminFinance);

// ── Disputes ───────────────────────────────────────────────────────────────
router.get("/disputes", getAdminDisputes);
router.patch("/disputes/:id/status", updateAdminDisputeStatus);

// ── Audit Logs (read-only — no DELETE/UPDATE routes exposed) ───────────────
router.get("/audit-logs", getAdminAuditLogs);

// ── Broadcast ──────────────────────────────────────────────────────────────
router.post("/broadcast", sendAdminBroadcast);
router.get("/broadcast/history", getAdminBroadcastHistory);

// ── System Health ──────────────────────────────────────────────────────────
router.get("/system/health", getAdminSystemHealth);

// ── Admin Notifications ────────────────────────────────────────────────────
// NOTE: "mark-all-read" is registered BEFORE "/:id/read" so Express does not
// treat the literal string "mark-all-read" as a Mongo ObjectId.
router.get("/notifications", getAdminNotifications);
router.get("/notifications/unread-count", getAdminNotificationCount);
router.patch("/notifications/mark-all-read", markAllAdminNotificationsRead);
router.patch("/notifications/:id/read", markAdminNotificationRead);

module.exports = router;
