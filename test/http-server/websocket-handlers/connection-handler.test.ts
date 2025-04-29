import { type Mock, beforeEach, describe, expect, mock, test } from "bun:test";
import type { WebSocket } from "ws";
import {
  ConnectionCloseCode,
  ConnectionCloseReason,
} from "../../../src/connection.js";
import connectionHandler from "../../../src/http-server/websocket-handlers/connection-handler.js";
import { pageManager } from "../../../src/page-manager.js";

mock.module("../../../src/page-manager", () => ({
  pageManager: {
    getPage: mock(() => null),
    addConnection: mock(() => true),
    removeConnection: mock(() => true),
  },
}));

type GetPage = Mock<typeof pageManager.getPage>;

let socket: WebSocket;

beforeEach(() => {
  socket = { close: mock(), on: mock() } as unknown as WebSocket;
});

describe("connectionHandler", () => {
  test("closes socket when page doesn't exist", () => {
    const id = "non-existent-id";

    (pageManager.getPage as GetPage).mockImplementation(() => null);

    connectionHandler(socket, { id });

    expect(pageManager.getPage).toHaveBeenCalledWith(id);
    expect(socket.close).toHaveBeenCalledWith(
      ConnectionCloseCode.NotFound,
      ConnectionCloseReason.NotFound,
    );
    expect(pageManager.addConnection).not.toHaveBeenCalled();
  });

  test("adds connection when page exists", () => {
    const id = "existing-id";
    const page = {
      id,
      body: "<div>Test</div>",
      scripts: [],
      stylesheets: [],
      createdAt: new Date(),
      expiresAt: new Date(),
      connections: new Set<WebSocket>(),
    };

    (pageManager.getPage as GetPage).mockImplementation(() => page);

    connectionHandler(socket, { id });

    expect(pageManager.getPage).toHaveBeenCalledWith(id);
    expect(socket.close).not.toHaveBeenCalled();
    expect(pageManager.addConnection).toHaveBeenCalledWith(id, socket);
  });

  test("sets up event listeners", () => {
    const id = "existing-id";
    const page = {
      id,
      body: "<div>Test</div>",
      scripts: [],
      stylesheets: [],
      createdAt: new Date(),
      expiresAt: new Date(),
      connections: new Set<WebSocket>(),
    };

    (pageManager.getPage as GetPage).mockImplementation(() => page);

    connectionHandler(socket, { id });

    expect(socket.on).toHaveBeenCalledTimes(2);
    expect(socket.on).toHaveBeenCalledWith("close", expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith("error", expect.any(Function));
  });
});
