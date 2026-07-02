import {
  isAraDbProducerType,
  isAraServiceProducerType,
  isAraSupportedProducerType,
  mapAraSecrets,
  buildGatewayAuthHeader,
} from './ara';

describe('ara producer types', () => {
  it('identifies database producers', () => {
    expect(isAraDbProducerType('postgres')).toBe(true);
    expect(isAraDbProducerType('aws')).toBe(false);
  });

  it('identifies service producers', () => {
    expect(isAraServiceProducerType('aws')).toBe(true);
    expect(isAraServiceProducerType('mysql')).toBe(false);
  });

  it('combines supported producers', () => {
    expect(isAraSupportedProducerType('github')).toBe(true);
    expect(isAraSupportedProducerType('vault')).toBe(false);
  });
});

describe('mapAraSecrets', () => {
  it('filters to ARA-enabled supported secrets', () => {
    const secrets = mapAraSecrets([
      {
        item_name: '/db/postgres-ds',
        item_type: 'dynamic-secret',
        item_metadata: 'prod db',
        client_permissions: ['ara_allow_access'],
        item_general_info: {
          dynamic_secret_producer_details: { producer_type: 'postgres' },
        },
      },
      {
        item_name: '/db/no-ara',
        item_type: 'dynamic-secret',
        client_permissions: ['read'],
        item_general_info: {
          dynamic_secret_producer_details: { producer_type: 'postgres' },
        },
      },
      {
        item_name: '/cloud/aws-ds',
        item_type: 'dynamic-secret',
        client_permissions: ['ara_allow_access'],
        item_general_info: {
          dynamic_secret_producer_details: { producer_type: 'aws' },
        },
      },
    ]);

    expect(secrets).toHaveLength(2);
    expect(secrets.map((s) => s.name)).toEqual(['/cloud/aws-ds', '/db/postgres-ds']);
    expect(secrets[1]?.target_type).toBe('postgres');
  });
});

describe('buildGatewayAuthHeader', () => {
  it('uses temp token directly', () => {
    expect(buildGatewayAuthHeader({ token: 't-abc123' })).toEqual({
      Authorization: 'Bearer t-abc123',
    });
  });

  it('base64 encodes creds object', () => {
    const header = buildGatewayAuthHeader({
      token: 'legacy',
      creds: { token: 'legacy', expiry: 123 },
    });
    expect(header.Authorization?.startsWith('Bearer ')).toBe(true);
    const encoded = header.Authorization!.slice('Bearer '.length);
    const decoded = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
    expect(decoded.token).toBe('legacy');
  });
});
