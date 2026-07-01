import { MerkleTree } from '../merkle/tree.js';

describe('MerkleTree', () => {
  const toBytes = (s: string): Uint8Array => new TextEncoder().encode(s);

  it('throws on empty leaves', () => {
    expect(() => new MerkleTree([])).toThrow();
  });

  it('single leaf: root equals sha256(sha256(leaf))', () => {
    const tree = new MerkleTree([toBytes('a')]);
    expect(tree.rootHex).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it('root is deterministic for same input', () => {
    const leaves = ['a', 'b', 'c'].map(toBytes);
    const t1 = new MerkleTree(leaves);
    const t2 = new MerkleTree(leaves);
    expect(t1.rootHex).toBe(t2.rootHex);
  });

  it('different inputs produce different roots', () => {
    const t1 = new MerkleTree(['a', 'b'].map(toBytes));
    const t2 = new MerkleTree(['a', 'c'].map(toBytes));
    expect(t1.rootHex).not.toBe(t2.rootHex);
  });

  it('proof verifies correctly for all leaves', () => {
    const leaves = ['alpha', 'beta', 'gamma', 'delta'].map(toBytes);
    const tree = new MerkleTree(leaves);

    for (let i = 0; i < leaves.length; i++) {
      const proof = tree.getProof(i);
      expect(MerkleTree.verify(proof, tree.rootHex)).toBe(true);
    }
  });

  it('proof fails for tampered root', () => {
    const tree = new MerkleTree(['a', 'b', 'c'].map(toBytes));
    const proof = tree.getProof(0);
    const fakeRoot = '0x' + '0'.repeat(64);
    expect(MerkleTree.verify(proof, fakeRoot)).toBe(false);
  });

  it('odd number of leaves (padding) works correctly', () => {
    const tree = new MerkleTree(['a', 'b', 'c'].map(toBytes));
    const proof = tree.getProof(2);
    expect(MerkleTree.verify(proof, tree.rootHex)).toBe(true);
  });
});
