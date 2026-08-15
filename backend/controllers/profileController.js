const User = require("../models/User");

// COMPLETE PROFILE
const completeProfile = async (req, res) => {
  try {
    const {
      name,
      phone,
      location,
      district,
      state,
      role,
    } = req.body;

    const finalDistrict = district?.trim() || "";
    const finalState = state?.trim() || "";
    let finalLocation = location?.trim() || "";
    if (!finalLocation && (finalDistrict || finalState)) {
      finalLocation = [finalDistrict, finalState].filter(Boolean).join(", ");
    }

    if (!name || !role) {
      return res.status(400).json({
        success: false,
        message: "Name and role are required",
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
    user.district = finalDistrict;
    user.state = finalState;
    user.location = finalLocation;
    user.role = role;
    user.profileCompleted = true;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile completed successfully",
      user: {
        _id: user._id,
        id:  user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        district: user.district,
        state: user.state,
        location: user.location,
        role: user.role,
        profileCompleted: user.profileCompleted,
        profileComplete:  user.profileCompleted,
        createdAt: user.createdAt,
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
        _id: req.user._id,
        id:  req.user._id,
        email: req.user.email,
        name: req.user.name,
        phone: req.user.phone,
        district: req.user.district,
        state: req.user.state,
        location: req.user.location,
        role: req.user.role,
        profileCompleted: req.user.profileCompleted,
        profileComplete:  req.user.profileCompleted,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to load profile",
    });
  }
};

// ============================================================
// GET FARM DETAILS — GET /api/profile/farm
// ============================================================
const getFarmDetails = async (req, res) => {
  try {
    const user = req.user;
    return res.status(200).json({
      success: true,
      farm: {
        farmName:          user.farmName          || "",
        farmArea:          user.farmArea          ?? null,
        areaUnit:          user.areaUnit          || "Acre",
        soilType:          user.soilType          || "",
        irrigation:        user.irrigation        || "",
        waterSource:       user.waterSource       || "",
        season:            user.season            || "",
        previousCrop:      user.previousCrop      || "",
        farmingExperience: user.farmingExperience ?? null,
        // Identity fields from profile
        name:     user.name     || "",
        location: user.location || "",
        district: user.district || "",
        state:    user.state    || "",
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to load farm details" });
  }
};

// ============================================================
// UPDATE FARM DETAILS — PUT /api/profile/farm
// ============================================================
const updateFarmDetails = async (req, res) => {
  try {
    const {
      farmName, farmArea, areaUnit, soilType,
      irrigation, waterSource, season, previousCrop, farmingExperience,
    } = req.body;

    const user = await require("../models/User").findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (farmName          !== undefined) user.farmName          = farmName.trim();
    if (farmArea          !== undefined) user.farmArea          = farmArea ? Number(farmArea) : null;
    if (areaUnit          !== undefined) user.areaUnit          = areaUnit;
    if (soilType          !== undefined) user.soilType          = soilType;
    if (irrigation        !== undefined) user.irrigation        = irrigation;
    if (waterSource       !== undefined) user.waterSource       = waterSource;
    if (season            !== undefined) user.season            = season;
    if (previousCrop      !== undefined) user.previousCrop      = previousCrop.trim();
    if (farmingExperience !== undefined) user.farmingExperience = farmingExperience ? Number(farmingExperience) : null;

    await user.save();

    // Update localStorage-cached user on next profile fetch
    return res.status(200).json({
      success: true,
      message: "Farm details updated successfully",
      farm: {
        farmName: user.farmName, farmArea: user.farmArea, areaUnit: user.areaUnit,
        soilType: user.soilType, irrigation: user.irrigation, waterSource: user.waterSource,
        season: user.season, previousCrop: user.previousCrop, farmingExperience: user.farmingExperience,
        name: user.name, location: user.location, district: user.district, state: user.state,
      },
    });
  } catch (error) {
    console.error("Update farm details error:", error);
    return res.status(500).json({ success: false, message: "Unable to update farm details" });
  }
}

// UPDATE GENERAL PROFILE (Admin, User, Seller, Exporter, Farmer)
const updateProfile = async (req, res) => {
  try {
    const { name, phone, location, district, state } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (name !== undefined) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (district !== undefined) user.district = district.trim();
    if (state !== undefined) user.state = state.trim();
    if (location !== undefined) user.location = location.trim();
    user.profileCompleted = true;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        district: user.district,
        state: user.state,
        location: user.location,
        role: user.role,
        profileCompleted: user.profileCompleted,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ success: false, message: "Unable to update profile" });
  }
};

module.exports = {
  completeProfile,
  updateProfile,
  getProfile,
  getFarmDetails,
  updateFarmDetails,
};