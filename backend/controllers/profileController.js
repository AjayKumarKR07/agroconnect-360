const User = require("../models/User");

// COMPLETE PROFILE
const completeProfile = async (req, res) => {
  try {
    const {
      name,
      phone,
      location,
      role,
    } = req.body;

    if (!name || !location || !role) {
      return res.status(400).json({
        success: false,
        message:
          "Name, location and role are required",
      });
    }

    const allowedRoles = [
      "farmer",
      "user",
      "seller",
      "exporter",
      "admin",
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user role",
      });
    }

    const user = await User.findById(
      req.user._id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.name = name.trim();
    user.phone = phone?.trim() || "";
    user.location = location.trim();
    user.role = role;
    user.profileCompleted = true;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile completed successfully",

      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        location: user.location,
        role: user.role,
        profileCompleted:
          user.profileCompleted,
      },
    });
  } catch (error) {
    console.error(
      "Complete profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to complete profile",
    });
  }
};

// GET CURRENT USER
const getProfile = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,

      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        phone: req.user.phone,
        location: req.user.location,
        role: req.user.role,
        profileCompleted:
          req.user.profileCompleted,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to load profile",
    });
  }
};

module.exports = {
  completeProfile,
  getProfile,
};