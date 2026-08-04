const mongoose = require("mongoose");

const mandiCatalogSchema =
  new mongoose.Schema(
    {
      state: {
        type: String,
        required: true,
        trim: true,
        index: true,
      },

      district: {
        type: String,
        required: true,
        trim: true,
        index: true,
      },

      market: {
        type: String,
        required: true,
        trim: true,
        index: true,
      },

      commodity: {
        type: String,
        required: true,
        trim: true,
        index: true,
      },

      source: {
        type: String,
        default: "data.gov.in",
      },

      lastSeenAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      timestamps: true,
    }
  );


// Prevent duplicate catalog combinations
mandiCatalogSchema.index(
  {
    state: 1,
    district: 1,
    market: 1,
    commodity: 1,
  },
  {
    unique: true,
  }
);


// Improve dropdown queries
mandiCatalogSchema.index({
  state: 1,
  district: 1,
});

mandiCatalogSchema.index({
  state: 1,
  district: 1,
  market: 1,
});


module.exports =
  mongoose.model(
    "MandiCatalog",
    mandiCatalogSchema
  );