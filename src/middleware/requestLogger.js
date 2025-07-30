const logger = require("../utils/logger");

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function (...args) {
    const responseTime = Date.now() - startTime;
    logger.request(req, res, responseTime);
    originalEnd.apply(this, args);
  };

  next();
};

module.exports = requestLogger;
