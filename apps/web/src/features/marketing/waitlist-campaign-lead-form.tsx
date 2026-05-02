'use client';

import { TRPCClientError } from '@trpc/client';
import Link from 'next/link';
import { useState } from 'react';

import { trpc } from '@jurisly/api-client';

function fieldErrorsFromTrpc(err: unknown): Record<string, string[] | undefined> | undefined {
  if (
    err instanceof TRPCClientError &&
    err.data &&
    typeof err.data === 'object' &&
    'zodError' in err.data
  ) {
    const z = (err.data as { zodError?: { fieldErrors?: Record<string, string[] | undefined> } })
      .zodError;
    return z?.fieldErrors;
  }
  return undefined;
}

export function WaitlistCampaignLeadForm() {
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const mutation = trpc.waitlist.submitUser.useMutation({
    onSuccess: (data) => setSubmittedMessage(data.message),
  });

  const fieldErrors = mutation.isError ? fieldErrorsFromTrpc(mutation.error) : undefined;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmittedMessage(null);
    const fd = new FormData(e.currentTarget);
    const phoneRaw = String(fd.get('phone') ?? '').trim();
    mutation.mutate({
      name: String(fd.get('name') ?? ''),
      email: String(fd.get('email') ?? ''),
      phone: phoneRaw ? phoneRaw : undefined,
      referrer: String(fd.get('referrer') ?? '').trim() || undefined,
    });
  };

  return (
    <div
      id="waitlist-form"
      className="scroll-mt-28 rounded-[24px] border border-[#E7E5E4] bg-white p-8 shadow-sm md:p-10"
    >
      {submittedMessage ? (
        <div
          className="rounded-[16px] border border-[#BBF7D0] bg-[#F0FDF4] p-6 text-[#166534]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          <p className="font-semibold">You are on the list</p>
          <p className="mt-2 text-sm leading-relaxed">{submittedMessage}</p>
        </div>
      ) : (
        <>
          <h2
            className="mb-2 text-2xl font-bold text-[#1C1917]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Get early access
          </h2>
          <p
            className="mb-8 text-[#57534E]"
            style={{ fontFamily: 'var(--font-body)', lineHeight: 1.65 }}
          >
            We are opening Jurisly in batches. Leave your details — no spam, unsubscribe anytime.
          </p>
          <form onSubmit={onSubmit} className="space-y-5">
            {mutation.isError ? (
              <p className="rounded-xl bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]" role="alert">
                {mutation.error.message}
              </p>
            ) : null}

            <div>
              <label
                htmlFor="wc-name"
                className="mb-1.5 block text-sm font-semibold text-[#1C1917]"
              >
                Full name
              </label>
              <input
                id="wc-name"
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
              <label
                htmlFor="wc-email"
                className="mb-1.5 block text-sm font-semibold text-[#1C1917]"
              >
                Email
              </label>
              <input
                id="wc-email"
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
              <label
                htmlFor="wc-phone"
                className="mb-1.5 block text-sm font-semibold text-[#1C1917]"
              >
                Phone <span className="font-normal text-[#78716C]">(optional)</span>
              </label>
              <input
                id="wc-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+91 …"
                className="h-12 w-full rounded-[12px] border border-[#E7E5E4] px-4 text-[#1C1917] outline-none focus:border-[#C2410C]"
                style={{ fontFamily: 'var(--font-body)' }}
              />
            </div>

            <div>
              <label htmlFor="wc-ref" className="mb-1.5 block text-sm font-semibold text-[#1C1917]">
                How did you hear about us?{' '}
                <span className="font-normal text-[#78716C]">(optional)</span>
              </label>
              <input
                id="wc-ref"
                name="referrer"
                className="h-12 w-full rounded-[12px] border border-[#E7E5E4] px-4 text-[#1C1917] outline-none focus:border-[#C2410C]"
                style={{ fontFamily: 'var(--font-body)' }}
              />
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="h-12 w-full rounded-[16px] bg-[#C2410C] text-sm font-semibold text-white transition-colors hover:bg-[#9a3409] disabled:opacity-60"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {mutation.isPending ? 'Submitting…' : 'Join the waitlist'}
            </button>

            <p
              className="text-center text-xs text-[#78716C]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              By submitting, you agree to our{' '}
              <Link href="/privacy" className="text-[#C2410C] hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </form>
        </>
      )}
    </div>
  );
}
