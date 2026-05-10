/**
 * Canonical public origin for SEO (sitemap, robots, metadataBase).
 * Set NEXT_PUBLIC_APP_URL in production (e.g. https://tryjurisly.com).
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (raw) return raw.replace(/\/$/, '');
  return 'https://tryjurisly.com';
}
