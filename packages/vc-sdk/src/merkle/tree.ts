import { sha256Bytes } from '../crypto/hash.js';
import type { MerkleProof } from '@signa-chain/types';

function hashPair(left: Uint8Array, right: Uint8Array): Uint8Array {
  const combined = new Uint8Array(left.length + right.length);
  combined.set(left);
  combined.set(right, left.length);
  return sha256Bytes(combined);
}

export class MerkleTree {
  private readonly layers: Uint8Array[][];

  constructor(leaves: Uint8Array[]) {
    if (leaves.length === 0) throw new Error('MerkleTree requires at least one leaf');

    const hashedLeaves = leaves.map((l) => sha256Bytes(l));
    this.layers = [hashedLeaves];
    this.buildTree();
  }

  private buildTree(): void {
    let currentLayer = this.layers[0];
    if (!currentLayer) return;

    while (currentLayer.length > 1) {
      const nextLayer: Uint8Array[] = [];

      for (let i = 0; i < currentLayer.length; i += 2) {
        const left = currentLayer[i];
        if (!left) throw new Error('Unexpected undefined leaf');
        const rightCandidate = currentLayer[i + 1];
        const right = rightCandidate ?? left;
        nextLayer.push(hashPair(left, right));
      }

      this.layers.push(nextLayer);
      currentLayer = nextLayer;
    }
  }

  get root(): Uint8Array {
    const top = this.layers[this.layers.length - 1];
    if (!top || !top[0]) throw new Error('Tree is empty');
    return top[0];
  }

  get rootHex(): string {
    return '0x' + Buffer.from(this.root).toString('hex');
  }

  getProof(leafIndex: number): MerkleProof {
    const baseLayer = this.layers[0];
    if (!baseLayer) throw new Error('Empty tree');
    if (leafIndex < 0 || leafIndex >= baseLayer.length) {
      throw new Error(`Leaf index ${leafIndex} out of range`);
    }

    const siblings: string[] = [];
    const pathIndices: number[] = [];
    let index = leafIndex;

    for (let layerIdx = 0; layerIdx < this.layers.length - 1; layerIdx++) {
      const layer = this.layers[layerIdx];
      if (!layer) continue;

      const isRightNode = index % 2 === 1;
      const siblingIndex = isRightNode ? index - 1 : index + 1;
      const sibling = layer[siblingIndex] ?? layer[index];
      if (!sibling) throw new Error('Unexpected undefined sibling');

      siblings.push('0x' + Buffer.from(sibling).toString('hex'));
      pathIndices.push(isRightNode ? 0 : 1);

      index = Math.floor(index / 2);
    }

    const leaf = baseLayer[leafIndex];
    if (!leaf) throw new Error('Leaf not found');

    return {
      leaf: '0x' + Buffer.from(leaf).toString('hex'),
      siblings,
      pathIndices,
      root: this.rootHex,
    };
  }

  static verify(proof: MerkleProof, rootHex: string): boolean {
    let current = Buffer.from(proof.leaf.replace('0x', ''), 'hex');

    for (let i = 0; i < proof.siblings.length; i++) {
      const sibling = Buffer.from((proof.siblings[i] ?? '').replace('0x', ''), 'hex');
      const isRight = proof.pathIndices[i] === 1;

      if (isRight) {
        current = Buffer.from(hashPair(current, sibling));
      } else {
        current = Buffer.from(hashPair(sibling, current));
      }
    }

    return '0x' + current.toString('hex') === rootHex;
  }
}
