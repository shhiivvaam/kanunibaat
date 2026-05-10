import { defineConfig, devices } from '@playwright/test';

/**
 * Browser E2E (not part of default `pnpm test` / CI — run locally after `pnpm exec playwright install`).
 * Start web: `pnpm --filter web dev` then `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 pnpm --filter web test:e2e`
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
