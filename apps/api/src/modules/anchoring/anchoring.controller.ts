import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../issuer/auth/jwt-auth.guard.js';
import { CurrentIssuer } from '../issuer/auth/current-issuer.decorator.js';
import { CredentialService, type AnchorBatchSummary } from '../credential/credential.service.js';

@UseGuards(JwtAuthGuard)
@Controller('anchoring')
export class AnchoringController {
  constructor(private readonly credentialService: CredentialService) {}

  @Post('batch')
  batch(@CurrentIssuer() issuerId: string): Promise<AnchorBatchSummary> {
    return this.credentialService.anchorPendingBatch(issuerId);
  }
}
