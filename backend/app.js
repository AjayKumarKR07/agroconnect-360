/**
 * app.js — Express app factory (no server.listen call)
 * Used by both server.js (production) and tests (jest + supertest).
 * Separating app creation from server.listen allows supertest to bind its
 * own ephemeral port without port conflicts between tests.
 */

const express   = require("express");
const cors      = require("cors");
const mongoose  = require("mongoose");

const paymentRoutes      = require("./routes/paymentRoutes");
const authRoutes         = require("./routes/authRoutes");
const profileRoutes      = require("./routes/profileRoutes");
const cropRoutes         = require("./routes/cropRoutes");
const orderRoutes        = require("./routes/orderRoutes");
const weatherRoutes      = require("./routes/weatherRoutes");
const diagnosisRoutes    = require("./routes/diagnosisRoutes");
const priceRoutes        = require("./routes/priceRoutes");
const assistantRoutes    = require("./routes/assistantRoutes");
const inputRoutes        = require("./routes/inputRoutes");
const sellerRoutes       = require("./routes/sellerRoutes");
const exporterRoutes     = require("./routes/exporterRoutes");
const exportRoutes       = require("./routes/exportRoutes");
const adminRoutes        = require("./routes/adminRoutes");
const smartFarmRoutes    = require("./routes/smartFarmRoutes");
const farmerRoutes       = require("./routes/farmerRoutes");
const contractRoutes     = require("./routes/contractRoutes");
const complianceRoutes   = require("./routes/complianceRoutes");
const disputeRoutes      = require("./routes/disputeRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");

const DEV_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
];
const PROD_ORIGINS = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean)
  : [];
const ALLOWED_ORIGINS = [...DEV_ORIGINS, ...PROD_ORIGINS];

const app = express();

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

// express.json() must run BEFORE payment routes so req.body is available
// The webhook route handles raw body itself via express.raw() at route level
app.use(express.json());

app.use("/api/payment", paymentRoutes);

app.use("/api/auth",          authRoutes);
app.use("/api/profile",       profileRoutes);
app.use("/api/crops",         cropRoutes);
app.use("/api/orders",        orderRoutes);
app.use("/api/weather",       weatherRoutes);
app.use("/api/diagnosis",     diagnosisRoutes);
app.use("/api/prices",        priceRoutes);
app.use("/api/assistant",     assistantRoutes);
app.use("/api/inputs",        inputRoutes);
app.use("/api/seller",        sellerRoutes);
app.use("/api/exporter",      exporterRoutes);
app.use("/api/export",        exportRoutes);
app.use("/api/admin",         adminRoutes);
app.use("/api/farmer",        smartFarmRoutes);
app.use("/api/farmer",        farmerRoutes);
app.use("/api/contracts",     contractRoutes);
app.use("/api/compliance",    complianceRoutes);
app.use("/api/disputes",      disputeRoutes);
app.use("/api/subscriptions", subscriptionRoutes);

app.get("/", (_req, res) =>
  res.json({ success: true, message: "AgroConnect 360 API is running" })
);

app.get("/api/health", (_req, res) =>
  res.status(200).json({
    success:  true,
    status:   "healthy",
    project:  "AgroConnect 360",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  })
);

module.exports = app;
