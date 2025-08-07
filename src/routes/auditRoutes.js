const express = require("express");
const auditController = require("../controllers/auditController");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

// Apply authentication middleware to all audit routes
router.use(verifyToken);

// GET /api/audit/logs - Get audit logs for the authenticated user
router.get("/logs", auditController.getUserAuditLogs);

// GET /api/audit/action/:action - Get audit logs by action (admin only)
router.get("/action/:action", auditController.getAuditLogsByAction);

// GET /api/audit/resource/:resource - Get audit logs by resource (admin only)
router.get("/resource/:resource", auditController.getAuditLogsByResource);

// GET /api/audit/status/:status - Get audit logs by status (admin only)
router.get("/status/:status", auditController.getAuditLogsByStatus);

// GET /api/audit/all - Get all audit logs (admin only)
router.get("/all", auditController.getAllAuditLogs);

// GET /api/audit/stats - Get audit statistics (admin only)
router.get("/stats", auditController.getAuditStats);

module.exports = router;
