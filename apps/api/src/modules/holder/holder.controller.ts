import { Body, Controller, Get, NotFoundException, Post, UseGuards } from '@nestjs/common';
import type { Holder } from '@signa-chain/types';
import { CredentialService } from '../credential/credential.service.js';
import { CredentialEntity } from '../credential/entities/credential.entity.js';
import { TokenResponseDto } from '../issuer/auth/dto/token-response.dto.js';
import { HolderService } from './holder.service.js';
import { RegisterHolderDto } from './dto/register-holder.dto.js';
import { toHolderDto } from './holder.mapper.js';
import { HolderAuthService } from './auth/auth.service.js';
import { HolderJwtAuthGuard } from './auth/jwt-auth.guard.js';
import { CurrentHolder } from './auth/current-holder.decorator.js';

@Controller('holders')
export class HolderController {
  constructor(
    private readonly holderService: HolderService,
    private readonly authService: HolderAuthService,
    private readonly credentialService: CredentialService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterHolderDto): Promise<TokenResponseDto> {
    const entity = await this.holderService.register(dto);
    return this.authService.login(entity);
  }

  @UseGuards(HolderJwtAuthGuard)
  @Get('me')
  async me(@CurrentHolder() holderId: string): Promise<Holder> {
    const entity = await this.holderService.findById(holderId);
    if (!entity) {
      throw new NotFoundException('Holder not found');
    }

    return toHolderDto(entity);
  }

  @UseGuards(HolderJwtAuthGuard)
  @Get('me/credentials')
  async credentials(@CurrentHolder() holderId: string): Promise<CredentialEntity[]> {
    const entity = await this.holderService.findById(holderId);
    if (!entity) {
      throw new NotFoundException('Holder not found');
    }

    return this.credentialService.findBySubjectDid(entity.did);
  }
}
