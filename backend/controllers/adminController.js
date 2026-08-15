const mongoose = require("mongoose");
const User = require("../models/User");
const Order = require("../models/Order");
const Crop = require("../models/Crop");
const ExportRFQ = require("../models/ExportRFQ");
const ExportShipment = require("../models/ExportShipment");
const ExportInterest = require("../models/ExportInterest");
const ExportContract = require("../models/ExportContract");
const Dispute = require("../models/Dispute");
const AuditLog = require("../models/AuditLog");
const Notification = require("../models/Notification");

// ==========================================
// INTERNAL HELPER — Write Audit Log
// Called after every significant admin action
// ==========================================
const writeAuditLog = async (adminId, action, entityType, entityId, description, metadata = {}) => {
  try {
    await AuditLog.create({
      admin: adminId,
      action,
      entityType,
      entityId: entityId ? String(entityId) : "",
      description,
      metadata,
    });
  } catch (err) {
    // Never let audit log failure break the primary action
    console.error("AuditLog write failed:", err.message);
  }
};

// ==========================================
// GET ADMIN DASHBOARD STATS
// GET /api/admin/stats
// ==========================================
const getAdminStats = async (req, res) => {
  try {
    const [
      totalUsers,
      farmers,
      sellers,
      buyers,
      exporters,
      suspendedUsers,
      totalOrders,
      pendingOrders,
      totalCrops,
      listedCrops,
      rfqCount,
      pendingRFQs,
      shipmentCount,
      openDisputes,
      deliveredOrders,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "farmer" }),
      User.countDocuments({ role: "seller" }),
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "exporter" }),
      User.countDocuments({ isActive: false }),
      Order.countDocuments(),
      Order.countDocuments({ status: "pending" }),
      Crop.countDocuments(),
      Crop.countDocuments({ status: "listed" }),
      ExportRFQ.countDocuments(),
      ExportRFQ.countDocuments({ status: "pending" }),
      ExportShipment.countDocuments(),
      Dispute.countDocuments({ status: { $in: ["open", "under_review"] } }),
      Order.find({ status: "delivered" }).select("totalAmount").lean(),
      User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name email role createdAt isActive isEmailVerified profileCompleted")
        .lean(),
    ]);

    // GMV = sum of all delivered order totals
    const totalGmv = deliveredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    // Platform commission (2.5%) is estimated — not stored per transaction
    const platformFeesEstimated = totalGmv * 0.025;

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        farmers,
        sellers,
        buyers,
        exporters,
        suspendedUsers,
        totalOrders,
        pendingOrders,
        totalCrops,
        listedCrops,
        rfqCount,
        pendingRFQs,
        shipmentCount,
        openDisputes,
        totalGmv,
        platformFeesEstimated,
      },
      recentUsers,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return res.status(500).json({ success: false, message: "Unable to load admin stats" });
  }
};

// ==========================================
// GET ADMIN DASHBOARD OVERVIEW (Control Center V2)
// GET /api/admin/dashboard-overview
// ==========================================
const getAdminDashboardOverview = async (req, res) => {
  const startCheck = Date.now();
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      usersByRoleAgg,
      suspendedUsers,
      recentUsers,
      totalOrders,
      ordersByStatusAgg,
      deliveredOrders,
      totalCrops,
      cropsByStatusAgg,
      exportCropsCount,
      exportCropsByStatusAgg,
      totalRFQs,
      rfqsByStatusAgg,
      pendingRFQs,
      totalShipments,
      shipmentsByStatusAgg,
      activeShipments,
      totalInterests,
      interestsByStatusAgg,
      totalContracts,
      activeContracts,
      totalDisputes,
      disputesByStatusAgg,
      userGrowthAgg,
      orderGrowthAgg,
      recentAuditLogs,
    ] = await Promise.all([
      // Users
      User.countDocuments(),
      User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      User.countDocuments({ isActive: false }),
      User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name email role createdAt isActive isEmailVerified profileCompleted")
        .lean(),

      // Orders
      Order.countDocuments(),
      Order.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalValue: { $sum: "$totalAmount" },
          },
        },
      ]),
      Order.find({ status: "delivered" }).select("totalAmount").lean(),

      // Crops
      Crop.countDocuments(),
      Crop.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Crop.countDocuments({ isExportListing: true }),
      Crop.aggregate([
        { $match: { isExportListing: true } },
        { $group: { _id: "$exportStatus", count: { $sum: 1 } } },
      ]),

      // Exports: RFQs
      ExportRFQ.countDocuments(),
      ExportRFQ.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      ExportRFQ.countDocuments({ status: "pending" }),

      // Exports: Shipments
      ExportShipment.countDocuments(),
      ExportShipment.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      ExportShipment.countDocuments({ status: { $nin: ["delivered", "cancelled"] } }),

      // Exports: Interests
      ExportInterest.countDocuments(),
      ExportInterest.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),

      // Exports: Contracts
      ExportContract.countDocuments(),
      ExportContract.countDocuments({ status: "active" }),

      // Disputes
      Dispute.countDocuments(),
      Dispute.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),

      // Growth (Users)
      User.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      // Growth (Orders & GMV)
      Order.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            ordersCount: { $sum: 1 },
            deliveredGmv: {
              $sum: {
                $cond: [{ $eq: ["$status", "delivered"] }, "$totalAmount", 0],
              },
            },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      // Recent Activity
      AuditLog.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("admin", "name email")
        .lean(),
    ]);

    // Financial calculations
    const totalGmv = (deliveredOrders || []).reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const platformFeesEstimated = totalGmv * 0.025;

    // User breakdown map
    const userRoles = {
      farmer: 0,
      user: 0, // buyer
      seller: 0,
      exporter: 0,
      admin: 0,
    };
    (usersByRoleAgg || []).forEach((r) => {
      if (r && r._id && userRoles.hasOwnProperty(r._id)) {
        userRoles[r._id] = r.count || 0;
      }
    });

    // Orders breakdown map
    const orderStatuses = {
      pending: 0,
      accepted: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      rejected: 0,
      cancelled: 0,
    };
    const orderValuesByStatus = {};
    (ordersByStatusAgg || []).forEach((s) => {
      if (s && s._id && orderStatuses.hasOwnProperty(s._id)) {
        orderStatuses[s._id] = s.count || 0;
        orderValuesByStatus[s._id] = s.totalValue || 0;
      }
    });

    // Crops breakdown map
    const cropStatuses = {
      growing: 0,
      ready: 0,
      listed: 0,
      sold: 0,
    };
    (cropsByStatusAgg || []).forEach((c) => {
      if (c && c._id && cropStatuses.hasOwnProperty(c._id)) {
        cropStatuses[c._id] = c.count || 0;
      }
    });

    // Export Interests breakdown map
    const interestStatuses = {
      pending: 0,
      accepted: 0,
      rejected: 0,
      negotiating: 0,
      confirmed: 0,
      cancelled: 0,
      completed: 0,
    };
    (interestsByStatusAgg || []).forEach((i) => {
      if (i && i._id && interestStatuses.hasOwnProperty(i._id)) {
        interestStatuses[i._id] = i.count || 0;
      }
    });

    // Export RFQs breakdown map
    const rfqStatuses = {
      pending: 0,
      accepted: 0,
      quoted: 0,
      rejected: 0,
    };
    (rfqsByStatusAgg || []).forEach((r) => {
      if (r && r._id && rfqStatuses.hasOwnProperty(r._id)) {
        rfqStatuses[r._id] = r.count || 0;
      }
    });

    // Export Shipments breakdown map
    const shipmentStatuses = {
      farm_packed: 0,
      cfs_cold_storage: 0,
      port_gate_in: 0,
      customs_cleared: 0,
      onboard_vessel: 0,
      delivered: 0,
      cancelled: 0,
    };
    (shipmentsByStatusAgg || []).forEach((s) => {
      if (s && s._id && shipmentStatuses.hasOwnProperty(s._id)) {
        shipmentStatuses[s._id] = s.count || 0;
      }
    });

    // Dispute breakdown map
    const disputeStatuses = {
      open: 0,
      under_review: 0,
      resolved: 0,
      rejected: 0,
    };
    (disputesByStatusAgg || []).forEach((d) => {
      if (d && d._id && disputeStatuses.hasOwnProperty(d._id)) {
        disputeStatuses[d._id] = d.count || 0;
      }
    });

    // Export Crop status breakdown map
    const exportCropStatuses = {
      available: 0,
      negotiating: 0,
      committed: 0,
      closed: 0,
    };
    (exportCropsByStatusAgg || []).forEach((ec) => {
      if (ec && ec._id && exportCropStatuses.hasOwnProperty(ec._id)) {
        exportCropStatuses[ec._id] = ec.count || 0;
      }
    });

    // System health summary
    const dbState = ["disconnected", "connected", "connecting", "disconnecting"][
      mongoose.connection.readyState
    ] || "unknown";
    const mem = process.memoryUsage();
    const uptimeSec = Math.floor(process.uptime());
    const hours = Math.floor(uptimeSec / 3600);
    const minutes = Math.floor((uptimeSec % 3600) / 60);

    const systemHealth = {
      api: "operational",
      database: dbState,
      databaseName: mongoose.connection.name || "agroconnect",
      uptimeFormatted: `${hours}h ${minutes}m`,
      nodeVersion: process.version,
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      responseTimeMs: Date.now() - startCheck,
    };

    return res.status(200).json({
      success: true,
      data: {
        kpis: {
          totalUsers: totalUsers || 0,
          totalOrders: totalOrders || 0,
          totalGmv: totalGmv || 0,
          platformFeesEstimated: platformFeesEstimated || 0,
          totalCrops: totalCrops || 0,
          listedCrops: cropStatuses.listed || 0,
          totalExportDeals: (activeContracts || 0) + (interestStatuses.confirmed || 0) + (interestStatuses.negotiating || 0),
          activeShipments: activeShipments || 0,
          openDisputes: (disputeStatuses.open || 0) + (disputeStatuses.under_review || 0),
          pendingOrders: orderStatuses.pending || 0,
          pendingRFQs: pendingRFQs || 0,
          suspendedUsers: suspendedUsers || 0,
          pendingInterests: interestStatuses.pending || 0,
        },
        users: {
          total: totalUsers || 0,
          suspended: suspendedUsers || 0,
          roles: userRoles,
          recent: recentUsers || [],
        },
        orders: {
          total: totalOrders || 0,
          statuses: orderStatuses,
          values: orderValuesByStatus,
        },
        crops: {
          total: totalCrops || 0,
          statuses: cropStatuses,
          exportCount: exportCropsCount || 0,
          exportStatuses: exportCropStatuses,
        },
        exports: {
          listingsCount: exportCropsCount || 0,
          interestsCount: totalInterests || 0,
          interestsStatuses: interestStatuses,
          rfqCount: totalRFQs || 0,
          rfqStatuses,
          shipmentCount: totalShipments || 0,
          activeShipments: activeShipments || 0,
          shipmentStatuses,
          contractsCount: totalContracts || 0,
          activeContracts: activeContracts || 0,
        },
        disputes: {
          total: totalDisputes || 0,
          open: disputeStatuses.open || 0,
          underReview: disputeStatuses.under_review || 0,
          resolved: disputeStatuses.resolved || 0,
          rejected: disputeStatuses.rejected || 0,
          statuses: disputeStatuses,
        },
        growth: {
          users: userGrowthAgg || [],
          orders: orderGrowthAgg || [],
        },
        activity: recentAuditLogs || [],
        system: systemHealth,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Dashboard overview error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard overview data",
      error: error.message,
    });
  }
};

// ==========================================
// GET ALL USERS (Admin) with pagination
// GET /api/admin/users?role=&search=&page=&limit=
// ==========================================
const getAdminUsers = async (req, res) => {
  try {
    const { role, search, status } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (role && role !== "all") filter.role = role;
    if (status === "suspended") filter.isActive = false;
    else if (status === "active") filter.isActive = true;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("name email phone role location state district isActive isEmailVerified profileCompleted createdAt lastLogin")
      .lean();

    return res.status(200).json({
      success: true,
      count: users.length,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      users,
    });
  } catch (error) {
    console.error("Admin get users error:", error);
    return res.status(500).json({ success: false, message: "Unable to load users" });
  }
};

// ==========================================
// TOGGLE USER ACTIVE STATUS (Admin)
// PATCH /api/admin/users/:id/status
// ==========================================
const patchAdminUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Prevent admin from suspending themselves
    if (String(user._id) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: "Cannot change your own account status" });
    }

    user.isActive = !user.isActive;
    await user.save();

    // Write audit log
    await writeAuditLog(
      req.user._id,
      user.isActive ? "user_activated" : "user_suspended",
      "user",
      user._id,
      `User "${user.name || user.email}" ${user.isActive ? "activated" : "suspended"}`,
      { userName: user.name, userEmail: user.email, userRole: user.role, newStatus: user.isActive }
    );

    return res.status(200).json({
      success: true,
      message: user.isActive ? "User activated" : "User suspended",
      isActive: user.isActive,
    });
  } catch (error) {
    console.error("Admin toggle user status error:", error);
    return res.status(500).json({ success: false, message: "Unable to update user status" });
  }
};

// ==========================================
// GET ALL ORDERS (Admin) with pagination
// GET /api/admin/orders?status=&page=&limit=
// ==========================================
const getAdminOrders = async (req, res) => {
  try {
    const { status, search } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (status && status !== "all") filter.status = status;
    if (search) {
      if (mongoose.Types.ObjectId.isValid(search)) {
        filter._id = search;
      } else {
        filter.$or = [
          { "items.cropName": { $regex: search, $options: "i" } },
          { "deliveryAddress.name": { $regex: search, $options: "i" } },
          { "deliveryAddress.city": { $regex: search, $options: "i" } },
        ];
      }
    }

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate("buyer", "name email phone")
      .populate("items.farmer", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      orders,
    });
  } catch (error) {
    console.error("Admin get orders error:", error);
    return res.status(500).json({ success: false, message: "Unable to load orders" });
  }
};

// ==========================================
// UPDATE ANY ORDER STATUS (Admin)
// PATCH /api/admin/orders/:id/status
// ==========================================
const patchAdminOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["pending", "accepted", "rejected", "processing", "shipped", "delivered", "cancelled"];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const order = await Order.findById(req.params.id).populate("buyer", "name email").lean();
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const previousStatus = order.status;
    const updated = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });

    // Write audit log
    await writeAuditLog(
      req.user._id,
      "order_status_changed",
      "order",
      order._id,
      `Order status changed from "${previousStatus}" to "${status}"`,
      {
        orderId: order._id,
        buyerName: order.buyer?.name,
        previousStatus,
        newStatus: status,
        totalAmount: order.totalAmount,
      }
    );

    return res.status(200).json({ success: true, message: `Order marked ${status}`, order: updated });
  } catch (error) {
    console.error("Admin update order status error:", error);
    return res.status(500).json({ success: false, message: "Unable to update order status" });
  }
};

// ==========================================
// GET ALL CROPS (Admin) with pagination
// GET /api/admin/crops?status=&page=&limit=
// ==========================================
const getAdminCrops = async (req, res) => {
  try {
    const { status, search } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (status && status !== "all") filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Crop.countDocuments(filter);
    const crops = await Crop.find(filter)
      .populate("farmer", "name email location")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const result = crops.map((c) => ({
      ...c,
      farmerName: c.farmer?.name || "Unknown",
      farmerEmail: c.farmer?.email || "",
      farmerLocation: c.farmer?.location || "",
    }));

    return res.status(200).json({
      success: true,
      count: result.length,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      crops: result,
    });
  } catch (error) {
    console.error("Admin get crops error:", error);
    return res.status(500).json({ success: false, message: "Unable to load crops" });
  }
};

// ==========================================
// DELETE ANY CROP (Admin)
// DELETE /api/admin/crops/:id
// ==========================================
const deleteAdminCrop = async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id).populate("farmer", "name email").lean();
    if (!crop) return res.status(404).json({ success: false, message: "Crop not found" });

    await Crop.findByIdAndDelete(req.params.id);

    // Write audit log
    await writeAuditLog(
      req.user._id,
      "crop_deleted",
      "crop",
      crop._id,
      `Crop "${crop.name}" deleted (Farmer: ${crop.farmer?.name || "Unknown"})`,
      { cropName: crop.name, cropId: crop._id, farmerName: crop.farmer?.name, farmerEmail: crop.farmer?.email }
    );

    return res.status(200).json({ success: true, message: "Crop deleted" });
  } catch (error) {
    console.error("Admin delete crop error:", error);
    return res.status(500).json({ success: false, message: "Unable to delete crop" });
  }
};

// ==========================================
// GET ALL EXPORT RFQS (Admin)
// GET /api/admin/rfqs
// ==========================================
const getAdminRFQs = async (req, res) => {
  try {
    const rfqs = await ExportRFQ.find()
      .populate("exporter", "name email")
      .populate("crop", "name category location")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, count: rfqs.length, rfqs });
  } catch (error) {
    console.error("Admin get RFQs error:", error);
    return res.status(500).json({ success: false, message: "Unable to load RFQs" });
  }
};

// ==========================================
// UPDATE RFQ STATUS (Admin)
// PATCH /api/admin/rfqs/:id/status
// ==========================================
const patchAdminRFQStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["pending", "accepted", "rejected", "quoted"];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const rfq = await ExportRFQ.findById(req.params.id).populate("exporter", "name").lean();
    if (!rfq) return res.status(404).json({ success: false, message: "RFQ not found" });

    const previousStatus = rfq.status;
    const updated = await ExportRFQ.findByIdAndUpdate(req.params.id, { status }, { new: true });

    // Write audit log
    await writeAuditLog(
      req.user._id,
      "rfq_status_changed",
      "rfq",
      rfq._id,
      `RFQ for "${rfq.cropName}" changed from "${previousStatus}" to "${status}"`,
      { rfqId: rfq._id, cropName: rfq.cropName, exporterName: rfq.exporter?.name, previousStatus, newStatus: status }
    );

    return res.status(200).json({ success: true, message: `RFQ marked ${status}`, rfq: updated });
  } catch (error) {
    console.error("Admin patch RFQ error:", error);
    return res.status(500).json({ success: false, message: "Unable to update RFQ" });
  }
};

// ==========================================
// GET ALL EXPORT SHIPMENTS (Admin)
// GET /api/admin/shipments
// ==========================================
const getAdminShipments = async (req, res) => {
  try {
    const shipments = await ExportShipment.find()
      .populate("exporter", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, count: shipments.length, shipments });
  } catch (error) {
    console.error("Admin get shipments error:", error);
    return res.status(500).json({ success: false, message: "Unable to load shipments" });
  }
};

// ==========================================
// UPDATE SHIPMENT STATUS (Admin)
// PATCH /api/admin/shipments/:id/status
// ==========================================
const patchAdminShipmentStatus = async (req, res) => {
  try {
    const { status, statusStep } = req.body;
    const allowedStatuses = [
      "farm_packed", "cfs_cold_storage", "port_gate_in",
      "customs_cleared", "onboard_vessel", "delivered", "cancelled"
    ];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const shipment = await ExportShipment.findById(req.params.id).populate("exporter", "name").lean();
    if (!shipment) return res.status(404).json({ success: false, message: "Shipment not found" });

    const update = { status };
    if (statusStep !== undefined && statusStep >= 0 && statusStep <= 5) {
      update.statusStep = statusStep;
    }

    const updated = await ExportShipment.findByIdAndUpdate(req.params.id, update, { new: true });

    await writeAuditLog(
      req.user._id,
      "shipment_status_changed",
      "shipment",
      shipment._id,
      `Shipment ${shipment.containerNo} status → "${status}"`,
      { containerNo: shipment.containerNo, previousStatus: shipment.status, newStatus: status }
    );

    return res.json({ success: true, message: `Shipment updated to ${status}`, shipment: updated });
  } catch (error) {
    console.error("Admin patch shipment status error:", error);
    return res.status(500).json({ success: false, message: "Unable to update shipment" });
  }
};

// ==========================================
// GET FINANCE DATA (Admin)
// GET /api/admin/finance
// ==========================================
const getAdminFinance = async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [byStatus, monthlyRevenue, totalOrdersResult, avgResult, recentDelivered] = await Promise.all([
      // GMV grouped by status
      Order.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            total: { $sum: "$totalAmount" },
          },
        },
        { $sort: { total: -1 } },
      ]),

      // Monthly revenue from delivered orders (last 6 months)
      Order.aggregate([
        {
          $match: {
            status: "delivered",
            createdAt: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            revenue: { $sum: "$totalAmount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      // Total orders
      Order.countDocuments(),

      // Average order value
      Order.aggregate([{ $group: { _id: null, avg: { $avg: "$totalAmount" } } }]),

      // Recent 15 delivered orders for transaction feed
      Order.find({ status: "delivered" })
        .sort({ updatedAt: -1 })
        .limit(15)
        .populate("buyer", "name email")
        .populate("items.farmer", "name")
        .select("totalAmount paymentMethod createdAt updatedAt buyer items")
        .lean(),
    ]);

    const totalGmv = byStatus.find((s) => s._id === "delivered")?.total || 0;
    const avgOrderValue = avgResult[0]?.avg || 0;

    return res.json({
      success: true,
      data: {
        byStatus,
        monthlyRevenue,
        totalOrders: totalOrdersResult,
        avgOrderValue,
        recentDelivered,
        totalGmv,
        // Commission is estimated — not stored in DB
        commissionNote: "2.5% commission is estimated from delivered GMV. Not stored per-transaction.",
        commissionEstimated: totalGmv * 0.025,
      },
    });
  } catch (error) {
    console.error("Admin finance error:", error);
    return res.status(500).json({ success: false, message: "Unable to load finance data" });
  }
};

// ==========================================
// GET ALL DISPUTES (Admin) with pagination
// GET /api/admin/disputes?status=&page=&limit=
// ==========================================
const getAdminDisputes = async (req, res) => {
  try {
    const { status } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (status && status !== "all") filter.status = status;

    const total = await Dispute.countDocuments(filter);
    const disputes = await Dispute.find(filter)
      .populate("raisedBy", "name email role")
      .populate("order", "totalAmount status")
      .populate("resolvedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return res.json({
      success: true,
      disputes,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Admin disputes error:", error);
    return res.status(500).json({ success: false, message: "Unable to load disputes" });
  }
};

// ==========================================
// UPDATE DISPUTE STATUS (Admin)
// PATCH /api/admin/disputes/:id/status
// ==========================================
const updateAdminDisputeStatus = async (req, res) => {
  try {
    const { status, adminNotes, resolution } = req.body;
    const allowed = ["open", "under_review", "resolved", "rejected"];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const update = { status, adminNotes: adminNotes ? String(adminNotes).trim() : "" };
    if (status === "resolved" || status === "rejected") {
      const trimmedResolution = resolution ? String(resolution).trim() : "";
      if (!trimmedResolution || trimmedResolution.length < 10) {
        return res.status(400).json({
          success: false,
          message: "A resolution explanation of at least 10 characters is required to resolve or reject a dispute",
        });
      }
      update.resolvedBy = req.user._id;
      update.resolvedAt = new Date();
      update.resolution = trimmedResolution;
    }

    const dispute = await Dispute.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate("raisedBy", "name email")
      .lean();

    if (!dispute) return res.status(404).json({ success: false, message: "Dispute not found" });

    await writeAuditLog(
      req.user._id,
      `dispute_${status}`,
      "dispute",
      dispute._id,
      `Dispute "${dispute.subject}" marked as ${status}`,
      { disputeId: dispute._id, raisedBy: dispute.raisedBy?.name, resolution: resolution || "" }
    );

    return res.json({ success: true, message: `Dispute marked as ${status}`, dispute });
  } catch (error) {
    console.error("Admin update dispute error:", error);
    return res.status(500).json({ success: false, message: "Unable to update dispute" });
  }
};

// ==========================================
// GET AUDIT LOGS (Admin) with pagination
// GET /api/admin/audit-logs?action=&entityType=&page=&limit=
// ==========================================
const getAdminAuditLogs = async (req, res) => {
  try {
    const { action, entityType } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
    const skip = (page - 1) * limit;

    const filter = {};
    if (action) filter.action = { $regex: action, $options: "i" };
    if (entityType && entityType !== "all") filter.entityType = entityType;

    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .populate("admin", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return res.json({
      success: true,
      logs,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Admin audit logs error:", error);
    return res.status(500).json({ success: false, message: "Unable to load audit logs" });
  }
};

// ==========================================
// SEND BROADCAST (Admin)
// POST /api/admin/broadcast
// ==========================================
const sendAdminBroadcast = async (req, res) => {
  try {
    const { targetRole, title, message, type = "broadcast" } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    // Find active recipient users
    const filter = { isActive: true };
    if (targetRole && targetRole !== "all") filter.role = targetRole;

    const recipients = await User.find(filter).select("_id").lean();

    if (recipients.length === 0) {
      return res.json({
        success: true,
        message: "No active recipients found for the selected role",
        count: 0,
        sentAt: new Date(),
      });
    }

    // Bulk create notifications
    const notifications = recipients.map((u) => ({
      recipient: u._id,
      title: title.trim(),
      message: message.trim(),
      type: "broadcast",
      isRead: false,
    }));

    await Notification.insertMany(notifications, { ordered: false });

    const sentAt = new Date();

    await writeAuditLog(
      req.user._id,
      "broadcast_sent",
      "broadcast",
      "",
      `Broadcast sent to ${targetRole && targetRole !== "all" ? targetRole + "s" : "all users"}: "${title.trim()}"`,
      { targetRole: targetRole || "all", recipientCount: recipients.length, title: title.trim(), sentAt }
    );

    return res.json({
      success: true,
      message: "Broadcast sent successfully",
      count: recipients.length,
      sentAt,
    });
  } catch (error) {
    console.error("Admin broadcast error:", error);
    return res.status(500).json({ success: false, message: "Unable to send broadcast" });
  }
};

// ==========================================
// GET BROADCAST HISTORY (Admin)
// GET /api/admin/broadcast/history
// ==========================================
const getAdminBroadcastHistory = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    // Broadcasts are recorded in AuditLog with action=broadcast_sent
    const total = await AuditLog.countDocuments({ action: "broadcast_sent" });
    const history = await AuditLog.find({ action: "broadcast_sent" })
      .populate("admin", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return res.json({ success: true, history, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Admin broadcast history error:", error);
    return res.status(500).json({ success: false, message: "Unable to load broadcast history" });
  }
};

// ==========================================
// GET SYSTEM HEALTH (Admin)
// GET /api/admin/system/health
// ==========================================
const getAdminSystemHealth = async (req, res) => {
  const requestStart = Date.now();
  try {
    const mem = process.memoryUsage();
    const uptimeSec = Math.floor(process.uptime());
    const hours = Math.floor(uptimeSec / 3600);
    const minutes = Math.floor((uptimeSec % 3600) / 60);

    const dbStateMap = ["disconnected", "connected", "connecting", "disconnecting"];
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbStateMap[dbState] || "unknown";

    const responseTimeMs = Date.now() - requestStart;

    return res.json({
      success: true,
      health: {
        api: "operational",
        database: dbStatus,
        databaseName: mongoose.connection.name || "unknown",
        uptimeSeconds: uptimeSec,
        uptimeFormatted: `${hours}h ${minutes}m`,
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || "development",
        memory: {
          heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
          heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
          rssMB: Math.round(mem.rss / 1024 / 1024),
        },
        responseTimeMs,
        checkedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Admin system health error:", error);
    return res.status(500).json({ success: false, message: "Health check failed" });
  }
};

module.exports = {
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
};
