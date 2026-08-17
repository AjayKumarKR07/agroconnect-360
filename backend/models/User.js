const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    name: {
      type: String,
      trim: true,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    location: {
      type: String,
      trim: true,
      default: "",
    },

    district: {
      type: String,
      trim: true,
      default: "",
    },

    state: {
      type: String,
      trim: true,
      default: "",
    },

    role: {
      type: String,
      enum: [
        "farmer",
        "user",
        "seller",
        "exporter",
        "admin",
      ],
      default: null,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    profileCompleted: {
      type: Boolean,
      default: false,
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // ── Farm-specific fields (Farmer Portal) ──────────────
    farmName: { type: String, trim: true, default: "" },
    farmArea: { type: Number, default: null },
    areaUnit: { type: String, enum: ["Acre", "Hectare"], default: "Acre" },
    soilType: {
      type: String,
      enum: ["Loamy", "Clay", "Sandy", "Black Soil", "Red Soil", "Other", ""],
      default: "",
    },
    irrigation: {
      type: String,
      enum: ["Available", "Limited", "Rainfed", ""],
      default: "",
    },
    waterSource: {
      type: String,
      enum: ["Borewell", "Canal", "Rainwater", "Other", ""],
      default: "",
    },
    season: {
      type: String,
      enum: ["Current Season", "Kharif", "Rabi", "Zaid", ""],
      default: "",
    },
    previousCrop: { type: String, trim: true, default: "" },
    farmingExperience: { type: Number, default: null }, // years
  },
  {
    timestamps: true,
  }
);

// Indexes for admin query patterns
// getAdminUsers: filters by role, isActive; sorts by createdAt
userSchema.index({ role: 1, isActive: 1, createdAt: -1 });
// Text-search fallback for name/email fields (admin search bar)
userSchema.index({ name: 1 });

module.exports = mongoose.model("User", userSchema);