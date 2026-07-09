import { createDidKey } from '../did/did-key.js';
import { signBytes } from '../crypto/ed25519.js';
import { issueCredential } from '../credential/issuer.js';
import { deserializeCredential, serializeCredential } from '../credential/serializer.js';
import { verifyCredential } from '../verification/verifier.js';
import { buildMerkleBatch } from '../merkle/credential-merkle.js';
import { MerkleTree } from '../merkle/tree.js';

describe('Credential issuance and verification — full flow', () => {
  it('issues a credential with a valid proof', async () => {
    const issuer = await createDidKey();
    const holder = await createDidKey();

    const vc = await issueCredential({
      issuerDid: issuer.did,
      sign: (msg) => signBytes(msg, issuer.privateKey),
      subjectDid: holder.did,
      credentialSubject: {
        givenName: 'María',
        familyName: 'Pérez',
        degreeName: 'Ingeniería en Sistemas',
        institution: 'Escuela Politécnica Nacional',
        graduationDate: '2024-07-01',
      },
      additionalTypes: ['AcademicDegreeCredential'],
    });

    expect(vc.proof).toBeDefined();
    expect(vc.proof?.cryptosuite).toBe('eddsa-rdfc-2022');
    expect(vc.issuer).toBe(issuer.did);
    const subject = vc.credentialSubject as Record<string, unknown>;
    expect(subject['givenName']).toBe('María');
  });

  it('verifies a valid credential as status: valid', async () => {
    const issuer = await createDidKey();
    const holder = await createDidKey();

    const vc = await issueCredential({
      issuerDid: issuer.did,
      sign: (msg) => signBytes(msg, issuer.privateKey),
      subjectDid: holder.did,
      credentialSubject: { degreeName: 'Computer Science' },
    });

    const result = await verifyCredential({ credential: vc });
    expect(result.status).toBe('valid');
    expect(result.signatureValid).toBe(true);
    expect(result.revoked).toBe(false);
    expect(result.expired).toBe(false);
  });

  it('detects a tampered credential', async () => {
    const issuer = await createDidKey();
    const holder = await createDidKey();

    const vc = await issueCredential({
      issuerDid: issuer.did,
      sign: (msg) => signBytes(msg, issuer.privateKey),
      subjectDid: holder.did,
      credentialSubject: { degreeName: 'Original Degree' },
    });

    const tampered = {
      ...vc,
      credentialSubject: { ...vc.credentialSubject, degreeName: 'Tampered Degree' },
    };

    const result = await verifyCredential({ credential: tampered });
    expect(result.status).toBe('invalid_signature');
    expect(result.signatureValid).toBe(false);
  });

  it('detects a revoked credential', async () => {
    const issuer = await createDidKey();
    const holder = await createDidKey();

    const vc = await issueCredential({
      issuerDid: issuer.did,
      sign: (msg) => signBytes(msg, issuer.privateKey),
      subjectDid: holder.did,
      credentialSubject: { degreeName: 'Revoked Degree' },
    });

    const result = await verifyCredential({ credential: vc, isRevoked: true });
    expect(result.status).toBe('revoked');
    expect(result.revoked).toBe(true);
  });

  it('detects an expired credential', async () => {
    const issuer = await createDidKey();
    const holder = await createDidKey();

    const pastDate = new Date('2020-01-01');

    const vc = await issueCredential({
      issuerDid: issuer.did,
      sign: (msg) => signBytes(msg, issuer.privateKey),
      subjectDid: holder.did,
      credentialSubject: { degreeName: 'Old Credential' },
      expirationDate: pastDate,
    });

    const result = await verifyCredential({ credential: vc });
    expect(result.status).toBe('expired');
    expect(result.expired).toBe(true);
  });

  it('serializes and deserializes without data loss', async () => {
    const issuer = await createDidKey();
    const holder = await createDidKey();

    const vc = await issueCredential({
      issuerDid: issuer.did,
      sign: (msg) => signBytes(msg, issuer.privateKey),
      subjectDid: holder.did,
      credentialSubject: { degreeName: 'Ingeniería' },
    });

    const json = serializeCredential(vc);
    const parsed = deserializeCredential(json);
    expect(parsed.id).toBe(vc.id);
    expect(parsed.proof?.proofValue).toBe(vc.proof?.proofValue);
  });
});

describe('Merkle batch + verification', () => {
  it('batch proof verifies for all credentials in the batch', async () => {
    const issuer = await createDidKey();

    const credentials = await Promise.all(
      ['Ana', 'Luis', 'Sofia'].map((name) =>
        issueCredential({
          issuerDid: issuer.did,
          sign: (msg) => signBytes(msg, issuer.privateKey),
          subjectDid: `did:key:z${name}`,
          credentialSubject: { givenName: name },
        }),
      ),
    );

    const batch = buildMerkleBatch(credentials, '0xdeadbeef', 42);

    for (const anchored of batch.credentials) {
      const merkleValid = MerkleTree.verify(anchored.merkleProof, batch.root);
      expect(merkleValid).toBe(true);

      const result = await verifyCredential({
        credential: anchored.credential,
        merkleProof: anchored.merkleProof,
        anchoredRootHex: batch.root,
      });
      expect(result.status).toBe('valid');
      expect(result.merkleProofValid).toBe(true);
    }
  });
});
