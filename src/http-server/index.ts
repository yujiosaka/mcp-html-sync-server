import path from "node:path";
import { fileURLToPath } from "node:url";
import fastifyStatic from "@fastify/static";
import fastifyView from "@fastify/view";
import fastifyWebsocket from "@fastify/websocket";
import Fastify from "fastify";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import handlebars from "handlebars";
import type { WebSocket } from "ws";
import { env } from "../env.js";
import { getPageHandler } from "./route-handlers/index.js";
import { RequestPath, WebsocketPath } from "./schema.js";
import { connectionHandler } from "./websocket-handlers/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "../..");

export class HttpServer {
  #fastify: FastifyInstance;
  #host: string;
  #port: number;

  constructor(host: string, port: number) {
    this.#host = host;
    this.#port = port;
    this.#fastify = Fastify({ logger: false });
    this.#fastify.register(fastifyStatic, {
      root: path.join(packageRoot, "public"),
      prefix: "/",
    });
    this.#fastify.register(fastifyView, {
      engine: { handlebars },
      templates: path.join(packageRoot, "templates"),
    });
    this.#fastify.register(fastifyWebsocket);
    this.#setupRouteHandlers();
    this.#setupWebsocketHandlers();
  }

  public get fastify(): FastifyInstance {
    return this.#fastify;
  }

  #setupRouteHandlers() {
    this.#fastify.get(
      RequestPath.GetPage,
      async (request: FastifyRequest, reply: FastifyReply) => {
        await getPageHandler(request.params, reply);
      },
    );
  }

  #setupWebsocketHandlers() {
    this.#fastify.register(async () => {
      this.#fastify.get(
        WebsocketPath.Connection,
        { websocket: true },
        (connection: WebSocket, request: FastifyRequest) => {
          connectionHandler(connection, request.params);
        },
      );
    });
  }

  public async start(): Promise<void> {
    await this.#fastify.listen({ host: this.#host, port: this.#port });
  }

  public async stop(): Promise<void> {
    await this.#fastify.close();
  }
}

export const httpServer = new HttpServer(env.SERVER_HOST, env.SERVER_PORT);
