import 'server-only';

import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { headers } from 'next/headers';

import type { AppRouter } from '@jurisly/api-client';

function internalApiBaseUrl(): string {
  return (
    process.env.INTERNAL_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:4000'
  ).replace(/\/$/, '');
}

/**
 * Server-side tRPC client (forwards cookies). Used for RSC role gates and SEO metadata.
 */
export async function createServerTrpc(): Promise<
  ReturnType<typeof createTRPCProxyClient<AppRouter>>
> {
  const h = await headers();
  return createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${internalApiBaseUrl()}/trpc`,
        headers() {
          const cookie = h.get('cookie');
          return cookie ? { cookie } : {};
        },
      }),
    ],
  });
}
