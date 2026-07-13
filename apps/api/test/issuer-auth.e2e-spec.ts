import request from 'supertest';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { bootstrapTestApp } from './utils/bootstrap-app.js';
import { createTestIssuer, loginIssuer, registerTestHolder, TEST_ISSUER_PASSWORD } from './utils/fixtures.js';

describe('Issuer auth (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await bootstrapTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/auth/login', () => {
    it('issues a token pair for valid credentials', async () => {
      const issuer = await createTestIssuer(app);

      const res = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: issuer.email, password: TEST_ISSUER_PASSWORD })
        .expect(201);

      expect(res.body).toMatchObject({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        expiresIn: expect.any(String),
      });
    });

    it('rejects a wrong password', async () => {
      const issuer = await createTestIssuer(app);

      await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: issuer.email, password: 'wrong-password' })
        .expect(401);
    });

    it('rejects a nonexistent email', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: 'nobody@example.com', password: 'whatever123' })
        .expect(401);
    });
  });

  describe('POST /v1/auth/refresh', () => {
    it('issues a new token pair from a valid refresh token', async () => {
      const issuer = await createTestIssuer(app);
      const loginRes = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: issuer.email, password: TEST_ISSUER_PASSWORD })
        .expect(201);

      const refreshRes = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken: loginRes.body.refreshToken })
        .expect(201);

      expect(refreshRes.body.accessToken).toEqual(expect.any(String));
    });

    it('rejects an access token used as a refresh token', async () => {
      const issuer = await createTestIssuer(app);
      const accessToken = await loginIssuer(app, issuer.email, TEST_ISSUER_PASSWORD);

      await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken: accessToken })
        .expect(401);
    });
  });

  describe('GET /v1/issuer/me', () => {
    it('rejects requests with no token', async () => {
      await request(app.getHttpServer()).get('/v1/issuer/me').expect(401);
    });

    it('returns the issuer profile for a valid token', async () => {
      const issuer = await createTestIssuer(app);
      const accessToken = await loginIssuer(app, issuer.email, TEST_ISSUER_PASSWORD);

      const res = await request(app.getHttpServer())
        .get('/v1/issuer/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.id).toBe(issuer.id);
      expect(res.body.did).toBe(issuer.did);
    });

    it('rejects a holder token — defense in depth against cross-role token reuse', async () => {
      const holder = await registerTestHolder(app);

      await request(app.getHttpServer())
        .get('/v1/issuer/me')
        .set('Authorization', `Bearer ${holder.accessToken}`)
        .expect(401);
    });
  });
});
