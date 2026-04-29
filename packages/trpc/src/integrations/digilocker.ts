import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from 'node:crypto';

import { TRPCError } from '@trpc/server';

function base64UrlEncode(buf: Buffer): string {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return Buffer.from(b64, 'base64');
}

function sha256(buf: Buffer): Buffer {
  return createHash('sha256').update(buf).digest();
}

function hmacSha256(key: Buffer, data: Buffer): Buffer {
  return createHmac('sha256', key).update(data).digest();
}

export function requireDigiLockerEnabled(): {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUrl: string;
  tokenSecret: string;
  stateSecret: string;
} {
  const enabled = process.env.DIGILOCKER_ENABLED === 'true';
  if (!enabled) {
    throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'DigiLocker is not enabled.' });
  }

  const baseUrl = (process.env.DIGILOCKER_BASE_URL ?? 'https://betaapi.digitallocker.gov.in/public').trim();
  const clientId = process.env.DIGILOCKER_CLIENT_ID?.trim();
  const clientSecret = process.env.DIGILOCKER_CLIENT_SECRET?.trim();
  const redirectUrl = process.env.DIGILOCKER_REDIRECT_URL?.trim();
  const tokenSecret = process.env.DIGILOCKER_TOKEN_SECRET?.trim();
  const stateSecret = process.env.DIGILOCKER_STATE_SECRET?.trim();

  if (!clientId || !clientSecret || !redirectUrl || !tokenSecret || !stateSecret) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'DigiLocker is not configured.',
    });
  }
  return { baseUrl, clientId, clientSecret, redirectUrl, tokenSecret, stateSecret };
}

interface StatePayload {
  u: string;
  n: string;
  v: string;
  iat: number;
}

export function mintDigiLockerState(opts: { userId: string; stateSecret: string; codeVerifier: string }): string {
  const payload: StatePayload = {
    u: opts.userId,
    n: base64UrlEncode(randomBytes(12)),
    v: opts.codeVerifier,
    iat: Date.now(),
  };
  const body = Buffer.from(JSON.stringify(payload), 'utf8');
  const sig = hmacSha256(Buffer.from(opts.stateSecret, 'utf8'), body);
  return `${base64UrlEncode(body)}.${base64UrlEncode(sig)}`;
}

export function verifyDigiLockerState(opts: {
  state: string;
  stateSecret: string;
  maxAgeMs: number;
}): StatePayload {
  const [bodyB64, sigB64] = opts.state.split('.', 2);
  if (!bodyB64 || !sigB64) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid state.' });
  }
  const body = base64UrlDecode(bodyB64);
  const sig = base64UrlDecode(sigB64);
  const expected = hmacSha256(Buffer.from(opts.stateSecret, 'utf8'), body);
  if (sig.length !== expected.length || !sig.equals(expected)) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid state.' });
  }
  const parsed = JSON.parse(body.toString('utf8')) as StatePayload;
  if (!parsed?.u || !parsed?.v || typeof parsed.iat !== 'number') {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid state.' });
  }
  if (Date.now() - parsed.iat > opts.maxAgeMs) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'State expired.' });
  }
  return parsed;
}

export function pkceCodeChallenge(verifier: string): string {
  return base64UrlEncode(sha256(Buffer.from(verifier, 'utf8')));
}

export function newCodeVerifier(): string {
  return base64UrlEncode(randomBytes(32));
}

interface Enc {
  ciphertext: string;
}

export function encryptToken(opts: { token: string; secret: string }): Enc {
  const key = sha256(Buffer.from(opts.secret, 'utf8'));
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(opts.token, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const packed = `${base64UrlEncode(iv)}.${base64UrlEncode(enc)}.${base64UrlEncode(tag)}`;
  return { ciphertext: packed };
}

export function decryptToken(opts: { ciphertext: string; secret: string }): string {
  const [ivB64, ctB64, tagB64] = opts.ciphertext.split('.', 3);
  if (!ivB64 || !ctB64 || !tagB64) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Invalid token ciphertext.' });
  }
  const key = sha256(Buffer.from(opts.secret, 'utf8'));
  const iv = base64UrlDecode(ivB64);
  const ct = base64UrlDecode(ctB64);
  const tag = base64UrlDecode(tagB64);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const out = Buffer.concat([decipher.update(ct), decipher.final()]);
  return out.toString('utf8');
}

export interface DigiLockerTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
}

export async function digilockerToken(opts: {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUrl: string;
  code: string;
  codeVerifier?: string;
}): Promise<DigiLockerTokenResponse> {
  const url = `${opts.baseUrl.replace(/\/$/, '')}/oauth2/1/token`;
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: opts.code,
    client_id: opts.clientId,
    client_secret: opts.clientSecret,
    redirect_uri: opts.redirectUrl,
  });
  if (opts.codeVerifier) body.set('code_verifier', opts.codeVerifier);

  const res = await fetch(url, { method: 'POST', body, headers: { 'content-type': 'application/x-www-form-urlencoded' } });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new TRPCError({ code: 'BAD_REQUEST', message: `DigiLocker token failed (${res.status}): ${text}` });
  }
  return (await res.json()) as DigiLockerTokenResponse;
}

export async function digilockerRefresh(opts: {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<DigiLockerTokenResponse> {
  const url = `${opts.baseUrl.replace(/\/$/, '')}/oauth2/1/token`;
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: opts.refreshToken,
    client_id: opts.clientId,
    client_secret: opts.clientSecret,
  });
  const res = await fetch(url, { method: 'POST', body, headers: { 'content-type': 'application/x-www-form-urlencoded' } });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new TRPCError({ code: 'BAD_REQUEST', message: `DigiLocker refresh failed (${res.status}): ${text}` });
  }
  return (await res.json()) as DigiLockerTokenResponse;
}

export interface DigiLockerFileItem {
  id?: string;
  name?: string;
  uri?: string;
  type?: string;
  mime?: string;
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

function pickArrayField(obj: unknown, key: string): unknown[] | null {
  if (!isRecord(obj)) return null;
  const v = obj[key];
  return Array.isArray(v) ? v : null;
}

export async function digilockerListFiles(opts: { baseUrl: string; accessToken: string }): Promise<DigiLockerFileItem[]> {
  const url = `${opts.baseUrl.replace(/\/$/, '')}/oauth2/1/files/`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${opts.accessToken}` } });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new TRPCError({ code: 'BAD_REQUEST', message: `DigiLocker list failed (${res.status}): ${text}` });
  }
  const json = (await res.json()) as unknown;
  const items =
    pickArrayField(json, 'items') ?? pickArrayField(json, 'files') ?? pickArrayField(json, 'response') ?? [];
  return items as DigiLockerFileItem[];
}

export async function digilockerDownload(opts: {
  baseUrl: string;
  accessToken: string;
  uri: string;
  maxBytes: number;
}): Promise<{ bytes: Uint8Array; contentType: string | null }> {
  const base = opts.baseUrl.replace(/\/$/, '');
  const url = `${base}/oauth2/1/file/${encodeURIComponent(opts.uri)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${opts.accessToken}` } });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new TRPCError({ code: 'BAD_REQUEST', message: `DigiLocker download failed (${res.status}): ${text}` });
  }
  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.byteLength > opts.maxBytes) {
    throw new TRPCError({ code: 'PAYLOAD_TOO_LARGE', message: 'Document too large to import via web.' });
  }
  return { bytes: buf, contentType: res.headers.get('content-type') };
}

