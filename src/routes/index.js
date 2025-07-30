const express = require("express");
const snippetRoutes = require("./snippetRoutes");
const healthRoutes = require("./healthRoutes");
const testRoutes = require("./testRoutes");
const userRoutes = require("./userRoutes");

const router = express.Router();

// API Routes
router.use("/snippets", snippetRoutes);
router.use("/user", userRoutes);
router.use("/test", testRoutes);

// Health routes (mounted at root level, not under /api)
router.use("/health", healthRoutes);

module.exports = router;
