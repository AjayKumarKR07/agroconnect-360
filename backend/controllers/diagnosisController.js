const Diagnosis = require("../models/Diagnosis");
const cloudinary = require("../config/cloudinary");
const {
  analyzeCropImage,
} = require("../services/geminiService");

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream =
      cloudinary.uploader.upload_stream(
        {
          folder:
            "agroconnect360/diagnosis",
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }

          resolve(result);
        }
      );

    stream.end(buffer);
  });
};

// ==========================================
// CREATE DIAGNOSIS
// POST /api/diagnosis
// ==========================================
const createDiagnosis = async (req, res) => {
  try {
    if (req.user.role !== "farmer") {
      return res.status(403).json({
        success: false,
        message: "Farmer access required",
      });
    }

    const {
      cropName,
      symptoms,
    } = req.body;

    if (!cropName) {
      return res.status(400).json({
        success: false,
        message: "Crop name is required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          "Please upload a crop or leaf image",
      });
    }

    const uploadResult =
      await uploadToCloudinary(
        req.file.buffer
      );

   // Create diagnosis record first
const diagnosis =
  await Diagnosis.create({
    farmer: req.user._id,

    cropName,

    symptoms: symptoms || "",

    image: {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    },

    status: "pending",
  });

try {
  // ========================================
  // GEMINI AI IMAGE ANALYSIS
  // ========================================

  const aiResult =
    await analyzeCropImage({
      imageBuffer: req.file.buffer,

      mimeType:
        req.file.mimetype,

      cropName,

      symptoms:
        symptoms || "",
    });

  diagnosis.diagnosis = {
    disease:
      aiResult.disease ||
      "Unable to determine",

    confidence:
      Number(aiResult.confidence) || 0,

    severity:
      aiResult.severity ||
      "unknown",

    description:
      aiResult.description || "",

    causes:
      Array.isArray(aiResult.causes)
        ? aiResult.causes
        : [],

    treatment:
      Array.isArray(aiResult.treatment)
        ? aiResult.treatment
        : [],

    prevention:
      Array.isArray(aiResult.prevention)
        ? aiResult.prevention
        : [],
  };

  diagnosis.status = "completed";

  await diagnosis.save();

  // Build a flat response shape the frontend reads directly
  const flatDiagnosis = {
    _id: diagnosis._id,
    cropName: diagnosis.cropName,
    symptoms: diagnosis.symptoms,
    imageUrl: diagnosis.image?.url || "",
    status: diagnosis.status,
    createdAt: diagnosis.createdAt,
    isHealthy: !aiResult.disease || aiResult.disease.toLowerCase().includes("healthy"),
    disease: aiResult.disease || "Healthy",
    confidence: Number(aiResult.confidence) || 0,
    severity: aiResult.severity || "low",
    cause: Array.isArray(aiResult.causes) ? aiResult.causes.join(". ") : (aiResult.causes || ""),
    treatment: Array.isArray(aiResult.treatment) ? aiResult.treatment.join(". ") : (aiResult.treatment || ""),
    prevention: Array.isArray(aiResult.prevention) ? aiResult.prevention.join(". ") : (aiResult.prevention || ""),
    description: aiResult.description || "",
  };

  return res.status(201).json({
    success: true,
    message: "Crop diagnosis completed successfully",
    diagnosis: flatDiagnosis,
  });
} catch (aiError) {
  console.error(
    "Gemini diagnosis error:",
    aiError
  );

  diagnosis.status = "failed";

  await diagnosis.save();

  return res.status(502).json({
    success: false,

    message:
      "Image uploaded, but AI analysis failed",

    diagnosisId:
      diagnosis._id,
  });
}

    return res.status(201).json({
      success: true,
      message:
        "Crop image uploaded successfully",
      diagnosis,
    });
  } catch (error) {
    console.error(
      "Create diagnosis error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to process crop image",
    });
  }
};

// ==========================================
// GET DIAGNOSIS HISTORY
// GET /api/diagnosis/my
// ==========================================
const getMyDiagnoses = async (
  req,
  res
) => {
  try {
    const raw = await Diagnosis.find({
      farmer: req.user._id,
    }).sort({ createdAt: -1 });

    // Flatten for frontend consumption
    const diagnoses = raw.map((d) => ({
      _id: d._id,
      cropName: d.cropName,
      symptoms: d.symptoms,
      imageUrl: d.image?.url || "",
      status: d.status,
      createdAt: d.createdAt,
      isHealthy:
        !d.diagnosis?.disease ||
        d.diagnosis.disease.toLowerCase().includes("healthy"),
      disease: d.diagnosis?.disease || "—",
      severity: d.diagnosis?.severity || "—",
      confidence: d.diagnosis?.confidence || 0,
      cause: Array.isArray(d.diagnosis?.causes)
        ? d.diagnosis.causes.join(". ")
        : (d.diagnosis?.causes || ""),
      treatment: Array.isArray(d.diagnosis?.treatment)
        ? d.diagnosis.treatment.join(". ")
        : (d.diagnosis?.treatment || ""),
      prevention: Array.isArray(d.diagnosis?.prevention)
        ? d.diagnosis.prevention.join(". ")
        : (d.diagnosis?.prevention || ""),
    }));

    return res.status(200).json({
      success: true,
      count: diagnoses.length,
      diagnoses,
    });
  } catch (error) {
    console.error("Diagnosis history error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load diagnosis history",
    });
  }
};

// DELETE /api/diagnosis/:id
const deleteDiagnosis = async (req, res) => {
  try {
    const diagnosis = await Diagnosis.findOne({ _id: req.params.id, farmer: req.user._id });
    if (!diagnosis) {
      return res.status(404).json({ success: false, message: "Diagnosis not found" });
    }
    if (diagnosis.imagePublicId) {
      try { await cloudinary.uploader.destroy(diagnosis.imagePublicId); }
      catch (e) { console.warn("Cloudinary delete failed:", e.message); }
    }
    await diagnosis.deleteOne();
    return res.status(200).json({ success: true, message: "Diagnosis deleted successfully" });
  } catch (error) {
    console.error("Diagnosis delete error:", error);
    return res.status(500).json({ success: false, message: "Unable to delete diagnosis" });
  }
};

module.exports = {
  createDiagnosis,
  getMyDiagnoses,
  deleteDiagnosis,
};