const mongoose = require("mongoose");

const exportShipmentSchema = new mongoose.Schema(
  {
    exporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    containerNo: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    vessel: {
      type: String,
      required: true,
      trim: true,
    },
    cargo: {
      type: String,
      required: true,
      trim: true,
    },
    quantityTons: {
      type: Number,
      required: true,
      min: 0,
    },
    portOfOrigin: {
      type: String,
      required: true,
      trim: true,
    },
    destPort: {
      type: String,
      required: true,
      trim: true,
    },
    destinationCountry: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "farm_packed",
        "cfs_cold_storage",
        "port_gate_in",
        "customs_cleared",
        "onboard_vessel",
        "delivered",
        "cancelled",
      ],
      default: "cfs_cold_storage",
    },
    statusStep: {
      type: Number,
      default: 1,
      min: 0,
      max: 5,
    },
    etd: {
      type: Date,
    },
    eta: {
      type: Date,
    },
    billOfLading: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ExportShipment", exportShipmentSchema);
