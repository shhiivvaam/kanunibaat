import { router } from '../init';
import { practiceAnalyticsRouter } from './practice-analytics';
import { practiceBillingRouter } from './practice-billing';

/** Phase 10: practice analytics + billing (lawyer role). */
export const practiceRouter = router({
  analytics: practiceAnalyticsRouter,
  billing: practiceBillingRouter,
});
