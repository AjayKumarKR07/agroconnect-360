const ExportContract = require("../models/ExportContract");

const authExporter = (req, res) => {
  if (req.user.role !== "exporter") {
    res.status(403).json({ success: false, message: "Exporter access required" });
    return false;
  }
  return true;
};

/* GET /api/contracts — list all contracts for exporter */
const getContracts = async (req, res) => {
  try {
    if (!authExporter(req, res)) return;
    const contracts = await ExportContract.find({ exporter: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, contracts });
  } catch (err) {
    console.error("getContracts:", err);
    res.status(500).json({ success: false, message: "Failed to load contracts" });
  }
};

/* POST /api/contracts — create new contract */
const createContract = async (req, res) => {
  try {
    if (!authExporter(req, res)) return;
    const { lcRef, lcType, buyerName, buyerCountry, issuingBank, cropName, quantityTons, contractValueUsd, milestones, notes } = req.body;

    if (!buyerName) return res.status(400).json({ success: false, message: "Buyer name is required" });
    if (!cropName)  return res.status(400).json({ success: false, message: "Crop / commodity name is required" });
    if (!contractValueUsd || Number(contractValueUsd) <= 0)
      return res.status(400).json({ success: false, message: "Contract value must be greater than 0" });

    const contract = await ExportContract.create({
      exporter: req.user._id,
      lcRef:    lcRef || "",
      lcType:   lcType || "Irrevocable LC at Sight",
      buyerName,
      buyerCountry: buyerCountry || "",
      issuingBank:  issuingBank  || "",
      cropName,
      quantityTons: Number(quantityTons) || 0,
      contractValueUsd: Number(contractValueUsd),
      milestones: Array.isArray(milestones) ? milestones : [
        { label: "20% Advance",     percentage: 20, released: false },
        { label: "50% BL Onboard",  percentage: 50, released: false },
        { label: "30% Port Customs",percentage: 30, released: false },
      ],
      notes: notes || "",
    });

    res.status(201).json({ success: true, message: "Contract created", contract });
  } catch (err) {
    console.error("createContract:", err);
    res.status(500).json({ success: false, message: "Failed to create contract" });
  }
};

/* PATCH /api/contracts/:id/milestone — toggle a milestone released */
const toggleMilestone = async (req, res) => {
  try {
    if (!authExporter(req, res)) return;
    const { milestoneIndex, released } = req.body;

    const contract = await ExportContract.findById(req.params.id);
    if (!contract) return res.status(404).json({ success: false, message: "Contract not found" });
    if (contract.exporter.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Not authorized" });

    if (milestoneIndex === undefined || !contract.milestones[milestoneIndex])
      return res.status(400).json({ success: false, message: "Invalid milestone index" });

    contract.milestones[milestoneIndex].released = Boolean(released);

    // Auto-complete if all milestones released
    if (contract.milestones.every(m => m.released)) contract.status = "completed";
    else if (contract.status === "completed") contract.status = "active";

    await contract.save();
    res.json({ success: true, message: "Milestone updated", contract });
  } catch (err) {
    console.error("toggleMilestone:", err);
    res.status(500).json({ success: false, message: "Failed to update milestone" });
  }
};

/* DELETE /api/contracts/:id */
const deleteContract = async (req, res) => {
  try {
    if (!authExporter(req, res)) return;
    const contract = await ExportContract.findById(req.params.id);
    if (!contract) return res.status(404).json({ success: false, message: "Contract not found" });
    if (contract.exporter.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Not authorized" });
    await contract.deleteOne();
    res.json({ success: true, message: "Contract deleted" });
  } catch (err) {
    console.error("deleteContract:", err);
    res.status(500).json({ success: false, message: "Failed to delete contract" });
  }
};

module.exports = { getContracts, createContract, toggleMilestone, deleteContract };
