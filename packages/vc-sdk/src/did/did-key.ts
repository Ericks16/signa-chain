import type { DIDDocument, DIDResolutionResult } from '@signa-chain/types';
import { generateEd25519KeyPair } from '../crypto/ed25519.js';
import { encodeMultibase, decodeMultibase } from '../crypto/multibase.js';

const ED25519_MULTICODEC_PREFIX = new Uint8Array([0xed, 0x01]);
const VC_CONTEXT = 'https://www.w3.org/ns/did/v1';
const MULTIKEY_CONTEXT = 'https://w3id.org/security/multikey/v1';

export interface CreateDidKeyResult {
  did: string;
  privateKey: Uint8Array;
  publicKey: Uint8Array;
  didDocument: DIDDocument;
}

export interface DerivedDidKey {
  did: string;
  publicKeyMultibase: string;
  didDocument: DIDDocument;
}

export function deriveDidKeyDocument(publicKey: Uint8Array): DerivedDidKey {
  const multicodecKey = new Uint8Array(ED25519_MULTICODEC_PREFIX.length + publicKey.length);
  multicodecKey.set(ED25519_MULTICODEC_PREFIX);
  multicodecKey.set(publicKey, ED25519_MULTICODEC_PREFIX.length);

  const publicKeyMultibase = encodeMultibase(multicodecKey);
  const did = `did:key:${publicKeyMultibase}`;
  const vmId = `${did}#${publicKeyMultibase}`;

  const didDocument: DIDDocument = {
    '@context': [VC_CONTEXT, MULTIKEY_CONTEXT],
    id: did,
    verificationMethod: [
      {
        id: vmId,
        type: 'Ed25519VerificationKey2020',
        controller: did,
        publicKeyMultibase,
      },
    ],
    authentication: [vmId],
    assertionMethod: [vmId],
  };

  return { did, publicKeyMultibase, didDocument };
}

export async function createDidKey(): Promise<CreateDidKeyResult> {
  const { privateKey, publicKey } = await generateEd25519KeyPair();
  const { did, didDocument } = deriveDidKeyDocument(publicKey);

  return { did, privateKey, publicKey, didDocument };
}

export function resolveDid(did: string): DIDResolutionResult {
  if (!did.startsWith('did:key:z')) {
    return {
      didDocument: null,
      didResolutionMetadata: { error: 'unsupportedDidMethod' },
      didDocumentMetadata: {},
    };
  }

  try {
    const publicKeyMultibase = did.replace('did:key:', '');
    const multicodecKey = decodeMultibase(publicKeyMultibase);

    if (multicodecKey[0] !== 0xed || multicodecKey[1] !== 0x01) {
      throw new Error('Not an Ed25519 key');
    }

    const vmId = `${did}#${publicKeyMultibase}`;
    const didDocument: DIDDocument = {
      '@context': [
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/multikey/v1',
      ],
      id: did,
      verificationMethod: [
        {
          id: vmId,
          type: 'Ed25519VerificationKey2020',
          controller: did,
          publicKeyMultibase,
        },
      ],
      authentication: [vmId],
      assertionMethod: [vmId],
    };

    return {
      didDocument,
      didResolutionMetadata: { contentType: 'application/did+ld+json' },
      didDocumentMetadata: {},
    };
  } catch (err) {
    return {
      didDocument: null,
      didResolutionMetadata: {
        error: `invalidDid: ${err instanceof Error ? err.message : String(err)}`,
      },
      didDocumentMetadata: {},
    };
  }
}

export function extractPublicKey(did: string): Uint8Array {
  const result = resolveDid(did);
  if (!result.didDocument) {
    throw new Error(`Cannot resolve DID: ${did}`);
  }

  const vm = result.didDocument.verificationMethod[0];
  if (!vm) throw new Error('No verification method found');

  const multicodecKey = decodeMultibase(vm.publicKeyMultibase);
  return multicodecKey.slice(ED25519_MULTICODEC_PREFIX.length);
}
