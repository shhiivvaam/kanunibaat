import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink, loggerLink } from '@trpc/client';
import Constants from 'expo-constants';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { trpc } from '@kb/api-client';

import { getSessionToken, subscribeSessionTokenChanged } from '@/lib/auth-token';

function defaultApiBaseUrl(): string {
  const fromEnv =
    (typeof process !== 'undefined' && process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '')) ||
    (Constants.expoConfig?.extra?.apiUrl as string | undefined)?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  return Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';
}

export function TrpcProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
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
            url: `${defaultApiBaseUrl()}/trpc`,
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
