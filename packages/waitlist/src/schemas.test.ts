import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { userWaitlistInputSchema } from './schemas';

describe('userWaitlistInputSchema', () => {
  it('accepts minimal valid payload', () => {
    const r = userWaitlistInputSchema.safeParse({
      name: 'A',
      email: 'a@b.co',
    });
    assert.equal(r.success, true);
  });

  it('rejects empty name', () => {
    const r = userWaitlistInputSchema.safeParse({
      name: '',
      email: 'a@b.co',
    });
    assert.equal(r.success, false);
  });
});
