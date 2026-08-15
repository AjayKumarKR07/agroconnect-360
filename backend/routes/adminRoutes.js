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

// ── Audit Logs ─────────────────────────────────────────────────────────────
router.get("/audit-logs", getAdminAuditLogs);

// ── Broadcast ──────────────────────────────────────────────────────────────
router.post("/broadcast", sendAdminBroadcast);
router.get("/broadcast/history", getAdminBroadcastHistory);

// ── System Health ──────────────────────────────────────────────────────────
router.get("/system/health", getAdminSystemHealth);

module.exports = router;
