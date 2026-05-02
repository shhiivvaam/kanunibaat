import { fetchWithTimeout } from './outbound-fetch';

describe('fetchWithTimeout', () => {
  it('rejects when the request exceeds timeoutMs', async () => {
    const orig = global.fetch;
    global.fetch = jest.fn((_url, init?: RequestInit) => {
      return new Promise<Response>((resolve, reject) => {
        const sig = init?.signal;
        if (!sig) {
          reject(new Error('expected AbortSignal'));
          return;
        }
        if (sig.aborted) {
          reject(new DOMException('Aborted', 'AbortError'));
          return;
        }
        const onAbort = () => {
          reject(new DOMException('Aborted', 'AbortError'));
        };
        sig.addEventListener('abort', onAbort, { once: true });
      });
    });
    try {
      await expect(
        fetchWithTimeout('https://example.invalid/', { timeoutMs: 80 }),
      ).rejects.toThrow();
    } finally {
      global.fetch = orig;
    }
  });
});
