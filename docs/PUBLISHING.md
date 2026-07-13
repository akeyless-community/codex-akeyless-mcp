# Publishing `@akeyless-community/codex-mcp`

## Prerequisites

- npm account with access to `@akeyless-community` scope
- `NPM_TOKEN` secret in the GitHub `npm` environment
- Maintainer approval on the protected `npm` environment

## Release workflow

1. Bump version in `package.json` and `plugins/akeyless/.codex-plugin/plugin.json`
2. Run `npm test && npm run build`
3. Commit and merge to `main` via PR
4. Create a GitHub release tag:

```bash
git tag v1.0.0
git push origin v1.0.0

gh release create v1.0.0 \
  --generate-notes \
  --title "v1.0.0"
```

5. The publish workflow runs on release; approve the `npm` environment deployment in GitHub Actions

## Manual publish (emergency only)

```bash
npm publish --access public
```

Requires `NPM_TOKEN` in the environment.
