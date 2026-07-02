import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { isAraDbProducerType, isAraServiceProducerType } from './ara';
import { AkeylessClient } from './client';
import { toAkeylessReference } from './paths';
import { redactSecretsFromOutput, runCommandWithEnv } from './runtime';
import { scanForExposedSecrets } from './scanner';

const SERVER_INSTRUCTIONS = `Akeyless Trusted Access Layer for OpenAI Codex.

Architectural guarantee: secret VALUES never appear in tool responses or model context.

Environment tools (static secrets / env vars):
- list_environment_variables — discover configured variable names and Akeyless paths
- run_with_environment — execute commands with secrets injected at runtime
- write_env_reference — generate .env.example files with akeyless:// references
- scan_for_exposed_secrets — find hardcoded credentials in the repository
- store_secret — migrate a discovered secret into Akeyless (requires approval)
- create_environment — bootstrap a new environment path prefix

Runtime Authority (ARA) tools (dynamic/rotated secrets — credentials never exposed):
- list-secrets — list database and service secrets available for secretless access
- query-db — run database queries using dynamic/rotated credentials server-side
- service-execute — run AWS/GCP/Azure/K8s/GitHub actions using server-side credentials

ARA execute tools require an Akeyless Gateway (AKEYLESS_ARA_GATEWAY_URL). Use list-secrets first to discover secret paths.

Never print, echo, or return secret values. Prefer run_with_environment or ARA tools over manual env setup.`;

export function createMcpServer(client = new AkeylessClient()): Server {
  const server = new Server(
    {
      name: 'akeyless-codex',
      version: '0.2.0',
    },
    {
      capabilities: {
        tools: {},
      },
      instructions: SERVER_INSTRUCTIONS,
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'list_environment_variables',
        description:
          'List environment variable names configured in Akeyless for the current environment prefix. Returns names and paths only — never secret values.',
        inputSchema: {
          type: 'object',
          properties: {
            prefix: {
              type: 'string',
              description:
                'Optional Akeyless path prefix (defaults to AKEYLESS_ENVIRONMENT_PREFIX, e.g. /codex/my-app/local)',
            },
          },
        },
      },
      {
        name: 'describe_environment',
        description:
          'Describe the active Codex environment: prefix, variable count, and variable names. No secret values are returned.',
        inputSchema: {
          type: 'object',
          properties: {
            prefix: { type: 'string' },
          },
        },
      },
      {
        name: 'create_environment',
        description:
          'Bootstrap a new Akeyless environment path for a Codex project (e.g. /codex/my-app/staging). Creates a marker secret to materialize the folder.',
        inputSchema: {
          type: 'object',
          properties: {
            prefix: {
              type: 'string',
              description: 'Full Akeyless path prefix for the environment',
            },
          },
          required: ['prefix'],
        },
      },
      {
        name: 'store_secret',
        description:
          'Store a secret in Akeyless under the environment prefix. Returns the Akeyless path and env var name only — not the stored value. Use only when migrating hardcoded secrets.',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Env var name or short secret name (e.g. DATABASE_URL)',
            },
            value: {
              type: 'string',
              description: 'Secret value to store in Akeyless',
            },
            prefix: { type: 'string' },
            description: { type: 'string' },
          },
          required: ['name', 'value'],
        },
      },
      {
        name: 'run_with_environment',
        description:
          'Run a command with secrets fetched from Akeyless and injected as environment variables. Secret values are injected into the child process only — they are redacted from the returned output.',
        inputSchema: {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              description: 'Executable to run (e.g. npm, node, python)',
            },
            args: {
              type: 'array',
              items: { type: 'string' },
              description: 'Arguments for the command',
            },
            cwd: {
              type: 'string',
              description: 'Working directory for the command',
            },
            variables: {
              type: 'array',
              items: { type: 'string' },
              description:
                'Optional subset of env var names to inject. Defaults to all variables in the environment prefix.',
            },
            prefix: { type: 'string' },
            timeout_ms: {
              type: 'number',
              description: 'Optional timeout in milliseconds (default 120000)',
            },
          },
          required: ['command'],
        },
      },
      {
        name: 'write_env_reference',
        description:
          'Write a .env.example (or similar) file containing akeyless:// references instead of secret values.',
        inputSchema: {
          type: 'object',
          properties: {
            output_path: {
              type: 'string',
              description: 'File path to write (default .env.example)',
            },
            prefix: { type: 'string' },
          },
        },
      },
      {
        name: 'scan_for_exposed_secrets',
        description:
          'Scan a directory for hardcoded secrets (.env files, API keys, tokens). Returns file locations and redacted snippets — never full secret values.',
        inputSchema: {
          type: 'object',
          properties: {
            directory: {
              type: 'string',
              description: 'Directory to scan (defaults to current working directory)',
            },
            max_files: {
              type: 'number',
              description: 'Maximum files to scan (default 500)',
            },
          },
        },
      },
      {
        name: 'list-secrets',
        description:
          'List Akeyless dynamic and rotated secrets available for Runtime Authority (ARA) access. Returns metadata only — credentials are never exposed. Supports databases (MySQL, PostgreSQL, etc.) and services (AWS, GCP, Azure, Kubernetes, GitHub).',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Optional Akeyless folder path to filter results (default /)',
            },
          },
        },
      },
      {
        name: 'query-db',
        description:
          'Execute a database query using Akeyless dynamic or rotated secret credentials. Supports MySQL, PostgreSQL, MSSQL, Oracle, Snowflake, HanaDB, Redshift, MongoDB, Redis, and Cassandra. Credentials are used server-side and never returned.',
        inputSchema: {
          type: 'object',
          properties: {
            'secret-name': {
              type: 'string',
              description: 'Full Akeyless path of the database dynamic/rotated secret',
            },
            payload: {
              type: 'string',
              description: 'SQL query or command (e.g. SELECT * FROM users LIMIT 10)',
            },
            'agent-id': {
              type: 'string',
              description: 'Agent identifier for auditing (defaults to AKEYLESS_AGENT_ID)',
            },
          },
          required: ['secret-name', 'payload'],
        },
      },
      {
        name: 'service-execute',
        description:
          'Execute an action against AWS, GCP, Azure, Kubernetes, or GitHub using Akeyless dynamic or rotated credentials. Accepts natural language or CLI-style payloads. Credentials are never exposed.',
        inputSchema: {
          type: 'object',
          properties: {
            'secret-name': {
              type: 'string',
              description: 'Full Akeyless path of the service dynamic/rotated secret',
            },
            payload: {
              type: 'string',
              description: "Action to execute (e.g. 'list all S3 buckets', 'kubectl get pods')",
            },
            'agent-id': {
              type: 'string',
              description: 'Agent identifier for auditing (defaults to AKEYLESS_AGENT_ID)',
            },
          },
          required: ['secret-name', 'payload'],
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      const result = await handleToolCall(client, request.params.name, request.params.arguments ?? {});
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: message }) }],
        isError: true,
      };
    }
  });

  return server;
}

async function handleToolCall(
  client: AkeylessClient,
  name: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  switch (name) {
    case 'list_environment_variables': {
      const input = z
        .object({ prefix: z.string().optional() })
        .parse(args);
      const variables = await client.listEnvironmentVariables(input.prefix);
      return {
        prefix: client.resolveEnvironmentPrefix(input.prefix),
        count: variables.length,
        variables,
      };
    }

    case 'describe_environment': {
      const input = z.object({ prefix: z.string().optional() }).parse(args);
      const prefix = client.resolveEnvironmentPrefix(input.prefix);
      const variables = await client.listEnvironmentVariables(prefix);
      return {
        prefix,
        gatewayUrl: client.getConfig().gatewayUrl,
        araGatewayUrl: client.getConfig().araGatewayUrl,
        variableCount: variables.length,
        variableNames: variables.map((v) => v.name),
        note: 'Secret values are stored in Akeyless and injected at runtime only.',
      };
    }

    case 'create_environment': {
      const input = z.object({ prefix: z.string().min(1) }).parse(args);
      const created = await client.createEnvironment(input.prefix);
      return {
        prefix: created,
        message: `Environment ready at ${created}. Store secrets with store_secret or the Akeyless Console.`,
      };
    }

    case 'store_secret': {
      const input = z
        .object({
          name: z.string().min(1),
          value: z.string(),
          prefix: z.string().optional(),
          description: z.string().optional(),
        })
        .parse(args);
      const stored = await client.storeSecret(input.name, input.value, {
        prefix: input.prefix,
        description: input.description,
      });
      return {
        ...stored,
        reference: toAkeylessReference(stored.akeylessPath),
        message: `Secret stored at ${stored.akeylessPath}. Value was NOT returned.`,
      };
    }

    case 'run_with_environment': {
      const input = z
        .object({
          command: z.string().min(1),
          args: z.array(z.string()).optional(),
          cwd: z.string().optional(),
          variables: z.array(z.string()).optional(),
          prefix: z.string().optional(),
          timeout_ms: z.number().optional(),
        })
        .parse(args);

      const prefix = client.resolveEnvironmentPrefix(input.prefix);
      const metadata = await client.listEnvironmentVariables(prefix);
      const envMap = await client.resolveEnvMap(metadata, input.variables);

      const runResult = await runCommandWithEnv({
        command: input.command,
        args: input.args,
        cwd: input.cwd,
        env: envMap,
        timeoutMs: input.timeout_ms ?? 120_000,
      });

      return {
        exitCode: runResult.exitCode,
        signal: runResult.signal,
        injectedVariables: runResult.injectedVariables,
        durationMs: runResult.durationMs,
        stdout: redactSecretsFromOutput(runResult.stdout, envMap),
        stderr: redactSecretsFromOutput(runResult.stderr, envMap),
        note: 'Secret values were injected into the process environment and redacted from this response.',
      };
    }

    case 'write_env_reference': {
      const input = z
        .object({
          output_path: z.string().optional(),
          prefix: z.string().optional(),
        })
        .parse(args);

      const prefix = client.resolveEnvironmentPrefix(input.prefix);
      const variables = await client.listEnvironmentVariables(prefix);
      const outputPath = input.output_path ?? '.env.example';

      const lines = [
        '# Generated by Akeyless Codex MCP — references only, no secret values',
        `# Environment prefix: ${prefix}`,
        '# At runtime, use run_with_environment or the Akeyless SDK to resolve values.',
        '',
        ...variables.map((v) => `${v.name}=${toAkeylessReference(v.akeylessPath)}`),
        '',
      ];

      await writeFile(path.resolve(outputPath), lines.join('\n'), 'utf8');
      return {
        outputPath,
        prefix,
        variableCount: variables.length,
        message: `Wrote ${variables.length} reference(s) to ${outputPath}`,
      };
    }

    case 'scan_for_exposed_secrets': {
      const input = z
        .object({
          directory: z.string().optional(),
          max_files: z.number().optional(),
        })
        .parse(args);

      const directory = input.directory ?? process.cwd();
      const scan = await scanForExposedSecrets(directory, {
        maxFiles: input.max_files,
      });

      return {
        directory,
        ...scan,
        recommendation:
          scan.findings.length > 0
            ? 'Use store_secret to migrate findings into Akeyless, then replace hardcoded values with akeyless:// references.'
            : 'No obvious hardcoded secrets detected in scanned files.',
      };
    }

    case 'list-secrets': {
      const input = z.object({ path: z.string().optional() }).parse(args);
      const secrets = await client.listAraSecrets(input.path);
      return {
        count: secrets.length,
        secrets,
        note: 'Use query-db for database secrets or service-execute for cloud/K8s/GitHub secrets.',
      };
    }

    case 'query-db': {
      const input = z
        .object({
          'secret-name': z.string().min(1),
          payload: z.string().min(1),
          'agent-id': z.string().optional(),
        })
        .parse(args);

      const secrets = await client.listAraSecrets();
      const secret = secrets.find((s) => s.name === input['secret-name']);
      if (secret?.target_type && !isAraDbProducerType(secret.target_type)) {
        throw new Error(
          `Secret "${input['secret-name']}" is not a database secret. Use service-execute instead.`,
        );
      }

      const result = await client.executeTargetQuery({
        secretName: input['secret-name'],
        payload: input.payload,
        agentId: input['agent-id'],
      });

      return {
        ...result,
        note: 'Query executed via Akeyless Runtime Authority. Credentials were not exposed.',
      };
    }

    case 'service-execute': {
      const input = z
        .object({
          'secret-name': z.string().min(1),
          payload: z.string().min(1),
          'agent-id': z.string().optional(),
        })
        .parse(args);

      const secrets = await client.listAraSecrets();
      const secret = secrets.find((s) => s.name === input['secret-name']);
      if (secret?.target_type && !isAraServiceProducerType(secret.target_type)) {
        throw new Error(
          `Secret "${input['secret-name']}" is not a service secret. Use query-db instead.`,
        );
      }

      const result = await client.executeTargetQuery({
        secretName: input['secret-name'],
        payload: input.payload,
        agentId: input['agent-id'],
      });

      return {
        ...result,
        note: 'Action executed via Akeyless Runtime Authority. Credentials were not exposed.',
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export async function runStdioServer(client?: AkeylessClient): Promise<void> {
  const server = createMcpServer(client);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
