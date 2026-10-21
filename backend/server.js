const dns = require("node:dns");

dns.setDefaultResultOrder("ipv4first");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

// Load environment variables FIRST
dotenv.config();


// Import local modules AFTER dotenv is loaded
const connectDB = require("./config/db");
const paymentRoutes = require("./routes/paymentRoutes");  // must be before express.json()
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const cropRoutes = require("./routes/cropRoutes");
const orderRoutes = require(
  "./routes/orderRoutes"
);
const weatherRoutes = require(
  "./routes/weatherRoutes"
);
const diagnosisRoutes = require(
  "./routes/diagnosisRoutes"
);
const priceRoutes = require(
  "./routes/priceRoutes"
);
const assistantRoutes = require(
  "./routes/assistantRoutes"
);
const inputRoutes = require(
  "./routes/inputRoutes"
);
const sellerRoutes = require(
  "./routes/sellerRoutes"
);
const exporterRoutes = require(
  "./routes/exporterRoutes"
);
const exportRoutes = require(
  "./routes/exportRoutes"
);
const adminRoutes = require(
  "./routes/adminRoutes"
);
const smartFarmRoutes = require(
  "./routes/smartFarmRoutes"
);
const farmerRoutes = require(
  "./routes/farmerRoutes"
);
const contractRoutes = require(
  "./routes/contractRoutes"
);
const complianceRoutes = require(
  "./routes/complianceRoutes"
);
const disputeRoutes = require(
  "./routes/disputeRoutes"
);
const subscriptionRoutes = require(
  "./routes/subscriptionRoutes"
);


// Connect to MongoDB
connectDB();

const app = express();

// ── CORS ─────────────────────────────────────────────────────────────────────
// In production (NODE_ENV=production) only the configured CORS_ORIGIN is
// allowed. In development, Vite dev server ports are also permitted.
const DEV_ORIGINS =
  process.env.NODE_ENV !== "production"
    ? [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:5177",
        "http://localhost:5178",
        "http://localhost:5179",
      ]
    : [];

// CORS_ORIGIN can be a comma-separated list for production
// e.g. "https://app.agroconnect360.com,https://www.agroconnect360.com"
const PROD_ORIGINS = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean)
  : [];

const ALLOWED_ORIGINS = [...DEV_ORIGINS, ...PROD_ORIGINS];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

app.use(express.json());

// Payment routes (webhook uses route-level express.raw() to receive raw buffer)
app.use("/api/payment", paymentRoutes);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/crops", cropRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/weather", weatherRoutes);
app.use(
  "/api/diagnosis",
  diagnosisRoutes
);
app.use(
  "/api/prices",
  priceRoutes
);
app.use(
  "/api/assistant",
  assistantRoutes
);
app.use(
  "/api/inputs",
  inputRoutes
);
app.use(
  "/api/seller",
  sellerRoutes
);
app.use(
  "/api/exporter",
  exporterRoutes
);
app.use(
  "/api/export",
  exportRoutes
);
app.use(
  "/api/admin",
  adminRoutes
);
app.use(
  "/api/farmer",
  smartFarmRoutes  // routes: /smart-farm-plan, /smart-farm-plans
);
app.use(
  "/api/farmer",
  farmerRoutes     // routes: /analytics, /notifications
  // Both routers share /api/farmer — Express chains them correctly.
  // smartFarmRoutes handles /smart-farm-plan(s); farmerRoutes handles /analytics + /notifications.
);
app.use(
  "/api/contracts",
  contractRoutes
);
app.use(
  "/api/compliance",
  complianceRoutes
);
app.use(
  "/api/disputes",
  disputeRoutes
);
app.use(
  "/api/subscriptions",
  subscriptionRoutes
);


console.log(
  "Data.gov API key loaded:",
  !!process.env.DATA_GOV_API_KEY
);
// Root API
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AgroConnect 360 API is running",
  });
});

// ── Liveness probe (/api/health) ─────────────────────────────────────────────
// Always returns 200 if the Node.js process is alive.
// Used by: ECS container HEALTHCHECK, Dockerfile HEALTHCHECK
// Must NOT fail solely because MongoDB is disconnected.
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "alive",
    project: "AgroConnect 360",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

// ── Readiness probe (/api/ready) ──────────────────────────────────────────────
// Returns 200 only when MongoDB is connected and the app can serve requests.
// Returns 503 when the database is unavailable.
// Used by: ALB target group health check (routes traffic only to ready tasks)
app.get("/api/ready", (req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  if (dbReady) {
    return res.status(200).json({
      success: true,
      status: "ready",
      database: "connected",
    });
  }
  res.status(503).json({
    success: false,
    status: "not_ready",
    database: "disconnected",
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `AgroConnect 360 server running on port ${PORT}`
  );
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
// ECS Fargate (and any POSIX runtime) sends SIGTERM on container stop.
// We close the HTTP server first (no new connections), then MongoDB,
// with a hard timeout so we never get stuck.
let _shuttingDown = false;

const shutdown = (signal) => {
  if (_shuttingDown) return;
  _shuttingDown = true;
  console.log(`[${signal}] Graceful shutdown initiated`);

  // Force-exit after 20 s if something hangs
  const timer = setTimeout(() => {
    console.error("Shutdown timeout — forcing exit");
    process.exit(1);
  }, 20_000);
  timer.unref(); // don't let this timer keep the process alive

  server.close(async () => {
    try {
      await mongoose.connection.close();
      console.log("MongoDB connection closed");
    } catch (err) {
      console.error("Error closing MongoDB:", err.message);
    } finally {
      clearTimeout(timer);
      process.exit(0);
    }
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));