const database = require("../config/database");

/**
 * Health check endpoint
 * GET /health
 */
const healthCheck = async (req, res) => {
  try {
    const response = {
      success: true,
      message: "Slash is running",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
    };

    // Check database connection
    if (database.isReady()) {
      response.database = "connected";
    } else {
      response.database = "disconnected";
      response.success = false;
      response.message = "Database connection issue";
    }

    const statusCode = response.success ? 200 : 503;
    res.status(statusCode).json(response);
  } catch (error) {
    console.error("Health check error:", error);
    res.status(503).json({
      success: false,
      message: "Service unavailable",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
};


module.exports = {
  healthCheck,
};
