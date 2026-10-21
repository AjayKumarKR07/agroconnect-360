const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  register,
  login,
  getMe,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// ── Rate limiters ─────────────────────────────────────────────────────────────
// Login: 10 attempts per 15 minutes per IP (only counts failures)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again in 15 minutes.",
  },
  skipSuccessfulRequests: true,
});

// Register: 20 attempts per 15 minutes per IP
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many registration attempts. Please try again in 15 minutes.",
  },
});

// ── Public routes ─────────────────────────────────────────────────────────────
router.post("/register", registerLimiter, register);
router.post("/login",    loginLimiter,    login);

// ── Protected routes ──────────────────────────────────────────────────────────
router.get("/me", protect, getMe);

module.exports = router;