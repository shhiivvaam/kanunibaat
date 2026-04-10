import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname, '../..'),
  },
  transpilePackages: [
    '@kb/api-client',
    '@kb/config',
    '@kb/database',
    '@kb/trpc',
    '@kb/types',
    '@kb/ui',
    '@kb/utils',
  ],
  serverExternalPackages: ['postgres', 'better-auth'],
};

export default nextConfig;
