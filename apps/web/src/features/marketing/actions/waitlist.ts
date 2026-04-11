'use server';

import { Resend } from 'resend';
import { z } from 'zod';

export type WaitlistResult =
  | { status: 'idle' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string; fieldErrors?: Record<string, string[] | undefined> };

const userWaitlistSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: z.string().trim().email('Enter a valid email').max(320),
  phone: z.string().trim().max(20).optional(),
  referrer: z.string().trim().max(200).optional(),
});

const lawyerWaitlistSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: z.string().trim().email('Enter a valid email').max(320),
  phone: z.string().trim().min(10, 'Enter a valid phone number').max(20),
  referrer: z.string().trim().max(200).optional(),
  barState: z.string().trim().min(1, 'State bar council is required').max(80),
  enrollmentNumber: z.string().trim().min(1, 'Enrollment number is required').max(80),
  practiceAreas: z.string().trim().max(500).optional(),
});

function notifyEmail(): string | undefined {
  const direct = process.env.WAITLIST_NOTIFY_EMAIL?.trim();
  if (direct) return direct;
  return process.env.FROM_EMAIL?.trim();
}

async function sendWaitlistEmail(subject: string, body: string): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.FROM_EMAIL?.trim();
  const to = notifyEmail();

  if (!apiKey || !from || !to) {
    if (process.env.NODE_ENV === 'development') {
      console.info('[waitlist] Resend not configured; would send:', { subject, body });
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

export async function submitUserWaitlist(_prev: WaitlistResult, formData: FormData): Promise<WaitlistResult> {
  const parsed = userWaitlistSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone') ?? '',
    referrer: formData.get('referrer') ?? '',
  });

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Please check the highlighted fields.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const lines = [
    'New user app waitlist submission',
    `Name: ${parsed.data.name}`,
    `Email: ${parsed.data.email}`,
    `Phone: ${parsed.data.phone || '(not provided)'}`,
    `Referrer: ${parsed.data.referrer || '(not provided)'}`,
  ];
  const result = await sendWaitlistEmail(`[KanooniBaat] App waitlist — ${parsed.data.email}`, lines.join('\n'));

  if (!result.sent) {
    return {
      status: 'error',
      message: result.reason ?? 'Could not send your request. Try again later.',
    };
  }

  return {
    status: 'success',
    message:
      process.env.RESEND_API_KEY && process.env.FROM_EMAIL && notifyEmail()
        ? "You're on the list. We'll email you when the app opens up."
        : "You're on the list (dev mode — email delivery simulated).",
  };
}

export async function submitLawyerWaitlist(_prev: WaitlistResult, formData: FormData): Promise<WaitlistResult> {
  const parsed = lawyerWaitlistSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone') ?? '',
    referrer: formData.get('referrer') ?? '',
    barState: formData.get('barState'),
    enrollmentNumber: formData.get('enrollmentNumber'),
    practiceAreas: formData.get('practiceAreas') ?? '',
  });

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Please check the highlighted fields.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const lines = [
    'New lawyer early-access waitlist submission',
    `Name: ${parsed.data.name}`,
    `Email: ${parsed.data.email}`,
    `Phone: ${parsed.data.phone || '(not provided)'}`,
    `Bar state: ${parsed.data.barState}`,
    `Enrollment: ${parsed.data.enrollmentNumber}`,
    `Practice areas: ${parsed.data.practiceAreas || '(not provided)'}`,
    `Referrer: ${parsed.data.referrer || '(not provided)'}`,
  ];
  const result = await sendWaitlistEmail(
    `[KanooniBaat] Lawyer waitlist — ${parsed.data.email}`,
    lines.join('\n'),
  );

  if (!result.sent) {
    return {
      status: 'error',
      message: result.reason ?? 'Could not send your request. Try again later.',
    };
  }

  return {
    status: 'success',
    message:
      process.env.RESEND_API_KEY && process.env.FROM_EMAIL && notifyEmail()
        ? 'Thanks — our team will verify your details and reach out within a few business days.'
        : 'Thanks (dev mode — email delivery simulated).',
  };
}
