const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ==========================================
// REGISTER (Simple & Secure)
// ==========================================
const register = async (req, res) => {
  try {
    let { name, email, password, confirmPassword, role } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Full Name, Email, Password, and Role are required.",
      });
    }

    name = name.trim();
    email = email.trim().toLowerCase();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    // Validate password length
    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long.",
      });
    }

    // Validate password confirmation if provided
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match.",
      });
    }

    // Role validation: Do NOT allow public users to register as Admin
    const roleLower = String(role).trim().toLowerCase();
    if (roleLower === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin registration is not permitted. Admin accounts must be authorized by an administrator.",
      });
    }

    const ALLOWED_ROLES = ["farmer", "user", "exporter"];
    if (!ALLOWED_ROLES.includes(roleLower)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role selected. Allowed roles: Farmer, Consumer / Buyer, or Exporter.",
      });
    }

    // Check whether the email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "This email address is already registered. Please sign in or use another email.",
      });
    }

    // Secure password hashing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user in MongoDB
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: roleLower,
      isEmailVerified: true,
      profileCompleted: true,
      isActive: true,
      lastLogin: null,
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully! Please sign in to continue.",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to complete registration. Please try again later.",
    });
  }
};

// ==========================================
// LOGIN (Simple & Secure)
// ==========================================
const login = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    email = email.trim().toLowerCase();

    // Find user in MongoDB
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Check for password presence (in case of legacy accounts created before password auth)
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: "This account was created without a password. Please register a new account or contact support.",
      });
    }

    // Account active check
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact support.",
      });
    }

    // Compare password hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Update lastLogin timestamp
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        profileCompleted: user.profileCompleted,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to sign in. Please try again later.",
    });
  }
};

// ==========================================
// GET CURRENT USER (/api/auth/me)
// ==========================================
const getMe = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }
    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        profileCompleted: user.profileCompleted,
      },
    });
  } catch (error) {
    console.error("GetMe error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching user profile.",
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
};