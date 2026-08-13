const ExportShipment = require("../models/ExportShipment");
const ExportRFQ = require("../models/ExportRFQ");
const Crop = require("../models/Crop");

// ==========================================
// GET EXPORTER DASHBOARD STATS
// GET /api/exporter/stats
// ==========================================
const getExporterStats = async (req, res) => {
  try {
    const shipments = await ExportShipment.find({ exporter: req.user._id });
    const rfqs = await ExportRFQ.find({ exporter: req.user._id });

    const activeContainers = shipments.filter(s => s.status !== "delivered" && s.status !== "cancelled").length;
    const customsCleared = shipments.filter(s => ["customs_cleared", "onboard_vessel", "delivered"].includes(s.status)).length;
    const totalVolumeTons = shipments.reduce((sum, s) => sum + (s.quantityTons || 0), 0);

    const totalRevenueUsd = shipments
      .filter(s => s.status === "delivered")
      .reduce((sum, s) => sum + (s.totalValueUsd || s.quantityTons * 3000 || 0), 0);

    return res.status(200).json({
      success: true,
      stats: {
        totalShipments: shipments.length,
        activeContainers,
        customsCleared,
        totalVolumeTons,
        rfqCount: rfqs.length,
        totalRevenueUsd,
      },
    });
  } catch (error) {
    console.error("Exporter stats error:", error);
    return res.status(500).json({ success: false, message: "Unable to load exporter stats" });
  }
};

// ==========================================
// GET EXPORTER SHIPMENTS
// GET /api/exporter/shipments
// ==========================================
const getExporterShipments = async (req, res) => {
  try {
    const shipments = await ExportShipment.find({ exporter: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, shipments });
  } catch (error) {
    console.error("Exporter shipments error:", error);
    return res.status(500).json({ success: false, message: "Unable to load shipments" });
  }
};

// ==========================================
// CREATE EXPORT SHIPMENT
// POST /api/exporter/shipments
// ==========================================
const createExportShipment = async (req, res) => {
  try {
    const { containerNo, vessel, cargo, quantityTons, portOfOrigin, destPort, destinationCountry, etd, eta } = req.body;

    if (!containerNo || !vessel || !cargo || !portOfOrigin || !destPort || !destinationCountry) {
      return res.status(400).json({ success: false, message: "All shipment details are required" });
    }

    const shipment = await ExportShipment.create({
      exporter: req.user._id,
      containerNo,
      vessel,
      cargo,
      quantityTons: Number(quantityTons || 10),
      portOfOrigin,
      destPort,
      destinationCountry,
      status: "cfs_cold_storage",
      statusStep: 1,
      etd: etd ? new Date(etd) : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      eta: eta ? new Date(eta) : new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    });

    return res.status(201).json({ success: true, message: "Container shipment created", shipment });
  } catch (error) {
    console.error("Create shipment error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to create shipment" });
  }
};

// ==========================================
// GET EXPORTER RFQS
// GET /api/exporter/rfqs
// ==========================================
const getExporterRFQs = async (req, res) => {
  try {
    const rfqs = await ExportRFQ.find({ exporter: req.user._id }).populate("crop").sort({ createdAt: -1 });
    return res.status(200).json({ success: true, rfqs });
  } catch (error) {
    console.error("Exporter RFQs error:", error);
    return res.status(500).json({ success: false, message: "Unable to load RFQs" });
  }
};

// ==========================================
// CREATE EXPORT RFQ
// POST /api/exporter/rfqs
// ==========================================
const createExportRFQ = async (req, res) => {
  try {
    const { cropId, cropName, destinationCountry, containerSize, quantityTons, packagingNotes, targetPriceUsd } = req.body;

    if (!cropName || !destinationCountry || !quantityTons) {
      return res.status(400).json({ success: false, message: "Crop name, destination country and quantity are required" });
    }

    const rfq = await ExportRFQ.create({
      exporter: req.user._id,
      crop: cropId || null,
      cropName,
      destinationCountry,
      containerSize: containerSize || "20ft Reefer (Cold)",
      quantityTons: Number(quantityTons),
      packagingNotes: packagingNotes || "",
      targetPriceUsd: targetPriceUsd ? Number(targetPriceUsd) : undefined,
      status: "pending",
    });

    return res.status(201).json({ success: true, message: "Export RFQ submitted successfully", rfq });
  } catch (error) {
    console.error("Create RFQ error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to submit RFQ" });
  }
};

module.exports = {
  getExporterStats,
  getExporterShipments,
  createExportShipment,
  getExporterRFQs,
  createExportRFQ,
};
