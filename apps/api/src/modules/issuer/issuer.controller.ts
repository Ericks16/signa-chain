import { Body, Controller, Get, NotFoundException, Post, UseGuards } from '@nestjs/common';
import type { Issuer } from '@signa-chain/types';
import { IssuerService } from './issuer.service.js';
import { toIssuerDto } from './issuer.mapper.js';
import { JwtAuthGuard } from './auth/jwt-auth.guard.js';
import { CurrentIssuer } from './auth/current-issuer.decorator.js';
import { AuthService } from './auth/auth.service.js';
import { TokenResponseDto } from './auth/dto/token-response.dto.js';
import { RegisterIssuerDto } from './dto/register-issuer.dto.js';
import { OnboardingSecretGuard } from './auth/onboarding-secret.guard.js';

@Controller('issuer')
export class IssuerController {
  constructor(
    private readonly issuerService: IssuerService,
    private readonly authService: AuthService,
  ) {}

  @UseGuards(OnboardingSecretGuard)
  @Post('register')
  async register(@Body() dto: RegisterIssuerDto): Promise<TokenResponseDto> {
    const entity = await this.issuerService.register(dto);
    return this.authService.login(entity);
  }

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
