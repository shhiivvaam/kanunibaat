'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { trpc } from '@kb/api-client';
import { decryptVaultPayload } from '@kb/vault-crypto';

function readPassphraseFromHash(): string {
  if (typeof window === 'undefined') return '';
  const h = window.location.hash.replace(/^#/, '');
  if (!h.startsWith('k=')) return '';
  try {
    return decodeURIComponent(h.slice(2));
  } catch {
    return '';
  }
}

export function VaultSharedViewer() {
  const params = useParams();
  const token = typeof params.token === 'string' ? params.token : '';

  const q = trpc.vault.share.get.useQuery(token ? { token } : (undefined as never), {
    enabled: Boolean(token),
    retry: false,
  });

  const [passphrase, setPassphrase] = useState('');
  const [decryptedNote, setDecryptedNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fromHash = readPassphraseFromHash();
    if (fromHash) setPassphrase(fromHash);
  }, [token]);

  async function onDecryptPreview() {
    setError(null);
    setDecryptedNote(null);
    if (!q.data || !passphrase.trim()) {
      setError('Enter the passphrase the owner shared with you.');
      return;
    }
    try {
      const res = await fetch(q.data.downloadUrl);
      if (!res.ok) throw new Error(`Download failed (${res.status}).`);
      const buf = new Uint8Array(await res.arrayBuffer());
      const plain = await decryptVaultPayload(
        buf,
        passphrase,
        q.data.wrappedDek,
        q.data.keyWrapSalt,
      );
      const preview = new TextDecoder('utf-8', { fatal: false }).decode(plain).slice(0, 4000);
      setDecryptedNote(preview || '(No UTF-8 preview; download decrypted blob below.)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Decryption failed.');
    }
  }

  async function onDownloadDecrypted() {
    setError(null);
    if (!q.data || !passphrase.trim()) {
      setError('Enter the passphrase the owner shared with you.');
      return;
    }
    try {
      const res = await fetch(q.data.downloadUrl);
      if (!res.ok) throw new Error(`Download failed (${res.status}).`);
      const buf = new Uint8Array(await res.arrayBuffer());
      const plain = await decryptVaultPayload(
        buf,
        passphrase,
        q.data.wrappedDek,
        q.data.keyWrapSalt,
      );
      const copy = new Uint8Array(plain.byteLength);
      copy.set(plain);
      const blob = new Blob([copy], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = q.data.displayName || 'shared-vault-document';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Decryption failed.');
    }
  }

  if (!token) {
    return <p className="text-sm text-red-700">Invalid link.</p>;
  }
  if (q.isPending) {
    return <p className="text-sm text-[#57534E]">Loading shared document…</p>;
  }
  if (q.error || !q.data) {
    return (
      <p className="text-sm text-red-700">
        {q.error?.message ?? 'This share link is not available.'}
      </p>
    );
  }

  const d = q.data;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10" style={{ fontFamily: 'var(--font-body)' }}>
      <h1 className="text-xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
        Shared vault document
      </h1>
      <p className="text-sm text-[#57534E]">
        <span className="font-medium text-[#44403C]">{d.displayName}</span> · {d.category} ·{' '}
        {Math.round(d.byteSize / 1024)} KB ciphertext
      </p>
      <p className="text-xs text-[#78716C]">
        Share expires {d.shareExpiresAt.toLocaleString()}
        {d.documentExpiresAt ? ` · Document expiry ${d.documentExpiresAt.toLocaleString()}` : ''}
      </p>
      <p className="text-xs text-[#78716C]">
        Optional: owner can append <code className="rounded bg-[#F5F5F4] px-1">#k=</code> with a URL-encoded
        passphrase (fragment is not sent to the server).
      </p>

      <label className="block text-sm">
        <span className="font-medium text-[#44403C]">Vault passphrase (from owner)</span>
        <input
          type="password"
          className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
        />
      </label>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void onDecryptPreview()}
          className="rounded-xl border border-[#D6D3D1] bg-white px-4 py-2 text-sm font-semibold text-[#44403C]"
        >
          Preview as text
        </button>
        <button
          type="button"
          onClick={() => void onDownloadDecrypted()}
          className="rounded-xl bg-[#C2410C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#9a3409]"
        >
          Download decrypted
        </button>
      </div>

      {decryptedNote ? (
        <section className="rounded-xl border border-[#E7E5E4] bg-white p-4 text-sm text-[#44403C] shadow-sm">
          <h2 className="font-semibold text-[#1C1917]">Preview</h2>
          <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap">{decryptedNote}</pre>
        </section>
      ) : null}
    </div>
  );
}
