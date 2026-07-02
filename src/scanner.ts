import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import type { ScanFinding, ScanResult } from './types';

const DEFAULT_IGNORE = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'coverage',
  '.venv',
  'vendor',
]);

const SECRET_PATTERNS: Array<{
  kind: string;
  regex: RegExp;
  envName?: (match: RegExpMatchArray) => string;
}> = [
  {
    kind: 'aws_access_key',
    regex: /\b(AKIA[0-9A-Z]{16})\b/,
    envName: () => 'AWS_ACCESS_KEY_ID',
  },
  {
    kind: 'generic_api_key_assignment',
    regex:
      /(?:api[_-]?key|secret[_-]?key|access[_-]?token|password|passwd|pwd)\s*[:=]\s*['"]([^'"\s]{8,})['"]/i,
    envName: (m) => {
      const key = m[0].split(/[:=]/)[0] ?? 'SECRET';
      return key.replace(/[^A-Za-z0-9_]/g, '_').toUpperCase();
    },
  },
  {
    kind: 'openai_key',
    regex: /\b(sk-[A-Za-z0-9_-]{20,})\b/,
    envName: () => 'OPENAI_API_KEY',
  },
  {
    kind: 'github_pat',
    regex: /\b(ghp_[A-Za-z0-9]{20,})\b/,
    envName: () => 'GITHUB_TOKEN',
  },
  {
    kind: 'dotenv_value',
    regex: /^([A-Z][A-Z0-9_]*)\s*=\s*(?!akeyless:\/\/|your_|changeme|<|example|\$\{)([^\s#"'`]{8,})/,
    envName: (m) => m[1] ?? 'SECRET',
  },
];

const TEXT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.py',
  '.go',
  '.rb',
  '.java',
  '.env',
  '.yaml',
  '.yml',
  '.json',
  '.toml',
  '.md',
  '.sh',
]);

function isTextFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  const base = path.basename(filePath);
  if (base === '.env' || base.startsWith('.env.')) {
    return true;
  }
  return TEXT_EXTENSIONS.has(ext);
}

function redactSnippet(line: string): string {
  return line
    .replace(/(['"])([^'"\n]{4,})\1/g, '$1[REDACTED]$1')
    .replace(/=\s*[^\s#]+/g, '= [REDACTED]')
    .slice(0, 160);
}

async function walkFiles(root: string, maxFiles: number): Promise<string[]> {
  const results: string[] = [];
  const queue = [root];

  while (queue.length > 0 && results.length < maxFiles) {
    const current = queue.shift()!;
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (results.length >= maxFiles) {
        break;
      }
      if (DEFAULT_IGNORE.has(entry.name)) {
        continue;
      }
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(fullPath);
        continue;
      }
      if (!entry.isFile() || !isTextFile(fullPath)) {
        continue;
      }
      try {
        const info = await stat(fullPath);
        if (info.size > 512 * 1024) {
          continue;
        }
      } catch {
        continue;
      }
      results.push(fullPath);
    }
  }

  return results;
}

export async function scanForExposedSecrets(
  rootDir: string,
  options: { maxFiles?: number } = {},
): Promise<ScanResult> {
  const maxFiles = options.maxFiles ?? 500;
  const files = await walkFiles(path.resolve(rootDir), maxFiles);
  const findings: ScanFinding[] = [];

  for (const file of files) {
    let content: string;
    try {
      content = await readFile(file, 'utf8');
    } catch {
      continue;
    }

    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i] ?? '';
      for (const pattern of SECRET_PATTERNS) {
        const match = line.match(pattern.regex);
        if (!match) {
          continue;
        }
        findings.push({
          file: path.relative(rootDir, file) || file,
          line: i + 1,
          kind: pattern.kind,
          snippet: redactSnippet(line.trim()),
          suggestedEnvName: pattern.envName?.(match),
        });
        break;
      }
    }
  }

  return {
    scannedFiles: files.length,
    findings,
  };
}
