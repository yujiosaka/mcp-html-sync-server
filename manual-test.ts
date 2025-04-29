import readline from "node:readline";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { RequestType } from "./src/mcp-server/scheme.js";

interface ToolResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
  metadata?: {
    id?: string;
    url?: string;
    expires_at?: string;
  };
  isError?: boolean;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const client = new Client({ name: "manual-test-client", version: "0.0.1" });

const transport = new StdioClientTransport({
  command: "bun",
  args: ["run", "src/server.ts"],
  stderr: "pipe",
});

transport.onerror = (error) => {
  console.error("Transport error:", error);
};

transport.stderr?.on("data", (data) => {
  console.error(`🔴 Server stderr: ${data}`);
});

console.log("🚀 Starting MCP Manual Test with Stdio Transport");
console.log("================================================");
console.log("Creating MCP client...");
console.log("Creating transport and starting server...");

try {
  console.log("Connecting to MCP server...");
  await client.connect(transport);

  console.log(
    "Creating a new page with canvas-confetti from CDN and Bootstrap CSS...",
  );

  const initialScripts = [
    {
      src: "https://cdn.jsdelivr.net/npm/bootstrap@5.3.5/dist/js/bootstrap.bundle.min.js",
    },
    {
      src: "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js",
    },
    {
      content:
        "confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } });",
    },
  ];
  const initialStylesheets = [
    {
      href: "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css",
    },
  ];

  const createResult = (await client.callTool({
    name: RequestType.CreatePage,
    arguments: {
      body: "<h1 class='display-4 text-center mt-4'>Test Page</h1>",
      scripts: initialScripts,
      stylesheets: initialStylesheets,
    },
  })) as ToolResponse;
  displayResponse(createResult);

  const id = createResult.metadata?.id;
  const url = createResult.metadata?.url;
  if (!id)
    throw new Error("Failed to extract page ID from metadata. Exiting test.");

  console.log(`Page created with ID: ${id}`);
  console.log(`Page URL: ${url}`);

  await waitForConfirmation("\nStep 2: Ready to update the page?");

  console.log(`Updating page with ID: ${id}...`);
  const updateResult = (await client.callTool({
    name: RequestType.UpdatePage,
    arguments: {
      id,
      body: `
      <h1 class='display-4 text-center mt-4'>Updated Test Page</h1>
      <div class='col text-center'>
        <h2 class='animate__animated animate__bounce'>This heading will be animated</h2>
      </div>
      `,
    },
  })) as ToolResponse;
  displayResponse(updateResult);

  await waitForConfirmation("\nStep 3: Ready to add a stylesheet?");

  console.log(`Adding additional stylesheet for page with ID: ${id}...`);

  const additionalStylesheets = [
    {
      href: "https://cdn.jsdelivr.net/npm/animate.css@4.1.1/animate.min.css",
    },
  ];

  const addStylesheetsResult = (await client.callTool({
    name: RequestType.AddStylesheets,
    arguments: { id, stylesheets: additionalStylesheets },
  })) as ToolResponse;
  displayResponse(addStylesheetsResult);

  await waitForConfirmation(
    "\nStep 4: Ready to add a script to trigger confetti animations?",
  );

  console.log(
    `Adding script to trigger canvas-confetti for page with ID: ${id}...`,
  );

  const additionalScripts = [
    {
      src: "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js",
    },
    {
      content:
        "confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } });",
    },
  ];

  const addScriptsResult = (await client.callTool({
    name: RequestType.AddScripts,
    arguments: { id, scripts: additionalScripts },
  })) as ToolResponse;
  displayResponse(addScriptsResult);

  await waitForConfirmation("\nStep 5: Ready to delete the page?");

  console.log(`Deleting page with ID: ${id}...`);
  const deleteResult = (await client.callTool({
    name: RequestType.DestroyPage,
    arguments: { id },
  })) as ToolResponse;
  displayResponse(deleteResult);

  await waitForConfirmation("\nReady to exit?");

  rl.close();

  await client.close();

  console.log("\n================================================");
  console.log("✅ Manual stdio test completed");
  process.exit(0);
} catch (err) {
  rl.close();

  await client.close();

  console.error("❌ Error during test:", err);
  process.exit(1);
}

async function waitForConfirmation(message: string): Promise<void> {
  return new Promise((resolve) => {
    rl.question(`${message} (Press Enter to continue)`, () => {
      resolve();
    });
  });
}

function displayResponse(response: ToolResponse): void {
  console.log("Result:", JSON.stringify(response, null, 2));

  if (response.isError) {
    console.log("❌ Error:", response.content[0]?.text || "Unknown error");
    return;
  }

  console.log("✅ Success:", response.content[0]?.text || "No message");
}
