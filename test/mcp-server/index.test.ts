import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { mcpServer } from "../../src/mcp-server/index.js";
import { RequestType } from "../../src/mcp-server/scheme.js";
import { pageManager } from "../../src/page-manager.js";

interface ToolResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
  metadata?: {
    id: string;
    url: string;
    expires_at: string;
  };
  isError?: boolean;
}

mock.module("../../src/env", () => ({
  env: {
    BASE_URL: "http://localhost:3000/",
  },
}));

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
          text: "Page created successfully! A URL is provided below to view your page.",
        },
        {
          type: "text",
          text: expect.stringContaining(
            "View your HTML page in URL: http://localhost:3000/",
          ),
        },
        {
          type: "text",
          text: expect.stringContaining("ID: "),
        },
      ],
      metadata: expect.objectContaining({
        id: expect.any(String),
        url: expect.stringContaining("http://localhost:3000/"),
        expires_at: expect.any(String),
      }),
    });

    const id = result.metadata?.id as string;

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
          text: "Page created successfully! A URL is provided below to view your page.",
        },
        {
          type: "text",
          text: expect.stringContaining(
            "View your HTML page in URL: http://localhost:3000/",
          ),
        },
        {
          type: "text",
          text: expect.stringContaining("ID: "),
        },
      ],
      metadata: expect.objectContaining({
        id: expect.any(String),
        url: expect.stringContaining("http://localhost:3000/"),
        expires_at: expect.any(String),
      }),
    });

    const id = result.metadata?.id as string;

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

    const id = createResult.metadata?.id as string;

    const updateResult = (await client.callTool({
      name: RequestType.UpdatePage,
      arguments: { id, body: "<h1>Updated Content</h1>" },
    })) as ToolResponse;

    expect(updateResult).toEqual({
      content: [
        {
          type: "text",
          text: "Page updated successfully! A URL is provided below to view your updated page.",
        },
        {
          type: "text",
          text: expect.stringContaining(
            "View your HTML page in URL: http://localhost:3000/",
          ),
        },
        {
          type: "text",
          text: expect.stringContaining("ID: "),
        },
      ],
      metadata: expect.objectContaining({
        id: expect.any(String),
        url: expect.stringContaining("http://localhost:3000/"),
        expires_at: expect.any(String),
      }),
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

    expect(updateResult).toEqual({
      content: [
        {
          type: "text",
          text: expect.stringContaining(
            "Error updating page: Page not found: non-existent-id",
          ),
        },
      ],
      isError: true,
    });

    const page = pageManager.getPage("non-existent-id");
    expect(page).toBeNull();
  });

  test("returns error when updating a removed page", async () => {
    const createResult = (await client.callTool({
      name: RequestType.CreatePage,
      arguments: { body: "<h1>Original Content</h1>" },
    })) as ToolResponse;

    const id = createResult.metadata?.id as string;

    pageManager.removePage(id);

    expect(pageManager.getPage(id)).toBeNull();

    const updateResult = (await client.callTool({
      name: RequestType.UpdatePage,
      arguments: { id, body: "<h1>Recreated Content</h1>" },
    })) as ToolResponse;

    expect(updateResult).toEqual({
      content: [
        {
          type: "text",
          text: expect.stringContaining(
            `Error updating page: Page not found: ${id}`,
          ),
        },
      ],
      isError: true,
    });

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

    const id = createResult.metadata?.id as string;

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

    expect(destroyResult).toEqual({
      content: [
        {
          type: "text",
          text: expect.stringContaining("destroyed successfully"),
        },
      ],
    });
  });
});

describe("add_scripts", () => {
  test("adds scripts to an existing page", async () => {
    const createResult = (await client.callTool({
      name: RequestType.CreatePage,
      arguments: { body: "<div>Test Page</div>" },
    })) as ToolResponse;

    const id = createResult.metadata?.id as string;

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
          text: "Scripts added successfully! A URL is provided below to view your page.",
        },
        {
          type: "text",
          text: expect.stringContaining(
            "View your HTML page in URL: http://localhost:3000/",
          ),
        },
        {
          type: "text",
          text: expect.stringContaining("ID: "),
        },
      ],
      metadata: expect.objectContaining({
        id: expect.any(String),
        url: expect.stringContaining("http://localhost:3000/"),
        expires_at: expect.any(String),
      }),
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

    expect(addScriptsResult).toEqual({
      content: [
        {
          type: "text",
          text: expect.stringContaining("not found"),
        },
      ],
      isError: true,
    });
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

    const id = createResult.metadata?.id as string;

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

    expect(addScriptsResult).toEqual({
      content: [
        {
          type: "text",
          text: "Scripts added successfully! A URL is provided below to view your page.",
        },
        {
          type: "text",
          text: expect.stringContaining(
            "View your HTML page in URL: http://localhost:3000/",
          ),
        },
        {
          type: "text",
          text: expect.stringContaining("ID: "),
        },
      ],
      metadata: expect.objectContaining({
        id: expect.any(String),
        url: expect.stringContaining("http://localhost:3000/"),
        expires_at: expect.any(String),
      }),
    });

    page = pageManager.getPage(id);
    expect(page).not.toBeNull();
    expect(page?.scripts).toEqual([...initialScripts, ...additionalScripts]);
  });
});

describe("add_stylesheets", () => {
  test("adds stylesheets to an existing page", async () => {
    const createResult = (await client.callTool({
      name: RequestType.CreatePage,
      arguments: { body: "<div>Test Page</div>" },
    })) as ToolResponse;

    const id = createResult.metadata?.id as string;

    const stylesheets = [{ href: "https://example.com/style.css" }];

    const addStylesheetsResult = (await client.callTool({
      name: RequestType.AddStylesheets,
      arguments: { id, stylesheets },
    })) as ToolResponse;

    expect(addStylesheetsResult).toEqual({
      content: [
        {
          type: "text",
          text: "Stylesheets added successfully! A URL is provided below to view your page.",
        },
        {
          type: "text",
          text: expect.stringContaining(
            "View your HTML page in URL: http://localhost:3000/",
          ),
        },
        {
          type: "text",
          text: expect.stringContaining("ID: "),
        },
      ],
      metadata: expect.objectContaining({
        id: expect.any(String),
        url: expect.stringContaining("http://localhost:3000/"),
        expires_at: expect.any(String),
      }),
    });

    const page = pageManager.getPage(id);
    expect(page).not.toBeNull();
    expect(page?.stylesheets).toEqual(stylesheets);
  });

  test("returns error when page does not exist", async () => {
    const stylesheets = [{ href: "https://example.com/style.css" }];

    const addStylesheetsResult = (await client.callTool({
      name: RequestType.AddStylesheets,
      arguments: { id: "non-existent-id", stylesheets },
    })) as ToolResponse;

    expect(addStylesheetsResult).toEqual({
      content: [
        {
          type: "text",
          text: expect.stringContaining("not found"),
        },
      ],
      isError: true,
    });
  });

  test("adds stylesheets to a page with existing stylesheets", async () => {
    const initialStylesheets = [
      { href: "https://example.com/initial-style.css" },
    ];

    const createResult = (await client.callTool({
      name: RequestType.CreatePage,
      arguments: {
        body: "<div>Test Page with Stylesheets</div>",
        stylesheets: initialStylesheets,
      },
    })) as ToolResponse;

    const id = createResult.metadata?.id as string;

    let page = pageManager.getPage(id);
    expect(page).not.toBeNull();
    expect(page?.stylesheets).toEqual(initialStylesheets);

    const additionalStylesheets = [
      { href: "https://example.com/additional-style.css" },
    ];

    const addStylesheetsResult = (await client.callTool({
      name: RequestType.AddStylesheets,
      arguments: { id, stylesheets: additionalStylesheets },
    })) as ToolResponse;

    expect(addStylesheetsResult).toEqual({
      content: [
        {
          type: "text",
          text: "Stylesheets added successfully! A URL is provided below to view your page.",
        },
        {
          type: "text",
          text: expect.stringContaining(
            "View your HTML page in URL: http://localhost:3000/",
          ),
        },
        {
          type: "text",
          text: expect.stringContaining("ID: "),
        },
      ],
      metadata: expect.objectContaining({
        id: expect.any(String),
        url: expect.stringContaining("http://localhost:3000/"),
        expires_at: expect.any(String),
      }),
    });

    page = pageManager.getPage(id);
    expect(page).not.toBeNull();
    expect(page?.stylesheets).toEqual([
      ...initialStylesheets,
      ...additionalStylesheets,
    ]);
  });
});
