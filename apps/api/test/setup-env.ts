import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { TEST_ENV } from './test-env.js';

for (const [key, value] of Object.entries(TEST_ENV)) {
  process.env[key] = value;
}

// Shared across the whole run (not per-file) so KMS key lookups stay
// consistent; global-setup.ts wipes this directory before tests start.
process.env['KMS_LOCAL_KEYS_PATH'] = join(tmpdir(), 'signachain-e2e-keys');
