import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { IssuerService } from '../issuer.service.js';
import type { IssuerEntity } from '../entities/issuer.entity.js';
import { TokenResponseDto } from './dto/token-response.dto.js';

interface AccessTokenPayload {
  sub: string;
  email: string;
}

interface RefreshTokenPayload extends AccessTokenPayload {
  type: 'refresh';
}

@Injectable()
export class AuthService {
  constructor(
    private readonly issuerService: IssuerService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async validateCredentials(email: string, password: string): Promise<IssuerEntity> {
    const entity = await this.issuerService.findByEmail(email);
    if (!entity) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(password, entity.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return entity;
  }

  login(entity: IssuerEntity): TokenResponseDto {
    return this.issueTokenPair(entity);
  }

  async refresh(refreshToken: string): Promise<TokenResponseDto> {
    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const entity = await this.issuerService.findById(payload.sub);
    if (!entity) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.issueTokenPair(entity);
  }

  private issueTokenPair(entity: IssuerEntity): TokenResponseDto {
    const accessPayload: AccessTokenPayload = { sub: entity.id, email: entity.email };
    const refreshPayload: RefreshTokenPayload = { ...accessPayload, type: 'refresh' };

    const expiresIn = this.config.get<string>('JWT_EXPIRY') ?? '1h';
    const refreshExpiresIn = this.config.get<string>('JWT_REFRESH_EXPIRY') ?? '7d';

    const accessToken = this.jwtService.sign(accessPayload);
    const refreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: refreshExpiresIn as NonNullable<JwtSignOptions['expiresIn']>,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }
}
