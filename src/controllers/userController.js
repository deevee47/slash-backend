const userModel = require("../models/userModel");
const logger = require("../utils/logger");

class UserController {
  /**
   * Sync user data on login
   * POST /api/user/sync
   */
  async syncUser(req, res) {
    try {
      const { uid, email, displayName, photoURL, lastLoginAt } = req.body;

      // Validate that the token user matches the request data
      if (req.user.uid !== uid) {
        logger.warn(`User ID mismatch: token=${req.user.uid}, body=${uid}`);
        return res.status(403).json({
          success: false,
          error: "User ID mismatch",
        });
      }

      // Validate required fields
      if (!uid || !email || !lastLoginAt) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: uid, email, lastLoginAt",
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: "Invalid email format",
        });
      }

      logger.info(`Syncing user: ${email} (${uid})`);

      // Sync user to database
      const userData = await userModel.syncUser({
        uid,
        email,
        displayName,
        photoURL,
        lastLoginAt,
      });

      logger.info(`User synced successfully: ${email}`);

      res.json({
        success: true,
        message: "User synced successfully",
        user: userData,
      });
    } catch (error) {
      logger.error("Error syncing user:", error);

      // Handle specific error types
      if (error.code === "DUPLICATE_EMAIL") {
        return res.status(409).json({
          success: false,
          error: error.message,
        });
      }

      // Handle validation errors
      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          error: "Invalid user data",
          details: Object.values(error.errors).map((e) => e.message),
        });
      }

      res.status(500).json({
        success: false,
        error: "Failed to sync user",
      });
    }
  }

  /**
   * Get user profile
   * GET /api/user/profile
   */
  async getUserProfile(req, res) {
    try {
      const userId = req.user.uid;

      const user = await userModel.findByUid(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      res.json({
        success: true,
        user,
      });
    } catch (error) {
      logger.error("Error fetching user profile:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch user profile",
      });
    }
  }

  /**
   * Get user statistics
   * GET /api/user/stats
   */
  async getUserStats(req, res) {
    try {
      const userId = req.user.uid;

      const stats = await userModel.getUserStats(userId);

      if (!stats) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      logger.error("Error fetching user stats:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch user statistics",
      });
    }
  }

  /**
   * Update last login time
   * PUT /api/user/login
   */
  async updateLastLogin(req, res) {
    try {
      const userId = req.user.uid;

      const user = await userModel.updateLastLogin(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      res.json({
        success: true,
        message: "Last login updated",
        lastLoginAt: user.lastLoginAt,
      });
    } catch (error) {
      logger.error("Error updating last login:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update last login",
      });
    }
  }

  /**
   * Delete user account
   * DELETE /api/user/account
   */
  async deleteAccount(req, res) {
    try {
      const userId = req.user.uid;

      logger.info(`Deleting user account: ${req.user.email} (${userId})`);

      const deleted = await userModel.deleteUser(userId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      logger.info(`User account deleted: ${req.user.email}`);

      res.json({
        success: true,
        message: "User account deleted successfully",
      });
    } catch (error) {
      logger.error("Error deleting user account:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete user account",
      });
    }
  }
}

module.exports = new UserController();
