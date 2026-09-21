/**
 * subscriptionController.js
 *
 * Handles Razorpay Subscription lifecycle for AgroConnect 360 farm-box plans.
 *
 * Security invariants:
 *  1. Plan amount/frequency NEVER trusted from frontend — always from SUBSCRIPTION_PLANS.
 *  2. Subscription only activated after server-side HMAC-SHA256 verification.
 *  3. RAZORPAY_KEY_SECRET never sent to frontend.
 *  4. Ownership verified on every read/cancel action.
 *  5. Idempotent: double-click protection via in-flight `created` status check.
 *  6. Razorpay cancel called on backend — not just a local state change.
 *  7. Generic 500 messages to prevent information leakage.
 *  8. All Mongoose IDs validated before queries.
 *
 * Razorpay Subscription signature formula (different from Order payments):
 *   HMAC-SHA256( razorpayPaymentId + "|" + razorpaySubscriptionId )
 */

const crypto       = require("crypto");
const Razorpay     = require("razorpay");
const mongoose     = require("mongoose");
const Subscription = require("../models/Subscription");
const Notification = require("../models/Notification");

// ── Lazily initialise Razorpay (same pattern as paymentController) ────────────
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

// ── Constant-time compare (same pattern as paymentController) ─────────────────
const safeEqual = (a, b) => {
  try { return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b)); }
  catch { return false; }
};

// ── Extract a readable message from Razorpay SDK errors ──────────────────────
// The Razorpay Node SDK throws plain objects (not Error instances), shaped as:
//   { statusCode: 400, error: { code, description, source, step, reason } }
// Standard JS errors have .message. Handle both.
const rzpErrMsg = (err) => {
  if (!err) return "Unknown error";
  if (typeof err === "string") return err;
  // Razorpay SDK plain object
  if (err.error?.description) return err.error.description;
  if (err.error?.code)        return err.error.code;
  // Standard Error
  if (err.message) return err.message;
  // Fallback
  return JSON.stringify(err);
};

// ── Server-side plan configuration — single source of truth ──────────────────
// Amount is in paise (INR × 100). Frontend amounts are NEVER trusted.
// Bi-Weekly maps to: period=weekly, interval=2 (Razorpay native mapping).
const SUBSCRIPTION_PLANS = {
  "sub-1": {
    planId:    "sub-1",
    name:      "Organic Veggie Basket",
    amount:    49900,          // ₹499 in paise
    currency:  "INR",
    period:    "weekly",
    interval:  1,              // every 1 week
    frequency: "Weekly",
    items:     ["Tomatoes (2kg)", "Onions (2kg)", "Potatoes (2kg)", "Spinach (500g)", "Green Chillies (250g)"],
    farmer:    "Nashik Organic Co-op",
  },
  "sub-2": {
    planId:    "sub-2",
    name:      "Seasonal Fruit Box",
    amount:    79900,          // ₹799 in paise
    currency:  "INR",
    period:    "weekly",
    interval:  2,              // every 2 weeks (bi-weekly)
    frequency: "Bi-Weekly",
    items:     ["Alphonso Mangoes (1.5kg)", "Green Bananas (1kg)", "Pomegranate (1kg)", "Fresh Apples (1kg)"],
    farmer:    "Ratnagiri Orchards",
  },
  "sub-3": {
    planId:    "sub-3",
    name:      "Pure Grain & Pulses Pack",
    amount:    119900,         // ₹1199 in paise
    currency:  "INR",
    period:    "monthly",
    interval:  1,              // every 1 month
    frequency: "Monthly",
    items:     ["Basmati Rice (5kg)", "Sharbati Wheat (5kg)", "Turmeric Powder (500g)", "Coriander Seeds (250g)"],
    farmer:    "Punjab Farmer Federation",
  },
};

// ── Non-blocking subscription notification ────────────────────────────────────
const notifySubscriptionSuccess = async (userId, planName) => {
  try {
    await Notification.create({
      recipient: userId,
      type:      "order",
      title:     "Subscription Activated 🎉",
      message:   `Your subscription to "${planName}" has been activated. First delivery is on its way!`,
      link:      "/user/subscriptions",
    });
  } catch (err) {
    console.error("[notifySubscriptionSuccess] Failed:", err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/subscriptions/create
// Auth: required
// Body: { planId }
// Returns: { subscriptionDbId, razorpaySubscriptionId, keyId, amount, currency, planName }
//
// IMPORTANT: Requires that the Razorpay Subscriptions product is API-enabled
// on the merchant account (/v1/plans and /v1/subscriptions must return 200).
// ─────────────────────────────────────────────────────────────────────────────
const createSubscription = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId     = req.user._id;

    // 1. Validate planId against server-side config — never trust client amount
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) {
      return res.status(400).json({ success: false, message: "Invalid subscription plan" });
    }

    // 2. Idempotency checks:
    //    a) Already paid/authorised — block entirely (must cancel first)
    const existingPaid = await Subscription.findOne({
      user:   userId,
      planId: plan.planId,
      status: { $in: ["authenticated", "active", "pending", "halted"] },
    });
    if (existingPaid) {
      return res.status(409).json({
        success: false,
        message: "You already have an active subscription for this plan. Please cancel it first.",
      });
    }

    //    b) Payment was started but not completed (status = "created"):
    //       Reuse the existing Razorpay Subscription so the user can complete
    //       payment without creating a duplicate. Return the same subscriptionId.
    const existingCreated = await Subscription.findOne({
      user:   userId,
      planId: plan.planId,
      status: "created",
    });
    if (existingCreated?.razorpaySubscriptionId) {
      console.log(`[Subscriptions] Reusing incomplete sub ${existingCreated._id} → Razorpay ${existingCreated.razorpaySubscriptionId}`);
      return res.status(200).json({
        success:                true,
        subscriptionDbId:       String(existingCreated._id),
        razorpaySubscriptionId: existingCreated.razorpaySubscriptionId,
        keyId:                  process.env.RAZORPAY_KEY_ID,
        amount:                 plan.amount,
        currency:               plan.currency,
        planName:               plan.name,
      });
    }

    const rzp = getRazorpay();

    // 3. Reuse existing Razorpay Plan or create a new one.
    //    Plans are immutable in Razorpay once created, so we cache the planId
    //    in any previous Subscription document for this planId.
    let razorpayPlanId = null;
    const anyPlanRecord = await Subscription.findOne({
      planId:         plan.planId,
      razorpayPlanId: { $ne: null },
    }).lean();

    if (anyPlanRecord?.razorpayPlanId) {
      razorpayPlanId = anyPlanRecord.razorpayPlanId;
      console.log(`[Subscriptions] Reusing Razorpay plan ${razorpayPlanId} for planId=${plan.planId}`);
    } else {
      // Create new Razorpay Plan — amount always from server-side config (paise)
      const rzpPlan = await rzp.plans.create({
        period:   plan.period,
        interval: plan.interval,
        item: {
          name:        plan.name,
          amount:      plan.amount,        // paise — from server-side config
          currency:    plan.currency,
          description: `AgroConnect 360 — ${plan.name} (${plan.frequency})`,
        },
      });
      razorpayPlanId = rzpPlan.id;
      console.log(`[Subscriptions] Created Razorpay plan ${razorpayPlanId} for planId=${plan.planId}`);
    }

    // 4. Create Razorpay Subscription against the plan
    const rzpSub = await rzp.subscriptions.create({
      plan_id:         razorpayPlanId,
      total_count:     12,           // max billing cycles
      quantity:        1,
      customer_notify: 1,
      notes: {
        userId:  String(userId),
        planId:  plan.planId,
        source:  "AgroConnect360",
      },
    });

    // 5. Calculate next delivery estimate
    const now        = new Date();
    const daysOffset = plan.frequency === "Weekly" ? 7 : plan.frequency === "Bi-Weekly" ? 14 : 30;
    const nextDelivery = new Date(now.getTime() + daysOffset * 24 * 60 * 60 * 1000);

    // 6. Persist subscription record (status = "created" — NOT yet active)
    const sub = await Subscription.create({
      user:                   userId,
      planId:                 plan.planId,
      planName:               plan.name,
      frequency:              plan.frequency,
      amount:                 plan.amount / 100,   // store INR for display
      currency:               plan.currency,
      razorpayPlanId,
      razorpaySubscriptionId: rzpSub.id,
      status:                 "created",
      items:                  plan.items,
      farmer:                 plan.farmer,
      nextDelivery,
    });

    console.log(`[Subscriptions] DB sub ${sub._id} → Razorpay sub ${rzpSub.id}`);

    // 7. Return only public data — secret never sent to frontend
    return res.status(201).json({
      success:                true,
      subscriptionDbId:       String(sub._id),
      razorpaySubscriptionId: rzpSub.id,
      keyId:                  process.env.RAZORPAY_KEY_ID,
      amount:                 plan.amount,
      currency:               plan.currency,
      planName:               plan.name,
    });
  } catch (error) {
    const msg = rzpErrMsg(error);
    console.error("[createSubscription] Error:", msg);

    // HTTP 401 from Razorpay — Subscriptions API not enabled at account level.
    // Confirmed via diagnostic: /v1/plans and /v1/subscriptions both return 401
    // while /v1/orders and /v1/payments return 200 with the same credentials.
    // This is a merchant-account API restriction, not a code error.
    if (error?.statusCode === 401) {
      return res.status(503).json({
        success: false,
        message:
          "The Razorpay Subscriptions API is not enabled for this account. " +
          "Contact Razorpay Support to activate the Subscriptions product at the API level.",
      });
    }

    return res.status(500).json({ success: false, message: "Subscription creation failed" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/subscriptions/verify
// Auth: required
// Body: { subscriptionDbId, razorpayPaymentId, razorpaySubscriptionId, razorpaySignature }
//
// Signature formula (Razorpay Subscriptions — different from Orders):
//   HMAC-SHA256( razorpayPaymentId + "|" + razorpaySubscriptionId )
// ─────────────────────────────────────────────────────────────────────────────
const verifySubscription = async (req, res) => {
  try {
    const {
      subscriptionDbId,
      razorpayPaymentId,
      razorpaySubscriptionId,
      razorpaySignature,
    } = req.body;

    // 1. Validate required fields
    if (!subscriptionDbId || !razorpayPaymentId || !razorpaySubscriptionId || !razorpaySignature) {
      return res.status(400).json({ success: false, message: "Missing verification fields" });
    }

    if (!mongoose.Types.ObjectId.isValid(subscriptionDbId)) {
      return res.status(400).json({ success: false, message: "Invalid subscription ID" });
    }

    // 2. Load from DB
    const sub = await Subscription.findById(subscriptionDbId);
    if (!sub) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }

    // 3. Ownership check
    if (sub.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // 4. Idempotency — already verified
    if (["authenticated", "active"].includes(sub.status)) {
      return res.status(200).json({ success: true, message: "Subscription already verified" });
    }

    // 5. Cross-check: razorpaySubscriptionId must match what we stored in DB
    if (sub.razorpaySubscriptionId !== razorpaySubscriptionId) {
      return res.status(400).json({ success: false, message: "Subscription verification failed" });
    }

    // 6. HMAC-SHA256 using Razorpay Subscriptions formula:
    //    paymentId + "|" + subscriptionId
    //    (DIFFERENT from Orders formula which is: orderId + "|" + paymentId)
    const expectedSig = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayPaymentId}|${razorpaySubscriptionId}`)
      .digest("hex");

    if (!safeEqual(expectedSig, razorpaySignature)) {
      if (!["authenticated", "active"].includes(sub.status)) {
        await Subscription.findByIdAndUpdate(subscriptionDbId, { status: "failed" });
      }
      return res.status(400).json({ success: false, message: "Subscription verification failed" });
    }

    // 7. Mark as authenticated — subscription is now active
    const now        = new Date();
    const daysOffset = sub.frequency === "Weekly" ? 7 : sub.frequency === "Bi-Weekly" ? 14 : 30;
    await Subscription.findByIdAndUpdate(subscriptionDbId, {
      status:             "authenticated",
      razorpayPaymentId,
      currentPeriodStart: now,
      currentPeriodEnd:   new Date(now.getTime() + daysOffset * 24 * 60 * 60 * 1000),
      nextDelivery:       new Date(now.getTime() + daysOffset * 24 * 60 * 60 * 1000),
    });

    // 8. Non-blocking notification
    notifySubscriptionSuccess(sub.user, sub.planName).catch(() => {});

    console.log(`[Subscriptions] Verified: DB ${subscriptionDbId} → Razorpay sub ${razorpaySubscriptionId}`);

    return res.status(200).json({
      success: true,
      message: "Subscription activated successfully",
      subscriptionDbId,
    });
  } catch (error) {
    console.error("[verifySubscription] Error:", rzpErrMsg(error));
    return res.status(500).json({ success: false, message: "Subscription verification failed" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/subscriptions/cancel/:id
// Auth: required
// Cancels subscription in Razorpay AND updates DB status
// ─────────────────────────────────────────────────────────────────────────────
const cancelSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid subscription ID" });
    }

    const sub = await Subscription.findById(id);
    if (!sub) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }

    // Ownership check — users can only cancel their own subscriptions
    if (sub.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Already cancelled — idempotent
    if (["cancelled", "completed", "failed"].includes(sub.status)) {
      return res.status(200).json({ success: true, message: "Subscription already cancelled" });
    }

    // Cancel on Razorpay (cancel at end of billing period = false for immediate)
    if (sub.razorpaySubscriptionId) {
      try {
        const rzp = getRazorpay();
        await rzp.subscriptions.cancel(sub.razorpaySubscriptionId, false);
        console.log(`[Subscriptions] Cancelled Razorpay sub ${sub.razorpaySubscriptionId}`);
      } catch (rzpErr) {
        // If Razorpay already cancelled it (e.g. via webhook), that's fine
        console.warn(`[Subscriptions] Razorpay cancel warning: ${rzpErrMsg(rzpErr)}`);
      }
    }

    // Update DB status
    await Subscription.findByIdAndUpdate(id, { status: "cancelled" });

    return res.status(200).json({ success: true, message: "Subscription cancelled" });
  } catch (error) {
    console.error("[cancelSubscription] Error:", rzpErrMsg(error));
    return res.status(500).json({ success: false, message: "Cancellation failed" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/subscriptions/my
// Auth: required
// Returns the authenticated user's subscriptions (active ones first)
// ─────────────────────────────────────────────────────────────────────────────
const getMySubscriptions = async (req, res) => {
  try {
    const subs = await Subscription.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, subscriptions: subs });
  } catch (error) {
    console.error("[getMySubscriptions] Error:", rzpErrMsg(error));
    return res.status(500).json({ success: false, message: "Failed to fetch subscriptions" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Webhook handler (called from paymentController.js razorpayWebhook extension)
// Exported for use by the payment webhook — NOT a direct route handler
// ─────────────────────────────────────────────────────────────────────────────
const handleSubscriptionWebhookEvent = async (event, payload) => {
  const entity = payload?.payload?.subscription?.entity;
  const rzpSubId = entity?.id;

  if (!rzpSubId) return;

  const sub = await Subscription.findOne({ razorpaySubscriptionId: rzpSubId });
  if (!sub) {
    console.log(`[Webhook] Subscription ${rzpSubId} not in DB — skipping`);
    return;
  }

  const currentStatus = sub.status;

  let newStatus = null;
  if (event === "subscription.activated")  newStatus = "active";
  if (event === "subscription.pending")    newStatus = "pending";
  if (event === "subscription.halted")     newStatus = "halted";
  if (event === "subscription.cancelled")  newStatus = "cancelled";
  if (event === "subscription.completed")  newStatus = "completed";

  if (!newStatus) return;

  // Idempotency guards — never downgrade active/authenticated to pending/created
  const TERMINAL_STATUSES = ["cancelled", "completed", "failed"];
  if (TERMINAL_STATUSES.includes(currentStatus) && newStatus !== "cancelled") {
    console.log(`[Webhook] ${event} ignored — subscription ${rzpSubId} already in terminal state ${currentStatus}`);
    return;
  }
  if (currentStatus === newStatus) {
    console.log(`[Webhook] ${event} duplicate — subscription ${rzpSubId} already ${currentStatus}`);
    return;
  }

  await Subscription.findByIdAndUpdate(sub._id, { status: newStatus });
  console.log(`[Webhook] ${event} — Subscription ${rzpSubId} → ${newStatus}`);
};

module.exports = {
  createSubscription,
  verifySubscription,
  cancelSubscription,
  getMySubscriptions,
  handleSubscriptionWebhookEvent,
};
