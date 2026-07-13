export interface Holder {
  id: string;
  did: string;
  name: string;
  email: string;
  publicKeyMultibase: string;
  createdAt: string;
  updatedAt: string;
}

export interface HolderRegistrationRequest {
  email: string;
  password: string;
  name: string;
}
