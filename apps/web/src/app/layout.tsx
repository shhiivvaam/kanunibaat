/**
 * Minimal root segment: `<html>/<body>` and i18n live under `app/[locale]/layout.tsx`.
 * Locale prefix (`localePrefix: 'always'`) is enforced by `middleware.ts`; do not add a second `(marketing)` or `app` tree — use `[locale]/(marketing)` and `[locale]/app` only.
 */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
