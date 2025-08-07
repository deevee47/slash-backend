const { createApp, initialize, cleanup } = require("./src/app");
const logger = require("./src/utils/logger");
const {
  handleUnhandledRejection,
  handleUncaughtException,
} = require("./src/utils/errorHandler");

const PORT = process.env.PORT || 5000;

// Handle uncaught exceptions and unhandled rejections
process.on("uncaughtException", handleUncaughtException);
process.on("unhandledRejection", handleUnhandledRejection);

async function startServer() {
  try {
    // Initialize the application
    await initialize();

    // Create the Express app
    const app = createApp();

    const server = app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`, {
        port: PORT,
        environment: process.env.NODE_ENV || "development",
      });
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);

      server.close(async () => {
        try {
          await cleanup();
          logger.info("Graceful shutdown completed");
          process.exit(0);
        } catch (error) {
          logger.error("Error during graceful shutdown", error);
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error("Forced shutdown - graceful shutdown took too long");
        process.exit(1);
      }, 30000);
    };

    // Listen for shutdown signals
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    logger.error("Failed to start server", error);
    process.exit(1);
  }
}

// Start the server
startServer();
