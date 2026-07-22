import { execSync } from 'node:child_process';

/**
 * `next build`/`next start` rewrite apps/web/tsconfig.json (adds noEmit/isolatedModules,
 * reformats the whole file) on every run — not a real project change, must never be
 * committed. Restore it automatically so this suite never leaves a dirty working tree.
 */
export default function globalTeardown(): void {
  try {
    execSync('git checkout -- tsconfig.json', { cwd: __dirname + '/..', stdio: 'ignore' });
  } catch {
    // Best-effort — if this isn't a git checkout (or tsconfig.json was already
    // clean), there's nothing to restore.
  }
}
