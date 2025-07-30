const logger = require("./logger");

/**
 * Custom error class for application-specific errors
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  logger.error("Error in request", err, {
    method: req.method,
    url: req.url,
    body: req.body,
    params: req.params,
    query: req.query,
    userId: req.user?.uid,
  });

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = "Resource not found";
    error = new AppError(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = "Duplicate field value entered";
    error = new AppError(message, 409);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    error = new AppError(message, 400);
  }

  // Firebase auth errors
  if (err.code && err.code.startsWith("auth/")) {
    let message = "Authentication failed";

    switch (err.code) {
      case "auth/id-token-expired":
        message = "Token has expired";
        break;
      case "auth/id-token-revoked":
        message = "Token has been revoked";
        break;
      case "auth/argument-error":
        message = "Invalid token format";
        break;
      case "auth/user-not-found":
        message = "User not found";
        break;
      default:
        message = "Authentication failed";
    }

    error = new AppError(message, 401);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
    }),
  });
};

/**
 * Handle unhandled promise rejections
 */
const handleUnhandledRejection = (err) => {
  logger.error("Unhandled Promise Rejection", err);
  process.exit(1);
};

/**
 * Handle uncaught exceptions
 */
const handleUncaughtException = (err) => {
  logger.error("Uncaught Exception", err);
  process.exit(1);
};

module.exports = {
  AppError,
  errorHandler,
  handleUnhandledRejection,
  handleUncaughtException,
};
