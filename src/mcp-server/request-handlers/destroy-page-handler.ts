import type { CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import { pageManager } from "../../page-manager.js";
import { assertDestroyPageArgs } from "./validator.js";

export default async function destroyPageHandler(request: CallToolRequest) {
  assertDestroyPageArgs(request.params.arguments);

  const { id } = request.params.arguments;
  try {
    void pageManager.removePage(id);
    return {
      content: [
        { type: "text", text: `Page with ID "${id}" destroyed successfully` },
      ],
    };
  } catch (err) {
    return {
      content: [
        {
          type: "text",
          text: `Error destroying page: ${err instanceof Error ? err.message : String(err)}`,
        },
      ],
      isError: true,
    };
  }
}
