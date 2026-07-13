import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface JwtPayload {
  sub: string;
  email: string;
  type?: 'refresh';
  role?: 'holder';
}

export interface CurrentIssuerPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload): CurrentIssuerPayload {
    if (payload.type === 'refresh') {
      throw new UnauthorizedException('Refresh tokens cannot be used as access tokens');
    }
    if (payload.role === 'holder') {
      throw new UnauthorizedException('Holder tokens cannot be used as issuer credentials');
    }

    return { sub: payload.sub, email: payload.email };
  }
}
