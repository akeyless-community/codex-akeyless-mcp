export type AccessType =
  | 'access_key'
  | 'api_key'
  | 'aws_iam'
  | 'azure_ad'
  | 'gcp'
  | 'universal_identity'
  | 'jwt';

export type CloudProvider = 'aws_iam' | 'azure_ad' | 'gcp';

export interface AkeylessConfig {
  gatewayUrl: string;
  araGatewayUrl: string;
  environmentPrefix: string;
  agentId: string;
  mcpId: string;
  accessType: AccessType;
  accessId?: string;
  accessKey?: string;
  uidToken?: string;
  jwt?: string;
  token?: string;
  cloudId?: string;
  cloudProvider?: CloudProvider;
  tokenExpiryMarginMs: number;
  secretCacheTtlMs: number;
}

export type AkeylessConfigInput = Partial<AkeylessConfig>;

export interface EnvironmentVariableMeta {
  /** Env var name (e.g. DATABASE_URL) */
  name: string;
  /** Full Akeyless path */
  akeylessPath: string;
  /** Item type from Akeyless */
  itemType?: string;
  /** Optional description from item metadata */
  description?: string;
}

export interface RunWithEnvironmentResult {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  injectedVariables: string[];
  durationMs: number;
}

export interface ScanFinding {
  file: string;
  line: number;
  kind: string;
  snippet: string;
  suggestedEnvName?: string;
}

export interface ScanResult {
  scannedFiles: number;
  findings: ScanFinding[];
}
