import { generateEd25519KeyPair, signBytes, verifyBytes } from '../crypto/ed25519.js';
import { encodeMultibase, decodeMultibase } from '../crypto/multibase.js';
import { sha256Hex } from '../crypto/hash.js';

describe('Ed25519 crypto', () => {
  it('generates a keypair with 32-byte keys', async () => {
    const { privateKey, publicKey } = await generateEd25519KeyPair();
    expect(privateKey).toHaveLength(32);
    expect(publicKey).toHaveLength(32);
  });

  it('sign and verify roundtrip succeeds', async () => {
    const { privateKey, publicKey } = await generateEd25519KeyPair();
    const msg = new TextEncoder().encode('hello signa chain');
    const sig = await signBytes(msg, privateKey);
    const valid = await verifyBytes(sig, msg, publicKey);
    expect(valid).toBe(true);
  });

  it('rejects tampered message', async () => {
    const { privateKey, publicKey } = await generateEd25519KeyPair();
    const msg = new TextEncoder().encode('original');
    const sig = await signBytes(msg, privateKey);
    const tampered = new TextEncoder().encode('tampered');
    const valid = await verifyBytes(sig, tampered, publicKey);
    expect(valid).toBe(false);
  });

  it('rejects wrong public key', async () => {
    const kp1 = await generateEd25519KeyPair();
    const kp2 = await generateEd25519KeyPair();
    const msg = new TextEncoder().encode('message');
    const sig = await signBytes(msg, kp1.privateKey);
    const valid = await verifyBytes(sig, msg, kp2.publicKey);
    expect(valid).toBe(false);
  });
});

describe('Multibase encoding', () => {
  it('encode and decode roundtrip', () => {
    const bytes = new Uint8Array([1, 2, 3, 200, 255, 0]);
    const encoded = encodeMultibase(bytes);
    expect(encoded.startsWith('z')).toBe(true);
    const decoded = decodeMultibase(encoded);
    expect(decoded).toEqual(bytes);
  });
});

describe('SHA-256 hash', () => {
  it('produces deterministic hex output', () => {
    const h1 = sha256Hex('test');
    const h2 = sha256Hex('test');
    expect(h1).toBe(h2);
    expect(h1).toHaveLength(64);
  });
});
