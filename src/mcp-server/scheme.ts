export const RequestType = {
  CreatePage: "create_page",
  UpdatePage: "update_page",
  DestroyPage: "destroy_page",
  AddScripts: "add_scripts",
  AddStylesheets: "add_stylesheets",
} as const;
export type RequestType = (typeof RequestType)[keyof typeof RequestType];

export const RequestDescription = {
  CreatePage:
    "Create a new page with HTML body content (without body tags). Returns a URL that can be shown to the user and a page ID that can be saved for future updates.",
  UpdatePage:
    "Update an existing page with new HTML body content (without body tags). Recommended for modifying existing content instead of creating a new page. Requires the page ID from a previous create_page call. This will extend the page's expiration time.",
  DestroyPage: "Remove a page by ID",
  AddScripts:
    "Add JavaScript scripts to an existing page. This will extend the page's expiration time.",
  AddStylesheets:
    "Add CSS stylesheets to an existing page. This will extend the page's expiration time.",
} as const;
export type RequestDescription =
  (typeof RequestDescription)[keyof typeof RequestDescription];

export const RequestSchema = {
  CreatePage: {
    type: "object",
    properties: {
      body: {
        type: "string",
        description: "HTML content for the page body (only the inner content)",
      },
      scripts: {
        type: "array",
        description:
          "Optional array of JavaScript scripts to include in the page",
        items: {
          type: "object",
          description: "Either src or content must be provided",
          properties: {
            src: {
              type: "string",
              description: "URL for external script",
            },
            content: {
              type: "string",
              description: "Content for inline script",
            },
          },
          oneOf: [{ required: ["src"] }, { required: ["content"] }],
        },
      },
      stylesheets: {
        type: "array",
        description: "Optional array of CSS stylesheets to include in the page",
        items: {
          type: "object",
          description: "Stylesheet with href property",
          properties: {
            href: {
              type: "string",
              description: "URL for external stylesheet",
            },
          },
          required: ["href"],
        },
      },
    },
    required: ["body"],
  },
  UpdatePage: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "ID of the page to update",
      },
      body: {
        type: "string",
        description:
          "New HTML content for the page body (only the inner content)",
      },
    },
    required: ["id", "body"],
  },
  DestroyPage: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "ID of the page to destroy",
      },
    },
    required: ["id"],
  },
  AddScripts: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "ID of the page to add scripts to",
      },
      scripts: {
        type: "array",
        description: "Array of JavaScript scripts to add to the page",
        items: {
          type: "object",
          description: "Either src or content must be provided",
          properties: {
            src: {
              type: "string",
              description: "URL for external script",
            },
            content: {
              type: "string",
              description: "Content for inline script",
            },
          },
          oneOf: [{ required: ["src"] }, { required: ["content"] }],
        },
      },
    },
    required: ["id", "scripts"],
  },
  AddStylesheets: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "ID of the page to add stylesheets to",
      },
      stylesheets: {
        type: "array",
        description: "Array of CSS stylesheets to add to the page",
        items: {
          type: "object",
          description: "Stylesheet with href property",
          properties: {
            href: {
              type: "string",
              description: "URL for external stylesheet",
            },
          },
          required: ["href"],
        },
      },
    },
    required: ["id", "stylesheets"],
  },
} as const;
export type RequestSchema = (typeof RequestSchema)[keyof typeof RequestSchema];
