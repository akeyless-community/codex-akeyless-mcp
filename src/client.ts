import * as akeyless from 'akeyless';
import { authenticate, type AuthSession } from './auth';
import {
  buildGatewayAuthHeader,
  mapAraSecrets,
  postTargetQuery,
  type AraSecretSummary,
  type TargetQueryResult,
} from './ara';
import { configFromEnv, validateConfig } from './config';
import {
  envNameFromPath,
  formatStructuredResponse,
  joinSecretPath,
  normalizePath,
  pickSecretFromResponse,
} from './paths';
import type {
  AkeylessConfig,
  AkeylessConfigInput,
  EnvironmentVariableMeta,
} from './types';

interface ListItemRow {
  item_name?: string;
  item_type?: string;
  item_metadata?: string;
}

class TtlCache<T> {
  private readonly entries = new Map<string, { value: T; expiresAtMs: number }>();

  constructor(private readonly defaultTtlMs: number) {}

  get(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) {
      return undefined;
    }
    if (Date.now() >= entry.expiresAtMs) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    this.entries.set(key, {
      value,
      expiresAtMs: Date.now() + (ttlMs ?? this.defaultTtlMs),
    });
  }

  clear(): void {
    this.entries.clear();
  }
}

export class AkeylessClient {
  private readonly config: AkeylessConfig;
  private readonly api: akeyless.V2Api;
  private session: AuthSession | null = null;
  private readonly secretCache: TtlCache<string>;

  constructor(config: AkeylessConfigInput = {}) {
    this.config = configFromEnv(config);
    validateConfig(this.config);
    this.secretCache = new TtlCache(this.config.secretCacheTtlMs);

    const client = new akeyless.ApiClient();
    client.basePath = this.config.gatewayUrl.replace(/\/$/, '');
    this.api = new akeyless.V2Api(client);
  }

  getConfig(): Readonly<AkeylessConfig> {
    return this.config;
  }

  resolveEnvironmentPrefix(prefix?: string): string {
    return normalizePath(prefix ?? this.config.environmentPrefix);
  }

  resolveSecretPath(nameOrPath: string, prefix?: string): string {
    const trimmed = nameOrPath.trim();
    if (trimmed.startsWith('/')) {
      return normalizePath(trimmed);
    }
    return joinSecretPath(this.resolveEnvironmentPrefix(prefix), trimmed);
  }

  private async getSession(): Promise<AuthSession> {
    const now = Date.now();
    if (this.session && now < this.session.expiresAtMs) {
      return this.session;
    }
    this.session = await authenticate(this.api, this.config);
    return this.session;
  }

  private async getToken(): Promise<string> {
    return (await this.getSession()).token;
  }

  private async getGatewayAuthHeader(): Promise<Record<string, string>> {
    return buildGatewayAuthHeader(await this.getSession());
  }

  async listEnvironmentVariables(prefix?: string): Promise<EnvironmentVariableMeta[]> {
    const envPrefix = this.resolveEnvironmentPrefix(prefix);
    const token = await this.getToken();

    const body = akeyless.ListItems.constructFromObject({
      token,
      path: envPrefix,
      filter: '',
      type: ['key', 'static-secret', 'dynamic-secret', 'rotated-secret'],
      pagination_token: '',
      advanced_filter: '',
    });

    const raw = (await this.api.listItems(body)) as {
      items?: ListItemRow[];
    };

    const items = raw?.items ?? [];
    return items
      .filter((item) => item.item_name?.trim())
      .map((item) => {
        const akeylessPath = normalizePath(item.item_name!);
        return {
          name: envNameFromPath(akeylessPath),
          akeylessPath,
          itemType: item.item_type,
          description: item.item_metadata?.trim() || undefined,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async fetchSecretValue(akeylessPath: string): Promise<string> {
    const resolved = normalizePath(akeylessPath);
    const cached = this.secretCache.get(resolved);
    if (cached !== undefined) {
      return cached;
    }

    const token = await this.getToken();
    const raw = (await this.api.getSecretValue(
      akeyless.GetSecretValue.constructFromObject({
        names: [resolved],
        token,
      }),
    )) as Record<string, unknown>;

    const value = pickSecretFromResponse(resolved, raw);
    this.secretCache.set(resolved, value);
    return value;
  }

  async fetchSecretValues(
    paths: string[],
  ): Promise<Record<string, string>> {
    const unique = [...new Set(paths.map((p) => normalizePath(p)))];
    const entries = await Promise.all(
      unique.map(async (path) => [path, await this.fetchSecretValue(path)] as const),
    );
    return Object.fromEntries(entries);
  }

  async storeSecret(
    nameOrPath: string,
    value: string,
    options: { prefix?: string; description?: string } = {},
  ): Promise<{ akeylessPath: string; envName: string }> {
    const akeylessPath = this.resolveSecretPath(nameOrPath, options.prefix);
    const token = await this.getToken();

    await this.api.createSecret(
      akeyless.CreateSecret.constructFromObject({
        token,
        name: akeylessPath,
        value,
        description: options.description ?? 'Managed by Akeyless Codex MCP',
        type: 'generic',
        protection_key: '',
        format: 'text',
        accessibility: 'regular',
        multiline_value: value.includes('\n'),
        json: false,
        tags: ['codex', 'trusted-access'],
      }),
    );

    this.secretCache.clear();
    return {
      akeylessPath,
      envName: envNameFromPath(akeylessPath),
    };
  }

  async createEnvironment(prefix: string): Promise<string> {
    const normalized = this.resolveEnvironmentPrefix(prefix);
    const token = await this.getToken();

    // Akeyless folders are created implicitly; create a marker secret to materialize the path.
    const markerPath = joinSecretPath(normalized, '.environment-marker');
    try {
      await this.api.createSecret(
        akeyless.CreateSecret.constructFromObject({
          token,
          name: markerPath,
          value: `codex-environment:${normalized}`,
          description: 'Environment marker — safe to delete after other secrets exist',
          type: 'generic',
          protection_key: '',
          format: 'text',
          accessibility: 'regular',
          multiline_value: false,
          json: false,
          tags: ['codex', 'environment-marker'],
        }),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
      if (!message.includes('already exist')) {
        throw error;
      }
    }

    return normalized;
  }

  async getDynamicSecretValue(akeylessPath: string): Promise<string> {
    const resolved = normalizePath(akeylessPath);
    const token = await this.getToken();
    const raw = await this.api.getDynamicSecretValue(
      akeyless.GetDynamicSecretValue.constructFromObject({
        name: resolved,
        token,
      }),
    );
    return formatStructuredResponse(raw);
  }

  async resolveEnvMap(
    variables: EnvironmentVariableMeta[],
    names?: string[],
  ): Promise<Record<string, string>> {
    const selected = names?.length
      ? variables.filter((v) => names.includes(v.name))
      : variables;

    if (selected.length === 0) {
      throw new Error('No environment variables matched the requested names');
    }

    const envMap: Record<string, string> = {};
    for (const variable of selected) {
      const itemType = (variable.itemType ?? '').toLowerCase();
      if (itemType.includes('dynamic')) {
        envMap[variable.name] = await this.getDynamicSecretValue(variable.akeylessPath);
      } else {
        envMap[variable.name] = await this.fetchSecretValue(variable.akeylessPath);
      }
    }
    return envMap;
  }

  async listAraSecrets(path?: string): Promise<AraSecretSummary[]> {
    const token = await this.getToken();
    const body = akeyless.ListItems.constructFromObject({
      token,
      path: path ?? '/',
      filter: '',
      type: ['dynamic-secret', 'rotated-secret'],
      'ara-only': true,
      pagination_token: '',
      advanced_filter: '',
    });

    const raw = (await this.api.listItems(body)) as {
      items?: Array<Record<string, unknown>>;
    };

    return mapAraSecrets((raw?.items ?? []) as Parameters<typeof mapAraSecrets>[0]);
  }

  async executeTargetQuery(input: {
    secretName: string;
    payload: string;
    agentId?: string;
  }): Promise<TargetQueryResult> {
    const authHeader = await this.getGatewayAuthHeader();
    return postTargetQuery(this.config.araGatewayUrl, authHeader, {
      secret_name: input.secretName,
      payload: input.payload,
      agent_id: input.agentId ?? this.config.agentId,
      mcp_id: this.config.mcpId,
    });
  }
}
