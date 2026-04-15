import Link from 'next/link';

import { createServerTrpc } from '@/lib/server-trpc';

type Props = { params: Promise<{ scanId: string }>; searchParams: Promise<{ t?: string }> };

export default async function NoticeScannerResultPage(props: Props) {
  const { scanId } = await props.params;
  const { t } = await props.searchParams;
  if (!t) {
    return (
      <div className="mx-auto max-w-[900px] px-6 py-16">
        <p className="text-sm text-red-700">Missing access token.</p>
        <Link href="/notice-scanner" className="mt-4 inline-block text-sm font-semibold text-[#C2410C] hover:underline">
          Back
        </Link>
      </div>
    );
  }

  const trpc = await createServerTrpc();
  const res = await trpc.notices.get.query({ scanId, accessToken: t });
  const scan = res.scan;

  return (
    <div className="mx-auto max-w-[900px] px-6 py-16" style={{ fontFamily: 'var(--font-body)' }}>
      <h1 className="text-2xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
        Notice scan result
      </h1>
      {!scan ? (
        <p className="mt-4 text-sm text-[#78716C]">Not found.</p>
      ) : (
        <div className="mt-6 rounded-2xl border border-[#E7E5E4] bg-white p-6 shadow-sm">
          <p className="text-xs text-[#78716C]">Status: {scan.status}</p>
          {scan.failureReason ? <p className="mt-2 text-sm text-red-700">{scan.failureReason}</p> : null}
          {scan.aiSummary ? <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[#44403C]">{scan.aiSummary}</p> : null}
          {Array.isArray(scan.recommendedActions) && scan.recommendedActions.length > 0 ? (
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-[#44403C]">
              {scan.recommendedActions.map((a: string) => (
                <li key={a}>{a}</li>
              ))}
            </ol>
          ) : null}
        </div>
      )}
      <Link href="/notice-scanner" className="mt-6 inline-block text-sm font-semibold text-[#C2410C] hover:underline">
        Scan another notice
      </Link>
    </div>
  );
}

