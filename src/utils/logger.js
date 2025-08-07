/**
 * Simple logging utility
 * Can be extended to use more sophisticated logging libraries like Winston
 */

const isDevelopment = process.env.NODE_ENV !== "production";

/**
 * Log info message
 */
const info = (message, meta = {}) => {
  console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta);
};

/**
 * Log error message
 */
const error = (message, error = null, meta = {}) => {
  console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, {
    error: error
      ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        }
      : null,
    ...meta,
  });
};

/**
 * Log warning message
 */
const warn = (message, meta = {}) => {
  console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta);
};

/**
 * Log debug message (only in development)
 */
const debug = (message, meta = {}) => {
  if (isDevelopment) {
    console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, meta);
  }
};

/**
 * Log request information
 */
const request = (req, res, responseTime) => {
  const logData = {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get("User-Agent"),
    ip: req.ip,
  };

  if (req.user) {
    logData.userId = req.user.uid;
  }

  info(`${req.method} ${req.url} - ${res.statusCode}`, logData);
};

module.exports = {
  info,
  error,
  warn,
  debug,
  request,
};
