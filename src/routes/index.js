const express = require("express");
const snippetRoutes = require("./snippetRoutes");
const healthRoutes = require("./healthRoutes");
const userRoutes = require("./userRoutes");
const auditRoutes = require("./auditRoutes");

const router = express.Router();

// API Routes
router.use("/snippets", snippetRoutes);
router.use("/user", userRoutes);
router.use("/audit-logs", auditRoutes);

// Health routes (mounted at root level, not under /api)
router.use("/health", healthRoutes);

module.exports = router;
