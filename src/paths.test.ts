import {
  envNameFromPath,
  joinSecretPath,
  normalizePath,
  toAkeylessReference,
} from './paths';
import { redactSecretsFromOutput } from './runtime';

describe('paths', () => {
  it('normalizes paths', () => {
    expect(normalizePath('codex/app/local/')).toBe('/codex/app/local');
    expect(normalizePath('/')).toBe('/');
  });

  it('joins secret paths', () => {
    expect(joinSecretPath('/codex/app/local', 'DATABASE_URL')).toBe(
      '/codex/app/local/DATABASE_URL',
    );
  });

  it('derives env names from paths', () => {
    expect(envNameFromPath('/codex/app/local/DATABASE_URL')).toBe('DATABASE_URL');
  });

  it('formats akeyless references', () => {
    expect(toAkeylessReference('/codex/app/local/API_KEY')).toBe(
      'akeyless:///codex/app/local/API_KEY',
    );
  });
});

describe('redactSecretsFromOutput', () => {
  it('redacts known secret values from output', () => {
    const output = 'connected with sk-supersecretkey1234567890';
    const redacted = redactSecretsFromOutput(output, {
      OPENAI_API_KEY: 'sk-supersecretkey1234567890',
    });
    expect(redacted).not.toContain('sk-supersecretkey1234567890');
    expect(redacted).toContain('[REDACTED]');
  });
});
