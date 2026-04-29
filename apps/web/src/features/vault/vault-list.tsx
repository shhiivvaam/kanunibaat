'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { trpc } from '@kb/api-client';
import { MAX_VAULT_OBJECT_BYTES } from '@kb/storage';
import { encryptVaultPayload } from '@kb/vault-crypto';

export function VaultList() {
  const q = trpc.vault.document.list.useQuery(undefined, { staleTime: 10_000 });
  const dlStatus = trpc.integrations.digilocker.status.useQuery();
  const dlGetAuth = trpc.integrations.digilocker.getAuthUrl.useMutation();
  const dlList = trpc.integrations.digilocker.listDocuments.useQuery(undefined, {
    enabled: dlStatus.data?.enabled === true && dlStatus.data?.connected === true,
  });
  const dlDownload = trpc.integrations.digilocker.downloadBase64.useMutation();
  const dlLink = trpc.integrations.digilocker.linkVaultDocument.useMutation();
  const requestUpload = trpc.vault.document.requestUpload.useMutation();
  const confirmUpload = trpc.vault.document.confirmUpload.useMutation();
  const utils = trpc.useUtils();

  const [dlSelectedUri, setDlSelectedUri] = useState<string>('');
  const [dlDisplayName, setDlDisplayName] = useState<string>('');
  const [dlPassphrase, setDlPassphrase] = useState<string>('');
  const [dlError, setDlError] = useState<string | null>(null);
  const [dlBusy, setDlBusy] = useState<boolean>(false);

  const dlPreviewItems = useMemo(() => (dlList.data?.items ?? []).slice(0, 8), [dlList.data?.items]);

  if (q.isPending) {
    return <p className="text-sm text-[#57534E]">Loading vault…</p>;
  }
  if (q.error) {
    return <p className="text-sm text-red-700">{q.error.message}</p>;
  }

  const { documents, usage } = q.data;
  const maxBytes = usage.maxTotalBytes ?? usage.totalBytes;
  const usagePct =
    usage.maxTotalBytes == null
      ? 0
      : Math.min(100, Math.round((usage.totalBytes / maxBytes) * 100));

  const expiringBanner = documents.some((d) => d.expiringSoon);

  async function onConnectDigiLocker() {
    setDlError(null);
    try {
      const out = await dlGetAuth.mutateAsync();
      window.location.href = out.url;
    } catch (e) {
      setDlError(e instanceof Error ? e.message : 'Failed to start DigiLocker connection.');
    }
  }

  async function onImportSelected() {
    setDlError(null);
    if (!dlSelectedUri) {
      setDlError('Pick a DigiLocker document.');
      return;
    }
    if (!dlDisplayName.trim()) {
      setDlError('Enter a display name.');
      return;
    }
    if (!dlPassphrase.trim()) {
      setDlError('Enter your vault passphrase (never sent to server).');
      return;
    }

    setDlBusy(true);
    try {
      const dl = await dlDownload.mutateAsync({ uri: dlSelectedUri });
      const bytes = Uint8Array.from(atob(dl.base64), (c) => c.charCodeAt(0));

      const { ciphertext, wrappedDekBase64, keyWrapSaltBase64 } = await encryptVaultPayload(bytes, dlPassphrase);
      if (ciphertext.byteLength > MAX_VAULT_OBJECT_BYTES) {
        throw new Error(`Encrypted file exceeds ${MAX_VAULT_OBJECT_BYTES} bytes.`);
      }

      const requested = await requestUpload.mutateAsync({
        displayName: dlDisplayName.trim(),
        folderId: null,
        category: 'identity',
        tags: ['digilocker'],
        expiresAt: null,
        byteSize: ciphertext.byteLength,
      });

      const body = new Uint8Array(ciphertext.byteLength);
      body.set(ciphertext);
      const put = await fetch(requested.uploadUrl, {
        method: 'PUT',
        body: body as unknown as BodyInit,
        headers: { 'Content-Type': 'application/octet-stream' },
      });
      if (!put.ok) throw new Error(`Upload failed (${put.status}).`);

      await confirmUpload.mutateAsync({
        documentId: requested.documentId,
        wrappedDek: wrappedDekBase64,
        keyWrapSalt: keyWrapSaltBase64,
        byteSize: ciphertext.byteLength,
      });

      await dlLink.mutateAsync({ docId: dlSelectedUri, vaultDocumentId: requested.documentId });
      await utils.vault.document.list.invalidate();
      window.location.href = `/app/vault/${requested.documentId}`;
    } catch (e) {
      setDlError(e instanceof Error ? e.message : 'Import failed.');
    } finally {
      setDlBusy(false);
    }
  }

  return (
    <div className="space-y-6" style={{ fontFamily: 'var(--font-body)' }}>
      <div>
        <h1 className="text-xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
          Document vault
        </h1>
        <p className="mt-2 text-sm text-[#57534E]">
          Client-encrypted storage for sensitive documents. Free tier: {usage.maxDocuments} documents,{' '}
          {usage.maxTotalBytes == null ? 'unlimited' : `${Math.round(usage.maxTotalBytes / (1024 * 1024))} MB`} total.
        </p>
      </div>

      {expiringBanner ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Some documents expire within 30 days. Review expiry dates below.
        </div>
      ) : null}

      <div className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-[#44403C]">Storage used</span>
          <span className="text-[#78716C]">
            {usage.completeCount} / {usage.maxDocuments} docs · {Math.round(usage.totalBytes / 1024)} KB /{' '}
            {usage.maxTotalBytes == null ? 'unlimited' : `${Math.round(usage.maxTotalBytes / (1024 * 1024))} MB`}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E7E5E4]">
          <div className="h-full rounded-full bg-[#C2410C]" style={{ width: `${usagePct}%` }} />
        </div>
      </div>

      <div className="flex justify-end">
        <Link
          href="/app/vault/upload"
          className="rounded-xl bg-[#C2410C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#9a3409]"
        >
          Upload document
        </Link>
      </div>

      <section className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#1C1917]">DigiLocker</p>
            <p className="mt-1 text-xs text-[#78716C]">
              Import documents from DigiLocker. Files are still encrypted in your browser before upload.
            </p>
          </div>
          {dlStatus.data?.enabled ? (
            dlStatus.data?.connected ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                Connected
              </span>
            ) : (
              <button
                type="button"
                className="rounded-xl bg-[#1C1917] px-4 py-2 text-sm font-semibold text-white hover:bg-[#292524]"
                onClick={() => void onConnectDigiLocker()}
                disabled={dlGetAuth.isPending}
              >
                Connect
              </button>
            )
          ) : (
            <span className="text-xs text-[#78716C]">Not enabled</span>
          )}
        </div>

        {dlError ? <p className="mt-3 text-sm text-red-700">{dlError}</p> : null}

        {dlStatus.data?.enabled && dlStatus.data?.connected ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#44403C]">Documents</p>
              {dlList.isPending ? <p className="text-xs text-[#78716C]">Loading…</p> : null}
              {dlList.error ? <p className="text-xs text-red-700">{dlList.error.message}</p> : null}
              <select
                className="w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
                value={dlSelectedUri}
                onChange={(e) => setDlSelectedUri(e.target.value)}
              >
                <option value="">— Pick a document —</option>
                {dlPreviewItems.map((i) => (
                  <option key={i.uri ?? i.id ?? Math.random()} value={i.uri ?? ''}>
                    {(i.name ?? i.id ?? 'Document') + (i.type ? ` · ${i.type}` : '')}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-[#78716C]">For now, imports are limited to ~2MB per document.</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#44403C]">Import to vault</p>
              <label className="block text-sm">
                <span className="text-xs font-medium text-[#44403C]">Display name</span>
                <input
                  className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
                  value={dlDisplayName}
                  onChange={(e) => setDlDisplayName(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="text-xs font-medium text-[#44403C]">Vault passphrase</span>
                <input
                  type="password"
                  className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
                  value={dlPassphrase}
                  onChange={(e) => setDlPassphrase(e.target.value)}
                  autoComplete="off"
                />
              </label>
              <button
                type="button"
                className="rounded-xl bg-[#C2410C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#9a3409] disabled:opacity-50"
                disabled={dlBusy}
                onClick={() => void onImportSelected()}
              >
                {dlBusy ? 'Importing…' : 'Encrypt and import'}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {documents.length === 0 ? (
        <p className="text-sm text-[#57534E]">No documents yet.</p>
      ) : (
        <ul className="divide-y divide-[#E7E5E4] rounded-xl border border-[#E7E5E4] bg-white shadow-sm">
          {documents.map((d) => (
            <li key={d.id}>
              <Link
                href={`/app/vault/${d.id}`}
                className="flex flex-col gap-1 px-4 py-3 text-sm hover:bg-[#FAFAF9]"
              >
                <span className="font-medium text-[#1C1917]">{d.displayName}</span>
                <span className="text-xs text-[#78716C]">
                  {d.category} · {d.uploadStatus === 'complete' ? 'Ready' : 'Upload pending'}
                  {d.expiresAt ? ` · Expires ${new Date(d.expiresAt).toLocaleDateString()}` : ''}
                  {d.expiringSoon ? ' · Expiring soon' : ''}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
