#!/usr/bin/env node

import { runStdioServer } from './server';

runStdioServer().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`[akeyless-codex-mcp] Fatal: ${message}\n`);
  process.exit(1);
});
