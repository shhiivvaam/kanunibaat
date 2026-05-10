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

const barStates = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Other / Union Territory',
] as const;

export function WaitlistLawyerPage() {
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const mutation = trpc.waitlist.submitLawyer.useMutation({
    onSuccess: (data) => setSubmittedMessage(data.message),
  });

  const fieldErrors = mutation.isError ? fieldErrorsFromTrpc(mutation.error) : undefined;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmittedMessage(null);
    const fd = new FormData(e.currentTarget);
    const practiceRaw = String(fd.get('practiceAreas') ?? '').trim();
    mutation.mutate({
      name: String(fd.get('name') ?? ''),
      email: String(fd.get('email') ?? ''),
      phone: String(fd.get('phone') ?? ''),
      referrer: String(fd.get('referrer') ?? '').trim() || undefined,
      barState: String(fd.get('barState') ?? ''),
      enrollmentNumber: String(fd.get('enrollmentNumber') ?? ''),
      practiceAreas: practiceRaw ? practiceRaw : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] px-6 py-16">
      <div className="mx-auto max-w-[520px]">
        <p className="mb-4 text-sm text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
          <Link href="/for-lawyers" className="text-[#C2410C] hover:underline">
            For Lawyers
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[#1C1917]">Early access</span>
        </p>
        <h1
          className="mb-3 text-3xl font-bold text-[#1C1917]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Lawyer early-access waitlist
        </h1>
        <p
          className="mb-8 text-[#57534E]"
          style={{ fontFamily: 'var(--font-body)', lineHeight: 1.65 }}
        >
          We verify every advocate against Bar Council records. Tell us who you are — we will follow
          up with onboarding steps and verification requirements.
        </p>

        {submittedMessage ? (
          <div
            className="rounded-[16px] border border-[#BBF7D0] bg-[#F0FDF4] p-6 text-[#166534]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            <p className="font-semibold">Received.</p>
            <p className="mt-2 text-sm leading-relaxed">{submittedMessage}</p>
            <Link
              href="/for-lawyers"
              className="mt-4 inline-block text-sm font-semibold text-[#C2410C] hover:underline"
            >
              Back to For Lawyers
            </Link>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="space-y-5 rounded-[24px] border border-[#E7E5E4] bg-white p-8 shadow-sm"
          >
            {mutation.isError ? (
              <p className="rounded-xl bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]" role="alert">
                {mutation.error.message}
              </p>
            ) : null}

            <div>
              <label
                htmlFor="wl-name"
                className="mb-1.5 block text-sm font-semibold text-[#1C1917]"
              >
                Full name (as on enrollment)
              </label>
              <input
                id="wl-name"
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
                htmlFor="wl-email"
                className="mb-1.5 block text-sm font-semibold text-[#1C1917]"
              >
                Work email
              </label>
              <input
                id="wl-email"
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
                htmlFor="wl-phone"
                className="mb-1.5 block text-sm font-semibold text-[#1C1917]"
              >
                Phone
              </label>
              <input
                id="wl-phone"
                name="phone"
                type="tel"
                required
                autoComplete="tel"
                className="h-12 w-full rounded-[12px] border border-[#E7E5E4] px-4 text-[#1C1917] outline-none focus:border-[#C2410C]"
                style={{ fontFamily: 'var(--font-body)' }}
                aria-invalid={Boolean(fieldErrors?.phone)}
              />
              {fieldErrors?.phone ? (
                <p className="mt-1 text-xs text-[#B91C1C]">{fieldErrors.phone[0]}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="wl-bar" className="mb-1.5 block text-sm font-semibold text-[#1C1917]">
                State Bar Council
              </label>
              <select
                id="wl-bar"
                name="barState"
                required
                className="h-12 w-full rounded-[12px] border border-[#E7E5E4] bg-white px-4 text-[#1C1917] outline-none focus:border-[#C2410C]"
                style={{ fontFamily: 'var(--font-body)' }}
                defaultValue=""
              >
                <option value="" disabled>
                  Select state
                </option>
                {barStates.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {fieldErrors?.barState ? (
                <p className="mt-1 text-xs text-[#B91C1C]">{fieldErrors.barState[0]}</p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="wl-enroll"
                className="mb-1.5 block text-sm font-semibold text-[#1C1917]"
              >
                Bar enrollment number
              </label>
              <input
                id="wl-enroll"
                name="enrollmentNumber"
                required
                className="h-12 w-full rounded-[12px] border border-[#E7E5E4] px-4 text-[#1C1917] outline-none focus:border-[#C2410C]"
                style={{ fontFamily: 'var(--font-body)' }}
                aria-invalid={Boolean(fieldErrors?.enrollmentNumber)}
              />
              {fieldErrors?.enrollmentNumber ? (
                <p className="mt-1 text-xs text-[#B91C1C]">{fieldErrors.enrollmentNumber[0]}</p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="wl-areas"
                className="mb-1.5 block text-sm font-semibold text-[#1C1917]"
              >
                Primary practice areas{' '}
                <span className="font-normal text-[#78716C]">(optional)</span>
              </label>
              <textarea
                id="wl-areas"
                name="practiceAreas"
                rows={3}
                placeholder="e.g. Civil, Consumer, Property"
                className="w-full rounded-[12px] border border-[#E7E5E4] px-4 py-3 text-[#1C1917] outline-none focus:border-[#C2410C]"
                style={{ fontFamily: 'var(--font-body)' }}
              />
            </div>

            <div>
              <label htmlFor="wl-ref" className="mb-1.5 block text-sm font-semibold text-[#1C1917]">
                Referral source <span className="font-normal text-[#78716C]">(optional)</span>
              </label>
              <input
                id="wl-ref"
                name="referrer"
                className="h-12 w-full rounded-[12px] border border-[#E7E5E4] px-4 text-[#1C1917] outline-none focus:border-[#C2410C]"
                style={{ fontFamily: 'var(--font-body)' }}
              />
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="h-12 w-full rounded-[16px] bg-[#1C1917] text-sm font-semibold text-white transition-colors hover:bg-[#292524] disabled:opacity-60"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {mutation.isPending ? 'Submitting…' : 'Request early access'}
            </button>

            <p
              className="text-center text-xs text-[#78716C]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              By submitting, you agree to our{' '}
              <Link href="/terms" className="text-[#C2410C] hover:underline">
                Terms
              </Link>{' '}
              and{' '}
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
