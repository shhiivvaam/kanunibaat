import { createHMAC } from '@better-auth/utils/hmac';
import { and, eq, gt } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Request } from 'express';

import type * as DbSchema from '@kb/database/schema';
import { session } from '@kb/database/schema';

export const DEFAULT_SESSION_COOKIE_NAMES = [
  'better-auth.session_token',
  '__Secure-better-auth.session_token',
] as const;

export type SessionCookieName = (typeof DEFAULT_SESSION_COOKIE_NAMES)[number];

function parseCookieHeader(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  const out: Record<string, string> = {};
  for (const part of cookieHeader.split(';')) {
    const trimmed = part.trim();
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const name = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1);
    if (!name) continue;
    try {
      out[name] = decodeURIComponent(value);
    } catch {
      out[name] = value;
    }
  }
  return out;
}

function configuredCookieNames(): string[] {
  const raw = process.env.BETTER_AUTH_SESSION_COOKIE_NAMES?.trim();
  if (!raw) return [...DEFAULT_SESSION_COOKIE_NAMES];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Extracts the Better Auth session token from `Authorization: Bearer` or session cookies.
 * The raw value matches `session.token` in Postgres (see Better Auth bearer + cookie naming).
 */
export function extractSessionTokenFromRequest(req: Pick<Request, 'headers'>): string | null {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    const t = auth.slice(7).trim();
    return t.length > 0 ? t : null;
  }
  const cookies = parseCookieHeader(
    typeof req.headers.cookie === 'string' ? req.headers.cookie : undefined,
  );
  for (const name of configuredCookieNames()) {
    const v = cookies[name];
    if (v) return v;
  }
  return null;
}

function tryDecodeCookieValue(str: string): string {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
}

/**
 * Better Auth may store a signed `payload.signature` cookie value (see bearer plugin)
 * while `session.token` in Postgres holds the raw token. Unsign when possible.
 */
export async function unsignBetterAuthSessionCookieValue(value: string): Promise<string | null> {
  const secret = process.env.BETTER_AUTH_SECRET?.trim();
  if (!secret) return null;
  const decoded = tryDecodeCookieValue(value);
  const lastDot = decoded.lastIndexOf('.');
  if (lastDot <= 0) return null;
  const data = decoded.slice(0, lastDot);
  const sig = decoded.slice(lastDot + 1);
  if (!data || !sig) return null;
  const ok = await createHMAC('SHA-256', 'base64urlnopad').verify(secret, data, sig);
  return ok ? data : null;
}

export async function resolveUserIdFromSessionToken(
  db: PostgresJsDatabase<typeof DbSchema>,
  token: string,
): Promise<string | null> {
  const now = new Date();
  const lookup = async (t: string) => {
    const rows = await db
      .select({ userId: session.userId })
      .from(session)
      .where(and(eq(session.token, t), gt(session.expiresAt, now)))
      .limit(1);
    return rows[0]?.userId ?? null;
  };

  const direct = await lookup(token);
  if (direct) return direct;

  const unsigned = await unsignBetterAuthSessionCookieValue(token);
  if (unsigned && unsigned !== token) {
    return lookup(unsigned);
  }
  return null;
}
