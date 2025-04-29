import { type Mock, describe, expect, mock, test } from "bun:test";
import type { CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import type WebSocket from "ws";
import addStylesheetsHandler from "../../../src/mcp-server/request-handlers/add-stylesheets-handler.js";
import { pageManager } from "../../../src/page-manager.js";

type AddStylesheets = Mock<typeof pageManager.addStylesheets>;

mock.module("../../../src/page-manager", () => ({
  pageManager: {
    addStylesheets: mock(() => {
      return {
        id: "id",
        body: "body",
        scripts: [],
        stylesheets: [{ href: "https://example.com/style.css" }],
        createdAt: new Date(),
        expiresAt: new Date(),
        connections: new Set(),
      };
    }),
  },
}));

mock.module("../../../src/env", () => ({
  env: {
    SERVER_HOST: "localhost",
    SERVER_PORT: 3000,
  },
}));

describe("handleAddStylesheets", () => {
  test("adds stylesheets to page and returns success response", async () => {
    const id = "id";
    const stylesheets = [{ href: "https://example.com/style.css" }];

    const page = {
      id,
      body: "<div>Content</div>",
      scripts: [],
      stylesheets,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
      connections: new Set<WebSocket>(),
    };

    (pageManager.addStylesheets as AddStylesheets).mockImplementation(
      () => page,
    );

    const request: CallToolRequest = {
      method: "tools/call",
      params: { name: "add_stylesheets", arguments: { id, stylesheets } },
    };

    const result = await addStylesheetsHandler(request);

    expect(pageManager.addStylesheets).toHaveBeenCalledWith(id, stylesheets);
    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: expect.stringContaining("Stylesheets added successfully!"),
        },
      ],
    });
    expect(result.content[0]?.text).toContain("ID: id");
    expect(result.content[0]?.text).toContain("URL: http://localhost:3000/id");
  });

  test("returns error when page does not exist", async () => {
    const id = "non-existent-id";
    const stylesheets = [{ href: "https://example.com/style.css" }];

    (pageManager.addStylesheets as AddStylesheets).mockImplementation(
      () => null,
    );

    const request: CallToolRequest = {
      method: "tools/call",
      params: { name: "add_stylesheets", arguments: { id, stylesheets } },
    };

    const result = await addStylesheetsHandler(request);

    expect(pageManager.addStylesheets).toHaveBeenCalledWith(id, stylesheets);
    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: `Error: Page with ID ${id} not found`,
        },
      ],
      isError: true,
    });
  });

  test("handles errors and returns error response", async () => {
    const id = "id";
    const stylesheets = [{ href: "https://example.com/style.css" }];
    const errorMessage = "Failed to add stylesheets";

    (pageManager.addStylesheets as AddStylesheets).mockImplementation(() => {
      throw new Error(errorMessage);
    });

    const request: CallToolRequest = {
      method: "tools/call",
      params: { name: "add_stylesheets", arguments: { id, stylesheets } },
    };

    const result = await addStylesheetsHandler(request);

    expect(pageManager.addStylesheets).toHaveBeenCalledWith(id, stylesheets);
    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: `Error adding stylesheets to page: ${errorMessage}`,
        },
      ],
      isError: true,
    });
  });
});
