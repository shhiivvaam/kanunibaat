'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { trpc } from '@jurisly/api-client';
import { MAX_VAULT_OBJECT_BYTES } from '@jurisly/storage';
import { encryptVaultPayload } from '@jurisly/vault-crypto';

const CATEGORIES = [
  'property',
  'family',
  'financial',
  'wills',
  'employment',
  'court',
  'identity',
  'rental',
  'business',
  'insurance',
  'other',
] as const;

export function VaultUpload() {
  const folders = trpc.vault.folder.list.useQuery();
  const requestUpload = trpc.vault.document.requestUpload.useMutation();
  const confirmUpload = trpc.vault.document.confirmUpload.useMutation();
  const utils = trpc.useUtils();

  const [file, setFile] = useState<File | null>(null);
  const [passphrase, setPassphrase] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('other');
  const [tagsRaw, setTagsRaw] = useState('');
  const [folderId, setFolderId] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const tagList = useMemo(
    () =>
      tagsRaw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 24),
    [tagsRaw],
  );

  async function onSubmit() {
    setError(null);
    if (!file || !passphrase.trim()) {
      setError('Choose a file and enter a vault passphrase.');
      return;
    }
    if (!displayName.trim()) {
      setError('Enter a display name.');
      return;
    }
    setBusy(true);
    try {
      const plain = new Uint8Array(await file.arrayBuffer());
      const { ciphertext, wrappedDekBase64, keyWrapSaltBase64 } = await encryptVaultPayload(
        plain,
        passphrase,
      );
      if (ciphertext.byteLength > MAX_VAULT_OBJECT_BYTES) {
        throw new Error(`Encrypted file exceeds ${MAX_VAULT_OBJECT_BYTES} bytes.`);
      }

      const exp = expiresAt ? new Date(expiresAt) : null;
      const requested = await requestUpload.mutateAsync({
        displayName: displayName.trim(),
        folderId: folderId || null,
        category,
        tags: tagList,
        expiresAt: exp && !Number.isNaN(exp.getTime()) ? exp : null,
        byteSize: ciphertext.byteLength,
        contentType: file.type || 'application/octet-stream',
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

      await utils.vault.document.list.invalidate();
      window.location.href = `/app/vault/${requested.documentId}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6" style={{ fontFamily: 'var(--font-body)' }}>
      <div className="flex items-center justify-between gap-4">
        <h1
          className="text-xl font-semibold text-[#1C1917]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Upload to vault
        </h1>
        <Link href="/app/vault" className="text-sm text-[#C2410C] hover:underline">
          Back
        </Link>
      </div>

      <p className="text-sm text-[#57534E]">
        Files are encrypted in your browser before upload. Your passphrase is never sent to the
        server. If you lose it, your documents cannot be recovered.
      </p>

      <div className="space-y-4 rounded-xl border border-[#E7E5E4] bg-white p-6 shadow-sm">
        <label className="block text-sm">
          <span className="font-medium text-[#44403C]">Display name</span>
          <input
            className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-[#44403C]">Folder (optional)</span>
          <select
            className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
          >
            <option value="">— None —</option>
            {(folders.data?.folders ?? []).map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-medium text-[#44403C]">Category</span>
          <select
            className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number])}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-medium text-[#44403C]">Tags (comma-separated)</span>
          <input
            className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
            value={tagsRaw}
            onChange={(e) => setTagsRaw(e.target.value)}
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-[#44403C]">Expiry (optional)</span>
          <input
            type="datetime-local"
            className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-[#44403C]">File</span>
          <input
            className="mt-1 block w-full text-sm"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-[#44403C]">Vault passphrase</span>
          <input
            type="password"
            className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            autoComplete="new-password"
          />
        </label>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        <button
          type="button"
          disabled={busy}
          onClick={() => void onSubmit()}
          className="rounded-xl bg-[#C2410C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#9a3409] disabled:opacity-50"
        >
          {busy ? 'Encrypting & uploading…' : 'Encrypt and upload'}
        </button>
      </div>
    </div>
  );
}
