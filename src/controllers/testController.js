const logger = require("../utils/logger");

class TestController {
  /**
   * Test endpoint for Chrome extension
   * GET /api/test
   */
  async testConnection(req, res) {
    try {
      logger.info(`Test endpoint called by: ${req.user.email}`);

      res.json({
        success: true,
        message: "Backend is connected and working!",
        timestamp: new Date().toISOString(),
        server: "Express.js with MVC Architecture",
        user: {
          uid: req.user.uid,
          email: req.user.email,
          name: req.user.name || req.user.displayName,
          emailVerified: req.user.emailVerified,
        },
        environment: process.env.NODE_ENV || "development",
        database: "MongoDB",
        authentication: "Firebase Admin SDK",
        architecture: "MVC Pattern",
      });
    } catch (error) {
      logger.error("Error in test endpoint:", error);
      res.status(500).json({
        success: false,
        error: "Test endpoint failed",
        timestamp: new Date().toISOString(),
      });
    }
  }
}

module.exports = new TestController();
