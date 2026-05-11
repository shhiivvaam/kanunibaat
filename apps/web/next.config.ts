import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import path from 'node:path';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
  turbopack: {
    root: path.join(__dirname, '../..'),
  },
  async rewrites() {
    const internal =
      process.env.API_INTERNAL_URL?.trim().replace(/\/$/, '') ||
      process.env.INTERNAL_API_URL?.trim().replace(/\/$/, '') ||
      'http://127.0.0.1:4000';
    return [{ source: '/api/backend/:path*', destination: `${internal}/:path*` }];
  },
  transpilePackages: [
    '@jurisly/api-client',
    '@jurisly/config',
    '@jurisly/database',
    '@jurisly/trpc',
    '@jurisly/types',
    '@jurisly/ui',
    '@jurisly/utils',
  ],
  serverExternalPackages: ['postgres', 'better-auth'],
};

export default withNextIntl(nextConfig);
