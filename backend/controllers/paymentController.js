/**
 * paymentController.js
 *
 * Security invariants (all preserved from V1, additions noted):
 *  1. Amount NEVER trusted from frontend — always read from Order.totalAmount in DB.
 *  2. Order ownership verified on every action (buyer === req.user._id).
 *  3. Already-paid orders rejected before creating a new Razorpay order.
 *  4. Signature verification is HMAC-SHA256 with timingSafeEqual.
 *  5. Verification is idempotent — re-verifying a paid order is a 200 no-op.
 *  6. Stock deduction NOT done here — already done atomically in createOrder.
 *  7. RAZORPAY_KEY_SECRET never sent to frontend.
 *  8. Generic 500 messages to prevent info leakage.
 *  9. All MongoDB IDs validated before queries.
 * 10. Webhook verifies raw body HMAC before processing.
 * 11. [NEW] Cancelled / rejected / delivered orders cannot be charged.
 * 12. [NEW] Retry creates a fresh Razorpay order against the EXISTING DB order (no stock deduction).
 * 13. [NEW] Payment success notification is non-blocking and deduplicated via state-change guard.
 */

const crypto       = require("crypto");
const Razorpay     = require("razorpay");
const mongoose     = require("mongoose");
const Order        = require("../models/Order");
const Notification = require("../models/Notification");

// ── Order status values that block any new payment action ────────────────────
const BLOCKED_ORDER_STATUSES = ["cancelled", "rejected", "delivered"];

// ── paymentMethod values that are eligible for Razorpay retry ────────────────
// "upi", "card", "netbanking" existed before Razorpay integration was real;
// only "razorpay" orders have a valid razorpayOrderId and can be retried.
const RETRYABLE_PAYMENT_METHODS = ["razorpay"];

// ── Lazily initialise Razorpay — missing keys blow up at call time, not boot ──
let _rzp = null;
const getRazorpay = () => {
  if (!_rzp) {
    const keyId     = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) throw new Error("Razorpay credentials not configured");
    _rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return _rzp;
};

// ── Constant-time compare to prevent timing attacks ──────────────────────────
const safeEqual = (a, b) => {
  try { return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b)); }
  catch { return false; }
};

// ── Non-blocking payment notification helper ──────────────────────────────────
// Fire-and-forget: payment success must never fail if notification fails.
const notifyPaymentSuccess = async (buyerId, orderId) => {
  try {
    const shortRef = String(orderId).slice(-8).toUpperCase();
    await Notification.create({
      recipient: buyerId,
      type:      "order",
      title:     "Payment Successful 🎉",
      message:   `Your payment for Order #${shortRef} was successful. Your order is now confirmed.`,
      link:      "/user/orders",
      metadata:  { orderId: String(orderId) },
    });
  } catch (err) {
    // Log but never propagate — notification failure must not break the payment flow
    console.error("[notifyPaymentSuccess] Failed to create notification:", err.message);
  }
};

// ============================================================
// CREATE RAZORPAY ORDER (initial checkout)
// POST /api/payment/create-order
// Body: { orderId }
// Auth: required
// ============================================================
const createRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    // 1. Validate ObjectId
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }

    // 2. Load from DB
    const order = await Order.findById(orderId).lean();
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // 3. Ownership check
    if (order.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // 4. Already paid — idempotent rejection
    if (order.paymentStatus === "paid") {
      return res.status(409).json({ success: false, message: "This order has already been paid" });
    }

    // 5. [NEW] Block payment on terminal order statuses
    if (BLOCKED_ORDER_STATUSES.includes(order.status)) {
      return res.status(409).json({
        success: false,
        message: `Cannot initiate payment for a ${order.status} order`,
      });
    }

    // 6. Create Razorpay order — amount always from DB (paise = INR × 100)
    const rzp = getRazorpay();
    const rzpOrder = await rzp.orders.create({
      amount:   Math.round(order.totalAmount * 100),
      currency: "INR",
      receipt:  `order_${orderId}`,
      notes:    { orderId: String(orderId), buyerId: String(order.buyer) },
    });

    // 7. Persist Razorpay order ID for signature verification
    await Order.findByIdAndUpdate(orderId, { razorpayOrderId: rzpOrder.id });

    // 8. Return only public data (secret stays server-side)
    return res.status(200).json({
      success:         true,
      razorpayOrderId: rzpOrder.id,
      amount:          rzpOrder.amount,
      currency:        rzpOrder.currency,
      keyId:           process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("createRazorpayOrder error:", error.message);
    return res.status(500).json({ success: false, message: "Payment initiation failed" });
  }
};

// ============================================================
// RETRY RAZORPAY PAYMENT
// POST /api/payment/retry/:orderId
// Auth: required
// Creates a FRESH Razorpay order against the EXISTING application order.
// Does NOT create a new DB order. Does NOT deduct stock again.
// ============================================================
const retryRazorpayPayment = async (req, res) => {
  try {
    const { orderId } = req.params;

    // 1. Validate ObjectId
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }

    // 2. Load from DB
    const order = await Order.findById(orderId).lean();
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // 3. Ownership check
    if (order.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // 4. Already paid — no retry needed
    if (order.paymentStatus === "paid") {
      return res.status(409).json({ success: false, message: "This order has already been paid" });
    }

    // 5. Block retry on terminal order statuses
    if (BLOCKED_ORDER_STATUSES.includes(order.status)) {
      return res.status(409).json({
        success: false,
        message: `Cannot retry payment for a ${order.status} order`,
      });
    }

    // 6. Only Razorpay-method orders are retryable
    if (!RETRYABLE_PAYMENT_METHODS.includes(order.paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Payment retry is only available for online payment orders",
      });
    }

    // 7. Only allow retry when paymentStatus is pending or failed
    if (!["pending", "failed"].includes(order.paymentStatus)) {
      return res.status(409).json({
        success: false,
        message: "Payment retry is not applicable for this order",
      });
    }

    // 8. Create a fresh Razorpay order (new attempt against same DB order)
    const rzp = getRazorpay();
    const rzpOrder = await rzp.orders.create({
      amount:   Math.round(order.totalAmount * 100), // always from DB
      currency: "INR",
      receipt:  `retry_${orderId}_${Date.now()}`,
      notes:    { orderId: String(orderId), buyerId: String(order.buyer), retry: "true" },
    });

    // 9. Update razorpayOrderId — the new attempt replaces the stale one
    //    Also reset paymentStatus to pending so the new attempt is clean
    await Order.findByIdAndUpdate(orderId, {
      razorpayOrderId: rzpOrder.id,
      paymentStatus:   "pending",
    });

    // 10. Return only public data (no secret)
    return res.status(200).json({
      success:         true,
      razorpayOrderId: rzpOrder.id,
      amount:          rzpOrder.amount,
      currency:        rzpOrder.currency,
      keyId:           process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("retryRazorpayPayment error:", error.message);
    return res.status(500).json({ success: false, message: "Payment retry failed" });
  }
};

// ============================================================
// VERIFY RAZORPAY PAYMENT
// POST /api/payment/verify
// Body: { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }
// Auth: required
// ============================================================
const verifyRazorpayPayment = async (req, res) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    // 1. Validate required fields
    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ success: false, message: "Missing payment verification fields" });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }

    // 2. Load from DB
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // 3. Ownership check
    if (order.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // 4. Idempotency: already paid → success without re-processing or re-notifying
    if (order.paymentStatus === "paid") {
      return res.status(200).json({ success: true, message: "Payment already verified", orderId });
    }

    // 5. Block verification for terminal order statuses
    if (BLOCKED_ORDER_STATUSES.includes(order.status)) {
      return res.status(409).json({
        success: false,
        message: `Cannot verify payment for a ${order.status} order`,
      });
    }

    // 6. Cross-check: razorpayOrderId in DB must match frontend submission
    //    (prevents substituting IDs from a different order)
    if (!order.razorpayOrderId || order.razorpayOrderId !== razorpayOrderId) {
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    // 7. HMAC-SHA256 signature verification (Razorpay specification)
    const expectedSig = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (!safeEqual(expectedSig, razorpaySignature)) {
      // Signature mismatch — mark as failed but do not change paid→failed
      if (order.paymentStatus !== "paid") {
        await Order.findByIdAndUpdate(orderId, { paymentStatus: "failed" });
      }
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    // 8. Atomic update: pending/failed → paid
    await Order.findByIdAndUpdate(orderId, {
      paymentStatus:    "paid",
      razorpayPaymentId,
      paymentMethod:    "razorpay",
    });

    // 9. Non-blocking notification (payment state changed here, so no duplicate risk)
    notifyPaymentSuccess(order.buyer, orderId).catch(() => {});

    return res.status(200).json({ success: true, message: "Payment verified successfully", orderId });
  } catch (error) {
    console.error("verifyRazorpayPayment error:", error.message);
    return res.status(500).json({ success: false, message: "Payment verification failed" });
  }
};

// ============================================================
// WEBHOOK HANDLER
// POST /api/payment/webhook
// No auth — verified by raw body HMAC signature
// ============================================================
const razorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.warn("[Webhook] RAZORPAY_WEBHOOK_SECRET not set — skipping verification (dev mode)");
      return res.status(200).json({ received: true });
    }

    const signature = req.headers["x-razorpay-signature"];
    if (!signature) return res.status(400).json({ success: false, message: "Missing webhook signature" });

    const rawBody = req.body;
    if (!Buffer.isBuffer(rawBody)) return res.status(400).json({ success: false, message: "Invalid webhook body" });

    const expectedSig = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (!safeEqual(expectedSig, signature)) {
      return res.status(400).json({ success: false, message: "Invalid webhook signature" });
    }

    let payload;
    try { payload = JSON.parse(rawBody.toString()); }
    catch { return res.status(400).json({ success: false, message: "Invalid JSON" }); }

    const event = payload.event;

    // ── payment.captured ──────────────────────────────────────────────────────
    if (event === "payment.captured") {
      const payment      = payload.payload?.payment?.entity;
      const rzpOrderId   = payment?.order_id;
      const rzpPaymentId = payment?.id;

      if (rzpOrderId && rzpPaymentId) {
        const order = await Order.findOne({ razorpayOrderId: rzpOrderId });
        if (order) {
          // Guard 1: already paid — idempotent, no re-notification
          if (order.paymentStatus === "paid") {
            console.log(`[Webhook] payment.captured duplicate — Order ${order._id} already paid`);
          }
          // Guard 2: cancelled/rejected/delivered — do not process
          else if (BLOCKED_ORDER_STATUSES.includes(order.status)) {
            console.warn(`[Webhook] payment.captured blocked — Order ${order._id} has status ${order.status}`);
          }
          else {
            await Order.findByIdAndUpdate(order._id, {
              paymentStatus:    "paid",
              razorpayPaymentId: rzpPaymentId,
              paymentMethod:    "razorpay",
            });
            // Non-blocking notification (webhook path — notify once here)
            notifyPaymentSuccess(order.buyer, order._id).catch(() => {});
            console.log(`[Webhook] payment.captured — Order ${order._id} marked paid`);
          }
        }
      }
    }

    // ── payment.failed ────────────────────────────────────────────────────────
    if (event === "payment.failed") {
      const payment    = payload.payload?.payment?.entity;
      const rzpOrderId = payment?.order_id;

      if (rzpOrderId) {
        const order = await Order.findOne({ razorpayOrderId: rzpOrderId });
        if (order) {
          // Never overwrite a paid order with failed
          if (order.paymentStatus === "paid") {
            console.log(`[Webhook] payment.failed ignored — Order ${order._id} already paid`);
          } else if (order.paymentStatus === "pending") {
            await Order.findByIdAndUpdate(order._id, { paymentStatus: "failed" });
            console.log(`[Webhook] payment.failed — Order ${order._id} marked failed`);
          }
          // If already "failed" — idempotent, no action
        }
      }
    }

    // Acknowledge — Razorpay retries if we don't respond 200
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("razorpayWebhook error:", error.message);
    // Return 200 to prevent Razorpay retry storm on our internal errors
    return res.status(200).json({ received: true });
  }
};

module.exports = {
  createRazorpayOrder,
  retryRazorpayPayment,
  verifyRazorpayPayment,
  razorpayWebhook,
};
