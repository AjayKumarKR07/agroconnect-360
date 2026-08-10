const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const Otp = require("../models/Otp");
const User = require("../models/User");
const { sendOtpEmail } = require("../services/emailService");

// Hash OTP
const hashOtp = (otp) => {
  return crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");
};

// ================================
// SEND OTP
// ================================

const sendOtp = async (req, res) => {
  try {
    let { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email address is required",
      });
    }

    email = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    // Generate secure 6-digit OTP
    const otp = crypto.randomInt(
      100000,
      1000000
    ).toString();

    const otpHash = hashOtp(otp);
    console.log("========== SEND OTP ==========");
console.log("Email:", email);
console.log("Generated OTP:", otp);
console.log("Generated Hash:", otpHash);

    // OTP valid for 5 minutes
    const expiresAt = new Date(
      Date.now() + 5 * 60 * 1000
    );

    // Delete previous OTPs
    await Otp.deleteMany({ email });

    // Store hashed OTP
    await Otp.create({
      email,
      otpHash,
      expiresAt,
      attempts: 0,
    });

    // Send OTP email
    await sendOtpEmail(email, otp);

    return res.status(200).json({
      success: true,
      message: "Verification code sent successfully",
    });
  } catch (error) {
    console.error("Send OTP error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to send verification code",
    });
  }
};

// ================================
// VERIFY OTP
// ================================

const verifyOtp = async (req, res) => {
  try {
    let { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and verification code are required",
      });
    }

    email = email.trim().toLowerCase();
    otp = String(otp).trim();

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "Verification code must contain 6 digits",
      });
    }

    // Find OTP record
    const otpRecord = await Otp.findOne({
      email,
    });

    console.log("========== VERIFY OTP ==========");
    console.log("Email:", email, "| Entered OTP:", otp);
    if (!otpRecord) {
      console.log("OTP RECORD NOT FOUND for", email);
    } else {
      console.log("Stored Hash:", otpRecord.otpHash);
      console.log("Entered Hash:", hashOtp(otp));
      console.log("Match:", hashOtp(otp) === otpRecord.otpHash);
      console.log("Expires At:", otpRecord.expiresAt, "| Now:", new Date());
    }

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message:
          "Verification code is invalid or expired",
      });
    }

    // Check expiry
    if (
      otpRecord.expiresAt.getTime() <
      Date.now()
    ) {
      await Otp.deleteOne({
        _id: otpRecord._id,
      });

      return res.status(400).json({
        success: false,
        message: "Verification code has expired",
      });
    }

    // Maximum incorrect attempts
    if (otpRecord.attempts >= 5) {
      await Otp.deleteOne({
        _id: otpRecord._id,
      });

      return res.status(429).json({
        success: false,
        message:
          "Too many incorrect attempts. Request a new code.",
      });
    }

    // Hash entered OTP
    const enteredOtpHash = hashOtp(otp);

    // Compare OTP hashes
    if (
      enteredOtpHash !== otpRecord.otpHash
    ) {
      otpRecord.attempts += 1;

      await otpRecord.save();

      return res.status(400).json({
        success: false,
        message: "Incorrect verification code",
      });
    }

    // OTP successful — delete it
    await Otp.deleteOne({
      _id: otpRecord._id,
    });

    // Find existing user
    let user = await User.findOne({
      email,
    });

    let isNewUser = false;

    // Create first-time user
    if (!user) {
      user = await User.create({
        email,
        isEmailVerified: true,
        profileCompleted: false,
        lastLogin: new Date(),
      });

      isNewUser = true;
    } else {
      // Existing user
      user.isEmailVerified = true;
      user.lastLogin = new Date();

      await user.save();
    }

    // Generate JWT
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
      message: "Email verified successfully",

      token,
      isNewUser,
      profileCompleted:
        user.profileCompleted,

      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(
      "Verify OTP error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to verify code",
    });
  }
};

// ================================
// EXPORT CONTROLLERS
// ================================

module.exports = {
  sendOtp,
  verifyOtp,
};