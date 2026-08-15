const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // ── Farmer-specific notifications (existing behaviour, preserved) ──────
    // Used by: order updates, weather alerts, harvest reminders, AI diagnoses
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      // Not required — allows generic recipient-based notifications
    },

    // ── Generic recipient (used for admin broadcasts to any role) ──────────
    // One of {farmer, recipient} will be set. Never break existing queries.
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    type: {
      type: String,
      enum: [
        "order",
        "weather",
        "market",
        "harvest",
        "diagnosis",
        "plan",
        "export",
        "system",
        "broadcast",
      ],
      default: "system",
    },

    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    isRead: { type: Boolean, default: false },

    // Optional link for navigation
    link: { type: String, default: "" },

    // Extra data (cropId, orderId, etc.) — optional
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// Preserve original farmer-scoped indexes (backward compatible)
notificationSchema.index({ farmer: 1, createdAt: -1 });
notificationSchema.index({ farmer: 1, isRead: 1 });

// New recipient-scoped indexes for broadcast notifications
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
