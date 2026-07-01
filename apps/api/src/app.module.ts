import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { IssuerModule } from './modules/issuer/issuer.module.js';
import { CredentialModule } from './modules/credential/credential.module.js';
import { VerificationModule } from './modules/verification/verification.module.js';
import { AnchoringModule } from './modules/anchoring/anchoring.module.js';
import { IdentityModule } from './modules/identity/identity.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    IssuerModule,
    CredentialModule,
    VerificationModule,
    AnchoringModule,
    IdentityModule,
  ],
})
export class AppModule {}
