const User = require("../models/User");
const Order = require("../models/Order");
const Crop = require("../models/Crop");
const ExportRFQ = require("../models/ExportRFQ");
const ExportShipment = require("../models/ExportShipment");

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
      totalOrders,
      pendingOrders,
      totalCrops,
      listedCrops,
      rfqCount,
      shipmentCount,
      deliveredOrders,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "farmer" }),
      User.countDocuments({ role: "seller" }),
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "exporter" }),
      Order.countDocuments(),
      Order.countDocuments({ status: "pending" }),
      Crop.countDocuments(),
      Crop.countDocuments({ status: "listed" }),
      ExportRFQ.countDocuments(),
      ExportShipment.countDocuments(),
      Order.find({ status: "delivered" }).lean(),
      User.find().sort({ createdAt: -1 }).limit(5).select("name email role createdAt isActive").lean(),
    ]);

    // GMV = sum of all delivered order totals
    const totalGmv = deliveredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const platformFees = totalGmv * 0.025; // 2.5% commission

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        farmers,
        sellers,
        buyers,
        exporters,
        totalOrders,
        pendingOrders,
        totalCrops,
        listedCrops,
        rfqCount,
        shipmentCount,
        totalGmv,
        platformFees,
      },
      recentUsers,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return res.status(500).json({ success: false, message: "Unable to load admin stats" });
  }
};

// ==========================================
// GET ALL USERS (Admin)
// GET /api/admin/users?role=&search=
// ==========================================
const getAdminUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    const filter = {};
    if (role && role !== "all") filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .select("name email phone role location state district isActive isEmailVerified profileCompleted createdAt lastLogin")
      .lean();

    return res.status(200).json({ success: true, count: users.length, users });
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

    // Toggle isActive
    user.isActive = !user.isActive;
    await user.save();

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
// GET ALL ORDERS (Admin)
// GET /api/admin/orders?status=
// ==========================================
const getAdminOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== "all") filter.status = status;

    const orders = await Order.find(filter)
      .populate("buyer", "name email phone")
      .populate("items.farmer", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, count: orders.length, orders });
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

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    return res.status(200).json({ success: true, message: `Order marked ${status}`, order });
  } catch (error) {
    console.error("Admin update order status error:", error);
    return res.status(500).json({ success: false, message: "Unable to update order status" });
  }
};

// ==========================================
// GET ALL CROPS (Admin)
// GET /api/admin/crops?status=
// ==========================================
const getAdminCrops = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== "all") filter.status = status;

    const crops = await Crop.find(filter)
      .populate("farmer", "name email location")
      .sort({ createdAt: -1 })
      .lean();

    const result = crops.map(c => ({
      ...c,
      farmerName: c.farmer?.name || "Unknown",
      farmerEmail: c.farmer?.email || "",
    }));

    return res.status(200).json({ success: true, count: result.length, crops: result });
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
    const crop = await Crop.findByIdAndDelete(req.params.id);
    if (!crop) return res.status(404).json({ success: false, message: "Crop not found" });
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
    const rfq = await ExportRFQ.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!rfq) return res.status(404).json({ success: false, message: "RFQ not found" });
    return res.status(200).json({ success: true, message: `RFQ marked ${status}`, rfq });
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

module.exports = {
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
};
