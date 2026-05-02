import type { inferRouterOutputs } from '@trpc/server';

import type { AppRouter } from './router';

export type { AppRouter } from './router';
export type RouterOutputs = inferRouterOutputs<AppRouter>;
export { appRouter } from './router';
export { aggregateInvoiceTax, lineTaxAmount } from './practice/gst-totals';
export { indianFyStartYear } from './practice/fiscal-india';
export { computeReminderTimes, HEARING_REMINDER_OFFSETS_MS } from './notifications/schedule';
export { generateQaPreviewWithOpenAI, qaAiPreviewSchema } from './qa/openai-preview';
export {
  computeEntitlementsForUser,
  ensureDefaultPlans,
  incrementUsageMeter,
  monthStartUtc,
} from './billing/entitlements';
export { publicProcedure, protectedProcedure, roleProcedure, router } from './init';
export {
  createTrpcContextFactory,
  type KbRole,
  type TrpcContext,
  type TrpcContextDeps,
} from './context';
export { noopStructuredLogger } from './lib/trpc-structured-logger';
export {
  extractSessionTokenFromRequest,
  extractSessionTokenForStreaming,
  resolveUserIdFromSessionToken,
  unsignBetterAuthSessionCookieValue,
} from './session-resolve';
export { writeAuditLog } from './lib/audit-log';
export { normalizeAndValidateCnr } from './cases/njdg-lookup';
export { scanVaultDocument } from './vault/malware-scan';
