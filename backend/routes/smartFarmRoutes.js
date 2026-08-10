const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  generateSmartFarmPlan,
  savePlan,
  getSavedPlans,
  getSavedPlanById,
  deleteSavedPlan,
} = require("../controllers/smartFarmController");

const router = express.Router();

// Smart Farm Plan generation (existing)
router.post("/smart-farm-plan", protect, generateSmartFarmPlan);

// Saved plans CRUD
router.post("/smart-farm-plans",      protect, savePlan);
router.get("/smart-farm-plans",       protect, getSavedPlans);
router.get("/smart-farm-plans/:id",   protect, getSavedPlanById);
router.delete("/smart-farm-plans/:id", protect, deleteSavedPlan);

module.exports = router;
