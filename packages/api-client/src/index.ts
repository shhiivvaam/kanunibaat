import { createTRPCReact } from '@trpc/react-query';

import type { AppRouter } from '@jurisly/trpc';

export const trpc: ReturnType<typeof createTRPCReact<AppRouter>> = createTRPCReact<AppRouter>();

export type { AppRouter };
