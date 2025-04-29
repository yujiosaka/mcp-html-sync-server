import { type Mock, describe, expect, mock, test } from "bun:test";
import type { CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import type WebSocket from "ws";
import handleCreatePage from "../../../src/mcp-server/request-handlers/create-page-handler.js";
import { pageManager } from "../../../src/page-manager.js";

type CreatePage = Mock<typeof pageManager.createPage>;

mock.module("nanoid", () => ({
  nanoid: () => "id",
}));

mock.module("../../../src/page-manager", () => ({
  pageManager: {
    createPage: mock(() => {
      return {
        id: "id",
        body: "body",
        scripts: [],
        stylesheets: [],
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

describe("handleCreatePage", () => {
  test("creates page and returns success response", async () => {
    const body = "<div>New content</div>";
    const page = {
      id: "id",
      body,
      scripts: [],
      stylesheets: [],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
      connections: new Set<WebSocket>(),
    };

    (pageManager.createPage as CreatePage).mockImplementation(() => page);

    const request: CallToolRequest = {
      method: "tools/call",
      params: { name: "update_page", arguments: { body } },
    };

    const result = await handleCreatePage(request);

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: expect.stringContaining("Page created successfully!"),
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

  test("creates a page with scripts and stylesheets", async () => {
    const body = "<h1>Test</h1>";
    const scripts = [{ src: "https://example.com/script.js" }];
    const stylesheets = [{ href: "https://example.com/style.css" }];

    const page = {
      id: "id",
      body,
      scripts,
      stylesheets,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
      connections: new Set<WebSocket>(),
    };

    (pageManager.createPage as CreatePage).mockImplementation(() => page);

    const request: CallToolRequest = {
      method: "tools/call",
      params: {
        name: "create_page",
        arguments: {
          body,
          scripts,
          stylesheets,
        },
      },
    };

    const result = await handleCreatePage(request);

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: expect.stringContaining("Page created successfully!"),
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

  test("handles errors and returns error response", async () => {
    const body = "<div>New content</div>";
    const errorMessage = "Creation failed";

    (pageManager.createPage as CreatePage).mockImplementation(() => {
      throw new Error(errorMessage);
    });

    const request: CallToolRequest = {
      method: "tools/call",
      params: { name: "update_page", arguments: { body } },
    };

    const result = await handleCreatePage(request);

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: `Error creating page: ${errorMessage}`,
        },
      ],
      isError: true,
    });
  });
});
