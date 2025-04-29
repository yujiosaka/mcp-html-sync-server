import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import type { CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import logger from "../logger.js";
import {
  addScriptsHandler,
  addStylesheetsHandler,
  createPageHandler,
  destroyPageHandler,
  updatePageHandler,
} from "./request-handlers/index.js";
import { RequestDescription, RequestSchema, RequestType } from "./scheme.js";

export class McpServer {
  #server: Server;

  constructor() {
    this.#server = new Server(
      {
        name: "mcp-html-sync-server",
        version: "0.0.1",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.#setupToolHandlers();

    this.#server.onerror = (err: Error) => {
      logger.error({ err }, "[MCP Error]");
    };
  }

  public async open(transport: Transport = new StdioServerTransport()) {
    await this.#server.connect(transport);
  }

  public async close(): Promise<void> {
    await this.#server.close();
  }

  #setupToolHandlers() {
    this.#server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: RequestType.CreatePage,
          description: RequestDescription.CreatePage,
          inputSchema: RequestSchema.CreatePage,
        },
        {
          name: RequestType.UpdatePage,
          description: RequestDescription.UpdatePage,
          inputSchema: RequestSchema.UpdatePage,
        },
        {
          name: RequestType.DestroyPage,
          description: RequestDescription.DestroyPage,
          inputSchema: RequestSchema.DestroyPage,
        },
        {
          name: RequestType.AddScripts,
          description: RequestDescription.AddScripts,
          inputSchema: RequestSchema.AddScripts,
        },
        {
          name: RequestType.AddStylesheets,
          description: RequestDescription.AddStylesheets,
          inputSchema: RequestSchema.AddStylesheets,
        },
      ],
    }));

    this.#server.setRequestHandler(
      CallToolRequestSchema,
      async (request: CallToolRequest) => {
        switch (request.params.name) {
          case RequestType.CreatePage:
            return createPageHandler(request);
          case RequestType.UpdatePage:
            return updatePageHandler(request);
          case RequestType.DestroyPage:
            return destroyPageHandler(request);
          case RequestType.AddScripts:
            return addScriptsHandler(request);
          case RequestType.AddStylesheets:
            return addStylesheetsHandler(request);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${request.params.name}`,
            );
        }
      },
    );
  }
}

export const mcpServer = new McpServer();
