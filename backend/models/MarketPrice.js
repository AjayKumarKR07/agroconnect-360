const mongoose = require("mongoose");

const marketPriceSchema = new mongoose.Schema(
  {
    state: {
      type: String,
      required: true,
      trim: true,
    },

    district: {
      type: String,
      required: true,
      trim: true,
    },

    market: {
      type: String,
      required: true,
      trim: true,
    },

    commodity: {
      type: String,
      required: true,
      trim: true,
    },

    variety: {
      type: String,
      default: "",
    },

    grade: {
      type: String,
      default: "",
    },

    arrivalDate: {
      type: Date,
      required: true,
    },

    minPrice: {
      type: Number,
      required: true,
    },

    maxPrice: {
      type: Number,
      required: true,
    },

    modalPrice: {
      type: Number,
      required: true,
    },

    unit: {
      type: String,
      default: "quintal",
    },

    source: {
      type: String,
      default: "data.gov.in",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate historical records
marketPriceSchema.index(
  {
    state: 1,
    district: 1,
    market: 1,
    commodity: 1,
    variety: 1,
    arrivalDate: 1,
  },
  {
    unique: true,
  }
);

marketPriceSchema.index({
  commodity: 1,
  market: 1,
  arrivalDate: 1,
});

module.exports = mongoose.model(
  "MarketPrice",
  marketPriceSchema
);