import type { inferRouterOutputs } from '@trpc/server';

import type { AppRouter } from './router';

export type { AppRouter } from './router';
export type RouterOutputs = inferRouterOutputs<AppRouter>;
export { appRouter } from './router';
export { aggregateInvoiceTax, lineTaxAmount } from './practice/gst-totals';
export { indianFyStartYear } from './practice/fiscal-india';
export { computeReminderTimes, HEARING_REMINDER_OFFSETS_MS } from './notifications/schedule';
export { generateQaPreviewWithOpenAI, qaAiPreviewSchema } from './qa/openai-preview';
export { publicProcedure, protectedProcedure, roleProcedure, router } from './init';
export {
  createTrpcContextFactory,
  type KbRole,
  type TrpcContext,
  type TrpcContextDeps,
} from './context';
export {
  extractSessionTokenFromRequest,
  resolveUserIdFromSessionToken,
  unsignBetterAuthSessionCookieValue,
} from './session-resolve';
