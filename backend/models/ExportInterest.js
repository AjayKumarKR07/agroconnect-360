const mongoose = require("mongoose");

const exportInterestSchema = new mongoose.Schema(
  {
    // ── Core relationships ─────────────────────────────────────────────
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    exporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crop",
      required: true,
      index: true,
    },

    // ── Interest details ────────────────────────────────────────────────
    requestedQty:  { type: Number, required: true, min: 0 },
    requestedUnit: { type: String, default: "MT" },
    offeredPrice:  { type: Number, required: true, min: 0 }, // per unit
    destination:   { type: String, trim: true, default: "" },
    message:       { type: String, trim: true, default: "" },

    // ── Status lifecycle ────────────────────────────────────────────────
    // pending → accepted | rejected
    // accepted → negotiating → confirmed | cancelled
    // confirmed → completed
    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "rejected",
        "negotiating",
        "confirmed",
        "cancelled",
        "completed",
      ],
      default: "pending",
      index: true,
    },

    // ── Negotiation ─────────────────────────────────────────────────────
    farmerCounter:    { type: Number, default: null }, // farmer counter-price
    exporterCounter:  { type: Number, default: null }, // exporter counter-price
    negotiationNotes: { type: String, trim: true, default: "" },

    // ── Agreed deal (set when both confirm) ────────────────────────────
    agreedPrice:    { type: Number, default: null },
    agreedQty:      { type: Number, default: null },
    agreedUnit:     { type: String, default: "" },
    agreedDest:     { type: String, trim: true, default: "" },
    shipmentTerms:  { type: String, trim: true, default: "" },

    // ── Confirmation flags ──────────────────────────────────────────────
    farmerConfirmed:   { type: Boolean, default: false },
    exporterConfirmed: { type: Boolean, default: false },

    // ── Read flags (for notification badges) ───────────────────────────
    farmerRead:   { type: Boolean, default: true  }, // farmer created the listing
    exporterRead: { type: Boolean, default: false }, // exporter receives status updates
  },
  { timestamps: true }
);

// Compound index: one active interest per exporter per listing
exportInterestSchema.index(
  { exporter: 1, listing: 1, status: 1 },
  { name: "unique_active_interest" }
);

module.exports = mongoose.model("ExportInterest", exportInterestSchema);
