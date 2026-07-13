# Security Policy

## Reporting vulnerabilities

Report security issues to [security@akeyless.io](mailto:security@akeyless.io). Do not open public GitHub issues for vulnerabilities.

## Design principles

1. **Secret values never enter model context** — `list-secrets` returns metadata only; `query-db` and `service-execute` use credentials server-side via the Gateway.
2. **ARA-only surface** — this MCP server does not expose static-secret read or environment-injection tools.
3. **Bootstrap auth only in MCP env** — configure `AKEYLESS_ACCESS_ID` / keys in Codex MCP settings, not in prompts or committed files.
4. **Codex tool approval** — sensitive tools (`query-db`, `service-execute`) should use `prompt` or `approve` mode.
5. **Least privilege RBAC** — scope Akeyless roles to ARA-enabled secret paths with `ara_allow_access`.
6. **Single gateway URL** — set `AKEYLESS_GATEWAY_URL` to your organization's gateway; SDK and ARA bases are derived automatically.

## Production checklist

- [ ] RBAC scoped to minimum required ARA paths
- [ ] `default_tools_approval_mode = "prompt"` in Codex config
- [ ] `AKEYLESS_GATEWAY_URL` points to your organization's gateway
- [ ] ARA enabled on dynamic secrets and role rules grant Allow Access
- [ ] AI Insights configured on the Gateway
