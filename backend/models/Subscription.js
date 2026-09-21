/**
 * Subscription.js
 *
 * Mongoose model for AgroConnect 360 farm-box subscriptions.
 *
 * Security notes:
 *  - razorpaySubscriptionId is set by the backend after Razorpay API call.
 *  - status is ONLY updated by backend after verified Razorpay responses.
 *  - No card/UPI credential is ever stored.
 *  - Indexes ensure fast per-user queries and idempotent webhook lookups.
 */

const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    // ── Owning user (buyer) ──────────────────────────────────────────────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ── Application-level plan identifier (matches SUBSCRIPTION_PLANS config) ─
    planId: {
      type: String,
      required: true,
      enum: ["sub-1", "sub-2", "sub-3"],
    },

    planName: {
      type: String,
      required: true,
      trim: true,
    },

    frequency: {
      type: String,
      required: true,
      enum: ["Weekly", "Bi-Weekly", "Monthly"],
    },

    // Amount in INR (not paise) — display use only; actual charge is in Razorpay
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },

    // ── Razorpay identifiers ─────────────────────────────────────────────────
    // Razorpay Plan ID (used when Subscriptions API is available)
    razorpayPlanId: {
      type: String,
      default: null,
    },

    // Razorpay Subscription ID (used when Subscriptions API is available)
    razorpaySubscriptionId: {
      type: String,
      default: null,
    },

    // Razorpay Order ID — used in Orders-API-based subscription flow (fallback)
    razorpayOrderId: {
      type: String,
      default: null,
    },

    // Razorpay Payment ID — stored after successful verification
    razorpayPaymentId: {
      type: String,
      default: null,
    },

    // ── Status mirrors Razorpay subscription lifecycle ───────────────────────
    // created       → subscription record exists, Razorpay sub created
    // authenticated → user authorised the mandate (first charge collected)
    // active        → subscription is running
    // pending       → payment pending (halted billing)
    // halted        → Razorpay halted (too many payment failures)
    // cancelled     → user or admin cancelled
    // completed     → billing period ended naturally
    // failed        → payment/creation failure
    status: {
      type: String,
      enum: [
        "created",
        "authenticated",
        "active",
        "pending",
        "halted",
        "cancelled",
        "completed",
        "failed",
      ],
      default: "created",
    },

    // ── Delivery metadata (for display in UI) ────────────────────────────────
    items: {
      type: [String],
      default: [],
    },

    farmer: {
      type: String,
      default: "",
    },

    currentPeriodStart: {
      type: Date,
      default: null,
    },

    currentPeriodEnd: {
      type: Date,
      default: null,
    },

    nextDelivery: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Fast lookup by Razorpay subscription ID (webhook path)
subscriptionSchema.index({ razorpaySubscriptionId: 1 }, { sparse: true });
// Per-user active subscription queries
subscriptionSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model("Subscription", subscriptionSchema);
