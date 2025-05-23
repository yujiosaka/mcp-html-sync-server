import { type Mock, describe, expect, mock, test } from "bun:test";
import type { CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import type WebSocket from "ws";
import handleAddScripts from "../../../src/mcp-server/request-handlers/add-scripts-handler.js";
import { pageManager } from "../../../src/page-manager.js";

type AddScripts = Mock<typeof pageManager.addScripts>;

mock.module("../../../src/page-manager", () => ({
  pageManager: {
    addScripts: mock(() => {
      return {
        id: "id",
        body: "body",
        scripts: [
          { src: "https://example.com/script.js" },
          { content: "console.log('Hello');" },
        ],
        createdAt: new Date(),
        expiresAt: new Date(),
        connections: new Set(),
      };
    }),
  },
}));

mock.module("../../../src/env", () => ({
  env: {
    BASE_URL: "http://localhost:3000/",
  },
}));

describe("handleAddScripts", () => {
  test("adds scripts to page and returns success response", async () => {
    const id = "id";
    const scripts = [
      { src: "https://example.com/script.js" },
      { content: "console.log('Hello');" },
    ];

    const page = {
      id,
      body: "<div>Content</div>",
      scripts,
      stylesheets: [],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
      connections: new Set<WebSocket>(),
    };

    (pageManager.addScripts as AddScripts).mockImplementation(() => page);

    const request: CallToolRequest = {
      method: "tools/call",
      params: { name: "add_scripts", arguments: { id, scripts } },
    };

    const result = await handleAddScripts(request);

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: expect.stringContaining("Scripts added successfully!"),
        },
        {
          type: "text",
          text: "View your HTML page in URL: http://localhost:3000/id",
        },
        {
          type: "text",
          text: expect.stringContaining("ID: id"),
        },
      ],
      metadata: {
        id: "id",
        url: "http://localhost:3000/id",
        expires_at: expect.any(String),
      },
    });
  });

  test("returns error when page does not exist", async () => {
    const id = "non-existent-id";
    const scripts = [{ src: "https://example.com/script.js" }];

    (pageManager.addScripts as AddScripts).mockImplementation(() => null);

    const request: CallToolRequest = {
      method: "tools/call",
      params: { name: "add_scripts", arguments: { id, scripts } },
    };

    const result = await handleAddScripts(request);

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
    const scripts = [{ src: "https://example.com/script.js" }];
    const errorMessage = "Failed to add scripts";

    (pageManager.addScripts as AddScripts).mockImplementation(() => {
      throw new Error(errorMessage);
    });

    const request: CallToolRequest = {
      method: "tools/call",
      params: { name: "add_scripts", arguments: { id, scripts } },
    };

    const result = await handleAddScripts(request);

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: `Error adding scripts to page: ${errorMessage}`,
        },
      ],
      isError: true,
    });
  });
});
