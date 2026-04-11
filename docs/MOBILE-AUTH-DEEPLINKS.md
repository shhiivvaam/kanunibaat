# Mobile auth and deep links (Phase 2)

## Supported path (short term)

1. User signs in on **web** (email/password or OTP). Better Auth issues a **session** row and, with the **bearer** plugin, returns a **session token** in the `set-auth-token` response header on successful sign-in/session responses.
2. The mobile app stores that token in **Expo SecureStore** (key `kanunibaat_session_token` — see `apps/mobile/lib/auth-token.ts`).
3. **`TrpcProvider`** sends `Authorization: Bearer <token>` on every tRPC request to `EXPO_PUBLIC_API_URL`.

This avoids depending on httpOnly cookies in React Native, which do not apply to the native HTTP stack the same way as a browser.

## Deep links (strategy)

Product flows that open the app from email/SMS (magic link, OTP completion, marketing) should use a **stable HTTPS** URL scheme, for example:

- `https://app.kanooni.baat/auth/callback?token=...` (preferred in production), or
- Custom scheme `kanunibaat://auth?token=...` registered in `app.json` / Expo config.

**Phase 2 does not implement** a full universal-link handler. When you add it:

1. Resolve the **session token** only over **HTTPS** or verified app links; never log raw tokens.
2. On success, write the token with `setSessionToken()` and invalidate React Query caches if needed.
3. Prefer **short-lived exchange codes** (web redirects to code, app exchanges for session server-side) over long tokens in query strings if the threat model requires it.

## Environment

- `EXPO_PUBLIC_API_URL` — Nest API base URL (no trailing slash).
