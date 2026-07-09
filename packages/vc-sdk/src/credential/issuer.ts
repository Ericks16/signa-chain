import { v4 as uuidv4 } from 'uuid';
import type { VerifiableCredential, CredentialSubject } from '@signa-chain/types';
import { canonicalize } from './serializer.js';

const VC_CONTEXTS = [
  'https://www.w3.org/2018/credentials/v1',
  'https://w3id.org/security/data-integrity/v2',
];

export interface IssueCredentialOptions {
  issuerDid: string;
  sign: (message: Uint8Array) => Promise<Uint8Array>;
  subjectDid: string;
  credentialSubject: Omit<CredentialSubject, 'id'>;
  additionalTypes?: string[];
  expirationDate?: Date;
  credentialId?: string;
}

export function buildCredentialPayload(opts: IssueCredentialOptions): VerifiableCredential {
  const now = new Date();
  return {
    '@context': VC_CONTEXTS,
    id: opts.credentialId ?? `urn:uuid:${uuidv4()}`,
    type: ['VerifiableCredential', ...(opts.additionalTypes ?? [])],
    issuer: opts.issuerDid,
    issuanceDate: now.toISOString(),
    ...(opts.expirationDate ? { expirationDate: opts.expirationDate.toISOString() } : {}),
    credentialSubject: {
      id: opts.subjectDid,
      ...opts.credentialSubject,
    },
  };
}

export async function issueCredential(opts: IssueCredentialOptions): Promise<VerifiableCredential> {
  const credential = buildCredentialPayload(opts);

  const unsignedCanonical = canonicalize(credential);
  const messageBytes = new TextEncoder().encode(unsignedCanonical);
  const signatureBytes = await opts.sign(messageBytes);
  const proofValue = Buffer.from(signatureBytes).toString('base64url');

  const vmId = `${opts.issuerDid}#${opts.issuerDid.replace('did:key:', '')}`;

  const signed: VerifiableCredential = {
    ...credential,
    proof: {
      type: 'DataIntegrityProof',
      cryptosuite: 'eddsa-rdfc-2022',
      created: new Date().toISOString(),
      verificationMethod: vmId,
      proofPurpose: 'assertionMethod',
      proofValue,
    },
  };

  return signed;
}
