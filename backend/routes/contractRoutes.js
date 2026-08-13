const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getContracts, createContract, toggleMilestone, deleteContract } = require("../controllers/contractController");

const router = express.Router();
router.use(protect);

router.get("/",              getContracts);
router.post("/",             createContract);
router.patch("/:id/milestone", toggleMilestone);
router.delete("/:id",        deleteContract);

module.exports = router;
