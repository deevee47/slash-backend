const mongoose = require("mongoose");
require("dotenv").config();

class Database {
  constructor() {
    this.isConnected = false;
  }

  async connect() {
    try {
      if (this.isConnected) {
        return;
      }

      const mongoUri =
        process.env.MONGODB_URI || "mongodb://localhost:27017/slash-backend";

      await mongoose.connect(mongoUri);

      this.isConnected = true;
      console.log("Connected to MongoDB database");

      // Handle connection events
      mongoose.connection.on("error", (err) => {
        console.error("MongoDB connection error:", err);
        this.isConnected = false;
      });

      mongoose.connection.on("disconnected", () => {
        console.log("MongoDB disconnected");
        this.isConnected = false;
      });
    } catch (error) {
      console.error("Error connecting to MongoDB:", error);
      throw error;
    }
  }

  async close() {
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
        console.log("MongoDB connection closed");
      }
      this.isConnected = false;
    } catch (error) {
      console.error("Error closing MongoDB connection:", error);
      throw error;
    }
  }

  getConnection() {
    return mongoose.connection;
  }

  isReady() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }
}

module.exports = new Database();
