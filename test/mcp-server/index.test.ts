import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { mcpServer } from "../../src/mcp-server/index.js";
import { RequestType } from "../../src/mcp-server/scheme.js";
import { pageManager } from "../../src/page-manager.js";
import type { Script } from "../../src/page.js";

interface ToolResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
}

let client: Client;

beforeEach(async () => {
  client = new Client({ name: "test client", version: "0.0.1" });

  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();

  await Promise.all([
    client.connect(clientTransport),
    mcpServer.open(serverTransport),
  ]);
});

afterEach(async () => {
  await client.close();
  await mcpServer.close();
});

describe("create_page", () => {
  test("creates a new page", async () => {
    const result = (await client.callTool({
      name: RequestType.CreatePage,
      arguments: {
        body: "<h1>Test Page</h1>",
      },
    })) as ToolResponse;

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: expect.stringContaining("Page created successfully"),
        },
      ],
    });

    const responseText = result.content[0]?.text;
    if (!responseText) throw new Error("Response text is undefined");

    const idMatch = responseText.match(/ID: ([a-zA-Z0-9_-]+)/);
    const id = idMatch?.[1];
    if (!id) throw new Error("Page ID is not found");

    const page = pageManager.getPage(id);
    expect(page).not.toBeNull();
    expect(page?.body).toBe("<h1>Test Page</h1>");
  });

  test("creates a page with scripts", async () => {
    const scripts = [
      { src: "https://example.com/external-script.js" },
      { content: "console.log('Hello from inline script');" },
    ];

    const result = (await client.callTool({
      name: RequestType.CreatePage,
      arguments: { body: "<h1>Page with Scripts</h1>", scripts },
    })) as ToolResponse;

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: expect.stringContaining("Page created successfully"),
        },
      ],
    });

    const responseText = result.content[0]?.text;
    if (!responseText) throw new Error("Response text is undefined");

    const idMatch = responseText.match(/ID: ([a-zA-Z0-9_-]+)/);
    const id = idMatch?.[1];
    if (!id) throw new Error("Page ID is not found");

    const page = pageManager.getPage(id);
    expect(page).not.toBeNull();
    expect(page?.body).toBe("<h1>Page with Scripts</h1>");
    expect(page?.scripts).toEqual(scripts);
  });
});

describe("update_page", () => {
  test("update_page updates an existing page and returns success response", async () => {
    const createResult = (await client.callTool({
      name: RequestType.CreatePage,
      arguments: { body: "<h1>Original Content</h1>" },
    })) as ToolResponse;

    const createResponseText = createResult.content[0]?.text;
    if (!createResponseText) throw new Error("Response text is undefined");

    const idMatch = createResponseText.match(/ID: ([a-zA-Z0-9_-]+)/);
    const id = idMatch?.[1];
    if (!id) throw new Error("Page ID is not found");

    const updateResult = (await client.callTool({
      name: RequestType.UpdatePage,
      arguments: { id, body: "<h1>Updated Content</h1>" },
    })) as ToolResponse;

    expect(updateResult).toEqual({
      content: [
        {
          type: "text",
          text: expect.stringContaining("Page updated successfully"),
        },
      ],
    });

    const page = pageManager.getPage(id);
    expect(page).not.toBeNull();
    expect(page?.body).toBe("<h1>Updated Content</h1>");
  });

  test("returns error when updating a non-existent page", async () => {
    const updateResult = (await client.callTool({
      name: RequestType.UpdatePage,
      arguments: { id: "non-existent-id", body: "<h1>New Content</h1>" },
    })) as ToolResponse;

    expect(updateResult.isError).toBeTruthy();
    expect(updateResult.content[0]?.text).toContain(
      "Error updating page: Page not found: non-existent-id",
    );

    const page = pageManager.getPage("non-existent-id");
    expect(page).toBeNull();
  });

  test("returns error when updating a removed page", async () => {
    const createResult = (await client.callTool({
      name: RequestType.CreatePage,
      arguments: { body: "<h1>Original Content</h1>" },
    })) as ToolResponse;

    const createResponseText = createResult.content[0]?.text;
    if (!createResponseText) throw new Error("Response text is undefined");

    const idMatch = createResponseText.match(/ID: ([a-zA-Z0-9_-]+)/);
    const id = idMatch?.[1];
    if (!id) throw new Error("Page ID is not found");

    pageManager.removePage(id);

    expect(pageManager.getPage(id)).toBeNull();

    const updateResult = (await client.callTool({
      name: RequestType.UpdatePage,
      arguments: { id, body: "<h1>Recreated Content</h1>" },
    })) as ToolResponse;

    expect(updateResult.isError).toBeTruthy();
    expect(updateResult.content[0]?.text).toContain(
      `Error updating page: Page not found: ${id}`,
    );

    const page = pageManager.getPage(id);
    expect(page).toBeNull();
  });
});

describe("destroy_page", () => {
  test("removes an existing page and returns success response", async () => {
    const createResult = (await client.callTool({
      name: RequestType.CreatePage,
      arguments: { body: "<h1>Test Page</h1>" },
    })) as ToolResponse;

    const createResponseText = createResult.content[0]?.text;
    if (!createResponseText) throw new Error("Response text is undefined");

    const idMatch = createResponseText.match(/ID: ([a-zA-Z0-9_-]+)/);
    const id = idMatch?.[1];
    if (!id) throw new Error("Page ID is not found");

    const destroyResult = (await client.callTool({
      name: RequestType.DestroyPage,
      arguments: { id },
    })) as ToolResponse;

    expect(destroyResult).toEqual({
      content: [
        {
          type: "text",
          text: expect.stringContaining("destroyed successfully"),
        },
      ],
    });

    const page = pageManager.getPage(id);
    expect(page).toBeNull();
  });

  test("succeeds when destroying a non-existent page", async () => {
    const destroyResult = (await client.callTool({
      name: RequestType.DestroyPage,
      arguments: {
        id: "non-existent-id",
      },
    })) as ToolResponse;

    expect(destroyResult.isError).toBeFalsy();
    expect(destroyResult.content[0]?.text).toContain("destroyed successfully");
  });
});

describe("add_scripts", () => {
  test("adds scripts to an existing page", async () => {
    const createResult = (await client.callTool({
      name: RequestType.CreatePage,
      arguments: { body: "<div>Test Page</div>" },
    })) as ToolResponse;

    const createResponseText = createResult.content[0]?.text;
    if (!createResponseText) throw new Error("Response text is undefined");

    const idMatch = createResponseText.match(/ID: ([a-zA-Z0-9_-]+)/);
    const id = idMatch?.[1];
    if (!id) throw new Error("Page ID is not found");

    const scripts = [
      { src: "https://example.com/script.js" },
      { content: "console.log('Hello from script');" },
    ];

    const addScriptsResult = (await client.callTool({
      name: RequestType.AddScripts,
      arguments: { id, scripts },
    })) as ToolResponse;

    expect(addScriptsResult).toEqual({
      content: [
        {
          type: "text",
          text: expect.stringContaining("Scripts added successfully"),
        },
      ],
    });

    const page = pageManager.getPage(id);
    expect(page).not.toBeNull();
    expect(page?.scripts).toEqual(scripts);
  });

  test("returns error when page does not exist", async () => {
    const scripts = [{ src: "https://example.com/script.js" }];

    const addScriptsResult = (await client.callTool({
      name: RequestType.AddScripts,
      arguments: { id: "non-existent-id", scripts },
    })) as ToolResponse;

    expect(addScriptsResult.isError).toBe(true);
    expect(addScriptsResult.content[0]?.text).toContain("not found");
  });

  test("adds scripts to a page with existing scripts", async () => {
    const initialScripts = [{ src: "https://example.com/initial-script.js" }];

    const createResult = (await client.callTool({
      name: RequestType.CreatePage,
      arguments: {
        body: "<div>Test Page with Scripts</div>",
        scripts: initialScripts,
      },
    })) as ToolResponse;

    const createResponseText = createResult.content[0]?.text;
    if (!createResponseText) throw new Error("Response text is undefined");

    const idMatch = createResponseText.match(/ID: ([a-zA-Z0-9_-]+)/);
    const id = idMatch?.[1];
    if (!id) throw new Error("Page ID is not found");

    let page = pageManager.getPage(id);
    expect(page).not.toBeNull();
    expect(page?.scripts).toEqual(initialScripts);

    const additionalScripts = [
      { content: "console.log('Additional script');" },
    ];

    const addScriptsResult = (await client.callTool({
      name: RequestType.AddScripts,
      arguments: { id, scripts: additionalScripts },
    })) as ToolResponse;

    expect(addScriptsResult.isError).toBeFalsy();
    expect(addScriptsResult.content[0]?.text).toContain(
      "Scripts added successfully",
    );

    page = pageManager.getPage(id);
    expect(page).not.toBeNull();
    expect(page?.scripts).toEqual([...initialScripts, ...additionalScripts]);
  });
});
