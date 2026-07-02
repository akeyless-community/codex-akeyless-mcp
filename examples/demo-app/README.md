# Example app using Akeyless references (no secret values in repo)

This demo shows how Codex + Akeyless work together:

1. Secrets live in Akeyless under `/codex/demo-app/local/`
2. `.env.example` contains `akeyless://` references only
3. Codex uses `run_with_environment` to run the app with injected secrets

## Try it with Codex

After configuring the MCP server (see [README](../README.md)):

> "List environment variables for `/codex/demo-app/local`, then run `node index.js` with secrets from Akeyless."

## Manual run (requires Akeyless credentials)

```bash
export AKEYLESS_ACCESS_ID=p-xxxxx
export AKEYLESS_ACCESS_KEY=your-key
export AKEYLESS_ENVIRONMENT_PREFIX=/codex/demo-app/local

# Using the MCP server's runtime injection locally:
node -e "
  const { AkeylessClient } = require('../dist/client');
  const { runCommandWithEnv } = require('../dist/runtime');
  (async () => {
    const client = new AkeylessClient();
    const vars = await client.listEnvironmentVariables();
    const env = await client.resolveEnvMap(vars);
    const result = await runCommandWithEnv({ command: 'node', args: ['index.js'], env, cwd: __dirname });
    process.stdout.write(result.stdout);
    process.exit(result.exitCode ?? 1);
  })();
"
```
