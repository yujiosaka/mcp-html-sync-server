import type { WebSocket } from "ws";
import { ConnectionCloseCode, ConnectionCloseReason } from "./connection.js";
import { env } from "./env.js";
import logger from "./logger.js";
import { MessageFactory, serializeMessage } from "./message.js";
import type { Page, Script, Stylesheet } from "./page.js";

export interface PageManagerOptions {
  pageMaxAge: number;
  pageMaxCount: number;
}

export class PageManager {
  #pages: Map<string, Page> = new Map();
  #timers: Map<string, NodeJS.Timeout> = new Map();
  #pageMaxAge: number;
  #pageMaxCount: number;

  constructor(options: PageManagerOptions) {
    this.#pageMaxAge = options.pageMaxAge;
    this.#pageMaxCount = options.pageMaxCount;
  }

  public createPage(
    id: string,
    body: string,
    scripts: Script[] = [],
    stylesheets: Stylesheet[] = [],
  ): Page {
    if (this.#pages.size >= this.#pageMaxCount) {
      this.#removeOldestPage();
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.#pageMaxAge);

    const page: Page = {
      id,
      body,
      scripts,
      stylesheets,
      createdAt: now,
      expiresAt,
      connections: new Set(),
    };

    this.#pages.set(id, page);
    this.#setTimer(id);

    return page;
  }

  public getPage(id: string): Page | null {
    return this.#pages.get(id) ?? null;
  }

  public updatePage(id: string, body: string): Page | null {
    const page = this.#pages.get(id);
    if (!page) return null;

    this.#clearTimer(id);

    page.body = body;
    page.expiresAt = new Date(Date.now() + this.#pageMaxAge);

    for (const connection of page.connections) {
      try {
        connection.send(
          serializeMessage(MessageFactory.updated(body, page.scripts)),
        );
      } catch (err) {
        logger.error({ err }, "Error notifying client of page update");
      }
    }

    this.#setTimer(id);

    return page;
  }

  public addScripts(id: string, scripts: Script[]): Page | null {
    const page = this.#pages.get(id);
    if (!page) return null;

    this.#clearTimer(id);

    page.scripts = [...page.scripts, ...scripts];
    page.expiresAt = new Date(Date.now() + this.#pageMaxAge);

    for (const connection of page.connections) {
      try {
        connection.send(
          serializeMessage(MessageFactory.scriptsAdded(page.scripts)),
        );
      } catch (err) {
        logger.error({ err }, "Error notifying client of page scripts update");
      }
    }

    this.#setTimer(id);

    return page;
  }

  public addStylesheets(id: string, stylesheets: Stylesheet[]): Page | null {
    const page = this.#pages.get(id);
    if (!page) return null;

    this.#clearTimer(id);

    page.stylesheets = [...page.stylesheets, ...stylesheets];
    page.expiresAt = new Date(Date.now() + this.#pageMaxAge);

    for (const connection of page.connections) {
      try {
        connection.send(
          serializeMessage(MessageFactory.stylesheetsAdded(page.stylesheets)),
        );
      } catch (err) {
        logger.error(
          { err },
          "Error notifying client of page stylesheets update",
        );
      }
    }

    this.#setTimer(id);

    return page;
  }

  public removePage(id: string): boolean {
    const page = this.#pages.get(id);
    if (!page) return false;

    for (const connection of page.connections) {
      try {
        connection.send(serializeMessage(MessageFactory.removed()));
      } catch (err) {
        logger.error({ err }, "Error notifying client of page removal");
      }
      try {
        connection.close(
          ConnectionCloseCode.Removed,
          ConnectionCloseReason.Removed,
        );
      } catch (err) {
        logger.error({ err }, "Error closing connection");
      }
    }

    this.#clearTimer(id);

    return this.#pages.delete(id);
  }

  public addConnection(id: string, ws: WebSocket): boolean {
    const page = this.#pages.get(id);
    if (!page) return false;

    page.connections.add(ws);
    return true;
  }

  public removeConnection(id: string, ws: WebSocket): boolean {
    const page = this.#pages.get(id);
    if (!page) return false;

    return page.connections.delete(ws);
  }

  public get pageCount(): number {
    return this.#pages.size;
  }

  public removeAllPages(): number {
    const count = this.#pages.size;

    for (const [id, page] of this.#pages.entries()) {
      for (const connection of page.connections) {
        try {
          connection.send(serializeMessage(MessageFactory.removed()));
        } catch (err) {
          logger.error({ err }, "Error notifying client of page removal");
        }
        try {
          connection.close(
            ConnectionCloseCode.Removed,
            ConnectionCloseReason.Removed,
          );
        } catch (err) {
          logger.error({ err }, "Error closing connection");
        }
      }
      this.#clearTimer(id);
    }

    this.#pages.clear();
    this.#timers.clear();

    return count;
  }

  #setTimer(id: string): void {
    const timer = setTimeout(() => {
      this.#handlePageExpiration(id);
    }, this.#pageMaxAge);

    this.#timers.set(id, timer);
  }

  #clearTimer(id: string): void {
    const timer = this.#timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.#timers.delete(id);
    }
  }

  #handlePageExpiration(id: string): void {
    const page = this.#pages.get(id);
    if (!page) return;

    for (const connection of page.connections) {
      try {
        connection.send(serializeMessage(MessageFactory.expired()));
      } catch (err) {
        logger.error({ err }, "Error notifying client of page expiration");
      }

      try {
        connection.close(
          ConnectionCloseCode.Expired,
          ConnectionCloseReason.Expired,
        );
      } catch (err) {
        logger.error({ err }, "Error closing connection");
      }
    }

    this.#pages.delete(id);
    this.#timers.delete(id);
  }

  #removeOldestPage(): void {
    if (this.#pages.size === 0) return;

    let oldestId: string | null = null;
    let oldestTime = Date.now();

    for (const [id, page] of this.#pages.entries()) {
      if (page.createdAt.getTime() < oldestTime) {
        oldestId = id;
        oldestTime = page.createdAt.getTime();
      }
    }

    if (oldestId) {
      this.removePage(oldestId);
    }
  }
}

export const pageManager = new PageManager({
  pageMaxAge: env.PAGE_MAX_AGE,
  pageMaxCount: env.PAGE_MAX_COUNT,
});
