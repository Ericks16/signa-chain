import { Body, Controller, Post } from '@nestjs/common';
import { LoginDto } from '../../issuer/auth/dto/login.dto.js';
import { RefreshDto } from '../../issuer/auth/dto/refresh.dto.js';
import { TokenResponseDto } from '../../issuer/auth/dto/token-response.dto.js';
import { HolderAuthService } from './auth.service.js';

@Controller('holders/auth')
export class HolderAuthController {
  constructor(private readonly authService: HolderAuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto): Promise<TokenResponseDto> {
    const entity = await this.authService.validateCredentials(dto.email, dto.password);
    return this.authService.login(entity);
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshDto): Promise<TokenResponseDto> {
    return this.authService.refresh(dto.refreshToken);
  }
}
