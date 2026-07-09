import { Injectable, NotFoundException } from '@nestjs/common';
import { verifyCredential } from '@signa-chain/vc-sdk';
import type { VerificationResult } from '@signa-chain/types';
import { CredentialService } from '../credential/credential.service.js';
import { IssuerService } from '../issuer/issuer.service.js';

@Injectable()
export class VerificationService {
  constructor(
    private readonly credentialService: CredentialService,
    private readonly issuerService: IssuerService,
  ) {}

  async verify(credentialId: string): Promise<VerificationResult> {
    const entity = await this.credentialService.findByCredentialId(credentialId);
    if (!entity) {
      throw new NotFoundException('Credential not found');
    }

    const issuer = await this.issuerService.findById(entity.issuerId);

    return verifyCredential({
      credential: entity.vc,
      isRevoked: entity.status === 'revoked',
      resolveIssuerName: async () => issuer?.name,
    });
  }
}
