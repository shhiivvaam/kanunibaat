import { Resend } from 'resend';

import type { WaitlistEnv } from './env';
import { isResendConfigured } from './env';
import type { LawyerWaitlistInput, UserWaitlistInput } from './schemas';

export type WaitlistSubmitSuccess = {
  ok: true;
  message: string;
};

export type WaitlistSubmitFailure = {
  ok: false;
  message: string;
};

export type WaitlistSubmitResult = WaitlistSubmitSuccess | WaitlistSubmitFailure;

async function sendWaitlistEmail(
  env: WaitlistEnv,
  subject: string,
  body: string,
): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = env.resendApiKey?.trim();
  const from = env.fromEmail?.trim();
  const to = env.notifyEmail?.trim();

  if (!apiKey || !from || !to) {
    if (env.nodeEnv === 'development') {
      return { sent: true };
    }
    return { sent: false, reason: 'Email is not configured on the server yet.' };
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [to],
    subject,
    text: body,
  });

  if (error) {
    return { sent: false, reason: error.message };
  }
  return { sent: true };
}

export async function submitUserWaitlist(
  input: UserWaitlistInput,
  env: WaitlistEnv,
): Promise<WaitlistSubmitResult> {
  const lines = [
    'New user app waitlist submission',
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Phone: ${input.phone || '(not provided)'}`,
    `Referrer: ${input.referrer || '(not provided)'}`,
  ];
  const result = await sendWaitlistEmail(env, `[KanooniBaat] App waitlist — ${input.email}`, lines.join('\n'));

  if (!result.sent) {
    return {
      ok: false,
      message: result.reason ?? 'Could not send your request. Try again later.',
    };
  }

  return {
    ok: true,
    message: isResendConfigured(env)
      ? "You're on the list. We'll email you when the app opens up."
      : "You're on the list (dev mode — email delivery simulated).",
  };
}

export async function submitLawyerWaitlist(
  input: LawyerWaitlistInput,
  env: WaitlistEnv,
): Promise<WaitlistSubmitResult> {
  const lines = [
    'New lawyer early-access waitlist submission',
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Phone: ${input.phone || '(not provided)'}`,
    `Bar state: ${input.barState}`,
    `Enrollment: ${input.enrollmentNumber}`,
    `Practice areas: ${input.practiceAreas || '(not provided)'}`,
    `Referrer: ${input.referrer || '(not provided)'}`,
  ];
  const result = await sendWaitlistEmail(
    env,
    `[KanooniBaat] Lawyer waitlist — ${input.email}`,
    lines.join('\n'),
  );

  if (!result.sent) {
    return {
      ok: false,
      message: result.reason ?? 'Could not send your request. Try again later.',
    };
  }

  return {
    ok: true,
    message: isResendConfigured(env)
      ? 'Thanks — our team will verify your details and reach out within a few business days.'
      : 'Thanks (dev mode — email delivery simulated).',
  };
}
