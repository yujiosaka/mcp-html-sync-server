import type { CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import { env } from "../../env.js";
import logger from "../../logger.js";
import { pageManager } from "../../page-manager.js";
import { assertUpdatePageArgs } from "./validator.js";

export default async function updatePageHandler(request: CallToolRequest) {
  assertUpdatePageArgs(request.params.arguments);

  const { id, body } = request.params.arguments;
  try {
    const page = pageManager.updatePage(id, body);
    if (!page) {
      return {
        content: [
          {
            type: "text",
            text: `Error updating page: Page not found: ${id}`,
          },
        ],
        isError: true,
      };
    }

    for (const connection of page.connections) {
      try {
        connection.send(JSON.stringify({ type: "update", body }));
      } catch (err) {
        logger.error({ err }, "Error sending update to client");
      }
    }
    const viewUrl = `http://${env.SERVER_HOST}:${env.SERVER_PORT}/${id}`;
    return {
      content: [
        {
          type: "text",
          text: `Page updated successfully!\nID: ${id}\nURL: ${viewUrl}\nExpires: ${page.expiresAt.toISOString()}`,
        },
      ],
    };
  } catch (err) {
    return {
      content: [
        {
          type: "text",
          text: `Error updating page: ${err instanceof Error ? err.message : String(err)}`,
        },
      ],
      isError: true,
    };
  }
}
