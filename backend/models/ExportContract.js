const mongoose = require("mongoose");

const exportContractSchema = new mongoose.Schema(
  {
    exporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // LC / Contract reference
    lcRef:       { type: String, trim: true, default: "" },   // e.g. "LC-2024-001"
    lcType:      {
      type: String,
      enum: ["Irrevocable LC at Sight", "Confirmed LC 60 Days", "Usance LC 90 Days", "Standby LC", "Red Clause LC", "Revolving LC", "Other"],
      default: "Irrevocable LC at Sight",
    },

    // Buyer / counterparty
    buyerName:    { type: String, required: true, trim: true },
    buyerCountry: { type: String, trim: true, default: "" },
    issuingBank:  { type: String, trim: true, default: "" },

    // Commodity
    cropName:     { type: String, required: true, trim: true },
    quantityTons: { type: Number, default: 0 },

    // Financials
    contractValueUsd: { type: Number, required: true, min: 0 },

    // Payment milestones (array of { label, percentage, released })
    milestones: [
      {
        label:      { type: String, required: true },   // e.g. "20% Advance"
        percentage: { type: Number, required: true },   // e.g. 20
        released:   { type: Boolean, default: false },
      },
    ],

    // Status
    status: {
      type: String,
      enum: ["draft", "active", "completed", "cancelled"],
      default: "active",
    },

    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

exportContractSchema.index({ exporter: 1, createdAt: -1 });

module.exports = mongoose.model("ExportContract", exportContractSchema);
