# ADR 0002 — Phase 2 auth, subdomains, and API session validation

## Status

Accepted

## Context

KanuniBaat uses **Better Auth** on **Next.js** (`apps/web`) with credentials stored in **PostgreSQL** via Drizzle (`packages/database`). The **Nest API** (`apps/api`) exposes **tRPC** and must identify the same user without trusting unsigned client claims.

Future **admin** and **lawyer** experiences are intended to run on **separate subdomains**, not inside `apps/web`. Phase 2 must define how cookies, CORS, and mobile clients interact with this model.

## Decision

1. **Single session store**  
   Session rows live in the Better Auth `session` table (`token`, `expires_at`, `user_id`). The API resolves identity by looking up a **non-expired** row for that token. No parallel custom JWT is introduced in Phase 2.

2. **Session token transport**
   - **Browser + web app + API on different ports/origins:** The web app calls tRPC through a **same-origin Next.js proxy** (`/api/trpc/*`) so the browser’s **httpOnly** Better Auth cookie is forwarded to the API on the server. The API never needs to share cookie `Domain` with the API host for this path.
   - **Mobile / native:** Use **`Authorization: Bearer <session_token>`**. Better Auth’s **bearer** plugin exposes the session token on auth responses (`set-auth-token`); the mobile app persists it (e.g. Expo SecureStore) and attaches it to tRPC links.
   - **Future subdomain web apps** (`admin.*`, `lawyer.*`): Use **Bearer** (or enable Better Auth **crossSubDomainCookies** with an explicit cookie `Domain` such as `.kanooni.baat` and aligned `trustedOrigins` / `CORS_ORIGIN`). Prefer Bearer for non-Next clients to avoid fragile cookie rules.

3. **Cookie names**  
   Better Auth defaults to `better-auth.session_token` over HTTP and `__Secure-better-auth.session_token` on HTTPS with secure cookies. The API accepts both plus optional `BETTER_AUTH_SESSION_COOKIE_NAMES` (comma-separated) for overrides.

4. **Signed cookie values**  
   Session cookies may contain a **signed** `payload.signature` string while Postgres stores the **raw** `session.token`. The API process must set **`BETTER_AUTH_SECRET`** (same value as `apps/web`) so tRPC can verify the HMAC and resolve the raw token before querying `session`.

5. **CORS**  
   Nest enables CORS from `CORS_ORIGIN` (comma-separated). Production should list all browser origins that call the API **directly** (e.g. mobile web, subdomain apps). The primary Next app may use the proxy and not require the API origin in CORS for those requests.

6. **RLS**  
   Row Level Security is **not** relied upon for API authorization in Phase 2. The API connects with a **service** database role; authorization is enforced in **tRPC middleware** (roles from `user_role`). If RLS is added later, document separate **user-scoped** vs **service** connection strings.

## Consequences

- The **API** must receive **`BETTER_AUTH_SECRET`** wherever cookie-based session resolution is used (same secret as the Next.js Better Auth instance).
- Adding a new browser origin that talks **directly** to the Nest API requires updating **`CORS_ORIGIN`** and redeploying the API.
- Session invalidation is centralized (delete or expire session rows); both web and mobile respect the same state.
- Subdomain UIs can ship later without changing the core session model, only client transport (cookie domain vs Bearer).
