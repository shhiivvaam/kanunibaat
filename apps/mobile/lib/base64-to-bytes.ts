/**
 * Decodes standard base64 into bytes (DigiLocker payloads, vault helpers).
 */
export function base64ToUint8Array(b64: string): Uint8Array {
  const normalized = b64.replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/');
  const g = globalThis as { atob?: (data: string) => string };
  if (typeof g.atob !== 'function') {
    throw new Error('Base64 decoding is not available.');
  }
  const pad = normalized.length % 4;
  const padded = pad ? normalized + '='.repeat(4 - pad) : normalized;
  const binary = g.atob(padded);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}
