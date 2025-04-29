import type { FastifyRequest } from "fastify";
import type { WebSocket } from "ws";
import {
  ConnectionCloseCode,
  ConnectionCloseReason,
} from "../../connection.js";
import { pageManager } from "../../page-manager.js";
import { assertConnectionParams } from "./validator.js";

export default function connectionHandler(
  socket: WebSocket,
  params: FastifyRequest["params"],
): void {
  assertConnectionParams(params);

  const page = pageManager.getPage(params.id);
  if (!page) {
    socket.close(ConnectionCloseCode.NotFound, ConnectionCloseReason.NotFound);
    return;
  }

  pageManager.addConnection(params.id, socket);

  socket.on("close", () => {
    try {
      pageManager.removeConnection(params.id, socket);
    } catch (err) {
      console.error("Error removing connection:", err);
    }
  });

  socket.on("error", (error: Error) => {
    console.error(`WebSocket error for page ${params.id}:`, error);
    try {
      pageManager.removeConnection(params.id, socket);
    } catch (err) {
      console.error("Error removing connection after error:", err);
    }
  });
}
