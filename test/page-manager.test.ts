import {
  afterEach,
  beforeEach,
  describe,
  expect,
  mock,
  setSystemTime,
  test,
} from "bun:test";

import type WebSocket from "ws";
import {
  ConnectionCloseCode,
  ConnectionCloseReason,
} from "../src/connection.js";
import { PageManager } from "../src/page-manager.js";

const PAGE_MAX_AGE = 100;
const PAGE_MAX_COUNT = 2;

let now: number;
let pageManager: PageManager;
let websocket: WebSocket;

beforeEach(() => {
  now = Date.now();
  pageManager = new PageManager({
    pageMaxAge: PAGE_MAX_AGE,
    pageMaxCount: PAGE_MAX_COUNT,
  });
  websocket = { close: mock(), send: mock() } as unknown as WebSocket;
});

afterEach(() => {
  setSystemTime();
  mock.restore();
});

describe("createPage", () => {
  test("creates a new page with correct properties", () => {
    setSystemTime(now);

    const scripts = [
      { src: "https://example.com/script.js" },
      { content: "console.log('Hello');" },
    ];
    const page = pageManager.createPage("id", "body", scripts);
    expect(page.id).toBe("id");
    expect(page.body).toBe("body");
    expect(page.scripts).toEqual(scripts);
    expect(page.connections).toBeInstanceOf(Set);
    expect(page.connections.size).toBe(0);
    expect(page.createdAt).toBeInstanceOf(Date);
    expect(page.expiresAt).toBeInstanceOf(Date);
    expect(page.expiresAt.getTime()).toBe(now + PAGE_MAX_AGE);
  });

  test("removes oldest page when max page count is reached", () => {
    setSystemTime(now);
    pageManager.createPage("id1", "body1");

    setSystemTime(now + 1);
    pageManager.createPage("id2", "body2");

    setSystemTime(now + 1);
    pageManager.createPage("id3", "body3");

    const page1 = pageManager.getPage("id1");
    expect(page1).toBeNull();
    const page2 = pageManager.getPage("id2");
    expect(page2).not.toBeNull();
    const page3 = pageManager.getPage("id3");
    expect(page3).not.toBeNull();
  });

  test("creates a page with correct expiration time", () => {
    setSystemTime(now);

    const page = pageManager.createPage("id", "body");
    expect(page.expiresAt.getTime()).toBe(now + PAGE_MAX_AGE);
  });
});

describe("getPage", () => {
  test("returns the page if it exists", () => {
    const createdPage = pageManager.createPage("id", "body");

    const retrievedPage = pageManager.getPage("id");
    expect(retrievedPage).toBe(createdPage);
  });

  test("returns null if the page does not exist", () => {
    const retrievedPage = pageManager.getPage("non-existent-id");
    expect(retrievedPage).toBeNull();
  });
});

describe("updatePage", () => {
  test("updates the page body and resets expiration", () => {
    setSystemTime(now);

    pageManager.createPage("id", "created-body");

    setSystemTime(now + 1);

    const updatedPage = pageManager.updatePage("id", "updated-body");

    expect(updatedPage).not.toBeNull();
    expect(updatedPage?.body).toBe("updated-body");

    expect(updatedPage?.expiresAt?.getTime()).toBe(now + 1 + PAGE_MAX_AGE);
  });

  test("returns null if the page does not exist", () => {
    setSystemTime(now);

    const result = pageManager.updatePage("non-existent-id", "body");
    expect(result).toBeNull();
  });

  test("returns null for an expired page", async () => {
    setSystemTime(now);

    const page = pageManager.createPage("expired-id", "original-body");
    expect(page).not.toBeNull();

    await new Promise((resolve) => setTimeout(resolve, PAGE_MAX_AGE + 1));

    setSystemTime(now + PAGE_MAX_AGE + 2);

    const result = pageManager.updatePage("expired-id", "new-body");
    expect(result).toBeNull();
  });
});

describe("removePage", () => {
  test("removes the page and closes all connections", () => {
    const page = pageManager.createPage("id", "body");

    page.connections.add(websocket);

    const result = pageManager.removePage("id");
    expect(result).toBe(true);

    expect(pageManager.getPage("id")).toBeNull();
    expect(websocket.send).toHaveBeenCalled();
    expect(websocket.close).toHaveBeenCalledWith(
      ConnectionCloseCode.Removed,
      ConnectionCloseReason.Removed,
    );
  });

  test("returns false if the page does not exist", () => {
    const result = pageManager.removePage("non-existent-id");

    expect(result).toBe(false);
  });
});

describe("addConnection", () => {
  test("adds a connection to the page", () => {
    const page = pageManager.createPage("id", "body");

    const result = pageManager.addConnection("id", websocket);

    expect(result).toBe(true);
    expect(page.connections.has(websocket)).toBe(true);
  });

  test("returns false if the page does not exist", () => {
    const result = pageManager.addConnection("non-existent-id", websocket);
    expect(result).toBe(false);
  });
});

describe("removeConnection", () => {
  test("removes a connection from the page", () => {
    const page = pageManager.createPage("test-id", "body");

    page.connections.add(websocket);

    const result = pageManager.removeConnection("test-id", websocket);
    expect(result).toBe(true);

    expect(page.connections.has(websocket)).toBe(false);
  });

  test("returns false if the page does not exist", () => {
    const result = pageManager.removeConnection("non-existent-id", websocket);
    expect(result).toBe(false);
  });

  test("returns false if the connection does not exist", () => {
    pageManager.createPage("id", "body");

    const result = pageManager.removeConnection("id", websocket);
    expect(result).toBe(false);
  });
});

describe("pageCount", () => {
  test("returns the number of pages", () => {
    pageManager.createPage("id1", "body1");
    pageManager.createPage("id2", "body2");

    const pageCount = pageManager.pageCount;
    expect(pageCount).toBe(2);
  });

  test("returns 0 if no pages exist", () => {
    const pageCount = pageManager.pageCount;
    expect(pageCount).toBe(0);
  });
});

describe("addScripts", () => {
  test("adds scripts to an existing page", () => {
    setSystemTime(now);

    pageManager.createPage("id", "body");

    const scripts = [
      { src: "https://example.com/script.js" },
      { content: "console.log('Hello');" },
    ];

    setSystemTime(now + 1);

    const updatedPage = pageManager.addScripts("id", scripts);
    expect(updatedPage).not.toBeNull();
    expect(updatedPage?.scripts).toEqual(scripts);
    expect(updatedPage?.expiresAt.getTime()).toBe(now + 1 + PAGE_MAX_AGE);
  });

  test("returns null if the page does not exist", () => {
    const scripts = [{ src: "https://example.com/script.js" }];

    const result = pageManager.addScripts("non-existent-id", scripts);

    expect(result).toBeNull();
  });

  test("appends new scripts to existing scripts", () => {
    const initialScripts = [{ src: "https://example.com/script1.js" }];

    pageManager.createPage("id", "body", initialScripts);

    const additionalScripts = [{ content: "console.log('Hello');" }];
    const updatedPage = pageManager.addScripts("id", additionalScripts);

    expect(updatedPage).not.toBeNull();
    expect(updatedPage?.scripts).toEqual([
      ...initialScripts,
      ...additionalScripts,
    ]);
  });
});

describe("addStylesheets", () => {
  test("adds stylesheets to an existing page", () => {
    setSystemTime(now);

    pageManager.createPage("id", "body");

    const stylesheets = [{ href: "https://example.com/style.css" }];

    setSystemTime(now + 1);

    const updatedPage = pageManager.addStylesheets("id", stylesheets);
    expect(updatedPage).not.toBeNull();
    expect(updatedPage?.stylesheets).toEqual(stylesheets);
    expect(updatedPage?.expiresAt.getTime()).toBe(now + 1 + PAGE_MAX_AGE);
  });

  test("returns null if the page does not exist", () => {
    const stylesheets = [{ href: "https://example.com/style.css" }];

    const result = pageManager.addStylesheets("non-existent-id", stylesheets);

    expect(result).toBeNull();
  });

  test("appends new stylesheets to existing stylesheets", () => {
    const initialStylesheets = [{ href: "https://example.com/style1.css" }];

    pageManager.createPage("id", "body", [], initialStylesheets);

    const additionalStylesheets = [{ href: "https://example.com/style2.css" }];
    const updatedPage = pageManager.addStylesheets("id", additionalStylesheets);

    expect(updatedPage).not.toBeNull();
    expect(updatedPage?.stylesheets).toEqual([
      ...initialStylesheets,
      ...additionalStylesheets,
    ]);
  });
});

describe("page expiration behavior", () => {
  test("page expires after timeout", async () => {
    const page = pageManager.createPage("id", "body");
    page.connections.add(websocket);

    await new Promise((resolve) => setTimeout(resolve, PAGE_MAX_AGE + 1));

    expect(pageManager.getPage("id")).toBeNull();
    expect(websocket.send).toHaveBeenCalled();

    expect(websocket.send).toHaveBeenCalledWith(
      expect.stringContaining('"type":"expired"'),
    );
    expect(websocket.close).toHaveBeenCalledWith(
      ConnectionCloseCode.Expired,
      ConnectionCloseReason.Expired,
    );
  });

  test("updating page resets expiration", async () => {
    pageManager.createPage("id", "body");

    await new Promise((resolve) => setTimeout(resolve, PAGE_MAX_AGE / 2));

    pageManager.updatePage("id", "updated-body");

    await new Promise((resolve) => setTimeout(resolve, PAGE_MAX_AGE / 2 + 1));

    expect(pageManager.getPage("id")).not.toBeNull();

    await new Promise((resolve) => setTimeout(resolve, PAGE_MAX_AGE / 2));

    expect(pageManager.getPage("id")).toBeNull();
  });
});

describe("removeAllPages", () => {
  test("removes all pages and returns the correct count", () => {
    pageManager.createPage("id1", "body1");
    pageManager.createPage("id2", "body2");

    const removedCount = pageManager.removeAllPages();

    expect(removedCount).toBe(2);
    expect(pageManager.pageCount).toBe(0);
    expect(pageManager.getPage("id1")).toBeNull();
    expect(pageManager.getPage("id2")).toBeNull();
  });

  test("closes all connections when removing pages", () => {
    const page = pageManager.createPage("id1", "body1");

    page.connections.add(websocket);

    pageManager.removeAllPages();

    expect(websocket.send).toHaveBeenCalled();
    expect(websocket.close).toHaveBeenCalledWith(
      ConnectionCloseCode.Removed,
      ConnectionCloseReason.Removed,
    );
  });

  test("returns 0 when there are no pages to remove", () => {
    const removedCount = pageManager.removeAllPages();

    expect(removedCount).toBe(0);
    expect(pageManager.pageCount).toBe(0);
  });

  test("clears all timers when removing pages", () => {
    setSystemTime(now);

    pageManager.createPage("id1", "body1");
    pageManager.createPage("id2", "body2");

    pageManager.removeAllPages();

    const page = pageManager.createPage("id3", "body3");

    expect(pageManager.getPage("id3")).toBe(page);
  });
});
