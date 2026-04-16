/**
 * Client-side vault encryption (AES-GCM file payload + passphrase-wrapped DEK).
 * Requires Web Crypto (`globalThis.crypto.subtle`).
 */

export const VAULT_FILE_FORMAT_VERSION = 1 as const;

/** PBKDF2 iterations for passphrase → wrapping key (AES-256-GCM key wrap). */
export const VAULT_PBKDF2_ITERATIONS = 100_000;

const FILE_IV_LENGTH = 12;
const WRAP_IV_LENGTH = 12;
const GCM_TAG_LENGTH = 16;
const DEK_LENGTH = 32;
const SALT_LENGTH = 16;

function requireSubtle(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('Web Crypto (crypto.subtle) is not available in this environment.');
  }
  return subtle;
}

/** Normalizes typed arrays for TS 5.9 DOM lib + Web Crypto `BufferSource` expectations. */
function asBufferSource(data: Uint8Array): BufferSource {
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

function randomBytes(length: number): Uint8Array {
  const out = new Uint8Array(length);
  globalThis.crypto.getRandomValues(out);
  return out;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return globalThis.btoa(binary);
}

export function base64ToBytes(b64: string): Uint8Array {
  const binary = globalThis.atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

async function importPassphraseKeyMaterial(passphrase: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return requireSubtle().importKey('raw', asBufferSource(enc.encode(passphrase)), 'PBKDF2', false, ['deriveKey']);
}

async function deriveWrappingKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const material = await importPassphraseKeyMaterial(passphrase);
  return requireSubtle().deriveKey(
    {
      name: 'PBKDF2',
      salt: asBufferSource(salt),
      iterations: VAULT_PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function importDek(dek: Uint8Array): Promise<CryptoKey> {
  return requireSubtle().importKey('raw', asBufferSource(dek), { name: 'AES-GCM', length: 256 }, false, [
    'encrypt',
    'decrypt',
  ]);
}

export interface VaultEncryptResult {
  ciphertext: Uint8Array;
  wrappedDekBase64: string;
  keyWrapSaltBase64: string;
}

/**
 * Encrypts plaintext with a random DEK; wraps the DEK with a key derived from `passphrase`.
 * Wire format: `[version:1][iv:12][ciphertext+tag]`.
 */
export async function encryptVaultPayload(
  plaintext: Uint8Array,
  passphrase: string,
): Promise<VaultEncryptResult> {
  const subtle = requireSubtle();
  const dek = randomBytes(DEK_LENGTH);
  const dekKey = await importDek(dek);
  const fileIv = randomBytes(FILE_IV_LENGTH);
  const fileCipher = new Uint8Array(
    await subtle.encrypt({ name: 'AES-GCM', iv: asBufferSource(fileIv) }, dekKey, asBufferSource(plaintext)),
  );

  const version = new Uint8Array([VAULT_FILE_FORMAT_VERSION]);
  const ciphertext = new Uint8Array(1 + FILE_IV_LENGTH + fileCipher.length);
  ciphertext.set(version, 0);
  ciphertext.set(fileIv, 1);
  ciphertext.set(fileCipher, 1 + FILE_IV_LENGTH);

  const salt = randomBytes(SALT_LENGTH);
  const wrappingKey = await deriveWrappingKey(passphrase, salt);
  const wrapIv = randomBytes(WRAP_IV_LENGTH);
  const wrapped = new Uint8Array(
    await subtle.encrypt({ name: 'AES-GCM', iv: asBufferSource(wrapIv) }, wrappingKey, asBufferSource(dek)),
  );
  const wrappedBlob = new Uint8Array(WRAP_IV_LENGTH + wrapped.length);
  wrappedBlob.set(wrapIv, 0);
  wrappedBlob.set(wrapped, WRAP_IV_LENGTH);

  return {
    ciphertext,
    wrappedDekBase64: bytesToBase64(wrappedBlob),
    keyWrapSaltBase64: bytesToBase64(salt),
  };
}

export async function decryptVaultPayload(
  ciphertext: Uint8Array,
  passphrase: string,
  wrappedDekBase64: string,
  keyWrapSaltBase64: string,
): Promise<Uint8Array> {
  const subtle = requireSubtle();
  if (ciphertext.length < 1 + FILE_IV_LENGTH + GCM_TAG_LENGTH) {
    throw new Error('Invalid vault ciphertext.');
  }
  if (ciphertext[0] !== VAULT_FILE_FORMAT_VERSION) {
    throw new Error('Unsupported vault file format version.');
  }
  const fileIv = ciphertext.slice(1, 1 + FILE_IV_LENGTH);
  const fileCipher = ciphertext.slice(1 + FILE_IV_LENGTH);

  const salt = base64ToBytes(keyWrapSaltBase64);
  const wrappingKey = await deriveWrappingKey(passphrase, salt);
  const wrappedBlob = base64ToBytes(wrappedDekBase64);
  if (wrappedBlob.length < WRAP_IV_LENGTH + GCM_TAG_LENGTH) {
    throw new Error('Invalid wrapped key.');
  }
  const wrapIv = wrappedBlob.slice(0, WRAP_IV_LENGTH);
  const wrappedDek = wrappedBlob.slice(WRAP_IV_LENGTH);
  const dek = new Uint8Array(
    await subtle.decrypt(
      { name: 'AES-GCM', iv: asBufferSource(wrapIv) },
      wrappingKey,
      asBufferSource(wrappedDek),
    ),
  );
  if (dek.length !== DEK_LENGTH) {
    throw new Error('Invalid DEK length.');
  }
  const dekKey = await importDek(dek);
  return new Uint8Array(
    await subtle.decrypt({ name: 'AES-GCM', iv: asBufferSource(fileIv) }, dekKey, asBufferSource(fileCipher)),
  );
}
