const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { createDispute, getMyDisputes, getDisputeById } = require("../controllers/disputeController");

const router = express.Router();

// All dispute routes require authentication
router.use(protect);

// User-side routes
router.post("/", createDispute);
router.get("/my", getMyDisputes);
router.get("/:id", getDisputeById);

module.exports = router;
