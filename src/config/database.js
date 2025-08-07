const mongoose = require("mongoose");
require("dotenv").config();

let isConnected = false;

/**
 * Connect to MongoDB database
 */
const connect = async () => {
  try {
    if (isConnected) {
      return;
    }

    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/slash-backend";

    await mongoose.connect(mongoUri);

    isConnected = true;
    console.log("Connected to MongoDB database");

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
      isConnected = false;
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected");
      isConnected = false;
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
};

/**
 * Close MongoDB connection
 */
const close = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log("MongoDB connection closed");
    }
    isConnected = false;
  } catch (error) {
    console.error("Error closing MongoDB connection:", error);
    throw error;
  }
};

/**
 * Get MongoDB connection
 */
const getConnection = () => {
  return mongoose.connection;
};

/**
 * Check if database is ready
 */
const isReady = () => {
  return isConnected && mongoose.connection.readyState === 1;
};

module.exports = {
  connect,
  close,
  getConnection,
  isReady,
};
