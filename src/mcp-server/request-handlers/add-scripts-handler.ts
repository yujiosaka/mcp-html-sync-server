import type { CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import { env } from "../../env.js";
import logger from "../../logger.js";
import { pageManager } from "../../page-manager.js";
import { assertAddScriptsArgs } from "./validator.js";

export default async function addScriptsHandler(request: CallToolRequest) {
  assertAddScriptsArgs(request.params.arguments);

  const { id, scripts } = request.params.arguments;
  try {
    const page = pageManager.addScripts(id, scripts);
    if (!page) {
      return {
        content: [
          {
            type: "text",
            text: `Error: Page with ID ${id} not found`,
          },
        ],
        isError: true,
      };
    }

    const viewUrl = `http://${env.SERVER_HOST}:${env.SERVER_PORT}/${id}`;
    return {
      content: [
        {
          type: "text",
          text: `Scripts added successfully!\nID: ${id}\nURL: ${viewUrl}\nExpires: ${page.expiresAt.toISOString()}`,
        },
      ],
    };
  } catch (err) {
    logger.error({ err }, "Error adding scripts to page");
    return {
      content: [
        {
          type: "text",
          text: `Error adding scripts to page: ${err instanceof Error ? err.message : String(err)}`,
        },
      ],
      isError: true,
    };
  }
}
