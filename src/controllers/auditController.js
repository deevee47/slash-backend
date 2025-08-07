const auditModel = require("../models/auditModel");
const logger = require("../utils/logger");

/**
 * Get audit logs for the authenticated user
 * GET /api/audit/logs
 */
const getUserAuditLogs = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { limit = 50, skip = 0 } = req.query;

    const logs = await auditModel.getAuditLogsByUserId(
      userId,
      parseInt(limit),
      parseInt(skip)
    );

    res.json({
      success: true,
      logs,
      pagination: {
        limit: parseInt(limit),
        skip: parseInt(skip),
        count: logs.length,
      },
    });
  } catch (error) {
    logger.error("Error fetching user audit logs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch audit logs",
    });
  }
};

/**
 * Get audit logs by action (admin only)
 * GET /api/audit/action/:action
 */
const getAuditLogsByAction = async (req, res) => {
  try {
    const { action } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    const logs = await auditModel.getAuditLogsByAction(
      action,
      parseInt(limit),
      parseInt(skip)
    );

    res.json({
      success: true,
      action,
      logs,
      pagination: {
        limit: parseInt(limit),
        skip: parseInt(skip),
        count: logs.length,
      },
    });
  } catch (error) {
    logger.error("Error fetching audit logs by action:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch audit logs",
    });
  }
};

/**
 * Get audit logs by resource (admin only)
 * GET /api/audit/resource/:resource
 */
const getAuditLogsByResource = async (req, res) => {
  try {
    const { resource } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    const logs = await auditModel.getAuditLogsByResource(
      resource,
      parseInt(limit),
      parseInt(skip)
    );

    res.json({
      success: true,
      resource,
      logs,
      pagination: {
        limit: parseInt(limit),
        skip: parseInt(skip),
        count: logs.length,
      },
    });
  } catch (error) {
    logger.error("Error fetching audit logs by resource:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch audit logs",
    });
  }
};

/**
 * Get audit logs by status (admin only)
 * GET /api/audit/status/:status
 */
const getAuditLogsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    // Validate status
    if (!["success", "failure", "error"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status. Must be 'success', 'failure', or 'error'",
      });
    }

    const logs = await auditModel.getAuditLogsByStatus(
      status,
      parseInt(limit),
      parseInt(skip)
    );

    res.json({
      success: true,
      status,
      logs,
      pagination: {
        limit: parseInt(limit),
        skip: parseInt(skip),
        count: logs.length,
      },
    });
  } catch (error) {
    logger.error("Error fetching audit logs by status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch audit logs",
    });
  }
};

/**
 * Get all audit logs (admin only)
 * GET /api/audit/all
 */
const getAllAuditLogs = async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;

    const logs = await auditModel.getAllAuditLogs(
      parseInt(limit),
      parseInt(skip)
    );

    res.json({
      success: true,
      logs,
      pagination: {
        limit: parseInt(limit),
        skip: parseInt(skip),
        count: logs.length,
      },
    });
  } catch (error) {
    logger.error("Error fetching all audit logs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch audit logs",
    });
  }
};

/**
 * Get audit statistics (admin only)
 * GET /api/audit/stats
 */
const getAuditStats = async (req, res) => {
  try {
    const stats = await auditModel.getAuditStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    logger.error("Error fetching audit statistics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch audit statistics",
    });
  }
};

module.exports = {
  getUserAuditLogs,
  getAuditLogsByAction,
  getAuditLogsByResource,
  getAuditLogsByStatus,
  getAllAuditLogs,
  getAuditStats,
};
