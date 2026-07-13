import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env['NEXT_PUBLIC_SENTRY_DSN'],
  environment: process.env.NODE_ENV,
  // Same-origin tunnel (wired via withSentryConfig's tunnelRoute in next.config.ts)
  // so browser events don't need connect-src opened to an external Sentry host —
  // keeps the strict CSP in middleware.ts untouched.
  tunnel: '/monitoring',
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
