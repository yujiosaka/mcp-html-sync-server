#!/usr/bin/env node

import("../dist/logger.js")
  .then((logger) => {
    import("../dist/server.js").catch((err) => {
      logger.error({ err }, "Failed to start MCP HTML Sync Server");
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error("Failed to load logger:", err);
    process.exit(1);
  });
