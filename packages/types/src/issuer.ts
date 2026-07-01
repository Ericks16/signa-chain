export interface Issuer {
  id: string;
  did: string;
  name: string;
  legalName: string;
  country: string;
  website?: string;
  publicKeyMultibase: string;
  onChainRegistered: boolean;
  registrationTxHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IssuerRegistrationRequest {
  name: string;
  legalName: string;
  country: string;
  website?: string;
  publicKeyMultibase: string;
}
