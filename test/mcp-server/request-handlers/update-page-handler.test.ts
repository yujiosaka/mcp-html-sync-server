import { type Mock, describe, expect, mock, test } from "bun:test";
import type { CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import type WebSocket from "ws";
import handleUpdatePage from "../../../src/mcp-server/request-handlers/update-page-handler.js";
import { pageManager } from "../../../src/page-manager.js";

mock.module("../../../src/page-manager", () => ({
  pageManager: {
    updatePage: mock(function mockUpdatePage() {
      return {
        id: "id",
        body: "body",
        createdAt: new Date(),
        expiresAt: new Date(),
        connections: new Set(),
        scripts: [],
        stylesheets: [],
      };
    }),
  },
}));

mock.module("../../../src/env", () => ({
  env: {
    BASE_URL: "http://localhost:3000/",
  },
}));

type UpdatePage = Mock<typeof pageManager.updatePage>;

describe("handleUpdatePage", () => {
  test("updates page and returns success response", async () => {
    const id = "id";
    const body = "<div>Updated content</div>";
    const page = {
      id,
      body,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
      connections: new Set<WebSocket>(),
      scripts: [],
      stylesheets: [],
    };

    (pageManager.updatePage as UpdatePage).mockImplementation(() => page);

    const request: CallToolRequest = {
      method: "tools/call",
      params: {
        name: "update_page",
        arguments: { id, body },
      },
    };

    const result = await handleUpdatePage(request);

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: expect.stringContaining("Page updated successfully!"),
        },
        {
          type: "text",
          text: `View your HTML page in URL: http://localhost:3000/${id}`,
        },
        {
          type: "text",
          text: expect.stringContaining(`ID: ${id}`),
        },
      ],
      metadata: {
        id: id,
        url: `http://localhost:3000/${id}`,
        expires_at: expect.any(String),
      },
    });
  });

  test("handles errors and returns error response", async () => {
    const id = "id";
    const body = "<div>Updated content</div>";
    const errorMessage = "Update failed";

    (pageManager.updatePage as UpdatePage).mockImplementation(() => {
      throw new Error(errorMessage);
    });

    const request: CallToolRequest = {
      method: "tools/call",
      params: {
        name: "update_page",
        arguments: { id, body },
      },
    };

    const result = await handleUpdatePage(request);

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: `Error updating page: ${errorMessage}`,
        },
      ],
      isError: true,
    });
  });

  test("handles page not found and returns appropriate error response", async () => {
    const id = "nonexistent-id";
    const body = "<div>Updated content</div>";

    (pageManager.updatePage as UpdatePage).mockImplementation(() => {
      return null;
    });

    const request: CallToolRequest = {
      method: "tools/call",
      params: {
        name: "update_page",
        arguments: { id, body },
      },
    };

    const result = await handleUpdatePage(request);

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: `Error updating page: Page not found: ${id}`,
        },
      ],
      isError: true,
    });
  });
});
