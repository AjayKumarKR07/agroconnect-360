const mongoose = require("mongoose");

const complianceDocSchema = new mongoose.Schema(
  {
    exporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: { type: String, required: true, trim: true },

    authority: { type: String, trim: true, default: "" }, // Issuing body

    docType: {
      type: String,
      enum: [
        "Phytosanitary Certificate",
        "Certificate of Origin",
        "APEDA Registration (RCMC)",
        "FSSAI Export License",
        "IEC Code (Import Export Code)",
        "GlobalGAP Certification",
        "Fumigation Certificate",
        "Inspection Certificate",
        "Packing List",
        "Bill of Lading",
        "Commercial Invoice",
        "Other",
      ],
      default: "Other",
    },

    status: {
      type: String,
      enum: ["VERIFIED", "ACTIVE", "RENEWAL DUE", "EXPIRED", "PENDING"],
      default: "ACTIVE",
    },

    // Validity
    validFrom:    { type: Date, default: null },
    validTill:    { type: Date, default: null },
    isLifetime:   { type: Boolean, default: false },

    // Reference number
    refNumber: { type: String, trim: true, default: "" },

    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

complianceDocSchema.index({ exporter: 1, createdAt: -1 });

module.exports = mongoose.model("ComplianceDoc", complianceDocSchema);
