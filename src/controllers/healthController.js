const database = require("../config/database");

class HealthController {
  /**
   * Health check endpoint
   * GET /health
   */
  async healthCheck(req, res) {
    try {
      const response = {
        success: true,
        message: "Server is running",
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
  }

  /**
   * Detailed system status endpoint
   * GET /status
   */
  async systemStatus(req, res) {
    try {
      const status = {
        success: true,
        timestamp: new Date().toISOString(),
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          version: process.version,
          platform: process.platform,
          arch: process.arch,
        },
        database: {
          status: database.isReady() ? "connected" : "disconnected",
          readyState: database.getConnection().readyState,
        },
        environment: {
          nodeEnv: process.env.NODE_ENV || "development",
          port: process.env.PORT || 5000,
        },
      };

      res.json(status);
    } catch (error) {
      console.error("System status error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get system status",
        timestamp: new Date().toISOString(),
      });
    }
  }
}

module.exports = new HealthController();
