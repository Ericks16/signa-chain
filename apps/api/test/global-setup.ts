import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Client } from 'pg';
import { DataSource } from 'typeorm';

// Jest's globalSetup runs outside the normal test module resolver (no
// moduleNameMapper for the .js-suffixed relative imports used elsewhere in
// this repo), so these are inlined here rather than imported from
// test-env.ts to avoid an unresolvable require at this specific lifecycle
// hook. setup-env.ts (loaded via setupFiles, not globalSetup) still imports
// test-env.ts normally — keep both in sync if either changes.
const TEST_ADMIN_DATABASE_URL = 'postgresql://signachain:password@localhost:5433/postgres';
const TEST_DB_NAME = 'signachain_test';
const TEST_DATABASE_URL = 'postgresql://signachain:password@localhost:5433/signachain_test';

export default async function globalSetup(): Promise<void> {
  await rm(join(tmpdir(), 'signachain-e2e-keys'), { recursive: true, force: true });

  const admin = new Client({ connectionString: TEST_ADMIN_DATABASE_URL });
  await admin.connect();
  try {
    // Terminate lingering connections from a previous interrupted run before dropping.
    await admin.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
      [TEST_DB_NAME],
    );
    await admin.query(`DROP DATABASE IF EXISTS "${TEST_DB_NAME}"`);
    await admin.query(`CREATE DATABASE "${TEST_DB_NAME}"`);
  } finally {
    await admin.end();
  }

  const dataSource = new DataSource({
    type: 'postgres',
    url: TEST_DATABASE_URL,
    entities: ['src/**/*.entity.ts'],
    migrations: ['src/database/migrations/*.ts'],
  });

  await dataSource.initialize();
  await dataSource.runMigrations();
  await dataSource.destroy();
}
