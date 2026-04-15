import { EMERGENCY_SCENARIOS } from '@kb/emergency-guide';
import type { MetadataRoute } from 'next';

import { getAllSlugs } from '@/lib/blog';
import { getSiteUrl } from '@/lib/site-url';

const STATIC_PATHS = [
  '/',
  '/features',
  '/for-lawyers',
  '/lawyers',
  '/pricing',
  '/about',
  '/blog',
  '/legal-qa',
  '/document-review',
  '/notice-scanner',
  '/kya-karein',
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

  const emergencyGuideEntries: MetadataRoute.Sitemap = EMERGENCY_SCENARIOS.map((s) => ({
    url: `${base}/kya-karein/${s.slug}`,
    lastModified: lastMod,
    changeFrequency: 'monthly',
    priority: 0.72,
  }));

  return [...staticEntries, ...blogEntries, ...emergencyGuideEntries];
}
