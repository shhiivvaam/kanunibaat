'use client';

import Link from 'next/link';
import { useActionState } from 'react';

import { submitUserWaitlist, type WaitlistResult } from '@/features/marketing/actions/waitlist';

const initial: WaitlistResult = { status: 'idle' };

export function WaitlistUserPage() {
  const [state, formAction, pending] = useActionState(submitUserWaitlist, initial);
  const fieldErrors = state.status === 'error' ? state.fieldErrors : undefined;

  return (
    <div className="min-h-screen bg-[#FAFAF9] px-6 py-16">
      <div className="mx-auto max-w-[480px]">
        <p className="mb-4 text-sm text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
          <Link href="/" className="text-[#C2410C] hover:underline">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[#1C1917]">App waitlist</span>
        </p>
        <h1
          className="mb-3 text-3xl font-bold text-[#1C1917]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Get early access to the KanooniBaat app
        </h1>
        <p className="mb-8 text-[#57534E]" style={{ fontFamily: 'var(--font-body)', lineHeight: 1.65 }}>
          We are onboarding citizens in batches. Leave your details and we will notify you when your spot opens — no
          spam, unsubscribe anytime.
        </p>

        {state.status === 'success' ? (
          <div
            className="rounded-[16px] border border-[#BBF7D0] bg-[#F0FDF4] p-6 text-[#166534]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            <p className="font-semibold">Thank you!</p>
            <p className="mt-2 text-sm leading-relaxed">{state.message}</p>
            <Link href="/" className="mt-4 inline-block text-sm font-semibold text-[#C2410C] hover:underline">
              Back to home
            </Link>
          </div>
        ) : (
          <form action={formAction} className="space-y-5 rounded-[24px] border border-[#E7E5E4] bg-white p-8 shadow-sm">
            {state.status === 'error' ? (
              <p className="rounded-xl bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]" role="alert">
                {state.message}
              </p>
            ) : null}

            <div>
              <label htmlFor="wu-name" className="mb-1.5 block text-sm font-semibold text-[#1C1917]">
                Full name
              </label>
              <input
                id="wu-name"
                name="name"
                required
                autoComplete="name"
                className="h-12 w-full rounded-[12px] border border-[#E7E5E4] px-4 text-[#1C1917] outline-none focus:border-[#C2410C]"
                style={{ fontFamily: 'var(--font-body)' }}
                aria-invalid={Boolean(fieldErrors?.name)}
              />
              {fieldErrors?.name ? (
                <p className="mt-1 text-xs text-[#B91C1C]">{fieldErrors.name[0]}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="wu-email" className="mb-1.5 block text-sm font-semibold text-[#1C1917]">
                Email
              </label>
              <input
                id="wu-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="h-12 w-full rounded-[12px] border border-[#E7E5E4] px-4 text-[#1C1917] outline-none focus:border-[#C2410C]"
                style={{ fontFamily: 'var(--font-body)' }}
                aria-invalid={Boolean(fieldErrors?.email)}
              />
              {fieldErrors?.email ? (
                <p className="mt-1 text-xs text-[#B91C1C]">{fieldErrors.email[0]}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="wu-phone" className="mb-1.5 block text-sm font-semibold text-[#1C1917]">
                Phone <span className="font-normal text-[#78716C]">(optional)</span>
              </label>
              <input
                id="wu-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+91 …"
                className="h-12 w-full rounded-[12px] border border-[#E7E5E4] px-4 text-[#1C1917] outline-none focus:border-[#C2410C]"
                style={{ fontFamily: 'var(--font-body)' }}
              />
            </div>

            <div>
              <label htmlFor="wu-ref" className="mb-1.5 block text-sm font-semibold text-[#1C1917]">
                How did you hear about us? <span className="font-normal text-[#78716C]">(optional)</span>
              </label>
              <input
                id="wu-ref"
                name="referrer"
                className="h-12 w-full rounded-[12px] border border-[#E7E5E4] px-4 text-[#1C1917] outline-none focus:border-[#C2410C]"
                style={{ fontFamily: 'var(--font-body)' }}
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="h-12 w-full rounded-[16px] bg-[#C2410C] text-sm font-semibold text-white transition-colors hover:bg-[#9a3409] disabled:opacity-60"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {pending ? 'Submitting…' : 'Join waitlist'}
            </button>

            <p className="text-center text-xs text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
              By submitting, you agree to our{' '}
              <Link href="/privacy" className="text-[#C2410C] hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
