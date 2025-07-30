const express = require("express");
const testController = require("../controllers/testController");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

// Apply authentication middleware to test routes
router.use(verifyToken);

// GET /api/test - Test endpoint for Chrome extension connectivity
router.get("/", testController.testConnection);

module.exports = router;
