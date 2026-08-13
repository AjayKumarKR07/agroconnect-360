const mongoose = require("mongoose");

const cropSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    unit: {
      type: String,
      enum: ["kg", "quintal", "ton"],
      default: "kg",
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    sowingDate: {
      type: Date,
    },

    harvestDate: {
      type: Date,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },


    image: {
  url: {
    type: String,
    default: "",
  },

  publicId: {
    type: String,
    default: "",
  },
},

    status: {
      type: String,
      enum: [
        "growing",
        "ready",
        "listed",
        "sold",
      ],
      default: "growing",
    },

    // Visual lifecycle stage (7-stage tracker in ViewCrop)
    lifecycleStage: {
      type: String,
      enum: [
        "sowing",
        "growing",
        "flowering",
        "harvest_ready",
        "harvested",
        "listed",
        "sold",
      ],
      default: "sowing",
    },

    // ── Export Listing Fields (optional, domestic crops unaffected) ──────
    isExportListing: { type: Boolean, default: false },
    exportGrade: {
      type: String,
      trim: true,
      default: "",
      // e.g. "Export Grade", "Grade A", "AGMARK", "HPS 40/50"
    },
    exportQuantity: { type: Number, default: null }, // in exportUnit
    exportUnit: {
      type: String,
      enum: ["MT", "quintal", "kg", ""],
      default: "MT",
    },
    expectedExportPrice: { type: Number, default: null }, // per exportUnit
    availableFrom: { type: Date, default: null },
    preferredDestination: { type: String, trim: true, default: "" },
    exportStatus: {
      type: String,
      enum: ["available", "negotiating", "committed", "closed"],
      default: "available",
    },
  },
  {
    timestamps: true,
  }
);

cropSchema.index({ isExportListing: 1, exportStatus: 1, createdAt: -1 });
cropSchema.index({ farmer: 1, isExportListing: 1 });

module.exports = mongoose.model("Crop", cropSchema);