/**
 * Server-side fetch with an explicit timeout. Use for outbound HTTP to avoid hung requests.
 * Does not validate URLs (callers must use fixed or server-controlled targets only).
 */
export async function fetchWithTimeout(
  input: string | URL,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<Response> {
  const { timeoutMs = 25_000, ...fetchInit } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);
  try {
    return await fetch(input, { ...fetchInit, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
