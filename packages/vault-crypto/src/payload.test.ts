import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { decryptVaultPayload, encryptVaultPayload } from './index.js';

void describe('encryptVaultPayload / decryptVaultPayload', () => {
  void it('roundtrips binary payload with passphrase', async () => {
    const plaintext = new TextEncoder().encode('vault test payload');
    const passphrase = 'correct horse battery staple';
    const enc = await encryptVaultPayload(plaintext, passphrase);
    const dec = await decryptVaultPayload(
      enc.ciphertext,
      passphrase,
      enc.wrappedDekBase64,
      enc.keyWrapSaltBase64,
    );
    assert.deepEqual(dec, plaintext);
  });

  void it('fails decrypt with wrong passphrase', async () => {
    const enc = await encryptVaultPayload(new Uint8Array([1, 2, 3]), 'one');
    await assert.rejects(
      async () =>
        decryptVaultPayload(enc.ciphertext, 'two', enc.wrappedDekBase64, enc.keyWrapSaltBase64),
    );
  });
});
