import { randomUUID } from 'node:crypto';
import request from 'supertest';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { bootstrapTestApp } from './utils/bootstrap-app.js';
import { createTestIssuer, loginIssuer, registerTestHolder, TEST_ISSUER_PASSWORD } from './utils/fixtures.js';

describe('Holder auth (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await bootstrapTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/holders/register', () => {
    it('registers a holder and returns a token pair', async () => {
      const email = `holder-${randomUUID()}@example.com`;

      const res = await request(app.getHttpServer())
        .post('/v1/holders/register')
        .send({ email, password: 'Holder-Password-123!', name: 'Ada Lovelace' })
        .expect(201);

      expect(res.body).toMatchObject({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      });
    });

    it('rejects a duplicate email', async () => {
      const holder = await registerTestHolder(app);

      await request(app.getHttpServer())
        .post('/v1/holders/register')
        .send({ email: holder.email, password: 'Another-Password-123!', name: 'Someone Else' })
        .expect(409);
    });

    it('rejects a password shorter than the minimum length', async () => {
      await request(app.getHttpServer())
        .post('/v1/holders/register')
        .send({ email: `holder-${randomUUID()}@example.com`, password: 'short', name: 'Ada' })
        .expect(400);
    });
  });

  describe('POST /v1/holders/auth/login', () => {
    it('logs a registered holder in', async () => {
      const holder = await registerTestHolder(app);

      const res = await request(app.getHttpServer())
        .post('/v1/holders/auth/login')
        .send({ email: holder.email, password: holder.password })
        .expect(201);

      expect(res.body.accessToken).toEqual(expect.any(String));
    });

    it('rejects a wrong password', async () => {
      const holder = await registerTestHolder(app);

      await request(app.getHttpServer())
        .post('/v1/holders/auth/login')
        .send({ email: holder.email, password: 'wrong-password' })
        .expect(401);
    });
  });

  describe('GET /v1/holders/me', () => {
    it('returns the holder profile for a valid token', async () => {
      const holder = await registerTestHolder(app);

      const res = await request(app.getHttpServer())
        .get('/v1/holders/me')
        .set('Authorization', `Bearer ${holder.accessToken}`)
        .expect(200);

      expect(res.body.email).toBe(holder.email);
    });

    it('rejects requests with no token', async () => {
      await request(app.getHttpServer()).get('/v1/holders/me').expect(401);
    });

    it('rejects an issuer token — defense in depth against cross-role token reuse', async () => {
      const issuer = await createTestIssuer(app);
      const issuerToken = await loginIssuer(app, issuer.email, TEST_ISSUER_PASSWORD);

      await request(app.getHttpServer())
        .get('/v1/holders/me')
        .set('Authorization', `Bearer ${issuerToken}`)
        .expect(401);
    });
  });
});
