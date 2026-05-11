export async function register() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  // Skip Sentry initialization during build/prerender to avoid issues with React context
  if (process.env.NEXT_PHASE === 'phase-production-build') return;

  const Sentry = await import('@sentry/nextjs');

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0),
  });
}
