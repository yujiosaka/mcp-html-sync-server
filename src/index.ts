import { env } from "./env.js";
import { httpServer } from "./http-server/index.js";
import logger from "./logger.js";
import { mcpServer } from "./mcp-server/index.js";

export async function start() {
  await httpServer.start();
  logger.info(
    `Server listening on http://${env.SERVER_HOST}:${env.SERVER_PORT}`,
  );
  logger.info("HTTP server started successfully");

  await mcpServer.open();
  logger.info("MCP server started successfully");
}

export async function stop() {
  await mcpServer.close();
  logger.info("MCP server closed successfully");

  await httpServer.stop();
  logger.info("HTTP server stopped successfully");
}

export async function restart() {
  await stop();
  await start();
}
