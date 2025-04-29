import type { CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import { nanoid } from "nanoid";
import { env } from "../../env.js";
import { pageManager } from "../../page-manager.js";
import { assertCreatePageArgs } from "./validator.js";

export default async function createPageHandler(request: CallToolRequest) {
  assertCreatePageArgs(request.params.arguments);

  const { body, scripts = [], stylesheets = [] } = request.params.arguments;
  try {
    const id = nanoid(10);
    const page = pageManager.createPage(id, body, scripts, stylesheets);
    const viewUrl = `http://${env.SERVER_HOST}:${env.SERVER_PORT}/${id}`;
    return {
      content: [
        {
          type: "text",
          text: `Page created successfully!\nID: ${id}\nURL: ${viewUrl}\nExpires: ${page.expiresAt.toISOString()}`,
        },
      ],
    };
  } catch (err) {
    return {
      content: [
        {
          type: "text",
          text: `Error creating page: ${err instanceof Error ? err.message : String(err)}`,
        },
      ],
      isError: true,
    };
  }
}
