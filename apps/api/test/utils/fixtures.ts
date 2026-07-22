import { randomUUID } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { deriveDidKeyDocument } from '@signa-chain/vc-sdk';
import { IssuerService } from '../../src/modules/issuer/issuer.service.js';
import { KMS_PROVIDER_TOKEN, type KmsProvider } from '../../src/common/kms/index.js';
import { TEST_ENV } from '../test-env.js';

export const TEST_ISSUER_PASSWORD = 'Test-Password-123!';

export interface IssuerFixture {
  id: string;
  email: string;
  did: string;
  password: string;
}

/** Creates an issuer directly via the service layer (there's no public issuer-signup endpoint yet). */
export async function createTestIssuer(
  app: NestFastifyApplication,
  overrides: { onChainRegistered?: boolean } = {},
): Promise<IssuerFixture> {
  const issuerService = app.get(IssuerService);
  const kms = app.get<KmsProvider>(KMS_PROVIDER_TOKEN);

  const suffix = randomUUID();
  const keyId = `test-issuer-${suffix}`;
  const { publicKey } = await kms.generateKeyPair(keyId);
  const { did, publicKeyMultibase } = deriveDidKeyDocument(publicKey);
  const email = `issuer-${suffix}@example.com`;
  const passwordHash = await bcrypt.hash(TEST_ISSUER_PASSWORD, 4); // low cost factor — speed, not security, in tests

  const entity = await issuerService.createForSeed({
    email,
    passwordHash,
    did,
    name: 'Test University',
    legalName: 'Test University Legal Name',
    country: 'EC',
    publicKeyMultibase,
    keyId,
  });

  if (overrides.onChainRegistered) {
    await issuerService.markOnChainRegistered(entity.id, `0xtest${suffix.replace(/-/g, '')}`);
  }

  return { id: entity.id, email, did, password: TEST_ISSUER_PASSWORD };
}

export async function loginIssuer(
  app: NestFastifyApplication,
  email: string,
  password: string,
): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/v1/auth/login')
    .send({ email, password })
    .expect(201);
  return res.body.accessToken as string;
}

/** Registers an issuer through the real HTTP onboarding endpoint (POST /v1/issuer/register). */
export async function registerTestIssuer(
  app: NestFastifyApplication,
  overrides: Partial<{
    email: string;
    password: string;
    name: string;
    legalName: string;
    country: string;
    website: string;
  }> = {},
): Promise<{ email: string; password: string; accessToken: string; refreshToken: string }> {
  const suffix = randomUUID();
  const email = overrides.email ?? `onboarded-issuer-${suffix}@example.com`;
  const password = overrides.password ?? TEST_ISSUER_PASSWORD;

  const res = await request(app.getHttpServer())
    .post('/v1/issuer/register')
    .set('x-onboarding-secret', TEST_ENV.ISSUER_ONBOARDING_SECRET)
    .send({
      email,
      password,
      name: overrides.name ?? 'Onboarded University',
      legalName: overrides.legalName ?? 'Onboarded University Legal Name',
      country: overrides.country ?? 'EC',
      ...(overrides.website ? { website: overrides.website } : {}),
    })
    .expect(201);

  return {
    email,
    password,
    accessToken: res.body.accessToken as string,
    refreshToken: res.body.refreshToken as string,
  };
}

export interface HolderFixture {
  email: string;
  password: string;
  accessToken: string;
}

export async function registerTestHolder(app: NestFastifyApplication): Promise<HolderFixture> {
  const suffix = randomUUID();
  const email = `holder-${suffix}@example.com`;
  const password = 'Holder-Password-123!';

  const res = await request(app.getHttpServer())
    .post('/v1/holders/register')
    .send({ email, password, name: 'Test Holder' })
    .expect(201);

  return { email, password, accessToken: res.body.accessToken as string };
}
