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

describe('Public verification (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await bootstrapTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 404 for a nonexistent credential', async () => {
    await request(app.getHttpServer()).get('/v1/verify/urn:uuid:does-not-exist').expect(404);
  });

  it('verifies a freshly issued credential as valid, with no auth required', async () => {
    const issuer = await createTestIssuer(app);
    const token = await loginIssuer(app, issuer.email, TEST_ISSUER_PASSWORD);

    const issueRes = await request(app.getHttpServer())
      .post('/v1/credentials')
      .set('Authorization', `Bearer ${token}`)
      .send(VALID_CREDENTIAL_PAYLOAD)
      .expect(201);
    const credentialId = issueRes.body.id as string;

    const verifyRes = await request(app.getHttpServer())
      .get(`/v1/verify/${encodeURIComponent(credentialId)}`)
      .expect(200);

    expect(verifyRes.body.status).toBe('valid');
    expect(verifyRes.body.signatureValid).toBe(true);
  });

  it('reflects revocation in the verification result', async () => {
    const issuer = await createTestIssuer(app);
    const token = await loginIssuer(app, issuer.email, TEST_ISSUER_PASSWORD);

    const issueRes = await request(app.getHttpServer())
      .post('/v1/credentials')
      .set('Authorization', `Bearer ${token}`)
      .send(VALID_CREDENTIAL_PAYLOAD)
      .expect(201);
    const credentialId = issueRes.body.id as string;

    await request(app.getHttpServer())
      .patch(`/v1/credentials/${encodeURIComponent(credentialId)}/revoke`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const verifyRes = await request(app.getHttpServer())
      .get(`/v1/verify/${encodeURIComponent(credentialId)}`)
      .expect(200);

    expect(verifyRes.body.status).toBe('revoked');
  });
});
