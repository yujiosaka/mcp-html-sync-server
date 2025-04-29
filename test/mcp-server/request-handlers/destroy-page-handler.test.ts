import { type Mock, describe, expect, mock, test } from "bun:test";
import type { CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import handleDestroyPage from "../../../src/mcp-server/request-handlers/destroy-page-handler.js";
import { pageManager } from "../../../src/page-manager.js";

mock.module("../../../src/page-manager", () => ({
  pageManager: {
    removePage: mock(function mockRemovePage() {
      return true;
    }),
  },
}));

type RemovePage = Mock<typeof pageManager.removePage>;

describe("handleDestroyPage", () => {
  test("removes page and returns success response", async () => {
    const id = "id";

    (pageManager.removePage as RemovePage).mockImplementation(() => true);

    const request: CallToolRequest = {
      method: "tools/call",
      params: {
        name: "destroy_page",
        arguments: { id },
      },
    };

    const result = await handleDestroyPage(request);

    expect(pageManager.removePage).toHaveBeenCalledWith(id);
    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: `Page with ID "${id}" destroyed successfully`,
        },
      ],
    });
  });

  test("handles errors and returns error response", async () => {
    const id = "id";
    const errorMessage = "Removal failed";

    (pageManager.removePage as RemovePage).mockImplementation(() => {
      throw new Error(errorMessage);
    });

    const request: CallToolRequest = {
      method: "tools/call",
      params: {
        name: "destroy_page",
        arguments: { id },
      },
    };

    const result = await handleDestroyPage(request);

    expect(pageManager.removePage).toHaveBeenCalledWith(id);
    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: `Error destroying page: ${errorMessage}`,
        },
      ],
      isError: true,
    });
  });
});
