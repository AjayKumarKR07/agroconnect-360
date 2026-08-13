const ComplianceDoc = require("../models/ComplianceDoc");

/* GET /api/compliance — list all docs for logged-in exporter */
const getDocs = async (req, res) => {
  try {
    const docs = await ComplianceDoc.find({ exporter: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, docs });
  } catch (err) {
    console.error("getDocs:", err);
    res.status(500).json({ success: false, message: "Failed to load documents" });
  }
};

/* POST /api/compliance — create a new compliance doc */
const createDoc = async (req, res) => {
  try {
    const { title, authority, docType, status, validFrom, validTill, isLifetime, refNumber, notes } = req.body;

    if (!title) return res.status(400).json({ success: false, message: "Document title is required" });

    const doc = await ComplianceDoc.create({
      exporter: req.user._id,
      title: title.trim(),
      authority: authority || "",
      docType:   docType   || "Other",
      status:    status    || "ACTIVE",
      validFrom: validFrom ? new Date(validFrom) : null,
      validTill: validTill ? new Date(validTill) : null,
      isLifetime: Boolean(isLifetime),
      refNumber: refNumber || "",
      notes:     notes     || "",
    });

    res.status(201).json({ success: true, message: "Document added", doc });
  } catch (err) {
    console.error("createDoc:", err);
    res.status(500).json({ success: false, message: "Failed to create document" });
  }
};

/* PATCH /api/compliance/:id/status — update status only */
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["VERIFIED", "ACTIVE", "RENEWAL DUE", "EXPIRED", "PENDING"];
    if (!allowed.includes(status)) return res.status(400).json({ success: false, message: "Invalid status" });

    const doc = await ComplianceDoc.findOneAndUpdate(
      { _id: req.params.id, exporter: req.user._id },
      { status },
      { new: true }
    );
    if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
    res.json({ success: true, doc });
  } catch (err) {
    console.error("updateStatus:", err);
    res.status(500).json({ success: false, message: "Failed to update status" });
  }
};

/* DELETE /api/compliance/:id */
const deleteDoc = async (req, res) => {
  try {
    const doc = await ComplianceDoc.findOneAndDelete({ _id: req.params.id, exporter: req.user._id });
    if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
    res.json({ success: true, message: "Document deleted" });
  } catch (err) {
    console.error("deleteDoc:", err);
    res.status(500).json({ success: false, message: "Failed to delete document" });
  }
};

module.exports = { getDocs, createDoc, updateStatus, deleteDoc };
