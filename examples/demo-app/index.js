// Demo app — reads config from environment variables injected at runtime.
// No secrets in this file.

const apiKey = process.env.DEMO_API_KEY;
const dbUrl = process.env.DATABASE_URL;

if (!apiKey || !dbUrl) {
  console.error(
    'Missing env vars. Run via Akeyless Codex MCP run_with_environment, not directly.',
  );
  process.exit(1);
}

console.log('App started successfully.');
console.log(`DATABASE_URL configured: ${dbUrl.replace(/:[^@/]+@/, ':***@')}`);
console.log(`DEMO_API_KEY configured: ${apiKey.slice(0, 4)}...`);
