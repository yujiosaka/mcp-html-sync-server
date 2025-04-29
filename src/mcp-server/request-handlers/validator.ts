import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import type { Script, Stylesheet } from "../../page.js";

export const ErrorMessage = {
  InvalidArguments: "Arguments must be an object",
  InvalidId: "id must be a string",
  InvalidBody: "body must be a string",
  InvalidScripts: "scripts must be an array",
  InvalidScript: "each script must have either src or content property",
  InvalidScriptSrc: "script src must be a string",
  InvalidScriptContent: "script content must be a string",
  InvalidStylesheets: "stylesheets must be an array",
  InvalidStylesheet: "each stylesheet must have href property",
  InvalidStylesheetHref: "stylesheet href must be a string",
} as const;
export type ErrorMessage = (typeof ErrorMessage)[keyof typeof ErrorMessage];

export interface CreatePageArgs {
  body: string;
  scripts?: Script[];
  stylesheets?: Stylesheet[];
}

export interface UpdatePageArgs {
  id: string;
  body: string;
}

export interface DestroyPageArgs {
  id: string;
}

export interface AddScriptsArgs {
  id: string;
  scripts: Script[];
}

export interface AddStylesheetsArgs {
  id: string;
  stylesheets: Stylesheet[];
}

export function assertCreatePageArgs(
  args: unknown,
): asserts args is CreatePageArgs {
  assertArgs(args);

  if (typeof args.body !== "string") {
    throw new McpError(ErrorCode.InvalidParams, ErrorMessage.InvalidBody);
  }

  if (args.scripts !== undefined) {
    if (!Array.isArray(args.scripts)) {
      throw new McpError(ErrorCode.InvalidParams, ErrorMessage.InvalidScripts);
    }
    assertScripts(args.scripts);
  }

  if (args.stylesheets !== undefined) {
    if (!Array.isArray(args.stylesheets)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        ErrorMessage.InvalidStylesheets,
      );
    }
    assertStylesheets(args.stylesheets);
  }
}

export function assertUpdatePageArgs(
  args: unknown,
): asserts args is UpdatePageArgs {
  assertArgs(args);

  if (typeof args.id !== "string") {
    throw new McpError(ErrorCode.InvalidParams, ErrorMessage.InvalidId);
  }

  if (typeof args.body !== "string") {
    throw new McpError(ErrorCode.InvalidParams, ErrorMessage.InvalidBody);
  }
}

export function assertDestroyPageArgs(
  args: unknown,
): asserts args is DestroyPageArgs {
  assertArgs(args);

  if (typeof args.id !== "string") {
    throw new McpError(ErrorCode.InvalidParams, ErrorMessage.InvalidId);
  }
}

export function assertAddScriptsArgs(
  args: unknown,
): asserts args is AddScriptsArgs {
  assertArgs(args);

  if (typeof args.id !== "string") {
    throw new McpError(ErrorCode.InvalidParams, ErrorMessage.InvalidId);
  }

  if (!Array.isArray(args.scripts)) {
    throw new McpError(ErrorCode.InvalidParams, ErrorMessage.InvalidScripts);
  }
  assertScripts(args.scripts);
}

export function assertAddStylesheetsArgs(
  args: unknown,
): asserts args is AddStylesheetsArgs {
  assertArgs(args);

  if (typeof args.id !== "string") {
    throw new McpError(ErrorCode.InvalidParams, ErrorMessage.InvalidId);
  }

  if (!Array.isArray(args.stylesheets)) {
    throw new McpError(
      ErrorCode.InvalidParams,
      ErrorMessage.InvalidStylesheets,
    );
  }
  assertStylesheets(args.stylesheets);
}

function assertArgs(args: unknown): asserts args is Record<string, unknown> {
  if (typeof args !== "object" || args === null) {
    throw new McpError(ErrorCode.InvalidParams, ErrorMessage.InvalidArguments);
  }
}

function assertScripts(scripts: unknown): asserts scripts is Script[] {
  if (!Array.isArray(scripts)) {
    throw new McpError(ErrorCode.InvalidParams, ErrorMessage.InvalidScripts);
  }

  for (const script of scripts) {
    if (typeof script !== "object" || script === null) {
      throw new McpError(ErrorCode.InvalidParams, ErrorMessage.InvalidScript);
    }

    const hasSrc = "src" in script;
    const hasContent = "content" in script;

    if ((!hasSrc && !hasContent) || (hasSrc && hasContent)) {
      throw new McpError(ErrorCode.InvalidParams, ErrorMessage.InvalidScript);
    }

    if (hasSrc && typeof script.src !== "string") {
      throw new McpError(
        ErrorCode.InvalidParams,
        ErrorMessage.InvalidScriptSrc,
      );
    }

    if (hasContent && typeof script.content !== "string") {
      throw new McpError(
        ErrorCode.InvalidParams,
        ErrorMessage.InvalidScriptContent,
      );
    }
  }
}

function assertStylesheets(
  stylesheets: unknown,
): asserts stylesheets is Stylesheet[] {
  if (!Array.isArray(stylesheets)) {
    throw new McpError(
      ErrorCode.InvalidParams,
      ErrorMessage.InvalidStylesheets,
    );
  }

  for (const stylesheet of stylesheets) {
    if (typeof stylesheet !== "object" || stylesheet === null) {
      throw new McpError(
        ErrorCode.InvalidParams,
        ErrorMessage.InvalidStylesheet,
      );
    }

    const hasHref = "href" in stylesheet;

    if (!hasHref) {
      throw new McpError(
        ErrorCode.InvalidParams,
        ErrorMessage.InvalidStylesheet,
      );
    }

    if (typeof stylesheet.href !== "string") {
      throw new McpError(
        ErrorCode.InvalidParams,
        ErrorMessage.InvalidStylesheetHref,
      );
    }
  }
}
