/**
 * MongoDB connection test script
 * Usage: node test-mongodb.js
 */

const mongoose = require("mongoose");
require("dotenv").config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/slash-backend";

async function testConnection() {
  console.log("🧪 Testing MongoDB Connection...");
  console.log("================================");

  try {
    console.log(`📡 Connecting to: ${MONGODB_URI}`);

    await mongoose.connect(MONGODB_URI);

    console.log("✅ MongoDB connected successfully!");

    // Test database operations
    const testSchema = new mongoose.Schema({
      name: String,
      createdAt: { type: Date, default: Date.now },
    });

    const TestModel = mongoose.model("Test", testSchema);

    // Create a test document
    console.log("📝 Creating test document...");
    const testDoc = new TestModel({ name: "Connection Test" });
    await testDoc.save();
    console.log("✅ Test document created:", testDoc._id);

    // Read the test document
    console.log("📖 Reading test document...");
    const foundDoc = await TestModel.findById(testDoc._id);
    console.log("✅ Test document found:", foundDoc.name);

    // Delete the test document
    console.log("🗑️ Cleaning up test document...");
    await TestModel.findByIdAndDelete(testDoc._id);
    console.log("✅ Test document deleted");

    // Check database info
    try {
      const dbStats = await mongoose.connection.db.stats();
      console.log("📊 Database stats:", {
        name: mongoose.connection.name,
        collections: dbStats.collections,
        dataSize: `${(dbStats.dataSize / 1024).toFixed(2)} KB`,
        storageSize: `${(dbStats.storageSize / 1024).toFixed(2)} KB`,
      });
    } catch (error) {
      console.log("📊 Database connected successfully (stats unavailable)");
    }

    console.log("\n✨ All tests passed! MongoDB is ready for use.");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);

    if (error.code === "ECONNREFUSED") {
      console.error("\n💡 Troubleshooting tips:");
      console.error("1. Make sure MongoDB is running");
      console.error("2. Check if the connection string is correct");
      console.error("3. For local MongoDB: mongod --dbpath /data/db");
      console.error("4. For Docker: docker run -d -p 27017:27017 mongo");
    }

    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run the test
testConnection();
