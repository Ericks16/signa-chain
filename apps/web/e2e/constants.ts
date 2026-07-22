// Shared between playwright.config.ts (spawns the servers) and the test
// helpers (talk to them) so the two can never drift out of sync.
export const API_PORT = 4100;
export const WEB_PORT = 3100;
export const API_URL = `http://127.0.0.1:${API_PORT}`;
export const WEB_URL = `http://127.0.0.1:${WEB_PORT}`;
export const ISSUER_ONBOARDING_SECRET = 'playwright-e2e-web-only-onboarding-secret';
