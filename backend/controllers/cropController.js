const Crop = require("../models/Crop");
const cloudinary = require("../config/cloudinary");


const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "agroconnect360/crops",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      }
    );

    stream.end(fileBuffer);
  });
};

// ==========================================
// ADD NEW CROP
// POST /api/crops
// ==========================================
const createCrop = async (req, res) => {
  try {
    // Only farmers can add crops
    if (req.user.role !== "farmer") {
      return res.status(403).json({
        success: false,
        message: "Only farmers can add crops",
      });
    }

    const {
      name,
      category,
      quantity,
      unit,
      price,
      location,
      sowingDate,
      harvestDate,
      description,
    } = req.body;

    // Basic validation
    if (
      !name ||
      !category ||
      quantity === undefined ||
      price === undefined ||
      !location
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    // ------------------------------------------
    // IMAGE
    // ------------------------------------------

    // First initialize the image
    let image = {
      url: "",
      publicId: "",
    };

    // If farmer uploaded an image,
    // upload it to Cloudinary
    if (req.file) {
      const uploadResult =
        await uploadToCloudinary(
          req.file.buffer
        );

      image = {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      };
    }

    // ------------------------------------------
    // CREATE CROP
    // ------------------------------------------

    // Create crop only AFTER image is ready
    const crop = await Crop.create({
      farmer: req.user._id,

      name,
      category,
      quantity,
      unit,
      price,
      location,

      sowingDate:
        sowingDate || undefined,

      harvestDate:
        harvestDate || undefined,

      description:
        description || "",

      image,
    });

    return res.status(201).json({
      success: true,
      message: "Crop added successfully",
      crop,
    });
  } catch (error) {
    console.error(
      "Create crop error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to add crop",
    });
  }
};

// ==========================================
// GET LOGGED-IN FARMER'S CROPS
// GET /api/crops/my
// ==========================================
const getMyCrops = async (req, res) => {
  try {
    const crops = await Crop.find({
      farmer: req.user._id,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: crops.length,
      crops,
    });
  } catch (error) {
    console.error("Get crops error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load crops",
    });
  }
};

// ==========================================
// GET SINGLE CROP
// GET /api/crops/:id
// ==========================================
const getCropById = async (req, res) => {
  try {
    const crop = await Crop.findOne({
      _id: req.params.id,
      farmer: req.user._id,
    });

    if (!crop) {
      return res.status(404).json({
        success: false,
        message: "Crop not found",
      });
    }

    return res.status(200).json({
      success: true,
      crop,
    });
  } catch (error) {
    console.error("Get crop error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load crop",
    });
  }
};

// ==========================================
// UPDATE CROP
// PUT /api/crops/:id
// ==========================================
const updateCrop = async (req, res) => {
  try {
    const crop = await Crop.findOne({
      _id: req.params.id,
      farmer: req.user._id,
    });

    if (!crop) {
      return res.status(404).json({
        success: false,
        message: "Crop not found",
      });
    }

    const allowedFields = [
      "name",
      "category",
      "quantity",
      "unit",
      "price",
      "location",
      "sowingDate",
      "harvestDate",
      "description",
      "status",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        crop[field] = req.body[field];
      }
    });

    // ======================================
    // REPLACE CROP IMAGE
    // ======================================

    if (req.file) {
      // Delete previous Cloudinary image
      if (crop.image?.publicId) {
        try {
          await cloudinary.uploader.destroy(
            crop.image.publicId
          );
        } catch (cloudinaryError) {
          console.error(
            "Old image delete error:",
            cloudinaryError
          );
        }
      }

      // Upload new image
      const uploadResult =
        await uploadToCloudinary(
          req.file.buffer
        );

      crop.image = {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      };
    }

    await crop.save();

    return res.status(200).json({
      success: true,
      message: "Crop updated successfully",
      crop,
    });
  } catch (error) {
    console.error(
      "Update crop error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to update crop",
    });
  }
};
// ==========================================
// DELETE CROP
// DELETE /api/crops/:id
// ==========================================
const deleteCrop = async (req, res) => {
  try {
    const crop = await Crop.findOne({
      _id: req.params.id,
      farmer: req.user._id,
    });

    if (!crop) {
      return res.status(404).json({
        success: false,
        message: "Crop not found",
      });
    }

    // Delete crop image from Cloudinary
    if (crop.image?.publicId) {
      try {
        await cloudinary.uploader.destroy(
          crop.image.publicId
        );

        console.log(
          "Cloudinary image deleted:",
          crop.image.publicId
        );
      } catch (cloudinaryError) {
        console.error(
          "Cloudinary image delete error:",
          cloudinaryError
        );
      }
    }

    // Delete crop from MongoDB
    await crop.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Crop deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete crop error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to delete crop",
    });
  }
};

// ==========================================
// GET ALL LISTED CROPS (Marketplace browse)
// GET /api/crops?status=listed&category=&search=
// ==========================================
const getListedCrops = async (req, res) => {
  try {
    const { status, category, search } = req.query;

    const filter = {};
    if (status)   filter.status   = status;           // 'listed', 'growing', etc.
    if (category) filter.category = category;
    if (search)   filter.name     = { $regex: search, $options: "i" };

    const crops = await Crop.find(filter)
      .populate("farmer", "name location")
      .sort({ createdAt: -1 })
      .lean();

    // Flatten farmer name for convenience
    const result = crops.map(c => ({
      ...c,
      farmerName: c.farmer?.name || "Farmer",
      location:   c.location || c.farmer?.location || "",
    }));

    return res.status(200).json({ success: true, crops: result });
  } catch (error) {
    console.error("getListedCrops error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch crops" });
  }
};

module.exports = {
  createCrop,
  getMyCrops,
  getCropById,
  updateCrop,
  deleteCrop,
  getListedCrops,
};