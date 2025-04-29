import type { CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import { env } from "../../env.js";
import logger from "../../logger.js";
import { pageManager } from "../../page-manager.js";
import { assertAddStylesheetsArgs } from "./validator.js";

export default async function addStylesheetsHandler(request: CallToolRequest) {
  assertAddStylesheetsArgs(request.params.arguments);

  const { id, stylesheets } = request.params.arguments;
  try {
    const page = pageManager.addStylesheets(id, stylesheets);
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
          text: `Stylesheets added successfully!\nID: ${id}\nURL: ${viewUrl}\nExpires: ${page.expiresAt.toISOString()}`,
        },
      ],
    };
  } catch (err) {
    logger.error({ err }, "Error adding stylesheets to page");
    return {
      content: [
        {
          type: "text",
          text: `Error adding stylesheets to page: ${err instanceof Error ? err.message : String(err)}`,
        },
      ],
      isError: true,
    };
  }
}
