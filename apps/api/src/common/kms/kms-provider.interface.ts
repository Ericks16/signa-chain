export interface KmsProvider {
  generateKeyPair(keyId: string): Promise<{ publicKey: Uint8Array }>;
  sign(keyId: string, message: Uint8Array): Promise<Uint8Array>;
}

export const KMS_PROVIDER_TOKEN = Symbol('KMS_PROVIDER_TOKEN');
