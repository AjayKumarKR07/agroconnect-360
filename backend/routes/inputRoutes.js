/**
 * inputRoutes.js
 *
 * Farmer Buy Inputs — order placement, payment, and history.
 *
 * Security invariants (mirrors paymentController.js for the main Order model):
 *  1. totalAmount calculated from items on the backend — never trusted from frontend.
 *  2. farmer ownership enforced on every payment action.
 *  3. Already-paid orders cannot be re-charged.
 *  4. Cancelled/delivered orders cannot be paid.
 *  5. Razorpay signature verified with HMAC-SHA256 + timingSafeEqual.
 *  6. RAZORPAY_KEY_SECRET never sent to frontend.
 *  7. Webhook verifies raw body HMAC before processing.
 *  8. All Mongoose IDs validated before queries.
 *  9. Duplicate payment processing blocked by idempotency checks.
 * 10. Generic error messages to prevent information leakage.
 */

const express    = require("express");
const crypto     = require("crypto");
const mongoose   = require("mongoose");
const Razorpay   = require("razorpay");
const { protect } = require("../middleware/authMiddleware");
const InputOrder = require("../models/InputOrder");
const Notification = require("../models/Notification");

const router = express.Router();

// ── Constants ────────────────────────────────────────────────────────────────
const DELIVERY_THRESHOLD = 2000; // orders >= ₹2000 get free delivery
const DELIVERY_FEE       = 150;
const BLOCKED_STATUSES   = ["cancelled", "delivered"];

// ── Lazy Razorpay initialisation ─────────────────────────────────────────────
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

// ── Timing-safe compare ───────────────────────────────────────────────────────
const safeEqual = (a, b) => {
  try { return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b)); }
  catch { return false; }
};

// ── Non-blocking payment notification ────────────────────────────────────────
const notifyInputPaymentSuccess = async (farmerId, orderId) => {
  try {
    const shortRef = String(orderId).slice(-8).toUpperCase();
    await Notification.create({
      recipient: farmerId,
      type:      "order",
      title:     "Payment Successful 🎉",
      message:   `Your payment for Input Order #${shortRef} was successful.`,
      link:      "/farmer/inputs",
      metadata:  { inputOrderId: String(orderId) },
    });
  } catch (err) {
    console.error("[notifyInputPaymentSuccess] Failed:", err.message);
  }
};

// ============================================================
// POST /api/inputs/order — Place a new input order
// Auth: required (farmer)
// Body: { items, delivery: { name, phone, address, city }, paymentMethod }
// ============================================================
router.post("/order", protect, async (req, res) => {
  try {
    const { items, delivery, paymentMethod } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Items are required" });
    }
    if (!delivery || !delivery.name || !delivery.phone || !delivery.address || !delivery.city) {
      return res.status(400).json({ success: false, message: "Complete delivery details are required" });
    }

    const method = ["cod", "razorpay"].includes(paymentMethod) ? paymentMethod : "cod";

    // Validate each item and calculate total from backend — never trust frontend totalAmount
    const validatedItems = [];
    let subtotalSum = 0;
    for (const item of items) {
      const price = Number(item.price);
      const qty   = Math.max(1, Math.round(Number(item.qty)));
      if (!item.name || !item.brand || !item.unit || isNaN(price) || price <= 0) {
        return res.status(400).json({ success: false, message: "Invalid item data" });
      }
      const subtotal = Math.round(price * qty * 100) / 100;
      subtotalSum += subtotal;
      validatedItems.push({
        name:     String(item.name).trim(),
        brand:    String(item.brand).trim(),
        unit:     String(item.unit).trim(),
        qty,
        price,
        subtotal,
      });
    }

    const deliveryFee   = subtotalSum >= DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
    const totalAmount   = Math.round((subtotalSum + deliveryFee) * 100) / 100;

    const order = await InputOrder.create({
      farmer:       req.user._id,
      items:        validatedItems,
      totalAmount,
      deliveryFee,
      delivery: {
        name:    delivery.name.trim(),
        phone:   delivery.phone.trim(),
        address: delivery.address.trim(),
        city:    delivery.city.trim(),
      },
      paymentMethod: method,
      // COD is immediately confirmed; Razorpay stays pending until verified
      paymentStatus: method === "cod" ? "paid" : "pending",
    });

    console.log(`[InputOrder] ${order._id} placed by ${req.user.email} — ₹${totalAmount} (${method})`);

    return res.status(201).json({
      success:  true,
      message:  "Order placed successfully",
      orderId:  order._id,
      totalAmount,
    });
  } catch (error) {
    console.error("Input order error:", error);
    return res.status(500).json({ success: false, message: "Unable to place order" });
  }
});

// ============================================================
// POST /api/inputs/payment/create-order — Create Razorpay order
// Auth: required
// Body: { orderId }
// ============================================================
router.post("/payment/create-order", protect, async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }

    const order = await InputOrder.findById(orderId).lean();
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (order.paymentStatus === "paid") {
      return res.status(409).json({ success: false, message: "This order has already been paid" });
    }

    if (BLOCKED_STATUSES.includes(order.status)) {
      return res.status(409).json({ success: false, message: `Cannot initiate payment for a ${order.status} order` });
    }

    // Amount always from DB (paise = INR × 100)
    const rzp = getRazorpay();
    const rzpOrder = await rzp.orders.create({
      amount:   Math.round(order.totalAmount * 100),
      currency: "INR",
      receipt:  `inp_${orderId}`,
      notes:    { inputOrderId: String(orderId), farmerId: String(order.farmer) },
    });

    await InputOrder.findByIdAndUpdate(orderId, { razorpayOrderId: rzpOrder.id });

    return res.status(200).json({
      success:         true,
      razorpayOrderId: rzpOrder.id,
      amount:          rzpOrder.amount,
      currency:        rzpOrder.currency,
      keyId:           process.env.RAZORPAY_KEY_ID,  // public key only
    });
  } catch (error) {
    console.error("InputOrder createRazorpayOrder error:", error.message);
    return res.status(500).json({ success: false, message: "Payment initiation failed" });
  }
});

// ============================================================
// POST /api/inputs/payment/verify — Verify Razorpay payment
// Auth: required
// Body: { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }
// ============================================================
router.post("/payment/verify", protect, async (req, res) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ success: false, message: "Missing payment verification fields" });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }

    const order = await InputOrder.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Idempotency: already paid — no re-processing, no re-notification
    if (order.paymentStatus === "paid") {
      return res.status(200).json({ success: true, message: "Payment already verified", orderId });
    }

    if (BLOCKED_STATUSES.includes(order.status)) {
      return res.status(409).json({ success: false, message: `Cannot verify payment for a ${order.status} order` });
    }

    // Cross-check Razorpay order ID (prevents ID substitution)
    if (!order.razorpayOrderId || order.razorpayOrderId !== razorpayOrderId) {
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    // HMAC-SHA256 signature verification
    const expectedSig = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (!safeEqual(expectedSig, razorpaySignature)) {
      if (order.paymentStatus !== "paid") {
        await InputOrder.findByIdAndUpdate(orderId, { paymentStatus: "failed" });
      }
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    // Atomic: mark paid
    await InputOrder.findByIdAndUpdate(orderId, {
      paymentStatus:     "paid",
      razorpayPaymentId,
    });

    // Non-blocking notification
    notifyInputPaymentSuccess(order.farmer, orderId).catch(() => {});

    return res.status(200).json({ success: true, message: "Payment verified successfully", orderId });
  } catch (error) {
    console.error("InputOrder verifyRazorpayPayment error:", error.message);
    return res.status(500).json({ success: false, message: "Payment verification failed" });
  }
});

// ============================================================
// POST /api/inputs/payment/webhook — Razorpay webhook (raw body)
// No auth — verified by HMAC signature
// ============================================================
router.post(
  "/payment/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      if (!webhookSecret) {
        console.warn("[InputWebhook] RAZORPAY_WEBHOOK_SECRET not set — skipping (dev mode)");
        return res.status(200).json({ received: true });
      }

      const signature = req.headers["x-razorpay-signature"];
      if (!signature) return res.status(400).json({ message: "Missing signature" });

      const rawBody = req.body;
      if (!Buffer.isBuffer(rawBody)) return res.status(400).json({ message: "Invalid body" });

      const expectedSig = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      if (!safeEqual(expectedSig, signature)) {
        return res.status(400).json({ message: "Invalid signature" });
      }

      let payload;
      try { payload = JSON.parse(rawBody.toString()); }
      catch { return res.status(400).json({ message: "Invalid JSON" }); }

      const event = payload.event;

      if (event === "payment.captured") {
        const payment    = payload.payload?.payment?.entity;
        const rzpOrderId = payment?.order_id;
        const rzpPayId   = payment?.id;
        if (rzpOrderId && rzpPayId) {
          const order = await InputOrder.findOne({ razorpayOrderId: rzpOrderId });
          if (order) {
            if (order.paymentStatus === "paid") {
              // Idempotent — already paid, no action
            } else if (BLOCKED_STATUSES.includes(order.status)) {
              console.warn(`[InputWebhook] payment.captured blocked — order ${order._id} has status ${order.status}`);
            } else {
              await InputOrder.findByIdAndUpdate(order._id, {
                paymentStatus:     "paid",
                razorpayPaymentId: rzpPayId,
              });
              notifyInputPaymentSuccess(order.farmer, order._id).catch(() => {});
              console.log(`[InputWebhook] payment.captured — InputOrder ${order._id} marked paid`);
            }
          }
        }
      }

      if (event === "payment.failed") {
        const payment    = payload.payload?.payment?.entity;
        const rzpOrderId = payment?.order_id;
        if (rzpOrderId) {
          const order = await InputOrder.findOne({ razorpayOrderId: rzpOrderId });
          if (order && order.paymentStatus === "pending") {
            await InputOrder.findByIdAndUpdate(order._id, { paymentStatus: "failed" });
            console.log(`[InputWebhook] payment.failed — InputOrder ${order._id} marked failed`);
          }
        }
      }

      return res.status(200).json({ received: true });
    } catch (error) {
      console.error("InputOrder webhook error:", error.message);
      return res.status(200).json({ received: true });
    }
  }
);

// ============================================================
// GET /api/inputs/orders — Get current farmer's input orders
// Auth: required
// ============================================================
router.get("/orders", protect, async (req, res) => {
  try {
    const orders = await InputOrder.find({ farmer: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error("Input orders fetch error:", error);
    return res.status(500).json({ success: false, message: "Unable to load orders" });
  }
});

module.exports = router;
