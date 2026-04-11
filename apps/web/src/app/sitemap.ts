import type { MetadataRoute } from 'next';

import { getAllSlugs } from '@/lib/blog';
import { getSiteUrl } from '@/lib/site-url';

const STATIC_PATHS = [
  '/',
  '/features',
  '/for-lawyers',
  '/pricing',
  '/about',
  '/blog',
  '/legal-qa',
  '/document-review',
  '/lawyer-connect',
  '/know-your-rights',
  '/privacy',
  '/terms',
  '/privacy-charter',
  '/waitlist',
  '/waitlist/lawyer',
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const lastMod = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${base}${path}`,
    lastModified: lastMod,
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : path === '/features' || path === '/for-lawyers' ? 0.9 : 0.7,
  }));

  const blogSlugs = getAllSlugs();
  const blogEntries: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
    url: `${base}/blog/${slug}`,
    lastModified: lastMod,
    changeFrequency: 'monthly',
    priority: 0.65,
  }));

  return [...staticEntries, ...blogEntries];
}
