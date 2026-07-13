---
name: akeyless-ara
description: Use Akeyless Agentic Runtime Authority (ARA) for secretless database and cloud access. Never expose credential values in responses.
---

# Akeyless ARA for Codex

Use the bundled Akeyless ARA MCP server for infrastructure access. This connector exposes **only** ARA tools — the same surface as `akeyless mcp-runtime-authority`.

## Core rules

1. **Never print, echo, or return secret values** — only names, paths, and action/query results.
2. **Start with `list-secrets`** to discover ARA-enabled secrets and target types.
3. **Use `query-db` for databases** (MySQL, PostgreSQL, MSSQL, Oracle, Snowflake, MongoDB, Redis, Cassandra, etc.).
4. **Use `service-execute` for cloud/K8s/GitHub/custom-MCP** secrets.
5. **Always ask the user to approve** before `query-db` or `service-execute`.

## ARA tools

| Tool | When to use |
|---|---|
| `list-secrets` | Discover ARA-enabled dynamic, rotated, and custom-MCP secrets |
| `query-db` | Run SQL or DB commands against database secrets |
| `service-execute` | Run AWS, GCP, Azure, Kubernetes, GitHub, or custom-MCP actions |
| `list-sub-tools` | (Optional) Discover sub-tools on a service secret before `service-execute` |

## Typical workflow

1. `list-secrets` — find available secrets and target types
2. (Optional) `list-sub-tools` — for service secrets with many sub-tools
3. `query-db` or `service-execute` — run the action with `secret-name`, `payload`, and `agent-id`

## Auth setup

Configure in Codex MCP env settings (not in prompts):

- `AKEYLESS_ACCESS_ID` + `AKEYLESS_ACCESS_KEY` (default)
- `AKEYLESS_GATEWAY_URL` — Gateway address (SDK + ARA URLs derived automatically)
- `AKEYLESS_AGENT_ID` — auditing identifier for ARA sessions
- Or `AKEYLESS_ACCESS_TYPE=jwt|universal_identity|aws_iam|azure_ad|gcp`
- Or pre-issued `AKEYLESS_TOKEN`

See the repository README for full auth options.
