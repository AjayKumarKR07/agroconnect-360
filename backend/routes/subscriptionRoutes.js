const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  createSubscription,
  verifySubscription,
  cancelSubscription,
  getMySubscriptions,
} = require("../controllers/subscriptionController");

const router = express.Router();

// All subscription routes require authentication
router.use(protect);

router.post("/create",         createSubscription);
router.post("/verify",         verifySubscription);
router.post("/cancel/:id",     cancelSubscription);
router.get("/my",              getMySubscriptions);

module.exports = router;
