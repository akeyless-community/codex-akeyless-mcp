export function normalizePath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) {
    return '/';
  }
  const withLeading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeading.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
}

export function joinSecretPath(prefix: string, name: string): string {
  const base = normalizePath(prefix);
  const segment = name.trim().replace(/^\/+/, '');
  if (!segment) {
    return base;
  }
  if (base === '/') {
    return `/${segment}`;
  }
  return `${base}/${segment}`;
}

/** Derive env var name from the last segment of an Akeyless path. */
export function envNameFromPath(akeylessPath: string): string {
  const normalized = normalizePath(akeylessPath);
  const parts = normalized.split('/').filter(Boolean);
  const last = parts[parts.length - 1] ?? 'SECRET';
  return last.replace(/[^A-Za-z0-9_]/g, '_').toUpperCase();
}

export function pickSecretFromResponse(
  requestedPath: string,
  data: Record<string, unknown> | null | undefined,
): string {
  if (!data || typeof data !== 'object') {
    throw new Error('Akeyless returned an empty secret payload');
  }

  const trimmed = requestedPath.trim();
  const candidates = [
    trimmed,
    normalizePath(trimmed),
    trimmed.replace(/^\//, ''),
  ];

  for (const key of candidates) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      return stringifySecretValue(data[key]);
    }
  }

  throw new Error(`No value for "${requestedPath}" in Akeyless response`);
}

export function stringifySecretValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return JSON.stringify(value);
}

export function formatStructuredResponse(data: unknown): string {
  if (data === null || data === undefined) {
    throw new Error('Akeyless returned an empty response');
  }
  if (typeof data === 'string') {
    return data;
  }
  return JSON.stringify(data);
}

/** Reference format for .env.example files — never contains values. */
export function toAkeylessReference(akeylessPath: string): string {
  return `akeyless://${normalizePath(akeylessPath)}`;
}
