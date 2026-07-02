---
name: akeyless
description: Use Akeyless as the trusted access layer for secrets and infrastructure. Never expose secret values in responses.
---

# Akeyless Trusted Access for Codex

Use the bundled Akeyless MCP server for all secret and credential workflows in this project.

## Core rules

1. **Never print, echo, or return secret values** — only names, paths, and redacted output.
2. **Prefer `run_with_environment`** over manually setting env vars or writing `.env` files.
3. **Prefer ARA tools** (`query-db`, `service-execute`) for databases and cloud APIs when dynamic secrets are available.
4. **Use `store_secret` only when migrating** hardcoded credentials found by `scan_for_exposed_secrets`.
5. **Always ask the user to approve** before `store_secret`, `run_with_environment`, `query-db`, or `service-execute`.

## Environment tools (static secrets / env vars)

| Tool | When to use |
|---|---|
| `list_environment_variables` | Discover configured env var names under an Akeyless prefix |
| `describe_environment` | Summarize the active environment |
| `create_environment` | Bootstrap a new `/codex/{project}/{stage}` prefix |
| `run_with_environment` | Run build/test/dev commands with secrets injected at runtime |
| `write_env_reference` | Generate `.env.example` with `akeyless://` references (no values) |
| `scan_for_exposed_secrets` | Find hardcoded credentials in the repository |
| `store_secret` | Migrate a discovered secret into Akeyless (user approval required) |

## Runtime Authority tools (secretless infrastructure)

| Tool | When to use |
|---|---|
| `list-secrets` | Discover ARA-enabled dynamic/rotated secrets |
| `query-db` | Run SQL against MySQL, PostgreSQL, MSSQL, Oracle, Snowflake, etc. |
| `service-execute` | Run AWS, GCP, Azure, Kubernetes, or GitHub actions |

ARA execute tools require `AKEYLESS_ARA_GATEWAY_URL` pointing to an Akeyless Gateway configuration port.

## Typical workflows

**Bootstrap a project:**
1. `create_environment` with prefix `/codex/{app}/{stage}`
2. `scan_for_exposed_secrets` on the repo
3. `store_secret` for each finding (with approval)
4. `write_env_reference` to create `.env.example`

**Run with secrets:**
1. `list_environment_variables`
2. `run_with_environment` with the appropriate command

**Query infrastructure secretlessly:**
1. `list-secrets`
2. `query-db` or `service-execute` with the chosen secret path

## Auth setup

The user must configure Akeyless credentials in Codex MCP env settings (not in prompts):

- `AKEYLESS_ACCESS_ID` + `AKEYLESS_ACCESS_KEY` (default)
- Or `AKEYLESS_ACCESS_TYPE=jwt|universal_identity|aws_iam|azure_ad|gcp`
- Or pre-issued `AKEYLESS_TOKEN`

See the repository README for full auth options.
