const express  = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  createRazorpayOrder,
  retryRazorpayPayment,
  verifyRazorpayPayment,
  razorpayWebhook,
} = require("../controllers/paymentController");

const router = express.Router();

// Webhook: raw body required — uses express.raw() at route level
// No protect middleware — Razorpay server calls this directly
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  razorpayWebhook
);

// All other payment routes require authentication
router.post("/create-order",     protect, createRazorpayOrder);
router.post("/verify",           protect, verifyRazorpayPayment);
router.post("/retry/:orderId",   protect, retryRazorpayPayment);

module.exports = router;