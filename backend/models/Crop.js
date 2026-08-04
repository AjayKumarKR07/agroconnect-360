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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Crop", cropSchema);