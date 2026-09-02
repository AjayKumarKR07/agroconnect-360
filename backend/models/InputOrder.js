/**
 * InputOrder.js
 *
 * MongoDB model for Farmer Buy Inputs orders.
 *
 * This is intentionally separate from the marketplace Order model because:
 *  - Input orders are placed by farmers against a static product catalog
 *    (not live crop listings) and have no stock management or crop IDs.
 *  - The items array contains flat product data (name, brand, price, unit)
 *    rather than Crop ObjectId references.
 *  - The payment flow mirrors the main Order model's Razorpay integration.
 *
 * Security invariants:
 *  - totalAmount is calculated by the backend from items (never trusted from frontend).
 *  - razorpayOrderId / razorpayPaymentId are stored for reconciliation only.
 *  - No card details, CVV, UPI IDs, or secrets are ever stored.
 */

const mongoose = require("mongoose");

const inputItemSchema = new mongoose.Schema(
  {
    name:  { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    qty:   { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    unit:  { type: String, required: true, trim: true },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const inputOrderSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: { type: [inputItemSchema], required: true },

    // Backend-calculated: sum of (item.price * item.qty) + deliveryFee
    totalAmount: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, default: 0 },

    delivery: {
      name:    { type: String, required: true, trim: true },
      phone:   { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      city:    { type: String, required: true, trim: true },
    },

    // Order status
    status: {
      type: String,
      enum: ["confirmed", "processing", "shipped", "delivered", "cancelled"],
      default: "confirmed",
    },

    // Payment tracking
    paymentMethod: {
      type: String,
      enum: ["cod", "razorpay"],
      default: "cod",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    // Razorpay identifiers — stored for reconciliation only
    razorpayOrderId:  { type: String, default: null },
    razorpayPaymentId:{ type: String, default: null },
  },
  { timestamps: true }
);

// Indexes for efficient farmer-scoped queries
inputOrderSchema.index({ farmer: 1, createdAt: -1 });
// Webhook lookup by Razorpay order ID
inputOrderSchema.index({ razorpayOrderId: 1 }, { sparse: true });

module.exports = mongoose.model("InputOrder", inputOrderSchema);
