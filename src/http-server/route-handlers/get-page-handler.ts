import type { FastifyReply, FastifyRequest } from "fastify";
import { pageManager } from "../../page-manager.js";
import { assertGetParams } from "./validator.js";

export default async function getPageHandler(
  params: FastifyRequest["params"],
  reply: FastifyReply,
): Promise<string> {
  assertGetParams(params);

  const page = pageManager.getPage(params.id);
  if (!page) return reply.code(404).view("not-found.hbs", { id: params.id });

  const externalScripts = page.scripts.filter((script) => script.src);
  const inlineScripts = page.scripts.filter((script) => script.content);

  return reply.view("page.hbs", {
    id: params.id,
    body: page.body,
    stylesheets: page.stylesheets,
    externalScripts,
    inlineScripts,
  });
}
