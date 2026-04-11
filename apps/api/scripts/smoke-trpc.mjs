/**
 * Smoke test: proves the Nest process exposes tRPC over HTTP (used in CI after `node dist/main.js`).
 */
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';

const base = (process.env.SMOKE_API_URL ?? 'http://127.0.0.1:4000').replace(/\/$/, '');
const url = `${base}/trpc`;

const client = createTRPCProxyClient({
  links: [
    httpBatchLink({
      url,
      fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(15_000) }),
    }),
  ],
});

const result = await client.health.query();
if (!result?.ok) {
  console.error('tRPC health unexpected:', result);
  process.exit(1);
}
console.log('tRPC health ok:', result.service);
