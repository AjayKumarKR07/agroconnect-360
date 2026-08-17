const Dispute = require("../models/Dispute");
const Notification = require("../models/Notification");
const User = require("../models/User");

// ==========================================
// CREATE DISPUTE (any logged-in user)
// POST /api/disputes
// ==========================================
const createDispute = async (req, res) => {
  try {
    const { subject, description, category, priority, orderId } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({ success: false, message: "Subject is required" });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: "Description is required" });
    }

    const dispute = await Dispute.create({
      raisedBy: req.user._id,
      subject: subject.trim(),
      description: description.trim(),
      category: category || "other",
      priority: priority || "medium",
      order: orderId || null,
    });

    // Notify all active admins — silently, never blocking the primary response
    // Uses recipient field to avoid affecting farmer-scoped notification queries
    try {
      const admins = await User.find({ role: "admin", isActive: true }).select("_id").lean();
      if (admins.length) {
        const adminNotifications = admins.map((a) => ({
          recipient: a._id,
          type: "system",
          title: "New Dispute Filed",
          message: `A ${priority || "medium"}-priority dispute has been submitted: "${subject.trim()}" by ${req.user.name || req.user.email || "a user"}.`,
          isRead: false,
          link: "/admin/disputes?status=open",
          metadata: { disputeId: String(dispute._id), priority: priority || "medium" },
        }));
        await Notification.insertMany(adminNotifications, { ordered: false });
      }
    } catch (notifyErr) {
      console.error("Admin dispute notification failed (non-critical):", notifyErr.message);
    }

    return res.status(201).json({ success: true, dispute });
  } catch (error) {
    console.error("Create dispute error:", error);
    return res.status(500).json({ success: false, message: "Unable to create dispute" });
  }
};

// ==========================================
// GET MY DISPUTES (for the logged-in user)
// GET /api/disputes/my
// ==========================================
const getMyDisputes = async (req, res) => {
  try {
    const disputes = await Dispute.find({ raisedBy: req.user._id })
      .populate("order", "totalAmount status createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, count: disputes.length, disputes });
  } catch (error) {
    console.error("Get my disputes error:", error);
    return res.status(500).json({ success: false, message: "Unable to load disputes" });
  }
};

// ==========================================
// GET ONE DISPUTE (owner or admin)
// GET /api/disputes/:id
// ==========================================
const getDisputeById = async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id)
      .populate("raisedBy", "name email role")
      .populate("order", "totalAmount status")
      .populate("resolvedBy", "name email")
      .lean();

    if (!dispute) {
      return res.status(404).json({ success: false, message: "Dispute not found" });
    }

    // Only allow owner or admin to view
    const isOwner = String(dispute.raisedBy?._id) === String(req.user._id);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    return res.json({ success: true, dispute });
  } catch (error) {
    console.error("Get dispute by id error:", error);
    return res.status(500).json({ success: false, message: "Unable to load dispute" });
  }
};

module.exports = { createDispute, getMyDisputes, getDisputeById };
