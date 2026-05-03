# Mobile vs web parity (Jurisly)

[Jurisly.md](../Jurisly.md) targets **cross-platform**: one product on **Next.js** and **Expo**, sharing the **same Nest/tRPC API** ([`packages/trpc/src/router.ts`](../packages/trpc/src/router.ts)). Backend procedures are platform-agnostic; differences are mainly **screens and acquisition URLs**.

## Shared API

- **Web**: `GET/POST /api/trpc/*` on Next proxies to Nest ([`apps/web/src/app/api/trpc/[[...path]]/route.ts`](../apps/web/src/app/api/trpc/[[...path]]/route.ts)) with Better Auth cookies forwarded.
- **Mobile**: calls `{API}/trpc` on Nest directly ([`apps/mobile/components/TrpcProvider.tsx`](../apps/mobile/components/TrpcProvider.tsx)) with `Authorization: Bearer` ([`packages/trpc/src/session-resolve.ts`](../packages/trpc/src/session-resolve.ts)).
- Session extraction for Bearer vs cookies is covered by [`apps/api/src/session-token.spec.ts`](../apps/api/src/session-token.spec.ts).

## Status matrix — signed-in app shell

Web base path: `apps/web/src/app/[locale]/app/<route>`. Mobile path: `apps/mobile/app/<route>` (outside tabs) unless noted.

| Web route (pattern)                               | Mobile native              | Notes                                                                                                                                                       |
| ------------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[locale]/app/notifications`                      | Yes — `/notifications`     | List + disable destinations (`notifications.*`); Expo push still auto-registered in app.                                                                    |
| `[locale]/app/lawyer/onboarding`                  | Yes — `/lawyer/onboarding` | Profile, documents (DocumentPicker → S3), submit, bar council status.                                                                                       |
| `[locale]/app/integrations` + DigiLocker callback | Yes — `/integrations`      | `openAuthSessionAsync` with **same** web `redirect_uri`; `exchangeCode` after return. Needs `EXPO_PUBLIC_APP_URL` aligned with backend DigiLocker redirect. |
| `[locale]/app/admin`                              | Yes — `/admin`             | `admin.pendingLawyers`, approve/reject; non-admins get API error surfaces.                                                                                  |

Deep links from **Settings** (`apps/mobile/app/(tabs)/settings.tsx`) open the native stack screens above. “Open canonical web site” remains for edge cases (SEO, unpublished legal copy).

## Status matrix — marketing / public (native)

Web base: `apps/web/src/app/[locale]/(marketing)/...`. Mobile mirrors under **`/marketing/...`** (`apps/mobile/app/marketing/`) with summaries, redirects into tabs where the product UI already lives, or tRPC-backed readers.

| Web path (after `[locale]/`)                                                                                                                            | Mobile path                                                              | Web | Mobile native                      | Notes                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | --- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/` (marketing home)                                                                                                                                    | `/marketing` hub                                                         | Yes | Yes — hub lists topics + shortcuts | Landing prose is not duplicated; hub is the native index.                                                                                            |
| `/about`, `/features`, `/pricing`, `/for-lawyers`, `/lawyer-connect`, `/document-review`, `/know-your-rights`, `/privacy-charter`, `/terms`, `/privacy` | `/marketing/<slug>` via `[pageSlug]`                                     | Yes | Yes — static summaries             | Canonical legal/policy text stays on deployed web for audits; native carries orientation copy.                                                       |
| `/waitlist`                                                                                                                                             | `/marketing/waitlist`                                                    | Yes | Yes                                | Form capture may remain web-linked for campaigns (see Waitlist UX row below).                                                                        |
| `/waitlist/lawyer`                                                                                                                                      | `/marketing/waitlist-lawyer`                                             | Yes | Yes                                | Same slug pattern via `[pageSlug]`.                                                                                                                  |
| `/blog`, `/blog/[slug]`                                                                                                                                 | `/marketing/blog`, `/marketing/blog/[slug]`                              | Yes | Yes                                | Manifest: [`apps/mobile/lib/blog-posts.manifest.ts`](./../apps/mobile/lib/blog-posts.manifest.ts) — keep in sync with `apps/web/content/blog/*.mdx`. |
| `/vault/shared/[token]`                                                                                                                                 | `/marketing/vault/shared/[token]`                                        | Yes | Yes                                | `vault.share.get` + decrypt preview (parity with [`vault-shared-viewer`](../apps/web/src/features/vault/vault-shared-viewer.tsx)).                   |
| `/lawyers`, `/lawyers/[slug]`                                                                                                                           | `/marketing/lawyers`, `/marketing/lawyers/[slug]` → tab                  | Yes | Yes                                | Redirects into `(tabs)/lawyers`.                                                                                                                     |
| `/legal-qa`, `/legal-qa/ask`, `/legal-qa/[questionId]`                                                                                                  | `/marketing/legal-qa/...`                                                | Yes | Yes                                | Redirects into `(tabs)/legal-qa`.                                                                                                                    |
| `/notice-scanner`, `/notice-scanner/result/[scanId]?t=`                                                                                                 | `/marketing/notice-scanner`, `/marketing/notice-scanner/result/[scanId]` | Yes | Yes                                | Scanner tab + result screen with token `t`.                                                                                                          |
| `/rights`, `/rights/[slug]`                                                                                                                             | `/marketing/rights`, `/marketing/rights/[slug]`                          | Yes | Yes                                | Redirects into `(tabs)/rights`.                                                                                                                      |
| `/case-tracker`                                                                                                                                         | `/marketing/case-tracker`                                                | Yes | Yes                                | Redirects into `(tabs)/case-tracker`.                                                                                                                |
| `/kya-karein`, `/kya-karein/[slug]`                                                                                                                     | `/marketing/kya-karein/...`                                              | Yes | Yes                                | Redirects into `(tabs)/guide`.                                                                                                                       |

## Signed-in tabs (already mirrored)

Capabilities that live primarily in **`apps/mobile/app/(tabs)/`** align with **`[locale]/app/`** modules (consultations, billing, vault tab, practice, research, Notice Scanner tab, etc.). See tab layout: [`apps/mobile/app/(tabs)/_layout.tsx`](<../apps/mobile/app/(tabs)/_layout.tsx>).

## Web completeness vs mobile-only (audit)

| Area              | Mobile behaviour                                                                                      | Web expectation                                                                                                      | Gap / parity                                                                                            |
| ----------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Push registration | Expo token via [`PushNotificationsClient.tsx`](../apps/mobile/components/PushNotificationsClient.tsx) | Web push enable in [`notifications-settings.tsx`](../apps/web/src/features/notifications/notifications-settings.tsx) | Parity: both hit `notifications` router; native screen lists/disables destinations without web-push UI. |
| Session transport | Bearer + SecureStore                                                                                  | Cookies via Next proxy                                                                                               | Documented only — not user-facing parity.                                                               |
| Waitlist submit   | Static native page; campaign forms                                                                    | Full waitlist UI                                                                                                     | Optional: deep-link web form when `isWaitlistCampaign` redirects apply.                                 |

## Configuration for web ↔ mobile linking

Set **`EXPO_PUBLIC_APP_URL`** on mobile builds to the **canonical web origin** (align with **`NEXT_PUBLIC_APP_URL`** for the deployed web app). Needed for:

- Opening the canonical marketing site from Settings when required.
- **DigiLocker OAuth** redirect URL matching backend `DIGILOCKER_REDIRECT_URL` (`/{locale}/app/integrations/digilocker/callback`).

Helpers: [`apps/mobile/lib/web-app-url.ts`](../apps/mobile/lib/web-app-url.ts), [`apps/mobile/lib/trpc-url.ts`](../apps/mobile/lib/trpc-url.ts).

## When adding features

Ship **one tRPC contract** and add **both** web and mobile entry points unless the feature is explicitly web-only (SEO, crawler-only fragments) or mobile-only hardware. Update **this matrix** when parity changes.
