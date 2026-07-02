import { randomUUID } from 'node:crypto';
import type {
  AccessType,
  AkeylessConfig,
  AkeylessConfigInput,
  CloudProvider,
} from './types';

const DEFAULT_GATEWAY = 'https://api.akeyless.io';
const DEFAULT_ENVIRONMENT_PREFIX = '/codex/default/local';
const DEFAULT_AGENT_ID = 'codex-agent';
const DEFAULT_SECRET_CACHE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_TOKEN_EXPIRY_MARGIN_MS = 60 * 1000;

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  if (value === undefined) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (raw === undefined) {
    return fallback;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
}

function parseAccessType(raw: string | undefined): AccessType {
  const value = (raw ?? 'access_key').toLowerCase();
  switch (value) {
    case 'access_key':
    case 'api_key':
    case 'aws_iam':
    case 'azure_ad':
    case 'gcp':
    case 'universal_identity':
    case 'jwt':
      return value;
    default:
      throw new Error(
        `Unsupported AKEYLESS_ACCESS_TYPE "${raw}". Expected access_key, api_key, aws_iam, azure_ad, gcp, universal_identity, or jwt.`,
      );
  }
}

function cloudProviderForAccessType(
  accessType: AccessType,
): CloudProvider | undefined {
  if (
    accessType === 'aws_iam' ||
    accessType === 'azure_ad' ||
    accessType === 'gcp'
  ) {
    return accessType;
  }
  return undefined;
}

export function configFromEnv(
  overrides: AkeylessConfigInput = {},
): AkeylessConfig {
  const accessType =
    overrides.accessType ?? parseAccessType(readEnv('AKEYLESS_ACCESS_TYPE'));

  return {
    gatewayUrl:
      overrides.gatewayUrl ??
      readEnv('AKEYLESS_GATEWAY_URL') ??
      DEFAULT_GATEWAY,
    araGatewayUrl:
      overrides.araGatewayUrl ??
      readEnv('AKEYLESS_ARA_GATEWAY_URL') ??
      overrides.gatewayUrl ??
      readEnv('AKEYLESS_GATEWAY_URL') ??
      DEFAULT_GATEWAY,
    environmentPrefix:
      overrides.environmentPrefix ??
      readEnv('AKEYLESS_ENVIRONMENT_PREFIX') ??
      DEFAULT_ENVIRONMENT_PREFIX,
    agentId:
      overrides.agentId ??
      readEnv('AKEYLESS_AGENT_ID') ??
      DEFAULT_AGENT_ID,
    mcpId: overrides.mcpId ?? readEnv('AKEYLESS_MCP_ID') ?? randomUUID(),
    accessType,
    accessId: overrides.accessId ?? readEnv('AKEYLESS_ACCESS_ID'),
    accessKey:
      overrides.accessKey ??
      readEnv('AKEYLESS_ACCESS_KEY') ??
      readEnv('AKEYLESS_API_KEY'),
    uidToken:
      overrides.uidToken ??
      readEnv('AKEYLESS_UID_TOKEN') ??
      readEnv('AKEYLESS_UNIVERSAL_IDENTITY_TOKEN'),
    jwt: overrides.jwt ?? readEnv('AKEYLESS_JWT'),
    token: overrides.token ?? readEnv('AKEYLESS_TOKEN'),
    cloudId: overrides.cloudId ?? readEnv('AKEYLESS_CLOUD_ID'),
    cloudProvider:
      overrides.cloudProvider ?? cloudProviderForAccessType(accessType),
    secretCacheTtlMs:
      overrides.secretCacheTtlMs ??
      parsePositiveInt(
        readEnv('AKEYLESS_SECRET_CACHE_TTL_MS'),
        DEFAULT_SECRET_CACHE_TTL_MS,
      ),
    tokenExpiryMarginMs:
      overrides.tokenExpiryMarginMs ??
      parsePositiveInt(
        readEnv('AKEYLESS_TOKEN_EXPIRY_MARGIN_MS'),
        DEFAULT_TOKEN_EXPIRY_MARGIN_MS,
      ),
  };
}

export function validateConfig(config: AkeylessConfig): void {
  if (!config.gatewayUrl.trim()) {
    throw new Error('gatewayUrl is required');
  }

  if (config.token?.trim()) {
    return;
  }

  switch (config.accessType) {
    case 'access_key':
    case 'api_key':
      if (!config.accessId?.trim() || !config.accessKey?.trim()) {
        throw new Error(
          'accessId and accessKey are required for access_key/api_key authentication (or set AKEYLESS_TOKEN)',
        );
      }
      break;
    case 'universal_identity':
      if (!config.uidToken?.trim()) {
        throw new Error(
          'uidToken is required for universal_identity authentication (or set AKEYLESS_TOKEN)',
        );
      }
      break;
    case 'jwt':
      if (!config.accessId?.trim() || !config.jwt?.trim()) {
        throw new Error(
          'accessId and jwt are required for jwt authentication (or set AKEYLESS_TOKEN)',
        );
      }
      break;
    case 'aws_iam':
    case 'azure_ad':
    case 'gcp':
      if (!config.accessId?.trim()) {
        throw new Error(
          `${config.accessType} authentication requires accessId (or set AKEYLESS_TOKEN)`,
        );
      }
      break;
    default:
      throw new Error(`Unsupported access type: ${config.accessType as string}`);
  }
}
