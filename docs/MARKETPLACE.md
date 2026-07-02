# Codex Marketplace Listing — Akeyless Trusted Access Layer

Draft listing for OpenAI Codex MCP marketplace / integrations directory.

---

## Listing title

**Akeyless Trusted Access Layer for Codex**

## Short description (≤160 chars)

Give Codex secure access to secrets and infrastructure through Akeyless — credentials stay in the vault, never in the model context.

## Category

Developer Tools · Security · Secrets Management

## Long description

The Akeyless Codex MCP server connects OpenAI Codex to [Akeyless Secrets Manager](https://www.akeyless.io) as a trusted access layer for AI-assisted development.

Coding agents need credentials to run apps, query databases, and call cloud APIs. This integration ensures Codex can orchestrate those workflows **without ever seeing secret values**.

### What Codex can do

- **Bootstrap environments** — list and manage env var names under Akeyless path prefixes like `/codex/my-app/local`
- **Run with secrets** — execute commands with credentials injected at runtime (values redacted from output)
- **Secretless infrastructure access** — query databases and execute cloud/K8s actions via Runtime Authority (ARA)
- **Migrate hardcoded secrets** — scan repos for exposed credentials and store them in Akeyless
- **Generate safe references** — write `.env.example` files with `akeyless://` paths instead of values

### Security guarantees

- Secret **values** never appear in MCP tool responses or model context
- ARA tools use credentials server-side through the Akeyless Gateway
- Codex tool approval (`prompt` / `approve`) gates sensitive operations
- Full audit trail via Akeyless RBAC and session logging

## Install command

```bash
codex mcp add akeyless \
  --env AKEYLESS_ACCESS_ID=p-xxxxx \
  --env AKEYLESS_ACCESS_KEY=your-key \
  --env AKEYLESS_ENVIRONMENT_PREFIX=/codex/my-app/local \
  -- npx -y @akeyless-community/codex-mcp
```

## Configuration snippet

```toml
[mcp_servers.akeyless]
command = "npx"
args = ["-y", "@akeyless-community/codex-mcp"]
default_tools_approval_mode = "prompt"

[mcp_servers.akeyless.env]
AKEYLESS_ACCESS_ID = "p-xxxxx"
AKEYLESS_ACCESS_KEY = "your-access-key"
AKEYLESS_ENVIRONMENT_PREFIX = "/codex/my-app/local"
AKEYLESS_ARA_GATEWAY_URL = "https://your-gateway.example.com:8000"
```

## Tools exposed

| Tool | Description |
|---|---|
| `list_environment_variables` | List env var names (no values) |
| `run_with_environment` | Run commands with JIT secret injection |
| `list-secrets` | List ARA-enabled dynamic/rotated secrets |
| `query-db` | Execute database queries (secretless) |
| `service-execute` | Execute AWS/GCP/Azure/K8s/GitHub actions (secretless) |
| `scan_for_exposed_secrets` | Find hardcoded credentials in repos |
| `store_secret` | Migrate secrets into Akeyless |
| `write_env_reference` | Generate `.env.example` with references |
| `create_environment` | Bootstrap a new environment prefix |
| `describe_environment` | Environment summary |

## Requirements

- Akeyless account ([free tier available](https://www.akeyless.io))
- Akeyless access credentials (access key, API key, or cloud identity)
- Akeyless Gateway (for ARA `query-db` / `service-execute` tools)

## Links

- **npm:** `@akeyless-community/codex-mcp`
- **GitHub:** `github.com/akeyless-community/codex-akeyless-mcp`
- **Docs:** [Akeyless Runtime Authority](https://docs.akeyless.io/docs/runtime-authority)
- **Codex MCP docs:** [developers.openai.com/codex/mcp](https://developers.openai.com/codex/mcp)

## Tags

`akeyless`, `secrets`, `security`, `mcp`, `codex`, `runtime-authority`, `zero-trust`, `devops`

## Support

- GitHub Issues: `github.com/akeyless-community/codex-akeyless-mcp/issues`
- Akeyless docs: [docs.akeyless.io](https://docs.akeyless.io)

---

## Submission checklist

- [ ] Package published to npm as `@akeyless-community/codex-mcp`
- [ ] GitHub repo public with README and examples
- [ ] Tested with Codex CLI (`codex mcp list`, `/mcp` in TUI)
- [ ] Example `.codex/config.toml` included in repo
- [ ] Security model documented (no secret values in model context)
- [ ] Support contact / issue tracker linked
