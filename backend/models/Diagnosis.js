const mongoose = require("mongoose");

const diagnosisSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    cropName: {
      type: String,
      required: true,
      trim: true,
    },

    symptoms: {
      type: String,
      trim: true,
      default: "",
    },

    image: {
      url: {
        type: String,
        required: true,
      },

      publicId: {
        type: String,
        required: true,
      },
    },

    diagnosis: {
      disease: {
        type: String,
        default: "",
      },

      confidence: {
        type: Number,
        default: 0,
      },

      severity: {
        type: String,
        enum: [
          "low",
          "medium",
          "high",
          "critical",
          "unknown",
        ],
        default: "unknown",
      },

      description: {
        type: String,
        default: "",
      },

      causes: {
        type: [String],
        default: [],
      },

      treatment: {
        type: [String],
        default: [],
      },

      prevention: {
        type: [String],
        default: [],
      },
    },

    status: {
      type: String,
      enum: [
        "pending",
        "completed",
        "failed",
      ],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Diagnosis",
  diagnosisSchema
);