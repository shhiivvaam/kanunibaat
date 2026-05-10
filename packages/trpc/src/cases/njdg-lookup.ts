/**
 * Optional NJDG / eCourts lookup via a server-controlled HTTPS bridge (no scraping in-repo).
 */

export function normalizeAndValidateCnr(raw: string): string {
  const normalized = raw.replace(/\s+/g, '').toUpperCase();
  if (!/^[A-Z0-9]{16}$/.test(normalized)) {
    throw new Error('Invalid CNR: expected 16 alphanumeric characters (spaces allowed).');
  }
  return normalized;
}

export async function fetchCourtSnapshotViaBridge(
  bridgeUrl: string,
  bridgeSecret: string,
  cnr: string,
): Promise<unknown> {
  const res = await fetch(bridgeUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${bridgeSecret}`,
    },
    body: JSON.stringify({ cnr }),
  });
  const text = await res.text().catch(() => '');
  if (!res.ok) {
    throw new Error(`NJDG bridge request failed (${res.status}): ${text.slice(0, 500)}`);
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error('NJDG bridge returned non-JSON response.');
  }
}
