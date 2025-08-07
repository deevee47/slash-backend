const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Import configurations
const database = require("./config/database");
const firebaseConfig = require("./config/firebase");

// Import middleware
const requestLogger = require("./middleware/requestLogger");
const auditLogger = require("./middleware/auditLogger");
const { errorHandler } = require("./utils/errorHandler");

// Import routes
const apiRoutes = require("./routes/index");
const healthRoutes = require("./routes/healthRoutes");

// Import utilities
const logger = require("./utils/logger");

/**
 * Initialize middleware for the Express app
 */
const initializeMiddleware = (app) => {
  // CORS configuration - Allow from anywhere
  app.use(
    cors({
      origin: true, // Allow all origins
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  );

  // Body parsing middleware
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Request logging
  if (process.env.NODE_ENV !== "test") {
    app.use(requestLogger);
  }

  // Audit logging (should be after request logger but before routes)
  app.use(auditLogger);

  // Security headers
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    next();
  });
};

/**
 * Initialize routes for the Express app
 */
const initializeRoutes = (app) => {
  // Health check routes (no /api prefix)
  app.use("/health", healthRoutes);

  // API routes
  app.use("/api", apiRoutes);

  // Root endpoint
  app.get("/", (req, res) => {
    res.json({
      success: true,
      message: "Slash Backend API",
      version: process.env.npm_package_version || "1.0.0",
      architecture: "MVC Pattern with MongoDB",
      documentation: "/api/docs", // For future API documentation
      health: "/health",
      endpoints: {
        test: "/api/test",
        snippets: "/api/snippets",
        user: "/api/user",
        audit: "/api/audit",
        health: "/health",
      },
    });
  });

  // Handle 404 for unknown routes
  app.use("*", (req, res) => {
    res.status(404).json({
      success: false,
      error: "Route not found",
      path: req.originalUrl,
    });
  });
};

/**
 * Initialize error handling for the Express app
 */
const initializeErrorHandling = (app) => {
  // Global error handler (must be last)
  app.use(errorHandler);
};

/**
 * Create and configure the Express application
 */
const createApp = () => {
  const app = express();

  initializeMiddleware(app);
  initializeRoutes(app);
  initializeErrorHandling(app);

  return app;
};

/**
 * Initialize the application (database, Firebase, etc.)
 */
const initialize = async () => {
  try {
    logger.info("Initializing application...");

    // Initialize Firebase
    await firebaseConfig.initialize();
    logger.info("Firebase configuration initialized");

    // Connect to database
    await database.connect();
    logger.info("Database connection established");

    logger.info("Application initialization completed");
  } catch (error) {
    logger.error("Failed to initialize application", error);
    throw error;
  }
};

/**
 * Cleanup application resources
 */
const cleanup = async () => {
  try {
    logger.info("Starting application cleanup...");

    await database.close();
    logger.info("Database connection closed");

    logger.info("Application cleanup completed");
  } catch (error) {
    logger.error("Error during cleanup", error);
    throw error;
  }
};

module.exports = {
  createApp,
  initialize,
  cleanup,
};
