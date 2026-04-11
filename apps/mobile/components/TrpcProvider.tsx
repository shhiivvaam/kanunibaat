import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink, loggerLink } from '@trpc/client';
import Constants from 'expo-constants';
import { type ReactNode, useState } from 'react';
import { Platform } from 'react-native';

import { trpc } from '@kb/api-client';

function defaultApiBaseUrl(): string {
  const fromEnv =
    (typeof process !== 'undefined' && process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '')) ||
    (Constants.expoConfig?.extra?.apiUrl as string | undefined)?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  return Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';
}

export function TrpcProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        loggerLink({ enabled: () => __DEV__ }),
        httpBatchLink({
          url: `${defaultApiBaseUrl()}/trpc`,
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
