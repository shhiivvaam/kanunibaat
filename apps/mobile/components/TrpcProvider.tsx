import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink, loggerLink } from '@trpc/client';
import { type ReactNode, useEffect, useMemo, useState } from 'react';

import { trpc } from '@jurisly/api-client';

import { getSessionToken, subscribeSessionTokenChanged } from '@/lib/auth-token';
import { trpcPlatformApiBase } from '@/lib/trpc-url';

export function TrpcProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            retry: (failureCount, error) => {
              const msg =
                error instanceof Error ? error.message : String(error ?? '');
              if (msg.includes('UNAUTHORIZED') || msg.includes('FORBIDDEN'))
                return false;
              return failureCount < 2;
            },
          },
        },
      }),
  );
  const [bearerToken, setBearerToken] = useState<string | null>(null);

  useEffect(() => {
    void getSessionToken().then(setBearerToken);
    const unsub = subscribeSessionTokenChanged(() => {
      void getSessionToken().then(setBearerToken);
    });
    return unsub;
  }, []);

  const trpcClient = useMemo(
    () =>
      trpc.createClient({
        links: [
          loggerLink({ enabled: () => __DEV__ }),
          httpBatchLink({
            url: `${trpcPlatformApiBase()}/trpc`,
            headers: () => {
              if (!bearerToken) return {};
              return { authorization: `Bearer ${bearerToken}` };
            },
          }),
        ],
      }),
    [bearerToken],
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
