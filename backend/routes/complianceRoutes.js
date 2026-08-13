const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getDocs, createDoc, updateStatus, deleteDoc } = require("../controllers/complianceController");

const router = express.Router();
router.use(protect);

router.get("/",              getDocs);
router.post("/",             createDoc);
router.patch("/:id/status",  updateStatus);
router.delete("/:id",        deleteDoc);

module.exports = router;
