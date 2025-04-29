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
    "Create a new page with HTML body content (DO NOT include <script> tags in body - use scripts parameter instead). Returns a URL and page ID for future updates.",
  UpdatePage:
    "Update an existing page with new HTML body content (DO NOT include <script> tags in body - use add_scripts function instead). Requires the page ID from a previous create_page call. This will extend the page's expiration time.",
  DestroyPage:
    "Remove a page by ID. This permanently deletes the page and all associated content (HTML, scripts, stylesheets). This action cannot be undone.",
  AddScripts:
    "Add JavaScript scripts to an existing page. This is the CORRECT way to add or update scripts after page creation. This will extend the page's expiration time.",
  AddStylesheets:
    "Add CSS stylesheets to an existing page. This is the CORRECT way to add or update styles after page creation. This will extend the page's expiration time.",
} as const;
export type RequestDescription =
  (typeof RequestDescription)[keyof typeof RequestDescription];

export const RequestSchema = {
  CreatePage: {
    type: "object",
    properties: {
      body: {
        type: "string",
        description:
          "HTML content for the page body (ONLY the inner content, NO <script> tags here)",
      },
      scripts: {
        type: "array",
        description:
          "Optional array of JavaScript scripts to include in the page. Each script must have EITHER src OR content property.",
        items: {
          type: "object",
          description:
            "Script object with either src property (for external scripts) OR content property (for inline scripts)",
          properties: {
            src: {
              type: "string",
              description:
                "URL for external script (e.g., https://cdn.example.com/script.js)",
            },
            content: {
              type: "string",
              description:
                "Content for inline script (JavaScript code without <script> tags)",
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
          description: "Stylesheet object with href property",
          properties: {
            href: {
              type: "string",
              description:
                "URL for external stylesheet (e.g., https://cdn.example.com/style.css)",
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
        description:
          "ID of the page to update (obtained from the create_page response)",
      },
      body: {
        type: "string",
        description:
          "New HTML content for the page body (ONLY the inner content, NO <script> tags here)",
      },
    },
    required: ["id", "body"],
  },
  DestroyPage: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description:
          "ID of the page to destroy (obtained from a previous create_page response)",
      },
    },
    required: ["id"],
  },
  AddScripts: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description:
          "ID of the page to add scripts to (obtained from a previous create_page response)",
      },
      scripts: {
        type: "array",
        description:
          "Array of JavaScript scripts to add to the page. Each script must have EITHER src OR content property.",
        items: {
          type: "object",
          description:
            "Script object with either src property (for external scripts) OR content property (for inline scripts)",
          properties: {
            src: {
              type: "string",
              description:
                "URL for external script (e.g., https://cdn.example.com/script.js)",
            },
            content: {
              type: "string",
              description:
                "Content for inline script (JavaScript code without <script> tags)",
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
        description:
          "ID of the page to add stylesheets to (obtained from a previous create_page response)",
      },
      stylesheets: {
        type: "array",
        description:
          "Array of CSS stylesheets to add to the page. Each stylesheet must have the href property.",
        items: {
          type: "object",
          description:
            "Stylesheet object with href property for external CSS file",
          properties: {
            href: {
              type: "string",
              description:
                "URL for external stylesheet (e.g., https://cdn.example.com/styles.css)",
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
