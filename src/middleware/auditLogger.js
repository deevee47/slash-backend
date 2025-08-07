const auditModel = require("../models/auditModel");

/**
 * Audit logging middleware
 * Captures all request/response data for audit purposes
 */
const auditLogger = (req, res, next) => {
  const startTime = Date.now();

  // Store original response methods
  const originalSend = res.send;
  const originalJson = res.json;
  const originalStatus = res.status;

  let responseData = null;
  let statusCode = 200;

  // Override res.status to capture status code
  res.status = function (code) {
    statusCode = code;
    return originalStatus.call(this, code);
  };

  // Override res.json to capture response data
  res.json = function (data) {
    responseData = data;
    return originalJson.call(this, data);
  };

  // Override res.send to capture response data
  res.send = function (data) {
    responseData = data;
    return originalSend.call(this, data);
  };

  // Capture the response after it's sent
  res.on("finish", async () => {
    try {
      const duration = Date.now() - startTime;

      // Determine action and resource from URL
      const urlParts = req.path.split("/").filter((part) => part);
      const resource = urlParts[1] || "unknown"; // /api/resource/...
      const action = getActionFromMethodAndPath(req.method, req.path);

      // Determine status
      let status = "success";
      if (statusCode >= 400 && statusCode < 500) {
        status = "failure";
      } else if (statusCode >= 500) {
        status = "error";
      }

      // Prepare audit data
      const auditData = {
        userId: req.user?.uid || null,
        userEmail: req.user?.email || null,
        userName: req.user?.name || req.user?.displayName || null,
        action,
        resource,
        resourceId: req.params?.id || null,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        status,
        statusCode,
        details: {
          params: req.params,
          query: req.query,
        },
        requestBody:
          req.body && Object.keys(req.body).length > 0 ? req.body : null,
        responseData,
        duration,
      };

      // Add error details if present
      if (status === "error" && responseData?.error) {
        auditData.error = {
          message: responseData.error,
          code: responseData.code || null,
        };
      }

      // Create audit log (non-blocking)
      auditModel.createAuditLog(auditData).catch((err) => {
        console.error("Failed to create audit log:", err);
      });
    } catch (error) {
      console.error("Error in audit logger:", error);
    }
  });

  next();
};

/**
 * Helper function to determine action from HTTP method and path
 */
const getActionFromMethodAndPath = (method, path) => {
  const pathParts = path.split("/").filter((part) => part);

  // Handle specific routes
  if (path === "/health") return "health_check";
  if (path === "/status") return "system_status";
  if (path === "/api/test") return "test_connection";

  // Handle user routes
  if (path.startsWith("/api/user")) {
    if (path === "/api/user/sync") return "user_sync";
    if (path === "/api/user/profile") return "get_user_profile";
    if (path === "/api/user/stats") return "get_user_stats";
    if (path === "/api/user/login") return "update_last_login";
    if (path === "/api/user/account") return "delete_user_account";
  }

  // Handle snippet routes
  if (path.startsWith("/api/snippets")) {
    if (method === "GET" && path === "/api/snippets") return "get_all_snippets";
    if (method === "POST" && path === "/api/snippets") return "create_snippet";
    if (method === "GET" && path.match(/^\/api\/snippets\/[^\/]+$/))
      return "get_snippet";
    if (method === "PUT" && path.match(/^\/api\/snippets\/[^\/]+$/))
      return "update_snippet";
    if (method === "DELETE" && path.match(/^\/api\/snippets\/[^\/]+$/))
      return "delete_snippet";
    if (method === "POST" && path.match(/^\/api\/snippets\/[^\/]+\/usage$/))
      return "increment_snippet_usage";
  }

  // Generic actions based on HTTP method
  switch (method) {
    case "GET":
      return "read";
    case "POST":
      return "create";
    case "PUT":
      return "update";
    case "PATCH":
      return "update";
    case "DELETE":
      return "delete";
    default:
      return "unknown";
  }
};

module.exports = auditLogger;
