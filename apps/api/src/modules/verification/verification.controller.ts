import { Controller, Get, Param } from '@nestjs/common';
import type { VerificationResult } from '@signa-chain/types';
import { VerificationService } from './verification.service.js';

@Controller('verify')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Get(':credentialId')
  verify(@Param('credentialId') credentialId: string): Promise<VerificationResult> {
    return this.verificationService.verify(credentialId);
  }
}
