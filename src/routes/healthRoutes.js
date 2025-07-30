const express = require("express");
const healthController = require("../controllers/healthController");

const router = express.Router();

// GET /health - Basic health check (no authentication required)
router.get("/", healthController.healthCheck);

// GET /status - Detailed system status (no authentication required)
router.get("/status", healthController.systemStatus);

module.exports = router;
