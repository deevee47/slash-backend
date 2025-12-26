const userModel = require("../models/userModel");
const logger = require("../utils/logger");

/**
 * Sync user data on login
 * POST /api/user/sync
 */
const syncUser = async (req, res) => {
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
};

/**
 * Get current authenticated user (for new auth system)
 * GET /api/user/me
 */
const getMe = async (req, res) => {
  try {
    // req.userId is set by verifyAccessToken middleware (MongoDB _id)
    const user = await userModel.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    res.json({
      user: {
        firebaseUid: user.firebaseUid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (error) {
    logger.error("Error fetching current user:", error);
    res.status(500).json({
      error: "Failed to get user",
      code: "SERVER_ERROR",
    });
  }
};

/**
 * Get user profile
 * GET /api/user/profile
 */
const getUserProfile = async (req, res) => {
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
};

/**
 * Get user statistics
 * GET /api/user/stats
 */
const getUserStats = async (req, res) => {
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
};

/**
 * Update last login time
 * PUT /api/user/login
 */
const updateLastLogin = async (req, res) => {
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
};

/**
 * Delete user account
 * DELETE /api/user/account
 */
const deleteAccount = async (req, res) => {
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
};

module.exports = {
  getMe,
  syncUser,
  getUserProfile,
  getUserStats,
  updateLastLogin,
  deleteAccount,
};
