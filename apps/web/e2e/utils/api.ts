import type { APIRequestContext } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { API_URL, ISSUER_ONBOARDING_SECRET } from '../constants';

export interface OnboardedIssuer {
  email: string;
  password: string;
  accessToken: string;
  did: string;
}

/** Onboards a fresh issuer through the real API endpoint (no UI exists for this yet). */
export async function onboardIssuer(
  request: APIRequestContext,
  overrides: Partial<{ email: string; password: string; name: string }> = {},
): Promise<OnboardedIssuer> {
  const suffix = randomUUID();
  const email = overrides.email ?? `e2e-issuer-${suffix}@example.com`;
  const password = overrides.password ?? 'Playwright-Issuer-123!';

  const res = await request.post(`${API_URL}/v1/issuer/register`, {
    headers: { 'x-onboarding-secret': ISSUER_ONBOARDING_SECRET },
    data: {
      email,
      password,
      name: overrides.name ?? 'Universidad E2E',
      legalName: 'Universidad E2E Legal',
      country: 'EC',
    },
  });

  if (!res.ok()) {
    throw new Error(`onboardIssuer failed: ${res.status()} ${await res.text()}`);
  }

  const body = (await res.json()) as { accessToken: string };

  const meRes = await request.get(`${API_URL}/v1/issuer/me`, {
    headers: { Authorization: `Bearer ${body.accessToken}` },
  });
  const me = (await meRes.json()) as { did: string };

  return { email, password, accessToken: body.accessToken, did: me.did };
}
