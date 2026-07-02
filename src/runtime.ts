import { spawn } from 'node:child_process';
import type { RunWithEnvironmentResult } from './types';

export interface RunCommandOptions {
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  timeoutMs?: number;
}

export async function runCommandWithEnv(
  options: RunCommandOptions,
): Promise<RunWithEnvironmentResult> {
  const start = Date.now();
  const injectedVariables = Object.keys(options.env ?? {});

  return new Promise((resolve, reject) => {
    const child = spawn(options.command, options.args ?? [], {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let settled = false;

    const finish = (
      exitCode: number | null,
      signal: NodeJS.Signals | null,
    ) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve({
        exitCode,
        signal,
        stdout,
        stderr,
        injectedVariables,
        durationMs: Date.now() - start,
      });
    };

    const timer =
      options.timeoutMs && options.timeoutMs > 0
        ? setTimeout(() => {
            child.kill('SIGTERM');
            stderr += `\n[akeyless-codex-mcp] Command timed out after ${options.timeoutMs}ms`;
            finish(null, 'SIGTERM');
          }, options.timeoutMs)
        : undefined;

    child.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8');
    });

    child.on('error', (error) => {
      if (timer) {
        clearTimeout(timer);
      }
      reject(error);
    });

    child.on('close', (code, signal) => {
      if (timer) {
        clearTimeout(timer);
      }
      finish(code, signal);
    });
  });
}

/** Redact injected secret values from command output before returning to the model. */
export function redactSecretsFromOutput(
  text: string,
  secrets: Record<string, string>,
): string {
  let redacted = text;
  for (const value of Object.values(secrets)) {
    if (!value || value.length < 4) {
      continue;
    }
    redacted = redacted.split(value).join('[REDACTED]');
  }
  return redacted;
}
