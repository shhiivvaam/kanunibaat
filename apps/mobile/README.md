# Jurisly Mobile (`apps/mobile`)

Expo mobile client for Jurisly.

## Start

From repo root:

```bash
pnpm --filter mobile dev
```

## Core responsibilities

- mobile-first product navigation,
- authenticated legal workflows (scanner, guide, consultations, vault, practice),
- typed API consumption through shared tRPC client packages.

## Configuration

Set API base URL in env:

- `EXPO_PUBLIC_API_URL`

For **Settings → Also on web**, set the Next.js origin:

- **`EXPO_PUBLIC_APP_URL`** (e.g. `http://localhost:3000` in dev; production web URL when shipped)

Use root `.env.example` for all shared env conventions.

## Related docs

- `docs/MOBILE-WEB-PARITY.md`
- `docs/ONBOARDING.md`
- `docs/PROJECT-FLOWS.md`
- `docs/MOBILE-AUTH-DEEPLINKS.md`
