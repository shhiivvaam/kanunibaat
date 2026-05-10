export type { WaitlistEnv } from './env';
export { isResendConfigured } from './env';
export {
  lawyerWaitlistInputSchema,
  userWaitlistInputSchema,
  type LawyerWaitlistInput,
  type UserWaitlistInput,
} from './schemas';
export {
  submitLawyerWaitlist,
  submitUserWaitlist,
  type WaitlistSubmitFailure,
  type WaitlistSubmitResult,
  type WaitlistSubmitSuccess,
} from './submit';
