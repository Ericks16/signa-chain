import { defineConfig, devices } from '@playwright/test';
import { API_PORT, API_URL, ISSUER_ONBOARDING_SECRET, WEB_PORT, WEB_URL } from './e2e/constants';

/**
 * Dedicated, isolated stack for this suite — separate ports (3100/4100) and a
 * separate database (`signachain_e2e_web`, reset+migrated fresh on every run
 * via reset-e2e-db.cjs) so this never collides with a developer's own `pnpm dev`
 * session or the API's own Jest e2e suite (which uses `signachain_test`).
 *
 * The web server runs a real production build (`next build && next start`),
 * not `next dev` — `next dev` never statically prerenders, so it can't catch
 * the CSP-nonce/force-dynamic class of bug that only shows up in a real build
 * (see the "Next.js Gotchas" note this suite exists partly to guard against).
 */
const apiEnv = {
  NODE_ENV: 'test',
  PORT: String(API_PORT),
  DATABASE_URL: 'postgresql://signachain:password@localhost:5433/signachain_e2e_web',
  E2E_ADMIN_DATABASE_URL: 'postgresql://signachain:password@localhost:5433/postgres',
  E2E_DB_NAME: 'signachain_e2e_web',
  ALLOWED_ORIGINS: WEB_URL,
  JWT_SECRET: 'playwright-e2e-web-only-secret-do-not-use-in-production-aaaaaaaaaaaaaaaaaaaaaa',
  JWT_EXPIRY: '1h',
  JWT_REFRESH_EXPIRY: '7d',
  KMS_PROVIDER: 'local',
  KMS_LOCAL_KEYS_PATH: '.e2e-web-keys',
  // AES-256-GCM needs exactly 32 bytes — fixed test-only key, never used outside this suite.
  KMS_LOCAL_MASTER_KEY: Buffer.alloc(32, 9).toString('base64'),
  ISSUER_ONBOARDING_SECRET,
  // Explicitly blank so a developer's ambient shell env can't leak a real DSN
  // into this throwaway server and send noise to the real Sentry project.
  SENTRY_DSN: '',
  CREDENTIAL_ANCHOR_ADDRESS: '',
};

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: process.env['CI'] ? [['list'], ['html', { open: 'never' }]] : 'list',
  globalTeardown: './e2e/global-teardown.ts',
  use: {
    baseURL: WEB_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command:
        'node scripts/reset-e2e-db.cjs && pnpm run migration:run && pnpm exec nest start',
      cwd: '../api',
      url: `${API_URL}/health`,
      env: apiEnv,
      reuseExistingServer: false,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'pnpm exec next build && pnpm exec next start -p ' + WEB_PORT,
      cwd: '.',
      url: WEB_URL,
      env: {
        NEXT_PUBLIC_API_URL: API_URL,
        PORT: String(WEB_PORT),
        NODE_ENV: 'production',
        NEXT_PUBLIC_SENTRY_DSN: '',
        SENTRY_DSN: '',
      },
      reuseExistingServer: false,
      timeout: 180_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
});
