import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';

ed.etc.sha512Sync = (...msgs: Uint8Array[]): Uint8Array => {
  const totalLen = msgs.reduce((acc, m) => acc + m.length, 0);
  const combined = new Uint8Array(totalLen);
  let offset = 0;
  for (const m of msgs) {
    combined.set(m, offset);
    offset += m.length;
  }
  return sha512(combined);
};

export interface Ed25519KeyPair {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
}

export async function generateEd25519KeyPair(): Promise<Ed25519KeyPair> {
  const privateKey = ed.utils.randomPrivateKey();
  const publicKey = await ed.getPublicKeyAsync(privateKey);
  return { privateKey, publicKey };
}

export async function signBytes(message: Uint8Array, privateKey: Uint8Array): Promise<Uint8Array> {
  return ed.signAsync(message, privateKey);
}

export async function verifyBytes(
  signature: Uint8Array,
  message: Uint8Array,
  publicKey: Uint8Array,
): Promise<boolean> {
  try {
    return await ed.verifyAsync(signature, message, publicKey);
  } catch {
    return false;
  }
}
