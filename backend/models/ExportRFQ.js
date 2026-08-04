const mongoose = require("mongoose");

const exportRFQSchema = new mongoose.Schema(
  {
    exporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    crop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crop",
    },
    cropName: {
      type: String,
      required: true,
      trim: true,
    },
    destinationCountry: {
      type: String,
      required: true,
      trim: true,
    },
    containerSize: {
      type: String,
      required: true,
      enum: ["20ft Dry Container", "20ft Reefer (Cold)", "40ft High Cube Reefer"],
      default: "20ft Reefer (Cold)",
    },
    quantityTons: {
      type: Number,
      required: true,
      min: 1,
    },
    packagingNotes: {
      type: String,
      trim: true,
      default: "",
    },
    targetPriceUsd: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "quoted"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ExportRFQ", exportRFQSchema);
