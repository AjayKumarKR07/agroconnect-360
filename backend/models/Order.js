const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    crop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crop",
      required: true,
    },

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

    quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    unit: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

const orderSchema = new mongoose.Schema(
  {
    // Consumer / buyer
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    deliveryAddress: {
      name: {
        type: String,
        required: true,
      },

      phone: {
        type: String,
        required: true,
      },

      address: {
        type: String,
        required: true,
      },

      city: {
        type: String,
        required: true,
      },

      state: {
        type: String,
        required: true,
      },

      pincode: {
        type: String,
        required: true,
      },
    },

    status: {
      type: String,

      enum: [
        "pending",
        "accepted",
        "rejected",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],

      default: "pending",
    },

    paymentStatus: {
      type: String,

      enum: [
        "pending",
        "paid",
        "failed",
        "refunded",
      ],

      default: "pending",
    },

    paymentMethod: {
      type: String,

      enum: [
        "cod",
        "upi",
        "card",
        "netbanking",
        "razorpay",
      ],

      default: "cod",
    },

    // Razorpay identifiers — only stored for reconciliation, no card/UPI details ever stored
    razorpayOrderId: {
      type: String,
      default: null,
    },

    razorpayPaymentId: {
      type: String,
      default: null,
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for admin and buyer query patterns
// getAdminOrders: filters by status, sorts by createdAt
orderSchema.index({ status: 1, createdAt: -1 });
// buyer-scoped order queries (Buyer portal)
orderSchema.index({ buyer: 1, createdAt: -1 });
// webhook lookup by Razorpay order ID (sparse: only indexes docs where field exists)
orderSchema.index({ razorpayOrderId: 1 }, { sparse: true });

module.exports = mongoose.model(
  "Order",
  orderSchema
);