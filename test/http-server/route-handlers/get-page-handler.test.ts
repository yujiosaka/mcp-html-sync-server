import { type Mock, beforeEach, expect, mock, test } from "bun:test";
import type { FastifyReply } from "fastify";
import type { WebSocket } from "ws";
import getPageHandler from "../../../src/http-server/route-handlers/get-page-handler.js";
import { pageManager } from "../../../src/page-manager.js";

mock.module("../../../src/page-manager", () => ({
  pageManager: { getPage: mock(() => null) },
}));

type GetPage = Mock<typeof pageManager.getPage>;

let reply: FastifyReply;

beforeEach(() => {
  reply = {
    view: mock((_template: string, _data: object) => reply),
    code: mock((_code: number) => reply),
  } as unknown as FastifyReply;
});

test("returns 404 and renders not-found template when page doesn't exist", async () => {
  const id = "non-existent-id";

  await getPageHandler({ id }, reply);

  expect(reply.code).toHaveBeenCalledWith(404);
  expect(reply.view).toHaveBeenCalledWith("not-found.hbs", { id });
});

test("renders page template with content when page exists", async () => {
  const id = "existing-id";
  const body = "<div>Test content</div>";
  const externalScripts = [{ src: "https://example.com/script.js" }];
  const inlineScripts = [{ content: "console.log('Test');" }];
  const scripts = [...externalScripts, ...inlineScripts];
  const stylesheets = [{ href: "https://example.com/style.css" }];
  const page = {
    id,
    body,
    scripts,
    stylesheets,
    createdAt: new Date(),
    expiresAt: new Date(),
    connections: new Set<WebSocket>(),
  };

  (pageManager.getPage as GetPage).mockImplementation(() => page);

  await getPageHandler({ id }, reply);

  expect(reply.view).toHaveBeenCalledWith(
    "page.hbs",
    expect.objectContaining({
      id,
      body,
      externalScripts,
      inlineScripts,
      stylesheets,
    }),
  );
});
