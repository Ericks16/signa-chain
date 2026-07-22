// Single source of truth for e2e test env config — imported by both
// setup-env.ts (per test-worker process.env) and global-setup.ts (DB
// bootstrap), so the two can never drift out of sync.
export const TEST_ENV = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://signachain:password@localhost:5433/signachain_test',
  JWT_SECRET: 'e2e-test-only-secret-do-not-use-in-production-aaaaaaaaaaaaaaaaaaaaaaaaaa',
  JWT_EXPIRY: '1h',
  JWT_REFRESH_EXPIRY: '7d',
  ALLOWED_ORIGINS: 'http://localhost:3000',
  KMS_PROVIDER: 'local',
  // AES-256-GCM needs exactly 32 bytes — fixed test-only key, never used outside this suite.
  KMS_LOCAL_MASTER_KEY: Buffer.alloc(32, 7).toString('base64'),
  ISSUER_ONBOARDING_SECRET: 'e2e-test-only-onboarding-secret-do-not-use-in-production',
} as const;

export const TEST_ADMIN_DATABASE_URL = 'postgresql://signachain:password@localhost:5433/postgres';
export const TEST_DB_NAME = 'signachain_test';
