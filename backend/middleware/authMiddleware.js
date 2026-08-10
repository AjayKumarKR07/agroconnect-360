const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User account not found",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error("JWT AUTH ERROR:", error.name, error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired session",
    });
  }
};

// ==========================================
// ADMIN ONLY MIDDLEWARE
// Requires protect to run first (req.user set)
// ==========================================
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }
  next();
};

module.exports = {
  protect,
  adminOnly,
};