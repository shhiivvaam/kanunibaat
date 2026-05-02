'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { trpc } from '@jurisly/api-client';
import { decryptVaultPayload } from '@jurisly/vault-crypto';

export function VaultDetail() {
  const params = useParams();
  const documentId = typeof params.documentId === 'string' ? params.documentId : '';

  const list = trpc.vault.document.list.useQuery(undefined, { enabled: Boolean(documentId) });
  const presign = trpc.vault.document.presignDownload.useMutation();
  const summarize = trpc.vault.document.summarize.useMutation();
  const createShare = trpc.vault.share.create.useMutation();
  const revokeShare = trpc.vault.share.revoke.useMutation();
  const shares = trpc.vault.share.list.useQuery(
    documentId ? { documentId } : (undefined as never),
    { enabled: Boolean(documentId) },
  );
  const utils = trpc.useUtils();

  const doc = list.data?.documents.find((d) => d.id === documentId);
  const [passphrase, setPassphrase] = useState('');
  const [summary, setSummary] = useState<string | null>(null);
  const [shareExpires, setShareExpires] = useState('');
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSummary(null);
  }, [documentId]);

  async function onDownload() {
    setError(null);
    if (!doc || doc.uploadStatus !== 'complete' || !doc.wrappedDek || !doc.keyWrapSalt) {
      setError('Document is not ready to download.');
      return;
    }
    if (!passphrase.trim()) {
      setError('Enter your vault passphrase to decrypt.');
      return;
    }
    try {
      const { downloadUrl } = await presign.mutateAsync({ documentId });
      const res = await fetch(downloadUrl);
      if (!res.ok) throw new Error(`Download failed (${res.status}).`);
      const buf = new Uint8Array(await res.arrayBuffer());
      const plain = await decryptVaultPayload(buf, passphrase, doc.wrappedDek, doc.keyWrapSalt);
      const copy = new Uint8Array(plain.byteLength);
      copy.set(plain);
      const blob = new Blob([copy], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.displayName || 'vault-document';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Download failed.');
    }
  }

  async function onSummarize() {
    setError(null);
    setSummary(null);
    if (!doc || doc.uploadStatus !== 'complete' || !doc.wrappedDek || !doc.keyWrapSalt) {
      setError('Document is not ready.');
      return;
    }
    if (!passphrase.trim()) {
      setError('Enter passphrase to decrypt for summary.');
      return;
    }
    try {
      const { downloadUrl } = await presign.mutateAsync({ documentId });
      const res = await fetch(downloadUrl);
      if (!res.ok) throw new Error(`Download failed (${res.status}).`);
      const buf = new Uint8Array(await res.arrayBuffer());
      const plain = await decryptVaultPayload(buf, passphrase, doc.wrappedDek, doc.keyWrapSalt);
      const text = new TextDecoder('utf-8', { fatal: false }).decode(plain).slice(0, 16_000);
      const out = await summarize.mutateAsync({ plaintext: text || '(binary)', locale: 'en' });
      setSummary(out.summary + '\n\n' + out.bullets.map((b) => `• ${b}`).join('\n'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Summary failed.');
    }
  }

  async function onCreateShare() {
    setShareMessage(null);
    if (!shareExpires) {
      setShareMessage('Pick a share expiry date.');
      return;
    }
    const exp = new Date(shareExpires);
    if (Number.isNaN(exp.getTime()) || exp.getTime() <= Date.now()) {
      setShareMessage('Share expiry must be in the future.');
      return;
    }
    try {
      const out = await createShare.mutateAsync({ documentId, expiresAt: exp });
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const link = `${origin}${out.webPath}`;
      setShareMessage(`Share link (send passphrase separately): ${link}`);
      await utils.vault.share.list.invalidate({ documentId });
    } catch (e) {
      setShareMessage(e instanceof Error ? e.message : 'Share failed.');
    }
  }

  async function onRevoke(shareId: string) {
    await revokeShare.mutateAsync({ shareId });
    await utils.vault.share.list.invalidate({ documentId });
  }

  if (list.isPending || !documentId) {
    return <p className="text-sm text-[#57534E]">Loading…</p>;
  }
  if (!doc) {
    return (
      <p className="text-sm text-red-700">
        Document not found. <Link href="/app/vault">Back to vault</Link>
      </p>
    );
  }

  return (
    <div className="space-y-6" style={{ fontFamily: 'var(--font-body)' }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1
            className="text-xl font-semibold text-[#1C1917]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {doc.displayName}
          </h1>
          <p className="mt-1 text-xs text-[#78716C]">
            {doc.category} · {doc.uploadStatus}
            {doc.expiresAt ? ` · Expires ${doc.expiresAt.toLocaleString()}` : ''}
          </p>
        </div>
        <Link href="/app/vault" className="text-sm text-[#C2410C] hover:underline">
          Back
        </Link>
      </div>

      <label className="block max-w-md text-sm">
        <span className="font-medium text-[#44403C]">Vault passphrase</span>
        <input
          type="password"
          className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          autoComplete="off"
        />
      </label>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void onDownload()}
          disabled={presign.isPending || doc.uploadStatus !== 'complete'}
          className="rounded-xl border border-[#D6D3D1] bg-white px-4 py-2 text-sm font-semibold text-[#44403C] hover:bg-[#FAFAF9] disabled:opacity-50"
        >
          Download decrypted
        </button>
        <button
          type="button"
          onClick={() => void onSummarize()}
          disabled={summarize.isPending || doc.uploadStatus !== 'complete'}
          className="rounded-xl bg-[#C2410C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#9a3409] disabled:opacity-50"
        >
          AI summary (ephemeral)
        </button>
      </div>

      {summary ? (
        <section className="rounded-xl border border-[#E7E5E4] bg-white p-4 text-sm text-[#44403C] shadow-sm">
          <h2 className="font-semibold text-[#1C1917]">Summary</h2>
          <p className="mt-2 whitespace-pre-wrap">{summary}</p>
        </section>
      ) : null}

      <section className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-[#1C1917]">Share with lawyer</h2>
        <p className="mt-2 text-xs text-[#78716C]">
          Creates a time-limited download link for the ciphertext. Share your passphrase through a
          separate channel.
        </p>
        <label className="mt-3 block text-sm">
          <span className="font-medium text-[#44403C]">Share expires</span>
          <input
            type="datetime-local"
            className="mt-1 w-full max-w-xs rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
            value={shareExpires}
            onChange={(e) => setShareExpires(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="mt-3 rounded-xl bg-[#1C1917] px-4 py-2 text-sm font-semibold text-white hover:bg-[#292524]"
          onClick={() => void onCreateShare()}
          disabled={createShare.isPending}
        >
          Create link
        </button>
        {shareMessage ? (
          <p className="mt-2 text-xs text-[#57534E] break-all">{shareMessage}</p>
        ) : null}

        <ul className="mt-4 space-y-2 text-sm">
          {(shares.data?.shares ?? []).map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-2 border-t border-[#E7E5E4] pt-2"
            >
              <span className="text-xs text-[#78716C]">
                token …{s.accessToken.slice(0, 8)} · expires {s.expiresAt.toLocaleString()}
                {s.revokedAt ? ' · revoked' : ''}
              </span>
              {!s.revokedAt ? (
                <button
                  type="button"
                  className="text-xs font-medium text-red-700 hover:underline"
                  onClick={() => void onRevoke(s.id)}
                >
                  Revoke
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
