'use client';

import { useMemo, useState } from 'react';

import { trpc } from '@jurisly/api-client';
import { MAX_VAULT_OBJECT_BYTES } from '@jurisly/storage';
import { encryptVaultPayload } from '@jurisly/vault-crypto';

export function DigiLockerCard() {
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

  const dlPreviewItems = useMemo(
    () => (dlList.data?.items ?? []).slice(0, 8),
    [dlList.data?.items],
  );

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

      const { ciphertext, wrappedDekBase64, keyWrapSaltBase64 } = await encryptVaultPayload(
        bytes,
        dlPassphrase,
      );
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
        contentType: 'application/pdf',
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
    <section className="rounded-xl border border-[#E7E5E4] bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3
              className="text-lg font-semibold text-[#1C1917]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              DigiLocker
            </h3>
            {dlStatus.data?.enabled && dlStatus.data?.connected ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                Connected
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-[#57534E]">
            Import identity documents from DigiLocker directly into your encrypted vault. All
            documents are encrypted in your browser before upload.
          </p>
        </div>
        {dlStatus.data?.enabled && !dlStatus.data?.connected ? (
          <button
            type="button"
            className="rounded-xl bg-[#C2410C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#9a3409] disabled:opacity-50"
            onClick={() => void onConnectDigiLocker()}
            disabled={dlGetAuth.isPending}
          >
            {dlGetAuth.isPending ? 'Connecting…' : 'Connect'}
          </button>
        ) : null}
      </div>

      {!dlStatus.data?.enabled ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          DigiLocker integration is not enabled. Contact support to enable this feature.
        </div>
      ) : null}

      {dlError ? <p className="mt-4 text-sm text-red-700">{dlError}</p> : null}

      {dlStatus.data?.enabled && dlStatus.data?.connected ? (
        <div className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block">
                <span className="text-sm font-semibold text-[#1C1917]">Select document</span>
                {dlList.isPending ? (
                  <p className="mt-1 text-xs text-[#78716C]">Loading documents…</p>
                ) : null}
                {dlList.error ? (
                  <p className="mt-1 text-xs text-red-700">{dlList.error.message}</p>
                ) : null}
                <select
                  className="mt-2 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm focus:border-[#C2410C] focus:outline-none focus:ring-2 focus:ring-[#C2410C]/20"
                  value={dlSelectedUri}
                  onChange={(e) => setDlSelectedUri(e.target.value)}
                  disabled={dlList.isPending}
                >
                  <option value="">— Choose a document —</option>
                  {dlPreviewItems.map((i) => (
                    <option key={i.uri ?? i.id ?? Math.random()} value={i.uri ?? ''}>
                      {(i.name ?? i.id ?? 'Document') + (i.type ? ` · ${i.type}` : '')}
                    </option>
                  ))}
                </select>
              </label>
              <p className="text-xs text-[#78716C]">Import limit: 2MB per document</p>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-semibold text-[#1C1917]">Display name</span>
                <input
                  className="mt-2 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm focus:border-[#C2410C] focus:outline-none focus:ring-2 focus:ring-[#C2410C]/20"
                  value={dlDisplayName}
                  onChange={(e) => setDlDisplayName(e.target.value)}
                  placeholder="My Aadhaar Card"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-[#1C1917]">Vault passphrase</span>
                <input
                  type="password"
                  className="mt-2 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm focus:border-[#C2410C] focus:outline-none focus:ring-2 focus:ring-[#C2410C]/20"
                  value={dlPassphrase}
                  onChange={(e) => setDlPassphrase(e.target.value)}
                  placeholder="Your vault passphrase"
                  autoComplete="off"
                />
              </label>
              <button
                type="button"
                className="w-full rounded-xl bg-[#C2410C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#9a3409] disabled:opacity-50"
                disabled={dlBusy}
                onClick={() => void onImportSelected()}
              >
                {dlBusy ? 'Importing…' : 'Encrypt and import to vault'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
