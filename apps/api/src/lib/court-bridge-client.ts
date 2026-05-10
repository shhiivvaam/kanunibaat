import { fetchWithTimeout } from './outbound-fetch';

export async function fetchCourtSnapshotFromBridge(opts: {
  cnr: string;
  bridgeUrl: string;
  bridgeSecret: string;
  timeoutMs?: number;
}): Promise<unknown> {
  const res = await fetchWithTimeout(opts.bridgeUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-kb-bridge-secret': opts.bridgeSecret,
    },
    body: JSON.stringify({ cnr: opts.cnr }),
    timeoutMs: opts.timeoutMs ?? 25_000,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(
      `NJDG bridge request failed (${res.status}): ${text.slice(0, 200)}`,
    );
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error('NJDG bridge returned non-JSON response.');
  }
}
