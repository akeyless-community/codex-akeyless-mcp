export const ARA_DB_PRODUCER_TYPES = new Set([
  'mysql',
  'postgres',
  'mssql',
  'oracle',
  'snowflake',
  'hana',
  'redshift',
  'mongodb',
  'redis',
  'cassandra',
]);

export const ARA_SERVICE_PRODUCER_TYPES = new Set([
  'aws',
  'gcp',
  'azure',
  'k8s',
  'eks',
  'gke',
  'github',
]);

export function isAraDbProducerType(producerType: string): boolean {
  return ARA_DB_PRODUCER_TYPES.has(producerType.toLowerCase());
}

export function isAraServiceProducerType(producerType: string): boolean {
  return ARA_SERVICE_PRODUCER_TYPES.has(producerType.toLowerCase());
}

export function isAraSupportedProducerType(producerType: string): boolean {
  const normalized = producerType.toLowerCase();
  return ARA_DB_PRODUCER_TYPES.has(normalized) || ARA_SERVICE_PRODUCER_TYPES.has(normalized);
}

export interface AraSecretSummary {
  name: string;
  secret_type: 'dynamic-secret' | 'rotated-secret';
  target_type?: string;
  description?: string;
}

export interface TargetQueryResult {
  target_type?: string;
  results?: Array<Record<string, unknown>>;
  raw?: unknown;
}

interface ItemTargetAssociation {
  target_type?: string;
}

interface DynamicSecretProducerInfo {
  producer_type?: string;
}

interface AraListItem {
  item_name?: string;
  item_type?: string;
  item_metadata?: string;
  client_permissions?: string[];
  item_general_info?: {
    dynamic_secret_producer_details?: DynamicSecretProducerInfo;
  };
  item_targets_assoc?: ItemTargetAssociation[];
}

export function mapAraSecrets(items: AraListItem[]): AraSecretSummary[] {
  const results: AraSecretSummary[] = [];

  for (const item of items) {
    if (!item.item_name?.trim()) {
      continue;
    }
    if (!item.client_permissions?.includes('ara_allow_access')) {
      continue;
    }

    const itemType = (item.item_type ?? '').toLowerCase();
    if (itemType === 'dynamic-secret') {
      const targetType =
        item.item_general_info?.dynamic_secret_producer_details?.producer_type?.toLowerCase();
      if (!targetType || !isAraSupportedProducerType(targetType)) {
        continue;
      }
      results.push({
        name: item.item_name,
        secret_type: 'dynamic-secret',
        target_type: targetType,
        description: item.item_metadata?.trim() || undefined,
      });
      continue;
    }

    if (itemType === 'rotated-secret') {
      const targetType = item.item_targets_assoc?.[0]?.target_type?.toLowerCase();
      if (targetType && !isAraSupportedProducerType(targetType)) {
        continue;
      }
      results.push({
        name: item.item_name,
        secret_type: 'rotated-secret',
        target_type: targetType,
        description: item.item_metadata?.trim() || undefined,
      });
    }
  }

  return results.sort((a, b) => a.name.localeCompare(b.name));
}

export function buildGatewayAuthHeader(session: {
  token: string;
  creds?: Record<string, unknown>;
}): Record<string, string> {
  if (session.token.startsWith('t-')) {
    return { Authorization: `Bearer ${session.token}` };
  }
  if (session.creds) {
    return {
      Authorization: `Bearer ${Buffer.from(JSON.stringify(session.creds)).toString('base64')}`,
    };
  }
  throw new Error('Unable to build gateway authorization header');
}

export async function postTargetQuery(
  gatewayUrl: string,
  authHeader: Record<string, string>,
  body: {
    secret_name: string;
    payload: string;
    agent_id: string;
    mcp_id: string;
  },
): Promise<TargetQueryResult> {
  const base = gatewayUrl.replace(/\/$/, '');
  const response = await fetch(`${base}/config/target_query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...authHeader,
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let parsed: unknown;
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = { raw: text };
  }

  if (!response.ok) {
    const message =
      typeof parsed === 'object' &&
      parsed !== null &&
      'error' in parsed &&
      typeof (parsed as { error?: unknown }).error === 'string'
        ? (parsed as { error: string }).error
        : text || `Gateway target query failed (${response.status})`;
    throw new Error(message);
  }

  if (typeof parsed === 'object' && parsed !== null) {
    const obj = parsed as TargetQueryResult;
    return {
      target_type: obj.target_type,
      results: obj.results,
      raw: parsed,
    };
  }

  return { raw: parsed };
}
