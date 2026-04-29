# KanuniBaat Mobile (`apps/mobile`)

Expo mobile client for KanuniBaat.

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

Use root `.env.example` for all shared env conventions.

## Related docs

- `docs/ONBOARDING.md`
- `docs/PROJECT-FLOWS.md`
- `docs/MOBILE-AUTH-DEEPLINKS.md`
