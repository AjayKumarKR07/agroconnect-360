const express = require("express");

const {
  completeProfile,
  updateProfile,
  getProfile,
  getFarmDetails,
  updateFarmDetails,
} = require("../controllers/profileController");

const {
  protect,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/me", protect, getProfile);
router.put("/me", protect, updateProfile);
router.put("/update", protect, updateProfile);

router.put(
  "/complete",
  protect,
  completeProfile
);

// Farm-specific fields
router.get("/farm", protect, getFarmDetails);
router.put("/farm", protect, updateFarmDetails);

module.exports = router;