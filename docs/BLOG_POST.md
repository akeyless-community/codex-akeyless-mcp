# Blog post draft — Akeyless ARA for OpenAI Codex

**Suggested title:** Akeyless Agentic Runtime Authority for OpenAI Codex  
**Status:** Draft

## Summary

The `@akeyless-community/codex-mcp` package brings [Agentic Runtime Authority (ARA)](https://docs.akeyless.io/docs/agentic-runtime-authority) to OpenAI Codex. Codex can list ARA-enabled secrets, query databases, and execute cloud actions — credentials stay in Akeyless and never enter the model context.

This is the same ARA MCP surface as `akeyless mcp-runtime-authority` and the [Claude connector](https://github.com/akeyless-community/claude-akeyless-connector), implemented with the Akeyless Node.js SDK (no CLI required).

## Workflow

1. Developer asks Codex to query a database or list cloud resources
2. Codex calls `list-secrets` — sees secret paths and target types only
3. Codex calls `query-db` or `service-execute` with a payload
4. The Akeyless Gateway executes the action with JIT credentials
5. Codex receives results — no long-lived secrets in prompts or context

## Tools

- `list-secrets` — discover ARA-enabled dynamic, rotated, and custom-MCP secrets
- `query-db` — MySQL, PostgreSQL, MSSQL, Oracle, Snowflake, MongoDB, Redis, Cassandra
- `service-execute` — AWS, GCP, Azure, Kubernetes, GitHub, custom MCP
- `list-sub-tools` — optional discovery of service sub-tools

## Configuration

Single gateway URL — `AKEYLESS_GATEWAY_URL` — with SDK and ARA bases derived automatically.

```bash
export AKEYLESS_GATEWAY_URL="https://your-gateway.example.com:8000"
export AKEYLESS_ACCESS_ID="p-xxxxx"
export AKEYLESS_ACCESS_KEY="your-key"
export AKEYLESS_AGENT_ID="codex-agent"
```

## Links

- npm: `@akeyless-community/codex-mcp`
- GitHub: `github.com/akeyless-community/codex-akeyless-mcp`
