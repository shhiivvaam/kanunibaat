import { loadApiEnv } from './env';

describe('loadApiEnv', () => {
  const prev = { ...process.env };

  afterEach(() => {
    process.env = { ...prev };
  });

  it('parses PORT as number', () => {
    process.env.PORT = '4001';
    const env = loadApiEnv();
    expect(env.PORT).toBe(4001);
  });

  it('throws on invalid PORT', () => {
    process.env.PORT = 'not-a-port';
    expect(() => loadApiEnv()).toThrow(/Invalid API environment/);
  });
});
