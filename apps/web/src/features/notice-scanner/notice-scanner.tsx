'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { trpc } from '@kb/api-client';

type ScanState =
  | { kind: 'idle' }
  | { kind: 'uploading'; scanId: string; accessToken: string }
  | { kind: 'processing'; scanId: string; accessToken: string }
  | { kind: 'done'; scanId: string; accessToken: string }
  | { kind: 'error'; message: string };

export function NoticeScanner() {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<ScanState>({ kind: 'idle' });

  const requestUpload = trpc.notices.requestUpload.useMutation();
  const confirmUpload = trpc.notices.confirmUpload.useMutation();
  const processScan = trpc.notices.process.useMutation();

  const scanId = 'scanId' in state ? state.scanId : null;
  const accessToken = 'accessToken' in state ? state.accessToken : null;

  const scanQuery = trpc.notices.get.useQuery(
    scanId && accessToken ? { scanId, accessToken } : (undefined as never),
    { enabled: Boolean(scanId && accessToken), refetchInterval: state.kind === 'processing' ? 1500 : false },
  );

  const shareUrl = useMemo(() => {
    if (!scanId || !accessToken) return null;
    return `/notice-scanner/result/${scanId}?t=${accessToken}`;
  }, [scanId, accessToken]);

  async function onRun() {
    if (!file) return;
    try {
      setState({ kind: 'idle' });
      const requested = await requestUpload.mutateAsync({
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        byteSize: file.size,
        locale: 'en',
      });
      setState({ kind: 'uploading', scanId: requested.scanId, accessToken: requested.accessToken });

      const put = await fetch(requested.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      });
      if (!put.ok) throw new Error(`Upload failed (${put.status}).`);

      await confirmUpload.mutateAsync({ scanId: requested.scanId, accessToken: requested.accessToken });
      setState({ kind: 'processing', scanId: requested.scanId, accessToken: requested.accessToken });

      await processScan.mutateAsync({ scanId: requested.scanId, accessToken: requested.accessToken });
      setState({ kind: 'done', scanId: requested.scanId, accessToken: requested.accessToken });
    } catch (e) {
      setState({ kind: 'error', message: e instanceof Error ? e.message : 'Something went wrong.' });
    }
  }

  const scan = scanQuery.data?.scan ?? null;

  return (
    <div className="space-y-8" style={{ fontFamily: 'var(--font-body)' }}>
      <section className="rounded-2xl border border-[#E7E5E4] bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-[#1C1917]">Upload a notice</h2>
        <p className="mt-2 text-sm text-[#57534E]">
          Upload a PDF or photo. We’ll extract text (OCR) and generate a plain-language explanation. This is general
          information, not legal advice.
        </p>
        <input
          className="mt-4 block w-full text-sm"
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => void onRun()}
          disabled={!file || requestUpload.isPending || confirmUpload.isPending || processScan.isPending}
          className="mt-4 rounded-xl bg-[#C2410C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#9a3409] disabled:opacity-50"
        >
          {state.kind === 'processing' ? 'Processing…' : 'Scan notice'}
        </button>

        {state.kind === 'error' ? <p className="mt-3 text-sm text-red-700">{state.message}</p> : null}
        {requestUpload.error ? <p className="mt-3 text-sm text-red-700">{requestUpload.error.message}</p> : null}
      </section>

      {scan ? (
        <section className="rounded-2xl border border-[#E7E5E4] bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-[#1C1917]">Result</h2>
          <p className="mt-2 text-xs text-[#78716C]">Status: {scan.status}</p>
          {scan.failureReason ? <p className="mt-2 text-sm text-red-700">{scan.failureReason}</p> : null}
          {scan.aiSummary ? (
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[#44403C]">{scan.aiSummary}</p>
          ) : null}
          {Array.isArray(scan.recommendedActions) && scan.recommendedActions.length > 0 ? (
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-[#44403C]">
              {scan.recommendedActions.map((a: string) => (
                <li key={a}>{a}</li>
              ))}
            </ol>
          ) : null}
          {shareUrl ? (
            <p className="mt-5 text-sm">
              Share link:{' '}
              <Link href={shareUrl} className="font-semibold text-[#C2410C] hover:underline">
                {shareUrl}
              </Link>
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

