import { Controller, Get, Param } from '@nestjs/common';
import type { DIDResolutionResult } from '@signa-chain/types';
import { IdentityService } from './identity.service.js';

@Controller('identity')
export class IdentityController {
  constructor(private readonly identityService: IdentityService) {}

  @Get(':did')
  resolve(@Param('did') did: string): DIDResolutionResult {
    return this.identityService.resolve(did);
  }
}
