/**
 * Simple logging utility
 * Can be extended to use more sophisticated logging libraries like Winston
 */

class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== "production";
  }

  info(message, meta = {}) {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta);
  }

  error(message, error = null, meta = {}) {
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
  }

  warn(message, meta = {}) {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta);
  }

  debug(message, meta = {}) {
    if (this.isDevelopment) {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, meta);
    }
  }

  request(req, res, responseTime) {
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

    this.info(`${req.method} ${req.url} - ${res.statusCode}`, logData);
  }
}

module.exports = new Logger();
