import type { VerifiableCredential, MerkleProof, MerkleAnchoredCredential } from '@signa-chain/types';
import { MerkleTree } from './tree.js';
import { sha256Bytes } from '../crypto/hash.js';
import { canonicalize } from '../credential/serializer.js';

export interface MerkleBatch {
  root: string;
  credentials: MerkleAnchoredCredential[];
}

export function buildCredentialLeaf(credential: VerifiableCredential): Uint8Array {
  const canonical = canonicalize({ id: credential.id, proof: credential.proof });
  return sha256Bytes(canonical);
}

export function buildMerkleBatch(
  credentials: VerifiableCredential[],
  anchorTxHash = '',
  anchorBlockNumber = 0,
): MerkleBatch {
  if (credentials.length === 0) throw new Error('Cannot build Merkle batch with zero credentials');

  const leaves = credentials.map(buildCredentialLeaf);
  const tree = new MerkleTree(leaves);

  const anchored: MerkleAnchoredCredential[] = credentials.map((credential, i) => {
    const proof: MerkleProof = tree.getProof(i);
    return {
      credential,
      merkleProof: proof,
      merkleRoot: tree.rootHex,
      anchorTxHash,
      anchorBlockNumber,
    };
  });

  return { root: tree.rootHex, credentials: anchored };
}
