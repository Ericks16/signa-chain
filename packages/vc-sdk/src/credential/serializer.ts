import type { VerifiableCredential } from '@signa-chain/types';

/**
 * RFC 8785 JSON Canonicalization Scheme (JCS).
 * Implemented directly to avoid CJS/ESM interop issues with the `canonicalize` npm package.
 */
export function canonicalize(obj: unknown): string {
  if (obj === null || obj === undefined) return 'null';
  if (typeof obj === 'boolean' || typeof obj === 'number') return String(obj);
  if (typeof obj === 'string') return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalize).join(',') + ']';
  }
  if (typeof obj === 'object') {
    const entries = Object.entries(obj as Record<string, unknown>)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonicalize(v)}`);
    return '{' + entries.join(',') + '}';
  }
  return 'null';
}

export function serializeCredential(vc: VerifiableCredential): string {
  return JSON.stringify(vc, null, 2);
}

export function deserializeCredential(json: string): VerifiableCredential {
  const parsed: unknown = JSON.parse(json);
  assertIsVerifiableCredential(parsed);
  return parsed;
}

function assertIsVerifiableCredential(value: unknown): asserts value is VerifiableCredential {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Invalid credential: not an object');
  }
  const obj = value as Record<string, unknown>;
  if (!Array.isArray(obj['@context'])) throw new Error('Missing @context');
  if (typeof obj['id'] !== 'string') throw new Error('Missing id');
  if (!Array.isArray(obj['type'])) throw new Error('Missing type');
  if (typeof obj['issuer'] !== 'string' && typeof obj['issuer'] !== 'object') {
    throw new Error('Missing issuer');
  }
  if (typeof obj['issuanceDate'] !== 'string') throw new Error('Missing issuanceDate');
  if (typeof obj['credentialSubject'] !== 'object' || obj['credentialSubject'] === null) {
    throw new Error('Missing credentialSubject');
  }
}
