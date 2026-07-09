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
  defaultSecretName?: string;
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
}

export type AkeylessConfigInput = Partial<AkeylessConfig> & {
  /** Raw Gateway URL before /api/v2 parsing (tests and direct injection). */
  gatewayInputUrl?: string;
};
