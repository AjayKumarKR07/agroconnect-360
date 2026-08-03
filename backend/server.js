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

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

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

// Health Check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    project: "AgroConnect 360",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `AgroConnect 360 server running on port ${PORT}`
  );
});