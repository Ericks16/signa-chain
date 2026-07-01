const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export function encodeBase58(bytes: Uint8Array): string {
  let num = BigInt(0);
  for (const byte of bytes) {
    num = num * BigInt(256) + BigInt(byte);
  }

  let encoded = '';
  while (num > BigInt(0)) {
    const remainder = Number(num % BigInt(58));
    num = num / BigInt(58);
    encoded = (BASE58_ALPHABET[remainder] ?? '') + encoded;
  }

  for (const byte of bytes) {
    if (byte === 0) encoded = '1' + encoded;
    else break;
  }

  return encoded;
}

export function decodeBase58(str: string): Uint8Array {
  let num = BigInt(0);
  for (const char of str) {
    const idx = BASE58_ALPHABET.indexOf(char);
    if (idx === -1) throw new Error(`Invalid base58 character: ${char}`);
    num = num * BigInt(58) + BigInt(idx);
  }

  const bytes: number[] = [];
  while (num > BigInt(0)) {
    bytes.unshift(Number(num % BigInt(256)));
    num = num / BigInt(256);
  }

  for (const char of str) {
    if (char === '1') bytes.unshift(0);
    else break;
  }

  return new Uint8Array(bytes);
}

export function encodeMultibase(bytes: Uint8Array, prefix = 'z'): string {
  if (prefix !== 'z') throw new Error('Only base58btc multibase (z) is supported');
  return 'z' + encodeBase58(bytes);
}

export function decodeMultibase(multibase: string): Uint8Array {
  if (!multibase.startsWith('z')) {
    throw new Error('Only base58btc multibase strings (prefix "z") are supported');
  }
  return decodeBase58(multibase.slice(1));
}
