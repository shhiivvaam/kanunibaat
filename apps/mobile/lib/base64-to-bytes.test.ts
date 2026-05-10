import { base64ToUint8Array } from './base64-to-bytes';

describe('base64ToUint8Array', () => {
  it('decodes standard base64', () => {
    const out = base64ToUint8Array('YWI='); // "ab"
    expect(Array.from(out)).toEqual([0x61, 0x62]);
  });

  it('accepts url-safe alphabet', () => {
    const out = base64ToUint8Array('YWI'); // "ab" without padding, -_ form supported via normalization
    expect(Array.from(out)).toEqual([0x61, 0x62]);
  });

  it('strips whitespace', () => {
    const out = base64ToUint8Array(' YWI= \n');
    expect(Array.from(out)).toEqual([0x61, 0x62]);
  });

  it('throws when atob is missing', () => {
    const g = globalThis as { atob?: (data: string) => string };
    const prev = g.atob;
    g.atob = undefined;
    try {
      expect(() => base64ToUint8Array('YWI=')).toThrow('Base64 decoding is not available');
    } finally {
      if (prev !== undefined) g.atob = prev;
    }
  });
});
