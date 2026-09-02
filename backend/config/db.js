const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("❌ MONGO_URI is not defined in .env");
    return;
  }

  console.log("🔌 Connecting to MongoDB...");

  const tryConnect = async () => {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
      });
      console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);
    } catch (error) {
      console.error("⚠️  MongoDB connection failed:", error.message);
      console.log("🔄 Retrying in 5 seconds...");
      setTimeout(tryConnect, 5000);
    }
  };

  await tryConnect();
};

module.exports = connectDB;
