# Contributing

Thanks for contributing to `@akeyless-community/codex-mcp`.

## Development setup

Requires Node.js 18+.

```bash
git clone https://github.com/akeyless-community/codex-akeyless-mcp.git
cd codex-akeyless-mcp
npm install
npm run build
npm test
```

## Pull requests

**All changes to `main` require review and approval from `@akeyless-community/cs-admin`.**

External contributors (outside the Akeyless org):

1. **Fork** the repository — do not request write access unless you are a maintainer.
2. Create a feature branch from `main`.
3. Add or update tests for behavior changes.
4. Run `npm test` before opening the PR.
5. Open a pull request using the provided template.
6. Wait for **CI** (`ci-success`) and a **maintainer approval** before merge.

Maintainers merge after approval. Direct pushes to `main` are blocked.

See [docs/MAINTAINER.md](docs/MAINTAINER.md) for branch protection and org settings.

## Plugin / marketplace changes

When updating the Codex plugin wrapper under `plugins/akeyless/`:

- Bump `version` in `plugins/akeyless/.codex-plugin/plugin.json`
- Keep `.mcp.json` env_vars list in sync with supported auth env vars
- Update `plugins/akeyless/skills/akeyless/SKILL.md` if tool behavior changes

## Publishing (maintainers)

See [docs/PUBLISHING.md](docs/PUBLISHING.md) for npm release instructions.

Publishing a GitHub Release triggers the npm workflow. The `npm` environment requires maintainer approval before upload.
