import { Module } from '@nestjs/common';
import { CredentialModule } from '../credential/credential.module.js';
import { IssuerModule } from '../issuer/issuer.module.js';
import { VerificationService } from './verification.service.js';
import { VerificationController } from './verification.controller.js';

@Module({
  imports: [CredentialModule, IssuerModule],
  controllers: [VerificationController],
  providers: [VerificationService],
})
export class VerificationModule {}
