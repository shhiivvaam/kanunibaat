/**
 * Email / runtime configuration for waitlist submissions (injected from API or tests).
 */
export interface WaitlistEnv {
  nodeEnv: string;
  resendApiKey?: string;
  fromEmail?: string;
  notifyEmail?: string;
}

export function isResendConfigured(env: WaitlistEnv): boolean {
  return Boolean(env.resendApiKey && env.fromEmail && env.notifyEmail);
}
