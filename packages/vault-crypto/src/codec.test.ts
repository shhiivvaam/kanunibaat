import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { base64ToBytes, bytesToBase64 } from './index.js';

void describe('vault base64 helpers', () => {
  void it('roundtrips random bytes', () => {
    const input = new Uint8Array([0, 127, 255, 10, 20]);
    const b64 = bytesToBase64(input);
    const out = base64ToBytes(b64);
    assert.deepEqual(out, input);
  });
});
