/**
 * exportController.js
 * Handles Farmer ↔ Exporter direct marketplace
 *
 * Farmer routes:  createExportListing, getFarmerExportListings,
 *                 updateExportListing, deleteExportListing,
 *                 getFarmerInterestRequests, respondToInterest,
 *                 farmerCounterOffer, farmerConfirmDeal
 *
 * Exporter routes: getAllExportListings, getExportListingDetail,
 *                  expressInterest, getExporterInterests,
 *                  exporterCounterOffer, exporterConfirmDeal
 */

const Crop           = require("../models/Crop");
const ExportInterest = require("../models/ExportInterest");
const Notification   = require("../models/Notification");

/* ─── helpers ──────────────────────────────────────────────────────────── */

const assertRole = (user, role, res) => {
  if (user.role !== role) {
    res.status(403).json({ success: false, message: `${role} access required` });
    return false;
  }
  return true;
};

const sendFarmerNotification = async ({ farmerId, title, message, link = "", metadata = {} }) => {
  try {
    await Notification.create({
      farmer:   farmerId,
      type:     "export",
      title,
      message,
      link,
      metadata,
    });
  } catch (e) {
    console.error("Notification error:", e.message);
  }
};

/* ════════════════════════════════════════════════════════════════════════
   FARMER CONTROLLERS
════════════════════════════════════════════════════════════════════════ */

/* ── POST /api/export/listings — Create export listing ─────────────────── */
const createExportListing = async (req, res) => {
  try {
    if (!assertRole(req.user, "farmer", res)) return;

    const {
      name, category = "export", exportGrade, exportQuantity, exportUnit = "MT",
      expectedExportPrice, location, availableFrom, preferredDestination,
      description, imageUrl,
    } = req.body;

    if (!name) return res.status(400).json({ success: false, message: "Crop/produce name is required" });
    if (!exportQuantity || Number(exportQuantity) <= 0) return res.status(400).json({ success: false, message: "Export quantity must be greater than 0" });
    if (!exportGrade) return res.status(400).json({ success: false, message: "Quality / Grade is required" });
    if (expectedExportPrice != null && Number(expectedExportPrice) < 0) return res.status(400).json({ success: false, message: "Price cannot be negative" });

    const farmerLocation = location ||
      [req.user.district, req.user.state].filter(Boolean).join(", ") ||
      req.user.location ||
      "India";

    const listing = await Crop.create({
      farmer:               req.user._id,
      name:                 name.trim(),
      category,
      quantity:             Number(exportQuantity),
      unit:                 exportUnit === "MT" ? "ton" : exportUnit === "quintal" ? "quintal" : "kg",
      price:                expectedExportPrice ? Number(expectedExportPrice) : 0,
      location:             farmerLocation,
      description:          description || "",
      status:               "listed",
      isExportListing:      true,
      exportGrade:          exportGrade.trim(),
      exportQuantity:       Number(exportQuantity),
      exportUnit,
      expectedExportPrice:  expectedExportPrice ? Number(expectedExportPrice) : 0,
      availableFrom:        availableFrom ? new Date(availableFrom) : null,
      preferredDestination: preferredDestination || "",
      exportStatus:         "available",
      ...(imageUrl ? { image: { url: imageUrl, publicId: "" } } : {}),
    });

    res.status(201).json({ success: true, message: "Export listing created successfully", listing });
  } catch (err) {
    console.error("createExportListing:", err);
    res.status(500).json({ success: false, message: "Failed to create export listing" });
  }
};

/* ── GET /api/export/farmer/listings — Farmer's own listings ───────────── */
const getFarmerExportListings = async (req, res) => {
  try {
    if (!assertRole(req.user, "farmer", res)) return;

    const listings = await Crop.find({ farmer: req.user._id, isExportListing: true })
      .sort({ createdAt: -1 });

    // Attach interest counts
    const listingIds = listings.map(l => l._id);
    const interestCounts = await ExportInterest.aggregate([
      { $match: { listing: { $in: listingIds } } },
      { $group: { _id: "$listing", count: { $sum: 1 }, pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } } } },
    ]);
    const countMap = {};
    interestCounts.forEach(c => { countMap[c._id.toString()] = { total: c.count, pending: c.pending }; });

    const enriched = listings.map(l => ({
      ...l.toObject(),
      _interestCount: countMap[l._id.toString()]?.total || 0,
      _pendingInterests: countMap[l._id.toString()]?.pending || 0,
    }));

    res.json({ success: true, listings: enriched });
  } catch (err) {
    console.error("getFarmerExportListings:", err);
    res.status(500).json({ success: false, message: "Failed to load export listings" });
  }
};

/* ── PUT /api/export/listings/:id — Update listing ──────────────────────── */
const updateExportListing = async (req, res) => {
  try {
    if (!assertRole(req.user, "farmer", res)) return;

    const listing = await Crop.findById(req.params.id);
    if (!listing || !listing.isExportListing)
      return res.status(404).json({ success: false, message: "Export listing not found" });
    if (listing.farmer.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "You can only edit your own listings" });

    const allowed = ["name","exportGrade","exportQuantity","exportUnit","expectedExportPrice",
                     "availableFrom","preferredDestination","description","exportStatus","location"];
    allowed.forEach(f => { if (req.body[f] !== undefined) listing[f] = req.body[f]; });

    await listing.save();
    res.json({ success: true, message: "Listing updated", listing });
  } catch (err) {
    console.error("updateExportListing:", err);
    res.status(500).json({ success: false, message: "Failed to update listing" });
  }
};

/* ── DELETE /api/export/listings/:id — Delete listing ───────────────────── */
const deleteExportListing = async (req, res) => {
  try {
    if (!assertRole(req.user, "farmer", res)) return;

    const listing = await Crop.findById(req.params.id);
    if (!listing || !listing.isExportListing)
      return res.status(404).json({ success: false, message: "Export listing not found" });
    if (listing.farmer.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "You can only delete your own listings" });

    await ExportInterest.deleteMany({ listing: listing._id });
    await listing.deleteOne();

    res.json({ success: true, message: "Export listing removed" });
  } catch (err) {
    console.error("deleteExportListing:", err);
    res.status(500).json({ success: false, message: "Failed to delete listing" });
  }
};

/* ── GET /api/export/farmer/interests — Farmer's incoming interest requests */
const getFarmerInterestRequests = async (req, res) => {
  try {
    if (!assertRole(req.user, "farmer", res)) return;

    const interests = await ExportInterest.find({ farmer: req.user._id })
      .populate("exporter", "name email phone location state")
      .populate("listing", "name exportGrade exportQuantity exportUnit expectedExportPrice location preferredDestination")
      .sort({ createdAt: -1 });

    res.json({ success: true, interests });
  } catch (err) {
    console.error("getFarmerInterestRequests:", err);
    res.status(500).json({ success: false, message: "Failed to load interest requests" });
  }
};

/* ── PATCH /api/export/interests/:id/respond — Farmer accept/reject ─────── */
const respondToInterest = async (req, res) => {
  try {
    if (!assertRole(req.user, "farmer", res)) return;

    const { status } = req.body; // "accepted" | "rejected"
    if (!["accepted", "rejected"].includes(status))
      return res.status(400).json({ success: false, message: "Status must be accepted or rejected" });

    const interest = await ExportInterest.findById(req.params.id)
      .populate("exporter", "name email")
      .populate("listing", "name");

    if (!interest) return res.status(404).json({ success: false, message: "Interest not found" });
    if (interest.farmer.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Not authorized" });
    if (interest.status !== "pending")
      return res.status(400).json({ success: false, message: `Cannot respond to a ${interest.status} interest` });

    interest.status       = status;
    interest.exporterRead = false; // mark unread for exporter
    await interest.save();

    // Notify farmer of their own action outcome (skipped — farmer knows what they did)
    // The exporterRead flag serves as the exporter's unread indicator

    res.json({ success: true, message: `Interest ${status}`, interest });
  } catch (err) {
    console.error("respondToInterest:", err);
    res.status(500).json({ success: false, message: "Failed to update interest" });
  }
};

/* ── PATCH /api/export/interests/:id/counter — Farmer counter offer ─────── */
const farmerCounterOffer = async (req, res) => {
  try {
    if (!assertRole(req.user, "farmer", res)) return;

    const { farmerCounter, negotiationNotes } = req.body;
    if (!farmerCounter || Number(farmerCounter) <= 0)
      return res.status(400).json({ success: false, message: "Valid counter price required" });

    const interest = await ExportInterest.findById(req.params.id);
    if (!interest) return res.status(404).json({ success: false, message: "Interest not found" });
    if (interest.farmer.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Not authorized" });
    if (!["accepted", "negotiating"].includes(interest.status))
      return res.status(400).json({ success: false, message: "Can only counter on accepted/negotiating interests" });

    interest.farmerCounter    = Number(farmerCounter);
    interest.status           = "negotiating";
    interest.exporterRead     = false;
    if (negotiationNotes) interest.negotiationNotes = negotiationNotes;
    await interest.save();

    res.json({ success: true, message: "Counter offer sent", interest });
  } catch (err) {
    console.error("farmerCounterOffer:", err);
    res.status(500).json({ success: false, message: "Failed to send counter offer" });
  }
};

/* ── PATCH /api/export/interests/:id/confirm — Farmer confirms deal ─────── */
const farmerConfirmDeal = async (req, res) => {
  try {
    if (!assertRole(req.user, "farmer", res)) return;

    const { agreedPrice, agreedQty, agreedUnit, agreedDest, shipmentTerms } = req.body;
    const interest = await ExportInterest.findById(req.params.id);
    if (!interest) return res.status(404).json({ success: false, message: "Interest not found" });
    if (interest.farmer.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Not authorized" });
    if (!["accepted", "negotiating"].includes(interest.status))
      return res.status(400).json({ success: false, message: "Interest must be accepted/negotiating to confirm" });

    interest.farmerConfirmed = true;
    if (agreedPrice)    interest.agreedPrice   = Number(agreedPrice);
    if (agreedQty)      interest.agreedQty     = Number(agreedQty);
    if (agreedUnit)     interest.agreedUnit    = agreedUnit;
    if (agreedDest)     interest.agreedDest    = agreedDest;
    if (shipmentTerms)  interest.shipmentTerms = shipmentTerms;
    interest.exporterRead = false;

    if (interest.exporterConfirmed) {
      interest.status = "confirmed";
      // Update listing status
      await Crop.findByIdAndUpdate(interest.listing, { exportStatus: "committed" });
    }

    await interest.save();
    res.json({ success: true, message: interest.status === "confirmed" ? "Deal confirmed!" : "Awaiting exporter confirmation", interest });
  } catch (err) {
    console.error("farmerConfirmDeal:", err);
    res.status(500).json({ success: false, message: "Failed to confirm deal" });
  }
};

/* ════════════════════════════════════════════════════════════════════════
   EXPORTER CONTROLLERS
════════════════════════════════════════════════════════════════════════ */

/* ── GET /api/export/listings — Browse all export listings ──────────────── */
const getAllExportListings = async (req, res) => {
  try {
    const { crop, location, grade, destination, minQty, maxQty, sort } = req.query;

    const filter = { isExportListing: true, exportStatus: "available" };
    if (crop)        filter.name     = { $regex: crop, $options: "i" };
    if (location)    filter.location = { $regex: location, $options: "i" };
    if (grade)       filter.exportGrade = { $regex: grade, $options: "i" };
    if (destination) filter.preferredDestination = { $regex: destination, $options: "i" };
    if (minQty)      filter.exportQuantity = { ...filter.exportQuantity, $gte: Number(minQty) };
    if (maxQty)      filter.exportQuantity = { ...filter.exportQuantity, $lte: Number(maxQty) };

    const sortMap = {
      newest:   { createdAt: -1 },
      qty_high: { exportQuantity: -1 },
      qty_low:  { exportQuantity: 1 },
      price:    { expectedExportPrice: 1 },
    };
    const sortOrder = sortMap[sort] || { createdAt: -1 };

    const listings = await Crop.find(filter)
      .populate("farmer", "name location state district")
      .sort(sortOrder);

    res.json({ success: true, listings });
  } catch (err) {
    console.error("getAllExportListings:", err);
    res.status(500).json({ success: false, message: "Failed to load listings" });
  }
};

/* ── GET /api/export/listings/:id — Single listing detail ───────────────── */
const getExportListingDetail = async (req, res) => {
  try {
    const listing = await Crop.findOne({ _id: req.params.id, isExportListing: true })
      .populate("farmer", "name location state district");

    if (!listing) return res.status(404).json({ success: false, message: "Listing not found" });
    res.json({ success: true, listing });
  } catch (err) {
    console.error("getExportListingDetail:", err);
    res.status(500).json({ success: false, message: "Failed to load listing" });
  }
};

/* ── POST /api/export/interests — Express Interest ───────────────────────── */
const expressInterest = async (req, res) => {
  try {
    if (!assertRole(req.user, "exporter", res)) return;

    const { listingId, requestedQty, offeredPrice, destination, message } = req.body;

    if (!listingId)    return res.status(400).json({ success: false, message: "Listing ID required" });
    if (!requestedQty || Number(requestedQty) <= 0)
      return res.status(400).json({ success: false, message: "Requested quantity must be > 0" });
    if (!offeredPrice || Number(offeredPrice) < 0)
      return res.status(400).json({ success: false, message: "Offered price required" });

    const listing = await Crop.findOne({ _id: listingId, isExportListing: true });
    if (!listing) return res.status(404).json({ success: false, message: "Export listing not found" });

    // Duplicate protection: block if active interest already exists
    const existing = await ExportInterest.findOne({
      exporter: req.user._id,
      listing:  listingId,
      status:   { $in: ["pending", "accepted", "negotiating"] },
    });
    if (existing)
      return res.status(409).json({ success: false, message: "You have already expressed interest in this listing. Please check My Interests." });

    const interest = await ExportInterest.create({
      farmer:       listing.farmer,
      exporter:     req.user._id,
      listing:      listing._id,
      requestedQty: Number(requestedQty),
      requestedUnit: listing.exportUnit || "MT",
      offeredPrice: Number(offeredPrice),
      destination:  destination || listing.preferredDestination || "",
      message:      message || "",
      farmerRead:   false, // farmer hasn't seen this yet
      exporterRead: true,
    });

    // Notify the farmer
    await sendFarmerNotification({
      farmerId: listing.farmer,
      title:    "🌍 New Export Interest",
      message:  `${req.user.name || "An exporter"} is interested in your ${listing.name} export listing (${requestedQty} ${listing.exportUnit || "MT"} @ ₹${offeredPrice})`,
      link:     "/farmer/export",
      metadata: { interestId: interest._id, listingId: listing._id },
    });

    const populated = await ExportInterest.findById(interest._id)
      .populate("listing", "name exportGrade exportQuantity exportUnit expectedExportPrice location")
      .populate("farmer", "name location");

    res.status(201).json({ success: true, message: "Interest submitted successfully", interest: populated });
  } catch (err) {
    console.error("expressInterest:", err);
    res.status(500).json({ success: false, message: "Failed to submit interest" });
  }
};

/* ── GET /api/export/exporter/interests — Exporter's own interests ──────── */
const getExporterInterests = async (req, res) => {
  try {
    if (!assertRole(req.user, "exporter", res)) return;

    const interests = await ExportInterest.find({ exporter: req.user._id })
      .populate("farmer",  "name location state district")
      .populate("listing", "name exportGrade exportQuantity exportUnit expectedExportPrice location preferredDestination image")
      .sort({ updatedAt: -1 });

    // Mark as read
    await ExportInterest.updateMany(
      { exporter: req.user._id, exporterRead: false },
      { exporterRead: true }
    );

    res.json({ success: true, interests });
  } catch (err) {
    console.error("getExporterInterests:", err);
    res.status(500).json({ success: false, message: "Failed to load interests" });
  }
};

/* ── PATCH /api/export/interests/:id/counter — Exporter counter offer ───── */
const exporterCounterOffer = async (req, res) => {
  try {
    if (!assertRole(req.user, "exporter", res)) return;

    const { exporterCounter, negotiationNotes } = req.body;
    if (!exporterCounter || Number(exporterCounter) <= 0)
      return res.status(400).json({ success: false, message: "Valid counter price required" });

    const interest = await ExportInterest.findById(req.params.id);
    if (!interest) return res.status(404).json({ success: false, message: "Interest not found" });
    if (interest.exporter.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Not authorized" });
    if (!["accepted", "negotiating"].includes(interest.status))
      return res.status(400).json({ success: false, message: "Can only counter on accepted/negotiating interests" });

    interest.exporterCounter  = Number(exporterCounter);
    interest.status           = "negotiating";
    interest.farmerRead       = false;
    if (negotiationNotes) interest.negotiationNotes = negotiationNotes;
    await interest.save();

    // Notify farmer
    const populated = await ExportInterest.findById(interest._id).populate("listing", "name").populate("exporter", "name");
    await sendFarmerNotification({
      farmerId: interest.farmer,
      title:    "💬 Counter Offer Received",
      message:  `${populated.exporter?.name || "Exporter"} counter-offered ₹${exporterCounter} for ${populated.listing?.name}`,
      link:     "/farmer/export",
      metadata: { interestId: interest._id },
    });

    res.json({ success: true, message: "Counter offer sent", interest });
  } catch (err) {
    console.error("exporterCounterOffer:", err);
    res.status(500).json({ success: false, message: "Failed to send counter offer" });
  }
};

/* ── PATCH /api/export/interests/:id/exporter-confirm — Exporter confirms ── */
const exporterConfirmDeal = async (req, res) => {
  try {
    if (!assertRole(req.user, "exporter", res)) return;

    const { agreedPrice, agreedQty, agreedUnit, agreedDest, shipmentTerms } = req.body;
    const interest = await ExportInterest.findById(req.params.id);
    if (!interest) return res.status(404).json({ success: false, message: "Interest not found" });
    if (interest.exporter.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Not authorized" });
    if (!["accepted", "negotiating"].includes(interest.status))
      return res.status(400).json({ success: false, message: "Interest must be accepted/negotiating to confirm" });

    interest.exporterConfirmed = true;
    if (agreedPrice)   interest.agreedPrice   = Number(agreedPrice);
    if (agreedQty)     interest.agreedQty     = Number(agreedQty);
    if (agreedUnit)    interest.agreedUnit    = agreedUnit;
    if (agreedDest)    interest.agreedDest    = agreedDest;
    if (shipmentTerms) interest.shipmentTerms = shipmentTerms;
    interest.farmerRead   = false;

    if (interest.farmerConfirmed) {
      interest.status = "confirmed";
      await Crop.findByIdAndUpdate(interest.listing, { exportStatus: "committed" });
    }
    await interest.save();

    // Notify farmer
    const populated = await ExportInterest.findById(interest._id).populate("listing","name").populate("exporter","name");
    await sendFarmerNotification({
      farmerId: interest.farmer,
      title:    interest.status === "confirmed" ? "🎉 Export Deal Confirmed!" : "✅ Exporter Ready to Confirm",
      message:  interest.status === "confirmed"
        ? `Deal confirmed with ${populated.exporter?.name} for ${populated.listing?.name}. Proceed to shipment.`
        : `${populated.exporter?.name} has confirmed their side. Waiting for your confirmation on ${populated.listing?.name}.`,
      link:     "/farmer/export",
      metadata: { interestId: interest._id },
    });

    res.json({ success: true, message: interest.status === "confirmed" ? "Deal confirmed!" : "Awaiting farmer confirmation", interest });
  } catch (err) {
    console.error("exporterConfirmDeal:", err);
    res.status(500).json({ success: false, message: "Failed to confirm deal" });
  }
};

/* ── Unread counts ──────────────────────────────────────────────────────── */
const getExportStats = async (req, res) => {
  try {
    if (req.user.role === "farmer") {
      const [listingCount, pendingInterests, unreadInterests] = await Promise.all([
        Crop.countDocuments({ farmer: req.user._id, isExportListing: true }),
        ExportInterest.countDocuments({ farmer: req.user._id, status: "pending" }),
        ExportInterest.countDocuments({ farmer: req.user._id, farmerRead: false }),
      ]);
      return res.json({ success: true, listingCount, pendingInterests, unreadInterests });
    }
    if (req.user.role === "exporter") {
      const [totalInterests, unreadUpdates, activeDeals] = await Promise.all([
        ExportInterest.countDocuments({ exporter: req.user._id }),
        ExportInterest.countDocuments({ exporter: req.user._id, exporterRead: false }),
        ExportInterest.countDocuments({ exporter: req.user._id, status: { $in: ["accepted","negotiating","confirmed"] } }),
      ]);
      return res.json({ success: true, totalInterests, unreadUpdates, activeDeals });
    }
    res.status(403).json({ success: false, message: "Farmer or exporter role required" });
  } catch (err) {
    console.error("getExportStats:", err);
    res.status(500).json({ success: false, message: "Failed to load stats" });
  }
};

/* ── Mark farmer interests as read ─────────────────────────────────────── */
const markFarmerInterestsRead = async (req, res) => {
  try {
    if (!assertRole(req.user, "farmer", res)) return;
    await ExportInterest.updateMany({ farmer: req.user._id, farmerRead: false }, { farmerRead: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to mark as read" });
  }
};

module.exports = {
  // Farmer
  createExportListing,
  getFarmerExportListings,
  updateExportListing,
  deleteExportListing,
  getFarmerInterestRequests,
  respondToInterest,
  farmerCounterOffer,
  farmerConfirmDeal,
  markFarmerInterestsRead,
  // Exporter
  getAllExportListings,
  getExportListingDetail,
  expressInterest,
  getExporterInterests,
  exporterCounterOffer,
  exporterConfirmDeal,
  // Shared
  getExportStats,
};
