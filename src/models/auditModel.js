const mongoose = require("mongoose");

// Audit Schema
const auditSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: false, // Can be null for unauthenticated actions
      index: true,
    },
    userEmail: {
      type: String,
      required: false,
    },
    userName: {
      type: String,
      required: false,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    resource: {
      type: String,
      required: true,
      index: true,
    },
    resourceId: {
      type: String,
      required: false,
    },
    method: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    ip: {
      type: String,
      required: false,
    },
    userAgent: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      required: true,
      enum: ["success", "failure", "error"],
    },
    statusCode: {
      type: Number,
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
    error: {
      message: String,
      code: String,
      stack: String,
    },
    requestBody: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
    responseData: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
    duration: {
      type: Number, // in milliseconds
      required: false,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Create indexes for efficient queries
auditSchema.index({ userId: 1, createdAt: -1 });
auditSchema.index({ action: 1, createdAt: -1 });
auditSchema.index({ resource: 1, createdAt: -1 });
auditSchema.index({ status: 1, createdAt: -1 });
auditSchema.index({ createdAt: -1 });

// Create the model
const Audit = mongoose.model("Audit", auditSchema);

/**
 * Create an audit log entry
 */
const createAuditLog = async (auditData) => {
  try {
    const audit = new Audit(auditData);
    const savedAudit = await audit.save();
    return savedAudit;
  } catch (error) {
    console.error("Error creating audit log:", error);
    // Don't throw error to avoid breaking the main flow
    return null;
  }
};

/**
 * Get audit logs for a specific user
 */
const getAuditLogsByUserId = async (userId, limit = 50, skip = 0) => {
  try {
    const audits = await Audit.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    return audits;
  } catch (error) {
    throw error;
  }
};

/**
 * Get audit logs by action
 */
const getAuditLogsByAction = async (action, limit = 50, skip = 0) => {
  try {
    const audits = await Audit.find({ action })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    return audits;
  } catch (error) {
    throw error;
  }
};

/**
 * Get audit logs by resource
 */
const getAuditLogsByResource = async (resource, limit = 50, skip = 0) => {
  try {
    const audits = await Audit.find({ resource })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    return audits;
  } catch (error) {
    throw error;
  }
};

/**
 * Get audit logs by status
 */
const getAuditLogsByStatus = async (status, limit = 50, skip = 0) => {
  try {
    const audits = await Audit.find({ status })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    return audits;
  } catch (error) {
    throw error;
  }
};

/**
 * Get all audit logs with pagination
 */
const getAllAuditLogs = async (limit = 50, skip = 0) => {
  try {
    const audits = await Audit.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    return audits;
  } catch (error) {
    throw error;
  }
};

/**
 * Get audit statistics
 */
const getAuditStats = async () => {
  try {
    const stats = await Audit.aggregate([
      {
        $group: {
          _id: null,
          totalLogs: { $sum: 1 },
          successCount: {
            $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] },
          },
          failureCount: {
            $sum: { $cond: [{ $eq: ["$status", "failure"] }, 1, 0] },
          },
          errorCount: {
            $sum: { $cond: [{ $eq: ["$status", "error"] }, 1, 0] },
          },
        },
      },
    ]);

    return (
      stats[0] || {
        totalLogs: 0,
        successCount: 0,
        failureCount: 0,
        errorCount: 0,
      }
    );
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createAuditLog,
  getAuditLogsByUserId,
  getAuditLogsByAction,
  getAuditLogsByResource,
  getAuditLogsByStatus,
  getAllAuditLogs,
  getAuditStats,
};
