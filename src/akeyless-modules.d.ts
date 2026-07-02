declare module 'akeyless' {
  export class ApiClient {
    basePath: string;
  }

  export class V2Api {
    constructor(client: ApiClient);
    auth(body: unknown): Promise<{
      token?: string;
      expiration?: string;
      creds?: Record<string, unknown>;
    }>;
    listItems(body: unknown): Promise<{ items?: Array<Record<string, unknown>> }>;
    getSecretValue(body: unknown): Promise<Record<string, unknown>>;
    getDynamicSecretValue(body: unknown): Promise<unknown>;
    getRotatedSecretValue(body: unknown): Promise<unknown>;
    createSecret(body: unknown): Promise<unknown>;
  }

  export const Auth: {
    constructFromObject: (obj: Record<string, unknown>) => unknown;
  };
  export const ListItems: {
    constructFromObject: (obj: Record<string, unknown>) => unknown;
  };
  export const GetSecretValue: {
    constructFromObject: (obj: Record<string, unknown>) => unknown;
  };
  export const GetDynamicSecretValue: {
    constructFromObject: (obj: Record<string, unknown>) => unknown;
  };
  export const GetRotatedSecretValue: {
    constructFromObject: (obj: Record<string, unknown>) => unknown;
  };
  export const CreateSecret: {
    constructFromObject: (obj: Record<string, unknown>) => unknown;
  };
}

declare module 'akeyless-cloud-id' {
  export function getCloudId(
    provider: string,
    param: string,
    callback: (err: Error | undefined, res: string | undefined) => void,
  ): void;
}
