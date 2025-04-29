import { start, stop } from "./index.js";
import logger from "./logger.js";

start().catch((error) => {
  logger.error({ err: error }, "Error starting server");
  process.exit(1);
});

const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal} signal, shutting down gracefully...`);
  try {
    await stop();
    logger.info("Server stopped successfully");
    process.exit(0);
  } catch (err) {
    logger.error({ err }, "Error stopping server");
    process.exit(1);
  }
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGTSTP", () => gracefulShutdown("SIGTSTP"));
process.stdin.on("end", () => gracefulShutdown("end"));
process.stdin.on("close", () => gracefulShutdown("close"));
