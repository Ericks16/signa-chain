import { timingSafeEqual } from 'node:crypto';
import { CanActivate, ExecutionContext, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FastifyRequest } from 'fastify';

/**
 * There's no admin/role system in this app (single-tenant by design so far — see
 * IssuerEntity). Gating issuer onboarding behind a shared secret (rather than leaving
 * it fully public) avoids letting anyone mint an issuer identity capable of signing
 * verifiable credentials, without building out a speculative RBAC system for it.
 */
@Injectable()
export class OnboardingSecretGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('ISSUER_ONBOARDING_SECRET');
    if (!expected) {
      throw new ServiceUnavailableException('Issuer onboarding is not configured');
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const provided = request.headers['x-onboarding-secret'];

    if (typeof provided !== 'string' || !secretsMatch(provided, expected)) {
      throw new UnauthorizedException('Invalid onboarding secret');
    }

    return true;
  }
}

function secretsMatch(provided: string, expected: string): boolean {
  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);

  // Compare against a same-length buffer even on length mismatch so a wrong-length
  // guess doesn't return faster than a right-length one (timing side-channel).
  if (providedBuf.length !== expectedBuf.length) {
    timingSafeEqual(providedBuf, providedBuf);
    return false;
  }

  return timingSafeEqual(providedBuf, expectedBuf);
}
