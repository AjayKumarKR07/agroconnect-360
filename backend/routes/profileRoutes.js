const express = require("express");

const {
  completeProfile,
  getProfile,
} = require("../controllers/profileController");

const {
  protect,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/me", protect, getProfile);

router.put(
  "/complete",
  protect,
  completeProfile
);

module.exports = router;