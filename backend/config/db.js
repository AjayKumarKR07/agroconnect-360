const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error("⚠️  MongoDB connection failed:", error.message);
    console.error(
      "👉 ACTION REQUIRED: Add your current IP to MongoDB Atlas Network Access:\n" +
      "   https://cloud.mongodb.com → Network Access → Add IP Address\n" +
      "   The server will keep running and retry when MongoDB reconnects."
    );
    // Do NOT exit — let the server stay alive so the IP can be whitelisted
    // Mongoose will auto-reconnect once Atlas allows the connection
  }
};

module.exports = connectDB;