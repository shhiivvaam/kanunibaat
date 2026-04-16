'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { trpc } from '@kb/api-client';

declare global {
  interface Window {
    Razorpay?: new (opts: unknown) => { open: () => void };
  }
}

function useRazorpayScript(): { ready: boolean; error: string | null } {
  const [ready, setReady] = useState(() => typeof window !== 'undefined' && Boolean(window.Razorpay));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (ready) return;
    const el = document.createElement('script');
    el.src = 'https://checkout.razorpay.com/v1/checkout.js';
    el.async = true;
    el.onload = () => setReady(true);
    el.onerror = () => setError('Failed to load Razorpay checkout.');
    document.body.appendChild(el);
  }, [ready]);

  return { ready, error };
}

export function BillingSettings() {
  const t = useTranslations();
  const plans = trpc.billing.plans.list.useQuery();
  const sub = trpc.billing.subscription.me.useQuery();
  const ent = trpc.billing.entitlements.me.useQuery();
  const history = trpc.billing.billingHistory.list.useQuery({ limit: 20 });

  const utils = trpc.useUtils();
  const create = trpc.billing.subscription.createOrUpdate.useMutation({
    onSuccess: async () => {
      await utils.billing.subscription.me.invalidate();
      await utils.billing.entitlements.me.invalidate();
    },
  });
  const cancel = trpc.billing.subscription.cancel.useMutation({
    onSuccess: async () => {
      await utils.billing.subscription.me.invalidate();
      await utils.billing.entitlements.me.invalidate();
    },
  });

  const { ready: rzReady, error: rzError } = useRazorpayScript();

  const planRows = useMemo(() => plans.data?.plans ?? [], [plans.data?.plans]);
  const currentPlanKey = ent.data?.entitlements.planKey ?? 'free';

  async function startCheckout(planKey: 'pro' | 'plus') {
    const r = await create.mutateAsync({ planKey });
    if (!rzReady || !window.Razorpay) return;
    const options = {
      key: r.keyId,
      subscription_id: r.subscriptionId,
      name: 'KanuniBaat',
      description: `Subscription: ${planKey}`,
      handler: async () => {
        await utils.billing.subscription.me.invalidate();
        await utils.billing.entitlements.me.invalidate();
      },
      modal: { ondismiss: async () => utils.billing.subscription.me.invalidate() },
    };
    const rz = new window.Razorpay(options);
    rz.open();
  }

  return (
    <div className="space-y-8" style={{ fontFamily: 'var(--font-body)' }}>
      <div>
        <h1 className="text-2xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
          {t('billing.title')}
        </h1>
        <p className="mt-1 text-sm text-[#57534E]">{t('billing.subtitle')}</p>
      </div>

      <section className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm space-y-2">
        <p className="text-sm font-semibold text-[#1C1917]">{t('billing.currentPlan')}</p>
        <p className="text-sm text-[#57534E]">
          {currentPlanKey.toUpperCase()} · Notice scans remaining this month:{' '}
          {ent.data?.entitlements.usage.noticeScansRemaining ?? 'Unlimited'}
        </p>
        {sub.data?.subscription?.razorpaySubscriptionId ? (
          <p className="text-xs text-[#78716C]">Razorpay subscription: {sub.data.subscription.razorpaySubscriptionId}</p>
        ) : null}
      </section>

      {rzError ? <p className="text-sm text-red-700">{rzError}</p> : null}
      {create.error ? <p className="text-sm text-red-700">{create.error.message}</p> : null}
      {cancel.error ? <p className="text-sm text-red-700">{cancel.error.message}</p> : null}

      <section className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm space-y-3">
        <p className="text-sm font-semibold text-[#1C1917]">{t('billing.plans')}</p>
        {plans.isPending ? <p className="text-sm text-[#57534E]">Loading…</p> : null}
        {plans.isError ? <p className="text-sm text-red-700">{plans.error.message}</p> : null}
        <div className="grid gap-3 sm:grid-cols-2">
          {planRows
            .filter((p) => p.key !== 'free')
            .map((p) => (
              <div key={p.id} className="rounded-xl border border-[#F5F5F4] p-4">
                <p className="text-sm font-semibold text-[#1C1917]">{p.name}</p>
                <p className="text-sm text-[#57534E]">₹{p.priceInr}/month</p>
                <button
                  type="button"
                  disabled={!rzReady || create.isPending}
                  onClick={() => void startCheckout(p.key as 'pro' | 'plus')}
                  className="mt-3 rounded-xl bg-[#C2410C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#9a3409] disabled:opacity-60"
                >
                  {t('billing.subscribe')}
                </button>
              </div>
            ))}
        </div>

        {sub.data?.subscription?.razorpaySubscriptionId ? (
          <button
            type="button"
            disabled={cancel.isPending}
            onClick={() =>
              void cancel.mutateAsync({
                subscriptionId: sub.data.subscription.razorpaySubscriptionId ?? '',
                cancelAtPeriodEnd: true,
              })
            }
            className="rounded-xl border border-[#E7E5E4] px-4 py-2 text-sm font-semibold text-[#44403C] hover:bg-[#FAFAF9] disabled:opacity-60"
          >
            {t('billing.cancelAtPeriodEnd')}
          </button>
        ) : null}
      </section>

      <section className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm space-y-2">
        <p className="text-sm font-semibold text-[#1C1917]">{t('billing.billingHistory')}</p>
        {history.isPending ? <p className="text-sm text-[#57534E]">Loading…</p> : null}
        {history.isError ? <p className="text-sm text-red-700">{history.error.message}</p> : null}
        <div className="space-y-2">
          {(history.data?.items ?? []).map((i) => (
            <div key={i.id} className="rounded-lg border border-[#F5F5F4] p-3">
              <p className="text-xs text-[#78716C]">{i.type}</p>
              <p className="text-sm text-[#1C1917]">
                {i.amountInr != null ? `₹${i.amountInr}` : '—'} {i.currency ?? ''}
              </p>
            </div>
          ))}
          {history.data && history.data.items.length === 0 ? <p className="text-sm text-[#78716C]">No events yet.</p> : null}
        </div>
      </section>
    </div>
  );
}

