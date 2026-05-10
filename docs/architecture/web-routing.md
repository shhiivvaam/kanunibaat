# Web app routing (`apps/web`)

## Single source of truth

All user-facing marketing and authenticated surfaces live under **`app/[locale]/`**.

- **`[locale]/(marketing)/…`** — public marketing pages (`/en/pricing`, etc.).
- **`[locale]/app/…`** — signed-in application shell (`/en/app/vault`, etc.).

`localePrefix` is **`always`** (see [`apps/web/src/middleware.ts`](../../apps/web/src/middleware.ts)); un-prefixed paths are rewritten to `/{locale}/…`.

## Prior pattern (removed)

Earlier, page modules lived under ~~`app/(marketing)`~~ and ~~`app/app`~~ while `app/[locale]/…` re-exported them. That split caused drift risk. Implementations now live **only** under `[locale]/(marketing)` and `[locale]/app`.

## What stays at `apps/web/src/app/` root

- **`layout.tsx`** — passthrough wrapper only (`<html>` is in `[locale]/layout.tsx`).
- **`middleware.ts`** (compiled from `src/middleware.ts`).
- **`api/`**, **`global-error.tsx`**, **`globals.css`**, **`opengraph-image.tsx`**, **`robots.ts`**, **`sitemap.ts`**, and other non-localized infra routes.
