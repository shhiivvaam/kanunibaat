# KanuniBaat Web (`apps/web`)

Next.js App Router app for:

- marketing site,
- localized routes (`/[locale]/*`),
- authenticated app UI,
- Better Auth host,
- and same-origin tRPC proxying.

## Start

From repo root:

```bash
pnpm --filter web dev
```

Build:

```bash
pnpm --filter web build
```

## Structure

- `src/app/[locale]/(marketing)/*`: public pages.
- `src/app/[locale]/app/*`: authenticated app pages.
- `src/app/api/auth/[...all]/route.ts`: Better Auth endpoints.
- `src/app/api/trpc/[[...path]]/route.ts`: tRPC proxy route.
- `src/i18n/*`: locale routing and message loading.
- `src/messages/*.json`: translation catalogs.

## Core environment variables

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_API_URL`
- `INTERNAL_API_URL` (optional server-side override)
- Better Auth and OTP vars (see root `.env.example`)

## i18n

Current web locales:

- `en`, `hi`, `ta`, `te`, `kn`, `mr`, `gu`, `bn`

Routing and fallback are configured in:

- `src/i18n/routing.ts`
- `src/i18n/request.ts`

## Related docs

- `docs/ARCHITECTURE.md`
- `docs/PROJECT-FLOWS.md`
- `docs/PHASE-14.md`
