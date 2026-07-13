import request from 'supertest';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { bootstrapTestApp } from './utils/bootstrap-app.js';
import { createTestIssuer, loginIssuer, TEST_ISSUER_PASSWORD } from './utils/fixtures.js';
import { BlockchainService } from '../src/common/blockchain/blockchain.service.js';

const VALID_CREDENTIAL_PAYLOAD = {
  subjectDid: 'did:key:z6MkTestSubjectPlaceholder',
  givenName: 'Ada',
  familyName: 'Lovelace',
  degreeType: 'bachelor',
  degreeName: 'Computer Science',
  institution: 'Escuela Politécnica Nacional',
  graduationDate: '2024-06-30',
};

async function issueOne(app: NestFastifyApplication, token: string): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/v1/credentials')
    .set('Authorization', `Bearer ${token}`)
    .send(VALID_CREDENTIAL_PAYLOAD)
    .expect(201);
  return res.body.id as string;
}

describe('Anchoring — CredentialAnchor not configured (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await bootstrapTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('refuses to anchor for an issuer that is not registered on-chain', async () => {
    const issuer = await createTestIssuer(app, { onChainRegistered: false });
    const token = await loginIssuer(app, issuer.email, TEST_ISSUER_PASSWORD);
    await issueOne(app, token);

    await request(app.getHttpServer())
      .post('/v1/anchoring/batch')
      .set('Authorization', `Bearer ${token}`)
      .expect(503);
  });

  it('refuses to anchor when CredentialAnchor itself is not configured, even for a registered issuer', async () => {
    // Real current production state for any issuer not yet on Amoy: onChainRegistered
    // can be true while CREDENTIAL_ANCHOR_ADDRESS/SIGNER_KEY are still unset — this must
    // fail loudly (503), never pretend to have anchored something it didn't.
    const issuer = await createTestIssuer(app, { onChainRegistered: true });
    const token = await loginIssuer(app, issuer.email, TEST_ISSUER_PASSWORD);
    await issueOne(app, token);

    await request(app.getHttpServer())
      .post('/v1/anchoring/batch')
      .set('Authorization', `Bearer ${token}`)
      .expect(503);
  });

  it('returns 404 when there is nothing unanchored to batch', async () => {
    const issuer = await createTestIssuer(app, { onChainRegistered: true });
    const token = await loginIssuer(app, issuer.email, TEST_ISSUER_PASSWORD);
    // No credentials issued for this issuer at all.

    await request(app.getHttpServer())
      .post('/v1/anchoring/batch')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });
});

describe('Anchoring — CredentialAnchor configured (e2e, mocked chain)', () => {
  let app: NestFastifyApplication;
  const mockBlockchainService = {
    anchorBatch: jest.fn(),
    revokeCredentialOnChain: jest.fn(),
    registerIssuerOnChain: jest.fn(),
  };

  beforeAll(async () => {
    app = await bootstrapTestApp((builder) =>
      builder.overrideProvider(BlockchainService).useValue(mockBlockchainService),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('anchors a batch, persists the merkle proof per credential, and verification reflects it', async () => {
    mockBlockchainService.anchorBatch.mockResolvedValueOnce({
      txHash: '0xabc123',
      blockNumber: 42,
    });

    const issuer = await createTestIssuer(app, { onChainRegistered: true });
    const token = await loginIssuer(app, issuer.email, TEST_ISSUER_PASSWORD);
    const credentialId = await issueOne(app, token);

    const batchRes = await request(app.getHttpServer())
      .post('/v1/anchoring/batch')
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    expect(batchRes.body).toMatchObject({
      anchorTxHash: '0xabc123',
      anchorBlockNumber: 42,
      credentialCount: 1,
    });
    expect(mockBlockchainService.anchorBatch).toHaveBeenCalledTimes(1);

    const verifyRes = await request(app.getHttpServer())
      .get(`/v1/verify/${encodeURIComponent(credentialId)}`)
      .expect(200);

    expect(verifyRes.body.merkleProofValid).toBe(true);
  });

  it('best-effort revokes on-chain: an on-chain failure must not block the off-chain revocation', async () => {
    mockBlockchainService.revokeCredentialOnChain.mockRejectedValueOnce(
      new Error('RPC timeout — simulated'),
    );

    const issuer = await createTestIssuer(app, { onChainRegistered: true });
    const token = await loginIssuer(app, issuer.email, TEST_ISSUER_PASSWORD);
    const credentialId = await issueOne(app, token);

    const revokeRes = await request(app.getHttpServer())
      .patch(`/v1/credentials/${encodeURIComponent(credentialId)}/revoke`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(revokeRes.body.status).toBe('revoked');
  });
});
