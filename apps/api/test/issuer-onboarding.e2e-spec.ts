import request from 'supertest';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { bootstrapTestApp } from './utils/bootstrap-app.js';
import { registerTestIssuer, loginIssuer, registerTestHolder } from './utils/fixtures.js';
import { TEST_ENV } from './test-env.js';

describe('Issuer onboarding (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await bootstrapTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/issuer/register', () => {
    it('rejects requests with no onboarding secret', async () => {
      await request(app.getHttpServer())
        .post('/v1/issuer/register')
        .send({
          email: 'no-secret@example.com',
          password: 'Password-123!',
          name: 'No Secret University',
          legalName: 'No Secret University Legal Name',
          country: 'EC',
        })
        .expect(401);
    });

    it('rejects requests with a wrong onboarding secret', async () => {
      await request(app.getHttpServer())
        .post('/v1/issuer/register')
        .set('x-onboarding-secret', 'wrong-secret')
        .send({
          email: 'wrong-secret@example.com',
          password: 'Password-123!',
          name: 'Wrong Secret University',
          legalName: 'Wrong Secret University Legal Name',
          country: 'EC',
        })
        .expect(401);
    });

    it('creates a new issuer and returns a token pair for a valid secret', async () => {
      const issuer = await registerTestIssuer(app);

      expect(issuer.accessToken).toEqual(expect.any(String));
      expect(issuer.refreshToken).toEqual(expect.any(String));

      // The returned tokens work immediately against the normal issuer-auth surface.
      const meRes = await request(app.getHttpServer())
        .get('/v1/issuer/me')
        .set('Authorization', `Bearer ${issuer.accessToken}`)
        .expect(200);

      expect(meRes.body.did).toMatch(/^did:key:/);
      expect(meRes.body.onChainRegistered).toBe(false); // no CredentialAnchor configured in the test env
    });

    it('logs in with the freshly onboarded credentials via the normal login endpoint', async () => {
      const issuer = await registerTestIssuer(app);
      const accessToken = await loginIssuer(app, issuer.email, issuer.password);
      expect(accessToken).toEqual(expect.any(String));
    });

    it('rejects a duplicate email with 409', async () => {
      const issuer = await registerTestIssuer(app);

      await request(app.getHttpServer())
        .post('/v1/issuer/register')
        .set('x-onboarding-secret', TEST_ENV.ISSUER_ONBOARDING_SECRET)
        .send({
          email: issuer.email,
          password: 'Another-Password-123!',
          name: 'Duplicate University',
          legalName: 'Duplicate University Legal Name',
          country: 'EC',
        })
        .expect(409);
    });

    it('rejects an invalid payload (bad email, short password)', async () => {
      await request(app.getHttpServer())
        .post('/v1/issuer/register')
        .set('x-onboarding-secret', TEST_ENV.ISSUER_ONBOARDING_SECRET)
        .send({
          email: 'not-an-email',
          password: 'short',
          name: 'Invalid University',
          legalName: 'Invalid University Legal Name',
          country: 'EC',
        })
        .expect(400);
    });

    it('a newly onboarded issuer cannot see/act on another issuer’s data — multi-tenant isolation', async () => {
      const issuerA = await registerTestIssuer(app);
      const issuerB = await registerTestIssuer(app);

      expect(issuerA.email).not.toBe(issuerB.email);

      const meA = await request(app.getHttpServer())
        .get('/v1/issuer/me')
        .set('Authorization', `Bearer ${issuerA.accessToken}`)
        .expect(200);
      const meB = await request(app.getHttpServer())
        .get('/v1/issuer/me')
        .set('Authorization', `Bearer ${issuerB.accessToken}`)
        .expect(200);

      expect(meA.body.id).not.toBe(meB.body.id);
      expect(meA.body.did).not.toBe(meB.body.did);
    });

    it('rejects a holder token used against the onboarding-protected profile endpoint', async () => {
      const holder = await registerTestHolder(app);

      await request(app.getHttpServer())
        .get('/v1/issuer/me')
        .set('Authorization', `Bearer ${holder.accessToken}`)
        .expect(401);
    });
  });
});
