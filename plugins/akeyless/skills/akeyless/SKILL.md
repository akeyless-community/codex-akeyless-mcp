---
name: akeyless-ara
description: Use Akeyless Agentic Runtime Authority (ARA) for secretless database, cloud, and remote host (SSH, Windows, LDAP) access. Never expose credential values in responses.
---

# Akeyless ARA for Codex

Use the bundled Akeyless ARA MCP server for infrastructure access. This connector exposes **only** ARA tools — the same surface as `akeyless mcp-runtime-authority`.

## Core rules

1. **Never print, echo, or return secret values** — only names, paths, and action/query results.
2. **Start with `list-secrets`** to discover ARA-enabled secrets and target types.
3. **Use `query-db` for databases** (MySQL, PostgreSQL, MSSQL, Oracle, Snowflake, MongoDB, Redis, Cassandra, etc.).
4. **Use `service-execute` for cloud/K8s/GitHub/custom-MCP** secrets, and for remote commands on SSH, Windows, RDP, LDAP, linked, and SSH certificate issuer items.
5. **Always ask the user to approve** before `query-db` or `service-execute`.

## ARA tools

| Tool | When to use |
|---|---|
| `list-secrets` | Discover ARA-enabled dynamic, rotated, and custom-MCP secrets and SSH certificate issuers |
| `query-db` | Run SQL or DB commands against database secrets |
| `service-execute` | Run AWS, GCP, Azure, Kubernetes, GitHub, or custom-MCP actions, or one command on a remote host |
| `list-sub-tools` | (Optional) Discover sub-tools on a service secret or remote item before `service-execute` |

## Typical workflow

1. `list-secrets` — find available secrets and target types
2. (Optional) `list-sub-tools` — for service secrets with many sub-tools
3. `query-db` or `service-execute` — run the action with `secret-name`, `payload`, and `agent-id`

## Remote commands (SSH, Windows, LDAP)

Items with `target_type` `ssh`, `windows`, `rdp`, `ldap`, or `linked`, and SSH certificate issuers (`secret_type: ssh-cert-issuer`), run one non-interactive command on a host through `service-execute` (requires Gateway 5.6.0+):

- Plain command line as the payload, e.g. `uptime` (SSH) or `Get-Service` (WinRM).
- Sub-tool call to pick the host, directory, or shell, or to move a file: `{"tool":"run","arguments":{"command":"df -h","host":"web1.corp","cwd":"/"}}`. Other sub-tools: `upload` (`remote_path`, base64 `content`) and `download` (`remote_path`).
- If the error lists several hosts (or users, for an SSH certificate issuer), call again with `host` (or `remote_user`) set to one of them.
- The result has `stdout`, `stderr`, `exit_code`; pass the returned `cwd` back on the next `run` to stay in the same directory. A non-zero `exit_code` is the command's own failure.
- No TTY: commands that prompt (e.g. `sudo` asking for a password) fail.

## Auth setup

Configure in Codex MCP env settings (not in prompts):

- `AKEYLESS_ACCESS_ID` + `AKEYLESS_ACCESS_KEY` (default)
- `AKEYLESS_GATEWAY_URL` — Gateway address (SDK + ARA URLs derived automatically)
- `AKEYLESS_AGENT_ID` — auditing identifier for ARA sessions
- Or `AKEYLESS_ACCESS_TYPE=jwt|universal_identity|aws_iam|azure_ad|gcp`
- Or pre-issued `AKEYLESS_TOKEN`

See the repository README for full auth options.
