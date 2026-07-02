# Publishing to npm

Step-by-step guide to publish `@akeyless-community/codex-mcp` to npm.

## Prerequisites

- Maintainer access to the `@akeyless-community` npm organization
- GitHub repository: `akeyless-community/codex-akeyless-mcp` (recommended public repo)
- npm account with publish access to `@akeyless-community`

## One-time setup

### 1. Create the GitHub repository

```bash
gh repo create akeyless-community/codex-akeyless-mcp --public \
  --description "Akeyless Trusted Access Layer MCP server for OpenAI Codex"
```

Push the `codex-akeyless-integration/` directory as the repo root (or publish from a dedicated repo).

### 2. Configure npm organization access

Ensure your npm user is added to the `@akeyless-community` org with publish rights:

```bash
npm org ls akeyless-community
npm whoami
```

### 3. Add GitHub secret

In the GitHub repo, add:

| Secret | Value |
|---|---|
| `NPM_TOKEN` | npm automation token with publish access to `@akeyless-community` |

Create the token at [npmjs.com/settings/~/tokens](https://www.npmjs.com/settings/~/tokens) → **Granular Access Token** → allow publish for `@akeyless-community/*`.

## Release workflow

Publishing is triggered by a **GitHub Release** (see `.github/workflows/publish.yml`).

### Version checklist

1. Bump `version` in `package.json` (semver)
2. Run `npm install` to update `package-lock.json`
3. Run `npm run build && npm test`
4. Commit and push to `main`
5. Create and publish a GitHub Release

### Create a release (CLI)

```bash
cd codex-akeyless-integration
npm version patch   # or minor / major — updates package.json + lockfile
npm run build && npm test
git add package.json package-lock.json
git commit -m "chore: release v0.2.0"
git push origin main

gh release create v0.2.0 \
  --repo akeyless-community/codex-akeyless-mcp \
  --title "v0.2.0" \
  --notes "$(cat <<'EOF'
## What's new
- Runtime Authority (ARA) tools: list-secrets, query-db, service-execute
- Secretless database and cloud access via Akeyless Gateway
- Environment tools for JIT env injection and secret migration

## Install
npm install -g @akeyless-community/codex-mcp
EOF
)"
```

### Verify publish

1. Check **Actions** → **Publish to npm** workflow
2. Confirm package at [npmjs.com/package/@akeyless-community/codex-mcp](https://www.npmjs.com/package/@akeyless-community/codex-mcp)
3. Test install:

```bash
npx -y @akeyless-community/codex-mcp --help 2>&1 | head -5
# Or verify the bin exists:
npm install -g @akeyless-community/codex-mcp
which akeyless-codex-mcp
```

## Manual publish (fallback)

```bash
cd codex-akeyless-integration
npm run build && npm test
npm publish --access public
```

Requires `npm login` with a user that has org publish access.

## Troubleshooting

| Problem | Fix |
|---|---|
| `402 Payment Required` | Ensure package scope `@akeyless-community` is configured for public access (`publishConfig.access: public`) |
| `403 Forbidden` | Verify npm token has publish rights for the org |
| `npm ERR! 403 You cannot publish over the previously published versions` | Bump version in `package.json` |
| Workflow doesn't run | Release must be **published**, not draft |
| `prepublishOnly` fails | Fix build/test errors locally first |

## Future releases

1. Bump version → build → test → commit → tag → GitHub Release
2. npm updates automatically via the workflow
