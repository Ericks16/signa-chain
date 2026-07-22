// Standalone (plain CJS, no ts-node) so it can run as the first step of the
// Playwright webServer command for apps/web's e2e suite, before the compiled
// API server ever boots. Mirrors apps/api/test/global-setup.ts (same
// drop/recreate + terminate-lingering-connections pattern), but targets the
// dedicated `signachain_e2e_web` database instead of the Jest suite's
// `signachain_test` so the two suites never fight over the same schema.
const { Client } = require('pg');

async function main() {
  const adminUrl = process.env.E2E_ADMIN_DATABASE_URL;
  const dbName = process.env.E2E_DB_NAME;

  if (!adminUrl || !dbName) {
    throw new Error('E2E_ADMIN_DATABASE_URL and E2E_DB_NAME must both be set');
  }

  const admin = new Client({ connectionString: adminUrl });
  await admin.connect();
  try {
    await admin.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
      [dbName],
    );
    await admin.query(`DROP DATABASE IF EXISTS "${dbName}"`);
    await admin.query(`CREATE DATABASE "${dbName}"`);
  } finally {
    await admin.end();
  }

  console.log(`[reset-e2e-db] "${dbName}" recreated.`);
}

main().catch((err) => {
  console.error('[reset-e2e-db] failed:', err);
  process.exit(1);
});
