import { sha256 } from '@noble/hashes/sha256';

export function sha256Bytes(data: Uint8Array | string): Uint8Array {
  const input = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  return sha256(input);
}

export function sha256Hex(data: Uint8Array | string): string {
  return Buffer.from(sha256Bytes(data)).toString('hex');
}
