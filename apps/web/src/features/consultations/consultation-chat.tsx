'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';

import { trpc } from '@jurisly/api-client';

export function ConsultationChat({ consultationId }: { consultationId: string }) {
  const [body, setBody] = useState('');
  const [streamingOk, setStreamingOk] = useState(false);

  const list = trpc.consultations.chat.listMessages.useQuery(
    { consultationId, limit: 200 },
    {
      /** Poll only until SSE handshake succeeds (or SSE unavailable). */
      refetchInterval: streamingOk ? false : 2500,
    },
  );

  const invalidateViaSse = useCallback(() => {
    void list.refetch();
  }, [list]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
      return;
    }

    const url = new URL(
      `/api/backend/sse/consultations/${encodeURIComponent(consultationId)}/messages`,
      window.location.origin,
    );

    try {
      const es = new EventSource(url.toString(), { withCredentials: true });
      es.addEventListener('ready', () => {
        setStreamingOk(true);
      });
      es.addEventListener('refresh', () => {
        invalidateViaSse();
      });
      es.onerror = () => {
        setStreamingOk(false);
      };
      return () => {
        es.close();
        setStreamingOk(false);
      };
    } catch {
      queueMicrotask(() => {
        setStreamingOk(false);
      });
    }
  }, [consultationId, invalidateViaSse]);

  const send = trpc.consultations.chat.sendMessage.useMutation({
    onSuccess: async () => {
      setBody('');
      await list.refetch();
    },
  });

  const messages = useMemo(() => list.data ?? [], [list.data]);

  return (
    <section className="rounded-2xl border border-[#E7E5E4] bg-white shadow-sm">
      <div className="border-b border-[#E7E5E4] px-5 py-4">
        <h2
          className="text-sm font-semibold text-[#1C1917]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Chat
        </h2>
        <p className="mt-1 text-xs text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
          {streamingOk
            ? 'Live updates enabled.'
            : 'Connecting… Messages also refresh every few seconds.'}
        </p>
      </div>
      <div className="max-h-[420px] space-y-3 overflow-auto px-5 py-4">
        {list.isPending ? (
          <p className="text-sm text-[#78716C]">Loading…</p>
        ) : list.isError ? (
          <p className="text-sm text-red-700">{list.error.message}</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-[#78716C]">No messages yet.</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="rounded-xl bg-[#FAFAF9] p-3 ring-1 ring-[#E7E5E4]">
              <p
                className="whitespace-pre-wrap text-sm text-[#1C1917]"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {m.body}
              </p>
              <p
                className="mt-1 text-[11px] text-[#A8A29E]"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {new Date(m.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
      <form
        className="flex gap-2 border-t border-[#E7E5E4] px-5 py-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!body.trim()) return;
          send.mutate({ consultationId, body: body.trim() });
        }}
      >
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded-xl border border-[#E7E5E4] bg-white px-3 py-2 text-sm text-[#1C1917] outline-none focus:ring-2 focus:ring-[#FDBA74]"
          style={{ fontFamily: 'var(--font-body)' }}
        />
        <button
          type="submit"
          disabled={send.isPending}
          className="rounded-xl bg-[#C2410C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#9A3412] disabled:opacity-60"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          Send
        </button>
      </form>
    </section>
  );
}
