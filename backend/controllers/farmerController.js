/**
 * AgroConnect 360 — Farmer Controller
 * Handles: Analytics, Notifications
 */

const Crop         = require("../models/Crop");
const Order        = require("../models/Order");
const Diagnosis    = require("../models/Diagnosis");
const Notification = require("../models/Notification");

// ============================================================
// FARM ANALYTICS
// GET /api/farmer/analytics
// Aggregates real data from Crop + Order collections
// ============================================================
const getFarmerAnalytics = async (req, res) => {
  try {
    const farmerId = req.user._id;

    // Parallel queries
    const [crops, orders, diagnoses] = await Promise.all([
      Crop.find({ farmer: farmerId }),
      Order.find({ "items.farmer": farmerId }),
      Diagnosis.find({ farmer: farmerId }).sort({ createdAt: -1 }).limit(5),
    ]);

    // ── Crop metrics ──
    const cropStats = {
      total:        crops.length,
      growing:      crops.filter(c => c.status === "growing").length,
      ready:        crops.filter(c => c.status === "ready").length,
      listed:       crops.filter(c => c.status === "listed").length,
      sold:         crops.filter(c => c.status === "sold").length,
      active:       crops.filter(c => ["growing", "ready", "listed"].includes(c.status)).length,
    };

    // Crop inventory breakdown (name + quantity for chart)
    const cropInventory = crops.map(c => ({
      name: c.name,
      quantity: c.quantity,
      unit: c.unit,
      status: c.status,
    }));

    // ── Order metrics ──
    const orderStats = {
      total:     orders.length,
      pending:   orders.filter(o => o.status === "pending").length,
      accepted:  orders.filter(o => o.status === "accepted").length,
      delivered: orders.filter(o => o.status === "delivered").length,
      cancelled: orders.filter(o => o.status === "cancelled").length,
    };

    // ── Income metrics (from delivered orders) ──
    let totalIncome = 0;
    const monthlyIncome = Array(12).fill(0); // index 0=Jan, 11=Dec

    orders.forEach(order => {
      if (order.status === "delivered") {
        // Sum only items belonging to this farmer
        order.items.forEach(item => {
          if (String(item.farmer) === String(farmerId)) {
            totalIncome += item.subtotal || 0;
            const month = new Date(order.updatedAt || order.createdAt).getMonth();
            monthlyIncome[month] += item.subtotal || 0;
          }
        });
      }
    });

    // Crop-wise sales (name → total revenue)
    const cropSalesMap = {};
    orders.forEach(order => {
      if (order.status === "delivered") {
        order.items.forEach(item => {
          if (String(item.farmer) === String(farmerId)) {
            const key = item.cropName || "Unknown";
            cropSalesMap[key] = (cropSalesMap[key] || 0) + (item.subtotal || 0);
          }
        });
      }
    });
    const cropSales = Object.entries(cropSalesMap)
      .map(([crop, revenue]) => ({ crop, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Revenue trend (last 6 months)
    const revenueTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const month = d.getMonth();
      const year  = d.getFullYear();
      revenueTrend.push({
        label: d.toLocaleString("en-IN", { month: "short", year: "2-digit" }),
        income: monthlyIncome[month] || 0,
      });
    }

    // ── Diagnosis summary ──
    const diagnosisStats = {
      total: await Diagnosis.countDocuments({ farmer: farmerId }),
      recent: diagnoses.map(d => ({
        cropName: d.cropName,
        disease:  d.diagnosis?.disease || "—",
        severity: d.diagnosis?.severity || "—",
        date:     d.createdAt,
      })),
    };

    return res.status(200).json({
      success: true,
      crops:      cropStats,
      orders:     orderStats,
      income:     { total: totalIncome, monthly: monthlyIncome },
      cropSales,
      revenueTrend,
      cropInventory,
      diagnoses:  diagnosisStats,
      note: "Expense data unavailable — profit cannot be accurately calculated. Add expense tracking to calculate net profit.",
    });
  } catch (error) {
    console.error("[FarmerAnalytics] Error:", error?.message);
    return res.status(500).json({ success: false, message: "Unable to load analytics" });
  }
};

// ============================================================
// GET NOTIFICATIONS
// GET /api/farmer/notifications
// ============================================================
const getNotifications = async (req, res) => {
  try {
    const farmerId = req.user._id;

    // Auto-create harvest-approaching notifications (idempotent)
    const now     = new Date();
    const in14    = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const approaching = await Crop.find({
      farmer: farmerId,
      harvestDate: { $gt: now, $lte: in14 },
      status: { $in: ["growing", "ready"] },
    });

    for (const crop of approaching) {
      const exists = await Notification.findOne({
        farmer: farmerId,
        type: "harvest",
        "metadata.cropId": crop._id.toString(),
      });
      if (!exists) {
        const days = Math.ceil((new Date(crop.harvestDate) - now) / (1000 * 60 * 60 * 24));
        await Notification.create({
          farmer:  farmerId,
          type:    "harvest",
          title:   `🌱 ${crop.name} harvest in ${days} day${days !== 1 ? "s" : ""}`,
          message: `Your ${crop.name} crop is expected to be harvest-ready on ${new Date(crop.harvestDate).toLocaleDateString("en-IN")}.`,
          link:    `/farmer/crops/${crop._id}`,
          metadata: { cropId: crop._id.toString() },
        });
      }
    }

    // Fetch all notifications
    const notifications = await Notification.find({ farmer: farmerId })
      .sort({ createdAt: -1 })
      .limit(60);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return res.status(200).json({ success: true, count: notifications.length, unreadCount, notifications });
  } catch (error) {
    console.error("[Notifications] Error:", error?.message);
    return res.status(500).json({ success: false, message: "Unable to load notifications" });
  }
};

// ============================================================
// MARK ONE NOTIFICATION AS READ
// PUT /api/farmer/notifications/:id/read
// ============================================================
const markNotificationRead = async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, farmer: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ success: false, message: "Notification not found" });
    return res.status(200).json({ success: true, notification: notif });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to update notification" });
  }
};

// ============================================================
// MARK ALL NOTIFICATIONS AS READ
// PUT /api/farmer/notifications/read-all
// ============================================================
const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany({ farmer: req.user._id, isRead: false }, { isRead: true });
    return res.status(200).json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to update notifications" });
  }
};

module.exports = {
  getFarmerAnalytics,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
