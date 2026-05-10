import { loadApiEnv } from './env';

describe('loadApiEnv production refinements', () => {
  const prev = { ...process.env };

  afterEach(() => {
    process.env = { ...prev };
  });

  const productionBase = () => ({
    ...prev,
    NODE_ENV: 'production' as const,
    DATABASE_URL: 'postgresql://u:p@127.0.0.1:5432/db',
    BETTER_AUTH_SECRET: '0123456789abcdef0123456789abcdef',
    BETTER_AUTH_URL: 'https://example.com',
    VAULT_MALWARE_SCAN_PROVIDER: 'stub',
  });

  it('requires DATABASE_URL, BETTER_AUTH_*, vault stub when NODE_ENV is production', () => {
    process.env = productionBase();
    expect(() => loadApiEnv()).not.toThrow();
  });

  it('throws when production DATABASE_URL is empty', () => {
    process.env = {
      ...productionBase(),
      DATABASE_URL: '   ',
    };
    expect(() => loadApiEnv()).toThrow(/Invalid API environment/);
  });

  it('throws when production BETTER_AUTH_URL is empty', () => {
    process.env = {
      ...productionBase(),
      BETTER_AUTH_URL: ' ',
    };
    expect(() => loadApiEnv()).toThrow(/Invalid API environment/);
  });

  it('throws when production VAULT_MALWARE_SCAN_PROVIDER is not stub', () => {
    process.env = {
      ...productionBase(),
      VAULT_MALWARE_SCAN_PROVIDER: 'clamav',
    };
    expect(() => loadApiEnv()).toThrow(/Invalid API environment/);
  });

  it('throws when production MEILISEARCH_URL is set without master key', () => {
    process.env = {
      ...productionBase(),
      MEILISEARCH_URL: 'http://127.0.0.1:7700',
    };
    expect(() => loadApiEnv()).toThrow(/Invalid API environment/);
  });
});
