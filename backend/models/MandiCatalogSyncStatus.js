const mongoose = require("mongoose");

const mandiCatalogSyncStatusSchema =
  new mongoose.Schema(
    {
      type: {
        type: String,
        required: true,
        enum: [
          "districts",
          "markets",
          "commodities",
        ],
        index: true,
      },

      state: {
        type: String,
        required: true,
        trim: true,
        index: true,
      },

      district: {
        type: String,
        default: "",
        trim: true,
      },

      market: {
        type: String,
        default: "",
        trim: true,
      },

      synced: {
        type: Boolean,
        default: false,
      },

      recordCount: {
        type: Number,
        default: 0,
      },

      lastSyncedAt: {
        type: Date,
        default: null,
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


// ==========================================
// UNIQUE SYNC SCOPE
// ==========================================

mandiCatalogSyncStatusSchema.index(
  {
    type: 1,
    state: 1,
    district: 1,
    market: 1,
  },
  {
    unique: true,
  }
);


module.exports =
  mongoose.model(
    "MandiCatalogSyncStatus",
    mandiCatalogSyncStatusSchema
  );