import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isValidIndianMobile } from './phone.js';

void describe('isValidIndianMobile', () => {
  void it('accepts 10-digit numbers starting with 6–9', () => {
    assert.equal(isValidIndianMobile('9876543210'), true);
    assert.equal(isValidIndianMobile('6123456789'), true);
  });

  void it('accepts +91 prefix', () => {
    assert.equal(isValidIndianMobile('+919876543210'), true);
  });

  void it('rejects invalid lengths and leading digit', () => {
    assert.equal(isValidIndianMobile('5876543210'), false);
    assert.equal(isValidIndianMobile('987654321'), false);
    assert.equal(isValidIndianMobile('98765432101'), false);
  });

  void it('ignores internal whitespace in normalization', () => {
    assert.equal(isValidIndianMobile('98765 43210'), true);
  });
});
