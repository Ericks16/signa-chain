export interface VerifiableCredential {
  '@context': string[];
  id: string;
  type: string[];
  issuer: string | { id: string; name?: string };
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: CredentialSubject;
  proof?: CredentialProof;
  credentialStatus?: CredentialStatus;
}

export interface CredentialSubject {
  id: string;
  [key: string]: unknown;
}

export interface CredentialProof {
  type: 'DataIntegrityProof';
  cryptosuite: 'eddsa-rdfc-2022';
  created: string;
  verificationMethod: string;
  proofPurpose: 'assertionMethod';
  proofValue: string;
}

export interface CredentialStatus {
  id: string;
  type: 'SignaChainRevocationList2025';
  statusListIndex: string;
}

export interface AcademicCredentialSubject extends CredentialSubject {
  givenName: string;
  familyName: string;
  degreeType: 'bachelor' | 'master' | 'doctorate' | 'certificate' | 'diploma';
  degreeName: string;
  institution: string;
  graduationDate: string;
  honors?: string;
}

export interface MerkleAnchoredCredential {
  credential: VerifiableCredential;
  merkleProof: MerkleProof;
  anchorTxHash: string;
  anchorBlockNumber: number;
  merkleRoot: string;
}

export interface MerkleProof {
  leaf: string;
  siblings: string[];
  pathIndices: number[];
  root: string;
}
