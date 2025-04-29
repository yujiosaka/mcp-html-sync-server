import { describe, expect, test } from "bun:test";
import { McpError } from "@modelcontextprotocol/sdk/types.js";
import {
  ErrorMessage,
  assertAddScriptsArgs,
  assertAddStylesheetsArgs,
  assertCreatePageArgs,
  assertDestroyPageArgs,
  assertUpdatePageArgs,
} from "../../../src/mcp-server/request-handlers/validator.js";

describe("assertCreatePageArgs", () => {
  test("does not throw for valid CreatePageArgs without scripts and stylesheets", () => {
    const validArgs = { body: "body" };

    expect(() => assertCreatePageArgs(validArgs)).not.toThrow();
  });

  test("does not throw for valid CreatePageArgs with scripts", () => {
    const validArgs = {
      body: "body",
      scripts: [
        { src: "https://example.com/script.js" },
        { content: "console.log('Hello');" },
      ],
    };

    expect(() => assertCreatePageArgs(validArgs)).not.toThrow();
  });

  test("does not throw for valid CreatePageArgs with stylesheets", () => {
    const validArgs = {
      body: "body",
      stylesheets: [{ href: "https://example.com/style.css" }],
    };

    expect(() => assertCreatePageArgs(validArgs)).not.toThrow();
  });

  test("throws for invalid scripts format", () => {
    const invalidArgs = {
      body: "body",
      scripts: "not an array",
    };

    expect(() => assertCreatePageArgs(invalidArgs)).toThrow(McpError);
    expect(() => assertCreatePageArgs(invalidArgs)).toThrow(
      ErrorMessage.InvalidScripts,
    );
  });

  test("throws for invalid script item", () => {
    const invalidArgs = {
      body: "body",
      scripts: [{ notSrcOrContent: "invalid" }],
    };

    expect(() => assertCreatePageArgs(invalidArgs)).toThrow(McpError);
    expect(() => assertCreatePageArgs(invalidArgs)).toThrow(
      ErrorMessage.InvalidScript,
    );
  });

  test("throws when script has both src and content", () => {
    const invalidArgs = {
      body: "body",
      scripts: [
        {
          src: "https://example.com/script.js",
          content: "console.log('Hello');",
        },
      ],
    };

    expect(() => assertCreatePageArgs(invalidArgs)).toThrow(McpError);
    expect(() => assertCreatePageArgs(invalidArgs)).toThrow(
      ErrorMessage.InvalidScript,
    );
  });

  test("throws for invalid stylesheets format", () => {
    const invalidArgs = {
      body: "body",
      stylesheets: "not an array",
    };

    expect(() => assertCreatePageArgs(invalidArgs)).toThrow(McpError);
    expect(() => assertCreatePageArgs(invalidArgs)).toThrow(
      ErrorMessage.InvalidStylesheets,
    );
  });

  test("throws for invalid stylesheet item", () => {
    const invalidArgs = {
      body: "body",
      stylesheets: [{ notHref: "invalid" }],
    };

    expect(() => assertCreatePageArgs(invalidArgs)).toThrow(McpError);
    expect(() => assertCreatePageArgs(invalidArgs)).toThrow(
      ErrorMessage.InvalidStylesheet,
    );
  });

  test("throws for non-string href", () => {
    const invalidArgs = {
      body: "body",
      stylesheets: [{ href: 123 }],
    };

    expect(() => assertCreatePageArgs(invalidArgs)).toThrow(McpError);
    expect(() => assertCreatePageArgs(invalidArgs)).toThrow(
      ErrorMessage.InvalidStylesheetHref,
    );
  });

  test("throws for non-object args", () => {
    const invalidArgs = "not an object";

    expect(() => assertCreatePageArgs(invalidArgs)).toThrow(McpError);
    expect(() => assertCreatePageArgs(invalidArgs)).toThrow(
      ErrorMessage.InvalidArguments,
    );
  });

  test("throws for null args", () => {
    const invalidArgs = null;

    expect(() => assertCreatePageArgs(invalidArgs)).toThrow(McpError);
    expect(() => assertCreatePageArgs(invalidArgs)).toThrow(
      ErrorMessage.InvalidArguments,
    );
  });

  test("throws for missing body", () => {
    const invalidArgs = {};

    expect(() => assertCreatePageArgs(invalidArgs)).toThrow(McpError);
    expect(() => assertCreatePageArgs(invalidArgs)).toThrow(
      ErrorMessage.InvalidBody,
    );
  });

  test("throws for non-string body", () => {
    const invalidArgs = { body: 123 };

    expect(() => assertCreatePageArgs(invalidArgs)).toThrow(McpError);
    expect(() => assertCreatePageArgs(invalidArgs)).toThrow(
      ErrorMessage.InvalidBody,
    );
  });
});

describe("assertUpdatePageArgs", () => {
  test("does not throw for valid UpdatePageArgs", () => {
    const validArgs = { id: "id", body: "body" };

    expect(() => assertUpdatePageArgs(validArgs)).not.toThrow();
  });

  test("throws for non-object args", () => {
    const invalidArgs = "not an object";

    expect(() => assertUpdatePageArgs(invalidArgs)).toThrow(McpError);
    expect(() => assertUpdatePageArgs(invalidArgs)).toThrow(
      ErrorMessage.InvalidArguments,
    );
  });

  test("throws for null args", () => {
    const invalidArgs = null;

    expect(() => assertUpdatePageArgs(invalidArgs)).toThrow(McpError);
    expect(() => assertUpdatePageArgs(invalidArgs)).toThrow(
      ErrorMessage.InvalidArguments,
    );
  });

  test("throws for missing id", () => {
    const invalidArgs = { body: "body" };

    expect(() => assertUpdatePageArgs(invalidArgs)).toThrow(McpError);
    expect(() => assertUpdatePageArgs(invalidArgs)).toThrow(
      ErrorMessage.InvalidId,
    );
  });

  test("throws for non-string id", () => {
    const invalidArgs = { id: 123, body: "body" };

    expect(() => assertUpdatePageArgs(invalidArgs)).toThrow(McpError);
    expect(() => assertUpdatePageArgs(invalidArgs)).toThrow(
      ErrorMessage.InvalidId,
    );
  });

  test("throws for missing body", () => {
    const invalidArgs = { id: "id" };

    expect(() => assertUpdatePageArgs(invalidArgs)).toThrow(McpError);
    expect(() => assertUpdatePageArgs(invalidArgs)).toThrow(
      ErrorMessage.InvalidBody,
    );
  });

  test("throws for non-string body", () => {
    const invalidArgs = { id: "id", body: 123 };

    expect(() => assertUpdatePageArgs(invalidArgs)).toThrow(McpError);
    expect(() => assertUpdatePageArgs(invalidArgs)).toThrow(
      ErrorMessage.InvalidBody,
    );
  });
});

describe("assertDestroyPageArgs", () => {
  test("does not throw for valid DestroyPageArgs", () => {
    const validArgs = { id: "id" };

    expect(() => assertDestroyPageArgs(validArgs)).not.toThrow();
  });

  test("throws for non-object args", () => {
    const invalidArgs = "not an object";

    expect(() => assertDestroyPageArgs(invalidArgs)).toThrow(McpError);
    expect(() => assertDestroyPageArgs(invalidArgs)).toThrow(
      ErrorMessage.InvalidArguments,
    );
  });

  test("throws for null args", () => {
    const invalidArgs = null;

    expect(() => assertDestroyPageArgs(invalidArgs)).toThrow(McpError);
    expect(() => assertDestroyPageArgs(invalidArgs)).toThrow(
      ErrorMessage.InvalidArguments,
    );
  });

  test("throws for missing id", () => {
    const invalidArgs = {};

    expect(() => assertDestroyPageArgs(invalidArgs)).toThrow(McpError);
    expect(() => assertDestroyPageArgs(invalidArgs)).toThrow(
      ErrorMessage.InvalidId,
    );
  });

  test("throws for non-string id", () => {
    const invalidArgs = { id: 123 };

    expect(() => assertDestroyPageArgs(invalidArgs)).toThrow(McpError);
    expect(() => assertDestroyPageArgs(invalidArgs)).toThrow(
      ErrorMessage.InvalidId,
    );
  });
});

describe("assertAddStylesheetsArgs", () => {
  test("does not throw for valid AddStylesheetsArgs", () => {
    const validArgs = {
      id: "id",
      stylesheets: [{ href: "https://example.com/style.css" }],
    };

    expect(() => assertAddStylesheetsArgs(validArgs)).not.toThrow();
  });

  test("throws for non-object args", () => {
    const invalidArgs = "not an object";

    expect(() => assertAddStylesheetsArgs(invalidArgs)).toThrow(McpError);
    expect(() => assertAddStylesheetsArgs(invalidArgs)).toThrow(
      ErrorMessage.InvalidArguments,
    );
  });

  test("throws for null args", () => {
    const invalidArgs = null;

    expect(() => assertAddStylesheetsArgs(invalidArgs)).toThrow(McpError);
    expect(() => assertAddStylesheetsArgs(invalidArgs)).toThrow(
      ErrorMessage.InvalidArguments,
    );
  });

  test("throws for missing id", () => {
    const invalidArgs = {
      stylesheets: [{ href: "https://example.com/style.css" }],
    };

    expect(() => assertAddStylesheetsArgs(invalidArgs)).toThrow(McpError);
    expect(() => assertAddStylesheetsArgs(invalidArgs)).toThrow(
      ErrorMessage.InvalidId,
    );
  });

  test("throws for non-string id", () => {
    const invalidArgs = {
      id: 123,
      stylesheets: [{ href: "https://example.com/style.css" }],
    };

    expect(() => assertAddStylesheetsArgs(invalidArgs)).toThrow(McpError);
    expect(() => assertAddStylesheetsArgs(invalidArgs)).toThrow(
      ErrorMessage.InvalidId,
    );
  });

  test("throws for missing stylesheets", () => {
    const invalidArgs = { id: "id" };

    expect(() => assertAddStylesheetsArgs(invalidArgs)).toThrow(McpError);
    expect(() => assertAddStylesheetsArgs(invalidArgs)).toThrow(
      ErrorMessage.InvalidStylesheets,
    );
  });

  test("throws for non-array stylesheets", () => {
    const invalidArgs = {
      id: "id",
      stylesheets: "not an array",
    };

    expect(() => assertAddStylesheetsArgs(invalidArgs)).toThrow(McpError);
    expect(() => assertAddStylesheetsArgs(invalidArgs)).toThrow(
      ErrorMessage.InvalidStylesheets,
    );
  });

  test("throws for invalid stylesheet item", () => {
    const invalidArgs = {
      id: "id",
      stylesheets: [{ notHref: "invalid" }],
    };

    expect(() => assertAddStylesheetsArgs(invalidArgs)).toThrow(McpError);
    expect(() => assertAddStylesheetsArgs(invalidArgs)).toThrow(
      ErrorMessage.InvalidStylesheet,
    );
  });

  test("throws for non-string href", () => {
    const invalidArgs = {
      id: "id",
      stylesheets: [{ href: 123 }],
    };

    expect(() => assertAddStylesheetsArgs(invalidArgs)).toThrow(McpError);
    expect(() => assertAddStylesheetsArgs(invalidArgs)).toThrow(
      ErrorMessage.InvalidStylesheetHref,
    );
  });
});

describe("assertAddScriptsArgs", () => {
  test("does not throw for valid AddScriptsArgs", () => {
    const validArgs = {
      id: "id",
      scripts: [
        { src: "https://example.com/script.js" },
        { content: "console.log('Hello');" },
      ],
    };

    expect(() => assertAddScriptsArgs(validArgs)).not.toThrow();
  });

  test("throws for non-object args", () => {
    const invalidArgs = "not an object";

    expect(() => assertAddScriptsArgs(invalidArgs)).toThrow(McpError);
    expect(() => assertAddScriptsArgs(invalidArgs)).toThrow(
      ErrorMessage.InvalidArguments,
    );
  });

  test("throws for null args", () => {
    const invalidArgs = null;

    expect(() => assertAddScriptsArgs(invalidArgs)).toThrow(McpError);
    expect(() => assertAddScriptsArgs(invalidArgs)).toThrow(
      ErrorMessage.InvalidArguments,
    );
  });

  test("throws for missing id", () => {
    const invalidArgs = {
      scripts: [{ src: "https://example.com/script.js" }],
    };

    expect(() => assertAddScriptsArgs(invalidArgs)).toThrow(McpError);
    expect(() => assertAddScriptsArgs(invalidArgs)).toThrow(
      ErrorMessage.InvalidId,
    );
  });

  test("throws for non-string id", () => {
    const invalidArgs = {
      id: 123,
      scripts: [{ src: "https://example.com/script.js" }],
    };

    expect(() => assertAddScriptsArgs(invalidArgs)).toThrow(McpError);
    expect(() => assertAddScriptsArgs(invalidArgs)).toThrow(
      ErrorMessage.InvalidId,
    );
  });

  test("throws for missing scripts", () => {
    const invalidArgs = { id: "id" };

    expect(() => assertAddScriptsArgs(invalidArgs)).toThrow(McpError);
    expect(() => assertAddScriptsArgs(invalidArgs)).toThrow(
      ErrorMessage.InvalidScripts,
    );
  });

  test("throws for non-array scripts", () => {
    const invalidArgs = {
      id: "id",
      scripts: "not an array",
    };

    expect(() => assertAddScriptsArgs(invalidArgs)).toThrow(McpError);
    expect(() => assertAddScriptsArgs(invalidArgs)).toThrow(
      ErrorMessage.InvalidScripts,
    );
  });

  test("throws for invalid script item", () => {
    const invalidArgs = {
      id: "id",
      scripts: [{ notSrcOrContent: "invalid" }],
    };

    expect(() => assertAddScriptsArgs(invalidArgs)).toThrow(McpError);
    expect(() => assertAddScriptsArgs(invalidArgs)).toThrow(
      ErrorMessage.InvalidScript,
    );
  });

  test("throws when script has both src and content", () => {
    const invalidArgs = {
      id: "id",
      scripts: [
        {
          src: "https://example.com/script.js",
          content: "console.log('Hello');",
        },
      ],
    };

    expect(() => assertAddScriptsArgs(invalidArgs)).toThrow(McpError);
    expect(() => assertAddScriptsArgs(invalidArgs)).toThrow(
      ErrorMessage.InvalidScript,
    );
  });

  test("throws for non-string src", () => {
    const invalidArgs = {
      id: "id",
      scripts: [{ src: 123 }],
    };

    expect(() => assertAddScriptsArgs(invalidArgs)).toThrow(McpError);
    expect(() => assertAddScriptsArgs(invalidArgs)).toThrow(
      ErrorMessage.InvalidScriptSrc,
    );
  });

  test("throws for non-string content", () => {
    const invalidArgs = {
      id: "id",
      scripts: [{ content: 123 }],
    };

    expect(() => assertAddScriptsArgs(invalidArgs)).toThrow(McpError);
    expect(() => assertAddScriptsArgs(invalidArgs)).toThrow(
      ErrorMessage.InvalidScriptContent,
    );
  });
});
