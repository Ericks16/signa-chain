import canonicalizeJson from 'canonicalize';
import type { VerifiableCredential } from '@signa-chain/types';

export function canonicalize(obj: unknown): string {
  const result = canonicalizeJson(obj);
  if (result === undefined) throw new Error('Failed to canonicalize object');
  return result;
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
