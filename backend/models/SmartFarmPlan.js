const mongoose = require("mongoose");

const smartFarmPlanSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Human-readable title (auto-generated from top crop + location)
    title: { type: String, default: "", trim: true },

    // Snapshot fields for list display
    topCrop: { type: String, default: "" },
    topScore: { type: Number, default: 0 },
    location: { type: String, default: "" }, // "District, State"
    farmArea: { type: String, default: "" }, // "1 Acre"

    // Full plan payload (stored as-is from the recommendation engine)
    farmDetails: { type: mongoose.Schema.Types.Mixed, required: true },
    recommendations: { type: [mongoose.Schema.Types.Mixed], default: [] },
    weather: { type: mongoose.Schema.Types.Mixed, default: {} },
    market: { type: mongoose.Schema.Types.Mixed, default: {} },
    bestMarket: { type: mongoose.Schema.Types.Mixed, default: null },
    sellingRecommendation: { type: mongoose.Schema.Types.Mixed, default: null },
    aiExplanation: { type: String, default: "" },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

smartFarmPlanSchema.index({ farmer: 1, createdAt: -1 });

module.exports = mongoose.model("SmartFarmPlan", smartFarmPlanSchema);
