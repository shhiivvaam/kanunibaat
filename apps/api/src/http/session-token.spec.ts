/**
 * Regression checks for cross-platform tRPC auth: mobile sends Bearer; web (via Next proxy) sends cookies.
 * Context resolution uses the same helper — see `createTrpcContextFactory` in `@jurisly/trpc`.
 */
import { extractSessionTokenFromRequest } from '@jurisly/trpc';

describe('extractSessionTokenFromRequest', () => {
  it('reads Bearer token', () => {
    const token = extractSessionTokenFromRequest({
      headers: { authorization: 'Bearer abc123.token' },
    } as never);
    expect(token).toBe('abc123.token');
  });

  it('reads default Better Auth session cookie name', () => {
    const token = extractSessionTokenFromRequest({
      headers: { cookie: 'better-auth.session_token=sess_abc; other=1' },
    } as never);
    expect(token).toBe('sess_abc');
  });

  it('prefers Bearer over cookies when both are present', () => {
    const token = extractSessionTokenFromRequest({
      headers: {
        authorization: 'Bearer from-bearer',
        cookie: 'better-auth.session_token=from-cookie',
      },
    } as never);
    expect(token).toBe('from-bearer');
  });
});
