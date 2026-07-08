import { Controller, Get, NotFoundException, UseGuards } from '@nestjs/common';
import type { Issuer } from '@signa-chain/types';
import { IssuerService } from './issuer.service.js';
import { toIssuerDto } from './issuer.mapper.js';
import { JwtAuthGuard } from './auth/jwt-auth.guard.js';
import { CurrentIssuer } from './auth/current-issuer.decorator.js';

@Controller('issuer')
export class IssuerController {
  constructor(private readonly issuerService: IssuerService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentIssuer() issuerId: string): Promise<Issuer> {
    const entity = await this.issuerService.findById(issuerId);
    if (!entity) {
      throw new NotFoundException('Issuer not found');
    }

    return toIssuerDto(entity);
  }
}
