const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

notificationSchema.index({ farmer: 1, createdAt: -1 });
notificationSchema.index({ farmer: 1, isRead: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
