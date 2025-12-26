const express = require("express");
const userController = require("../controllers/userController");
const verifyAccessToken = require("../middleware/verifyAccessToken");

const router = express.Router();

// Apply authentication middleware to all user routes
router.use(verifyAccessToken);

// GET /api/user/me - Get current authenticated user
router.get("/me", userController.getMe);

// POST /api/user/sync - Sync user data on login
router.post("/sync", userController.syncUser);

// GET /api/user/profile - Get user profile
router.get("/profile", userController.getUserProfile);

// GET /api/user/stats - Get user statistics
router.get("/stats", userController.getUserStats);

// PUT /api/user/login - Update last login time
router.put("/login", userController.updateLastLogin);

// DELETE /api/user/account - Delete user account
router.delete("/account", userController.deleteAccount);

module.exports = router;
