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
    const url = `${env.BASE_URL}${id}`;
    return {
      content: [
        {
          type: "text",
          text: "Page created successfully! A URL is provided below to view your page.",
        },
        {
          type: "text",
          text: `View your HTML page in URL: ${url}`,
        },
        {
          type: "text",
          text: `ID: ${id}\nExpires at: ${page.expiresAt.toISOString()}\n\nUse this ID for future updates before expiration.`,
        },
      ],
      metadata: {
        id: id,
        url,
        expires_at: page.expiresAt.toISOString(),
      },
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
