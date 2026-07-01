export type VerificationStatus =
  | 'valid'
  | 'invalid_signature'
  | 'revoked'
  | 'expired'
  | 'issuer_not_found'
  | 'merkle_proof_invalid'
  | 'tampered';

export interface VerificationResult {
  status: VerificationStatus;
  credentialId: string;
  issuerId: string;
  issuerName?: string;
  checkedAt: string;
  signatureValid: boolean;
  merkleProofValid: boolean | null;
  revoked: boolean;
  expired: boolean;
  details: VerificationDetail[];
}

export interface VerificationDetail {
  check: string;
  passed: boolean;
  message: string;
}
