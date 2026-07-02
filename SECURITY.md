# Security Policy

## Reporting vulnerabilities

Report security issues to [security@akeyless.io](mailto:security@akeyless.io). Do not open public GitHub issues for vulnerabilities.

## Design principles

1. **Secret values never enter model context** — MCP read tools return metadata only; execute tools redact output or use credentials server-side via ARA.
2. **Bootstrap auth only in MCP env** — configure `AKEYLESS_ACCESS_ID` / keys in Codex MCP settings, not in prompts or committed files.
3. **Codex tool approval** — sensitive tools (`store_secret`, `run_with_environment`, `query-db`, `service-execute`) should use `prompt` or `approve` mode.
4. **Least privilege RBAC** — scope Akeyless auth methods to `/codex/*` for env tools and ARA-enabled paths for execute tools.
5. **Gateway for ARA** — `query-db` and `service-execute` require an Akeyless Gateway; do not point ARA at untrusted endpoints.

## Production checklist

- [ ] RBAC scoped to minimum required paths
- [ ] `default_tools_approval_mode = "prompt"` in Codex config
- [ ] ARA gateway URL points to your organization's gateway
- [ ] No secrets in `.env`, source code, or Codex prompts
- [ ] Prefer dynamic secrets and ARA over static secrets where possible
