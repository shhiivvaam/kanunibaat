import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { submitUserWaitlist } from './submit';

void describe('submitUserWaitlist', () => {
  void it('succeeds in development without Resend', async () => {
    const r = await submitUserWaitlist(
      { name: 'Test User', email: 'test@example.com' },
      { nodeEnv: 'development' },
    );
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.match(r.message, /dev mode/i);
    }
  });
});
