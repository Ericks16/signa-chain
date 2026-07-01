import { createDidKey, resolveDid, extractPublicKey } from '../did/did-key.js';

describe('DID Key', () => {
  it('creates a valid did:key DID', async () => {
    const { did } = await createDidKey();
    expect(did).toMatch(/^did:key:z[1-9A-HJ-NP-Za-km-z]+$/);
  });

  it('DID document has correct structure', async () => {
    const { did, didDocument } = await createDidKey();
    expect(didDocument.id).toBe(did);
    expect(didDocument.verificationMethod).toHaveLength(1);
    expect(didDocument.assertionMethod).toContain(didDocument.verificationMethod[0]?.id);
  });

  it('resolves a created DID deterministically', async () => {
    const { did } = await createDidKey();
    const result = resolveDid(did);
    expect(result.didDocument).not.toBeNull();
    expect(result.didDocument?.id).toBe(did);
    expect(result.didResolutionMetadata.error).toBeUndefined();
  });

  it('returns error for unsupported DID method', () => {
    const result = resolveDid('did:ethr:0x1234');
    expect(result.didDocument).toBeNull();
    expect(result.didResolutionMetadata.error).toBe('unsupportedDidMethod');
  });

  it('extracts public key matching generated key', async () => {
    const { did, publicKey } = await createDidKey();
    const extracted = extractPublicKey(did);
    expect(extracted).toEqual(publicKey);
  });
});
