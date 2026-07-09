# Example ARA prompts for Codex

Use these after connecting the Akeyless ARA MCP server.

## Discovery

> "List my Akeyless ARA secrets and summarize what databases and cloud services I can access."

## Database queries

> "Run `SELECT version()` against `/prod/db/postgres-readonly`."

> "How many rows are in the `users` table? Use the MySQL dynamic secret under `/staging/db`."

## Cloud / service actions

> "Use service-execute on `/prod/aws/devops` to list all S3 buckets."

> "Run `kubectl get pods -n default` using the Kubernetes secret `/prod/k8s/admin`."

## Custom MCP

> "List ARA secrets with target type custom-mcp, then service-execute against one to list its capabilities."

## Sub-tools (optional)

> "Call list-sub-tools on `/prod/aws/devops` before running a specific AWS action."
