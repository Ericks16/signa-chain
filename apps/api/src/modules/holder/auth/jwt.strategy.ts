import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface JwtPayload {
  sub: string;
  email: string;
  role?: 'holder';
  type?: 'refresh';
}

export interface CurrentHolderPayload {
  sub: string;
  email: string;
}

@Injectable()
export class HolderJwtStrategy extends PassportStrategy(Strategy, 'holder-jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload): CurrentHolderPayload {
    if (payload.type === 'refresh') {
      throw new UnauthorizedException('Refresh tokens cannot be used as access tokens');
    }
    if (payload.role !== 'holder') {
      throw new UnauthorizedException('Invalid token');
    }

    return { sub: payload.sub, email: payload.email };
  }
}
