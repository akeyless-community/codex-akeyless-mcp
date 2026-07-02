# Codex Marketplace Listing — Akeyless Trusted Access Layer

Guide for listing and distributing the Akeyless Codex plugin.

---

## Plugin structure (in this repo)

```
codex-akeyless-mcp/
├── .agents/plugins/marketplace.json       # marketplace catalog
├── plugins/akeyless/
│   ├── .codex-plugin/plugin.json          # plugin manifest
│   ├── .mcp.json                          # bundled MCP server config
│   └── skills/akeyless/SKILL.md           # Codex usage skill
```

The MCP server itself is published separately as `@akeyless-community/codex-mcp` on npm. The plugin bundles the install command and skill guidance.

---

## Install methods

### Option A — Codex plugin marketplace (recommended)

```bash
codex plugin marketplace add akeyless-community/codex-akeyless-mcp
```

Then in Codex TUI: `/plugins` → select **Akeyless Community** → install **Akeyless Trusted Access**.

Configure Akeyless credentials after install (see README).

### Option B — Community marketplace CLI

```bash
npx codex-marketplace add akeyless-community/codex-akeyless-mcp --plugin --project
```

### Option C — Direct MCP (no plugin wrapper)

```bash
codex mcp add akeyless \
  --env AKEYLESS_ACCESS_ID=p-xxxxx \
  --env AKEYLESS_ACCESS_KEY=your-key \
  --env AKEYLESS_ENVIRONMENT_PREFIX=/codex/my-app/local \
  -- npx -y @akeyless-community/codex-mcp
```

---

## Submit to codex-marketplace.com

1. Ensure the repo has a valid `plugins/akeyless/.codex-plugin/plugin.json`
2. Go to https://www.codex-marketplace.com/submit
3. Enter: `https://github.com/akeyless-community/codex-akeyless-mcp`
4. Wait for automated validation and manual review

### Listing metadata

| Field | Value |
|---|---|
| **Title** | Akeyless Trusted Access Layer for Codex |
| **Short description** | Give Codex secure access to secrets and infrastructure through Akeyless — credentials stay in the vault, never in the model context. |
| **Category** | Security |
| **npm package** | `@akeyless-community/codex-mcp` |
| **GitHub** | `github.com/akeyless-community/codex-akeyless-mcp` |

---

## Submit to OpenAI official Plugin Directory

Self-serve publishing to the official OpenAI Plugin Directory is **coming soon** per [OpenAI plugin docs](https://developers.openai.com/codex/plugins/build).

When available, submit the same repo URL with the plugin manifest at `plugins/akeyless/.codex-plugin/plugin.json`.

---

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

---

## Submission checklist

- [x] Package published to npm as `@akeyless-community/codex-mcp`
- [x] GitHub repo public with README and examples
- [x] Codex plugin wrapper (`plugins/akeyless/`)
- [x] Marketplace catalog (`.agents/plugins/marketplace.json`)
- [x] Branch protection and CODEOWNERS
- [ ] Submit to https://www.codex-marketplace.com/submit
- [ ] Add plugin icon under `plugins/akeyless/assets/` (optional, improves listing)
- [ ] Submit to OpenAI official directory when available

---

## Post-install configuration

Users must set Akeyless credentials in Codex after installing the plugin:

```toml
[plugins."akeyless-trusted-access@akeyless-community".mcp_servers.akeyless.env]
AKEYLESS_ACCESS_ID = "p-xxxxx"
AKEYLESS_ACCESS_KEY = "your-access-key"
AKEYLESS_ENVIRONMENT_PREFIX = "/codex/my-app/local"
AKEYLESS_ARA_GATEWAY_URL = "https://your-gateway.example.com:8000"
```

Or forward from shell via `env_vars` (already configured in the plugin's `.mcp.json`).
