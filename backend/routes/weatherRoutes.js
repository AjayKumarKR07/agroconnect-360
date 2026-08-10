const express = require("express");
const { getWeather, getForecast } = require("../controllers/weatherController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getWeather);
router.get("/forecast", protect, getForecast);

module.exports = router;