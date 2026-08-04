const express = require("express");

const {
  createDiagnosis,
  getMyDiagnoses,
  deleteDiagnosis,
} = require(
  "../controllers/diagnosisController"
);

const {
  protect,
} = require(
  "../middleware/authMiddleware"
);

const upload = require(
  "../middleware/uploadMiddleware"
);

const router = express.Router();

router.post(
  "/",
  protect,
  upload.single("image"),
  createDiagnosis
);

router.get(
  "/my",
  protect,
  getMyDiagnoses
);

router.delete(
  "/:id",
  protect,
  deleteDiagnosis
);

module.exports = router;