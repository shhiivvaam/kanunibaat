'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { trpc } from '@kb/api-client';

export default function DigiLockerCallbackPage() {
  const sp = useSearchParams();
  const code = sp.get('code');
  const state = sp.get('state');
  const error = sp.get('error');
  const [message, setMessage] = useState<string>('Connecting DigiLocker…');

  const exchange = trpc.integrations.digilocker.exchangeCode.useMutation();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (error) {
        if (!cancelled) setMessage(`DigiLocker error: ${error}`);
        return;
      }
      if (!code || !state) {
        if (!cancelled) setMessage('Missing DigiLocker callback parameters.');
        return;
      }
      try {
        await exchange.mutateAsync({ code, state });
        if (!cancelled) setMessage('DigiLocker connected. You can now import documents into your vault.');
      } catch (e) {
        if (!cancelled) setMessage(e instanceof Error ? e.message : 'Failed to connect DigiLocker.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, state, error, exchange]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-16" style={{ fontFamily: 'var(--font-body)' }}>
      <h1 className="text-2xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
        DigiLocker
      </h1>
      <p className="mt-3 text-sm text-[#57534E]">{message}</p>
      <div className="mt-6">
        <Link href="/app/vault" className="text-sm font-medium text-[#C2410C] hover:underline">
          Back to vault
        </Link>
      </div>
    </div>
  );
}

