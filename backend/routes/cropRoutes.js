const express = require("express");
const upload = require("../middleware/uploadMiddleware");

const {
  createCrop,
  getMyCrops,
  getCropById,
  updateCrop,
  deleteCrop,
  getListedCrops,
} = require("../controllers/cropController");


const {
  protect,
} = require("../middleware/authMiddleware");

const router = express.Router();

// All crop routes require login
router.use(protect);

// Create crop
router.post(
  "/",
  upload.single("image"),
  createCrop
);

// Get logged-in farmer crops
router.get("/my", getMyCrops);

// Browse marketplace (all listed crops) — must come BEFORE /:id
router.get("/", getListedCrops);

// Get one crop
router.get("/:id", getCropById);

// Update crop
router.put(
  "/:id",
  upload.single("image"),
  updateCrop
);

// Delete crop
router.delete("/:id", deleteCrop);

module.exports = router;