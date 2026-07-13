# Codex Marketplace Listing — Akeyless ARA

Guide for listing and distributing the Akeyless ARA Codex plugin.

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

The MCP server is published as `@akeyless-community/codex-mcp` on npm. It exposes **only** ARA tools (`list-secrets`, `query-db`, `service-execute`, `list-sub-tools`) — the same surface as `akeyless mcp-runtime-authority`.

---

## Install methods

### Option A — Codex plugin marketplace (recommended)

```bash
codex plugin marketplace add akeyless-community/codex-akeyless-mcp
```

Then in Codex TUI: `/plugins` → select **Akeyless Community** → install **Akeyless ARA**.

Configure Akeyless credentials after install (see README).

### Option B — Community marketplace CLI

```bash
npx codex-marketplace add akeyless-community/codex-akeyless-mcp --plugin --project
```

### Option C — Direct MCP (no plugin wrapper)

```bash
codex mcp add akeyless-ara \
  --env AKEYLESS_ACCESS_ID=p-xxxxx \
  --env AKEYLESS_ACCESS_KEY=your-key \
  --env AKEYLESS_GATEWAY_URL=https://your-gateway.example.com:8000 \
  --env AKEYLESS_AGENT_ID=codex-agent \
  -- npx -y @akeyless-community/codex-mcp
```

---

## Submit to codex-marketplace.com

1. Ensure the repo has a valid `plugins/akeyless/.codex-plugin/plugin.json`
2. Go to https://www.codex-marketplace.com/submit
3. Select **PLUGIN** (not marketplace)
4. Enter: `https://github.com/akeyless-community/codex-akeyless-mcp`
5. Wait for automated validation and manual review

### Listing metadata

| Field | Value |
|---|---|
| **Title** | Akeyless ARA for Codex |
| **Short description** | Secretless database and cloud access for Codex via Akeyless Agentic Runtime Authority — credentials never enter the model context. |
| **Category** | Security |
| **npm package** | `@akeyless-community/codex-mcp` |
| **GitHub** | `github.com/akeyless-community/codex-akeyless-mcp` |

---

## Tools exposed (ARA only)

| Tool | Description |
|---|---|
| `list-secrets` | List ARA-enabled dynamic, rotated, and custom-MCP secrets |
| `query-db` | Execute database queries (secretless) |
| `service-execute` | Execute AWS/GCP/Azure/K8s/GitHub/custom-MCP actions (secretless) |
| `list-sub-tools` | (Optional) Discover sub-tools on a service secret |

---

## Post-install configuration

Users must set Akeyless credentials in Codex after installing the plugin:

```toml
[plugins."akeyless-ara@akeyless-community".mcp_servers.akeyless-ara.env]
AKEYLESS_ACCESS_ID = "p-xxxxx"
AKEYLESS_ACCESS_KEY = "your-access-key"
AKEYLESS_GATEWAY_URL = "https://your-gateway.example.com:8000"
AKEYLESS_AGENT_ID = "codex-agent"
```

`AKEYLESS_GATEWAY_URL` is the only gateway setting — SDK API and ARA bases are derived automatically.

Or forward from shell via `env_vars` (configured in the plugin's `.mcp.json`).

---

## Submission checklist

- [x] Package published to npm as `@akeyless-community/codex-mcp`
- [x] GitHub repo public with README and examples
- [x] Codex plugin wrapper (`plugins/akeyless/`)
- [x] Marketplace catalog (`.agents/plugins/marketplace.json`)
- [x] Branch protection and CODEOWNERS
- [ ] Submit to https://www.codex-marketplace.com/submit
- [ ] Add plugin icon under `plugins/akeyless/assets/` (optional)
