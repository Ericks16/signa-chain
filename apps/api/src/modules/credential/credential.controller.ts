import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import type { VerifiableCredential } from '@signa-chain/types';
import { JwtAuthGuard } from '../issuer/auth/jwt-auth.guard.js';
import { CurrentIssuer } from '../issuer/auth/current-issuer.decorator.js';
import { CredentialService } from './credential.service.js';
import { IssueCredentialDto } from './dto/issue-credential.dto.js';
import { CredentialEntity } from './entities/credential.entity.js';

@UseGuards(JwtAuthGuard)
@Controller('credentials')
export class CredentialController {
  constructor(private readonly credentialService: CredentialService) {}

  @Post()
  issue(
    @CurrentIssuer() issuerId: string,
    @Body() dto: IssueCredentialDto,
  ): Promise<VerifiableCredential> {
    return this.credentialService.issue(issuerId, dto);
  }

  @Get()
  list(@CurrentIssuer() issuerId: string): Promise<CredentialEntity[]> {
    return this.credentialService.findByIssuer(issuerId);
  }

  @Get(':credentialId')
  findOne(
    @CurrentIssuer() issuerId: string,
    @Param('credentialId') credentialId: string,
  ): Promise<CredentialEntity> {
    return this.credentialService.findOne(issuerId, credentialId);
  }
}
