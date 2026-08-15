const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Short machine-readable action key, e.g. "user_suspended", "crop_deleted"
    action: {
      type: String,
      required: true,
      trim: true,
    },

    entityType: {
      type: String,
      enum: ["user", "order", "crop", "rfq", "shipment", "dispute", "broadcast", "system"],
      required: true,
    },

    // String representation of the affected document _id (or empty)
    entityId: {
      type: String,
      default: "",
      trim: true,
    },

    // Human-readable description shown in the UI
    description: {
      type: String,
      required: true,
      trim: true,
    },

    // Optional extra context (before/after values, counts, etc.)
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ entityType: 1 });
auditLogSchema.index({ admin: 1, createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
