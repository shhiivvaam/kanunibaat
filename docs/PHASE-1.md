# Phase 1 — Website (Trust & Visibility)

**Goal:** Public-facing website live; visitors understand KanooniBaat and can join waitlists. Aligned with [KanuniBaat.md](../KanuniBaat.md) §6 Phase 1.

## Checklist (blueprint → repo)

| Task | Status | Where |
|------|--------|--------|
| Landing (hero, features overview, how it works, stats, FAQ, testimonials) | Done | [apps/web/src/features/marketing/pages/home-page.tsx](../apps/web/src/features/marketing/pages/home-page.tsx) — trust bar copy §7, 8 FAQs, waitlist CTAs |
| Features page | Done | `/features` → [features-page.tsx](../apps/web/src/features/marketing/pages/features-page.tsx) |
| For Lawyers page | Done | `/for-lawyers` → [for-lawyers-page.tsx](../apps/web/src/features/marketing/pages/for-lawyers-page.tsx) |
| Pricing (Naagrik + Vakil tiers) | Done | [pricing-page.tsx](../apps/web/src/features/marketing/pages/pricing-page.tsx), home preview aligned |
| About | Done | `/about` |
| Blog (MDX) | Done | `/blog`, `/blog/[slug]` — [content/blog/](../apps/web/content/blog/) |
| User app waitlist | Done | `/waitlist` — [waitlist-user-page.tsx](../apps/web/src/features/marketing/pages/waitlist-user-page.tsx) → tRPC `waitlist.submitUser` on [apps/api](../apps/api) |
| Lawyer waitlist | Done | `/waitlist/lawyer` — [waitlist-lawyer-page.tsx](../apps/web/src/features/marketing/pages/waitlist-lawyer-page.tsx) → tRPC `waitlist.submitLawyer` on API |
| Privacy, Terms, Privacy Charter | Done | `/privacy`, `/terms`, `/privacy-charter` |
| SEO (metadata, sitemap, robots, default OG) | Done | [layout.tsx](../apps/web/src/app/layout.tsx) `metadataBase`, [sitemap.ts](../apps/web/src/app/sitemap.ts), [robots.ts](../apps/web/src/app/robots.ts), [opengraph-image.tsx](../apps/web/src/app/opengraph-image.tsx) |
| Nav + footer links | Done | [navbar.tsx](../apps/web/src/features/marketing/navbar.tsx), [footer.tsx](../apps/web/src/features/marketing/footer.tsx) |
| Auth modal (Phase 2 honest) | Done | [auth-modal.tsx](../apps/web/src/features/marketing/auth-modal.tsx) → waitlist flows |

## Waitlist email (Resend)

Configure on the **API** host (same keys in root `.env` for local dev — see [.env.example](../.env.example)):

- `RESEND_API_KEY`
- `FROM_EMAIL` (verified sender in Resend)
- Optional: `WAITLIST_NOTIFY_EMAIL` (defaults to `FROM_EMAIL`)

Without Resend in **production** (`NODE_ENV=production` on the API), submissions fail with a clear error. In **development**, the API accepts submissions without sending mail (same behaviour as before).

**Web** must call a reachable API: set `NEXT_PUBLIC_API_URL` (and CORS `CORS_ORIGIN` on the API) for non-local deploys.

## Out of scope (later phases)

- Phase 2: OTP auth, JWT, profile API, working email/password via Better Auth in UI.
- Phase 4: Notice scanner backend on the marketing “demo”.
- Full i18n routing (Phase 14).

## Commands

```bash
pnpm --filter web dev
pnpm --filter web build
```

Set `NEXT_PUBLIC_APP_URL` to your canonical URL for correct sitemap and `metadataBase` (see [site-url.ts](../apps/web/src/lib/site-url.ts)).
