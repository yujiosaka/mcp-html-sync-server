import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import type { WebSocket } from "ws";
import {
  ConnectionCloseCode,
  ConnectionCloseReason,
} from "../../src/connection.js";
import { httpServer } from "../../src/http-server/index.js";
import connectionHandler from "../../src/http-server/websocket-handlers/connection-handler.js";
import { pageManager } from "../../src/page-manager.js";

class MockWebSocket {
  public onmessage: ((event: { data: string }) => void) | null = null;
  public onclose: (() => void) | null = null;
  public onerror: ((error: Error) => void) | null = null;

  public close = mock((_code?: number, _reason?: string) => {
    this.onclose?.();
  });

  public send = mock((data: string) => {
    this.onmessage?.({ data });
  });

  public on = mock((event: string, handler: (arg?: unknown) => void) => {
    if (event === "close" && this.onclose === null) {
      this.onclose = handler;
    } else if (event === "error" && this.onerror === null) {
      this.onerror = handler;
    }
    return this;
  });
}

afterEach(() => {
  pageManager.removeAllPages();
});

describe("GET /:id", () => {
  test("returns 200 and renders page when page exists", async () => {
    const id = "test-page";
    const body = "<h1>Test Page</h1>";

    pageManager.createPage(id, body);

    const response = await httpServer.fastify.inject({
      method: "GET",
      url: `/${id}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("text/html");

    const html = response.body;
    expect(html).toContain(body);
  });

  test("renders page with scripts and stylesheets", async () => {
    const id = "page-with-assets";
    const body = "<h1>Page with Assets</h1>";
    const scripts = [{ src: "https://example.com/script.js" }];
    const stylesheets = [{ href: "https://example.com/style.css" }];

    pageManager.createPage(id, body, scripts, stylesheets);

    const response = await httpServer.fastify.inject({
      method: "GET",
      url: `/${id}`,
    });

    expect(response.statusCode).toBe(200);

    const html = response.body;
    expect(html).toContain(body);
    expect(html).toContain("https://example.com/script.js");
    expect(html).toContain("https://example.com/style.css");
  });

  test("returns 404 and renders not-found template when page doesn't exist", async () => {
    const id = "non-existent-page";

    const response = await httpServer.fastify.inject({
      method: "GET",
      url: `/${id}`,
    });

    expect(response.statusCode).toBe(404);
    expect(response.headers["content-type"]).toContain("text/html");

    const html = response.body;
    expect(html).toContain("Page Not Found");
  });
});

describe("WebSocket /ws/:id", () => {
  test("adds connection when page exists", () => {
    const id = "ws-test-page";
    const body = "<h1>WebSocket Test Page</h1>";
    pageManager.createPage(id, body);

    const ws = new MockWebSocket();

    connectionHandler(ws as unknown as WebSocket, { id });

    const page = pageManager.getPage(id);
    expect(page?.connections.size).toBe(1);

    expect(ws.close).not.toHaveBeenCalled();
  });

  test("closes connection when page doesn't exist", () => {
    const id = "non-existent-ws-page";

    const ws = new MockWebSocket();

    connectionHandler(ws as unknown as WebSocket, { id });

    expect(ws.close).toHaveBeenCalledWith(
      ConnectionCloseCode.NotFound,
      ConnectionCloseReason.NotFound,
    );
  });

  test("removes connection when WebSocket is closed", () => {
    const id = "ws-close-test";
    const body = "<h1>WebSocket Close Test</h1>";
    const page = pageManager.createPage(id, body);

    const ws = new MockWebSocket();

    connectionHandler(ws as unknown as WebSocket, { id });

    expect(page.connections.size).toBe(1);

    ws?.onclose?.();

    expect(page.connections.size).toBe(0);
  });

  test("updates page content for all connected clients", () => {
    const id = "ws-update-test";
    const initialBody = "<h1>Initial Content</h1>";
    const page = pageManager.createPage(id, initialBody);

    const ws1 = new MockWebSocket();
    const ws2 = new MockWebSocket();

    const messages1: string[] = [];
    const messages2: string[] = [];

    ws1.onmessage = (event) => {
      messages1.push(event.data);
    };

    ws2.onmessage = (event) => {
      messages2.push(event.data);
    };

    page.connections.add(ws1 as unknown as WebSocket);
    page.connections.add(ws2 as unknown as WebSocket);

    const updatedBody = "<h1>Updated Content</h1>";
    pageManager.updatePage(id, updatedBody);

    expect(messages1.length).toBe(1);
    expect(messages2.length).toBe(1);
    expect(messages1[0]).toContain(updatedBody);
    expect(messages2[0]).toContain(updatedBody);
  });
});
