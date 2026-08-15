const mongoose = require("mongoose");

const disputeSchema = new mongoose.Schema(
  {
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Optional — linked order if dispute is about a specific order
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: ["quality", "payment", "delivery", "quantity", "other"],
      default: "other",
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    status: {
      type: String,
      enum: ["open", "under_review", "resolved", "rejected"],
      default: "open",
    },

    adminNotes: {
      type: String,
      trim: true,
      default: "",
    },

    resolution: {
      type: String,
      trim: true,
      default: "",
    },

    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

disputeSchema.index({ status: 1, createdAt: -1 });
disputeSchema.index({ raisedBy: 1, createdAt: -1 });

module.exports = mongoose.model("Dispute", disputeSchema);
