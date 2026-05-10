'use client';

import { useState } from 'react';

import { trpc } from '@jurisly/api-client';

import { ensureWebPushSubscription } from './web-push';

export function NotificationsSettings() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const list = trpc.notifications.listDestinations.useQuery();
  const utils = trpc.useUtils();
  const register = trpc.notifications.registerWebPushSubscription.useMutation({
    onSuccess: async () => {
      await utils.notifications.listDestinations.invalidate();
    },
  });
  const disable = trpc.notifications.disableDestination.useMutation({
    onSuccess: async () => {
      await utils.notifications.listDestinations.invalidate();
    },
  });

  async function onEnableWebPush() {
    setErr(null);
    setBusy(true);
    try {
      const sub = await ensureWebPushSubscription();
      await register.mutateAsync({ subscription: sub, deviceLabel: 'web' });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to enable push.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6" style={{ fontFamily: 'var(--font-body)' }}>
      <div>
        <h1
          className="text-xl font-semibold text-[#1C1917]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Notifications
        </h1>
        <p className="mt-1 text-sm text-[#57534E]">Enable push notifications on this device.</p>
      </div>

      <section className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm">
        <button
          type="button"
          className="rounded-xl bg-[#C2410C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#9a3409] disabled:opacity-60"
          disabled={busy || register.isPending}
          onClick={() => void onEnableWebPush()}
        >
          Enable web push
        </button>
        {err ? <p className="mt-2 text-sm text-red-700">{err}</p> : null}
      </section>

      <section className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-[#1C1917]">Registered devices</h2>
        {list.isPending ? (
          <p className="mt-2 text-sm text-[#57534E]">Loading…</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {list.data?.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3">
                <span className="text-[#44403C]">
                  {d.platform} {d.deviceLabel ? `· ${d.deviceLabel}` : ''}{' '}
                  {d.enabled ? '' : '(disabled)'}
                </span>
                {d.enabled ? (
                  <button
                    type="button"
                    className="text-xs font-semibold text-red-700 hover:underline"
                    disabled={disable.isPending}
                    onClick={() => void disable.mutateAsync({ id: d.id })}
                  >
                    Disable
                  </button>
                ) : null}
              </li>
            ))}
            {list.data && list.data.length === 0 ? (
              <li className="text-[#78716C]">No destinations registered.</li>
            ) : null}
          </ul>
        )}
      </section>
    </div>
  );
}
