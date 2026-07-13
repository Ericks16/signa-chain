import request from 'supertest';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { bootstrapTestApp } from './utils/bootstrap-app.js';
import { createTestIssuer, loginIssuer, TEST_ISSUER_PASSWORD } from './utils/fixtures.js';

const VALID_CREDENTIAL_PAYLOAD = {
  subjectDid: 'did:key:z6MkTestSubjectPlaceholder',
  givenName: 'Ada',
  familyName: 'Lovelace',
  degreeType: 'bachelor',
  degreeName: 'Computer Science',
  institution: 'Escuela Politécnica Nacional',
  graduationDate: '2024-06-30',
};

describe('Credential lifecycle (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await bootstrapTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects unauthenticated issuance', async () => {
    await request(app.getHttpServer())
      .post('/v1/credentials')
      .send(VALID_CREDENTIAL_PAYLOAD)
      .expect(401);
  });

  it('rejects an invalid payload (missing required fields)', async () => {
    const issuer = await createTestIssuer(app);
    const token = await loginIssuer(app, issuer.email, TEST_ISSUER_PASSWORD);

    await request(app.getHttpServer())
      .post('/v1/credentials')
      .set('Authorization', `Bearer ${token}`)
      .send({ givenName: 'Ada' })
      .expect(400);
  });

  it('issues, lists, fetches and revokes a credential end to end', async () => {
    const issuer = await createTestIssuer(app);
    const token = await loginIssuer(app, issuer.email, TEST_ISSUER_PASSWORD);

    const issueRes = await request(app.getHttpServer())
      .post('/v1/credentials')
      .set('Authorization', `Bearer ${token}`)
      .send(VALID_CREDENTIAL_PAYLOAD)
      .expect(201);

    expect(issueRes.body).toMatchObject({
      id: expect.any(String),
      proof: expect.any(Object),
    });
    const credentialId = issueRes.body.id as string;

    const listRes = await request(app.getHttpServer())
      .get('/v1/credentials')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(listRes.body.some((c: { credentialId: string }) => c.credentialId === credentialId)).toBe(
      true,
    );

    const getRes = await request(app.getHttpServer())
      .get(`/v1/credentials/${credentialId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(getRes.body.status).toBe('issued');

    const revokeRes = await request(app.getHttpServer())
      .patch(`/v1/credentials/${credentialId}/revoke`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(revokeRes.body.status).toBe('revoked');

    // Revoking twice is idempotent, not an error.
    await request(app.getHttpServer())
      .patch(`/v1/credentials/${credentialId}/revoke`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('does not let one issuer see or revoke another issuer\'s credential', async () => {
    const issuerA = await createTestIssuer(app);
    const tokenA = await loginIssuer(app, issuerA.email, TEST_ISSUER_PASSWORD);
    const issuerB = await createTestIssuer(app);
    const tokenB = await loginIssuer(app, issuerB.email, TEST_ISSUER_PASSWORD);

    const issueRes = await request(app.getHttpServer())
      .post('/v1/credentials')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(VALID_CREDENTIAL_PAYLOAD)
      .expect(201);
    const credentialId = issueRes.body.id as string;

    await request(app.getHttpServer())
      .get(`/v1/credentials/${credentialId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);

    await request(app.getHttpServer())
      .patch(`/v1/credentials/${credentialId}/revoke`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);
  });
});
