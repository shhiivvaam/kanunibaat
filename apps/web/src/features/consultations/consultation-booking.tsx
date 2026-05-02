'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { trpc } from '@jurisly/api-client';

import { getRazorpayCtor, loadRazorpayCheckoutScript } from './razorpay';

const DEFAULT_TZ = 'Asia/Kolkata';
interface RazorpayHandlerResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export function ConsultationBooking() {
  const router = useRouter();
  const search = useSearchParams();
  const lawyerUserId = search.get('lawyerUserId') ?? '';
  const slug = search.get('slug') ?? '';

  const availability = trpc.marketplace.availabilityByLawyerUserId.useQuery(
    { lawyerUserId },
    { enabled: lawyerUserId.length > 0 },
  );

  const [mode, setMode] = useState<'chat' | 'audio' | 'video'>('chat');
  const [scheduledAtLocal, setScheduledAtLocal] = useState('');
  const [issueSummary, setIssueSummary] = useState('');
  const [busy, setBusy] = useState(false);
  const tz = DEFAULT_TZ;

  const create = trpc.consultations.create.useMutation();
  const createOrder = trpc.consultations.createRazorpayOrder.useMutation();
  const verify = trpc.consultations.verifyPayment.useMutation();

  const canSubmit = useMemo(() => {
    return (
      lawyerUserId.length > 0 && scheduledAtLocal.length > 0 && issueSummary.trim().length >= 10
    );
  }, [issueSummary, lawyerUserId, scheduledAtLocal]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1
          className="text-2xl font-semibold text-[#1C1917]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Book consultation
        </h1>
        <p className="text-sm text-[#57534E]" style={{ fontFamily: 'var(--font-body)' }}>
          Choose a mode, pick a time, and pay securely via Razorpay.
        </p>
      </header>

      {availability.isPending ? (
        <p className="text-sm text-[#78716C]">Loading availability…</p>
      ) : availability.isError ? (
        <p className="text-sm text-red-700">{availability.error.message}</p>
      ) : (availability.data?.availability?.length ?? 0) === 0 ? (
        <div className="rounded-2xl border border-[#E7E5E4] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#57534E]" style={{ fontFamily: 'var(--font-body)' }}>
            This lawyer has not set availability yet. You can still pick a time, but booking may
            fail validation.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#E7E5E4] bg-white p-5 shadow-sm">
          <p
            className="text-sm font-semibold text-[#1C1917]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Availability (weekly)
          </p>
          <ul
            className="mt-3 grid gap-2 text-sm text-[#44403C]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {availability.data.availability.map((a) => (
              <li key={a.id} className="rounded-xl bg-[#FAFAF9] px-3 py-2 ring-1 ring-[#E7E5E4]">
                Day {a.dayOfWeek} ·{' '}
                {Math.floor(a.startMinute / 60)
                  .toString()
                  .padStart(2, '0')}
                :{(a.startMinute % 60).toString().padStart(2, '0')}–
                {Math.floor(a.endMinute / 60)
                  .toString()
                  .padStart(2, '0')}
                :{(a.endMinute % 60).toString().padStart(2, '0')} ({a.timezone})
              </li>
            ))}
          </ul>
        </div>
      )}

      <form
        className="rounded-2xl border border-[#E7E5E4] bg-white p-5 shadow-sm"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!canSubmit || busy) return;
          setBusy(true);
          try {
            const scheduledAtIso = new Date(scheduledAtLocal).toISOString();
            const created = await create.mutateAsync({
              lawyerUserId,
              mode,
              scheduledAtIso,
              timeZone: tz,
              issueSummary: issueSummary.trim(),
            });
            const ord = await createOrder.mutateAsync({ consultationId: created.consultationId });
            await loadRazorpayCheckoutScript();
            const Razorpay = getRazorpayCtor();

            const rzp = new Razorpay({
              key: ord.keyId,
              amount: ord.amountPaise,
              currency: ord.currency,
              order_id: ord.orderId,
              name: 'Jurisly',
              description: 'Consultation booking',
              handler: async (response: RazorpayHandlerResponse) => {
                await verify.mutateAsync({
                  consultationId: created.consultationId,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                });
                router.push(`/app/consultations/${created.consultationId}`);
              },
              modal: {
                ondismiss: () => setBusy(false),
              },
              notes: { slug },
            });
            rzp.open();
          } catch {
            setBusy(false);
          }
        }}
      >
        <div className="grid gap-4">
          <label className="grid gap-2">
            <span
              className="text-sm font-semibold text-[#1C1917]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Mode
            </span>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as 'chat' | 'audio' | 'video')}
              className="rounded-xl border border-[#E7E5E4] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#FDBA74]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              <option value="chat">Chat</option>
              <option value="audio">Audio (LiveKit-gated)</option>
              <option value="video">Video (LiveKit-gated)</option>
            </select>
          </label>

          <label className="grid gap-2">
            <span
              className="text-sm font-semibold text-[#1C1917]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Time ({tz})
            </span>
            <input
              type="datetime-local"
              value={scheduledAtLocal}
              onChange={(e) => setScheduledAtLocal(e.target.value)}
              className="rounded-xl border border-[#E7E5E4] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#FDBA74]"
              style={{ fontFamily: 'var(--font-body)' }}
            />
          </label>

          <label className="grid gap-2">
            <span
              className="text-sm font-semibold text-[#1C1917]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Issue summary
            </span>
            <textarea
              value={issueSummary}
              onChange={(e) => setIssueSummary(e.target.value)}
              rows={5}
              placeholder="Describe your issue and what outcome you want."
              className="rounded-xl border border-[#E7E5E4] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#FDBA74]"
              style={{ fontFamily: 'var(--font-body)' }}
            />
          </label>

          {create.isError ? <p className="text-sm text-red-700">{create.error.message}</p> : null}
          {createOrder.isError ? (
            <p className="text-sm text-red-700">{createOrder.error.message}</p>
          ) : null}
          {verify.isError ? <p className="text-sm text-red-700">{verify.error.message}</p> : null}

          <button
            type="submit"
            disabled={!canSubmit || busy}
            className="rounded-xl bg-[#C2410C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#9A3412] disabled:opacity-60"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {busy ? 'Starting checkout…' : 'Pay & book'}
          </button>
        </div>
      </form>
    </div>
  );
}
