import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssuerModule } from './modules/issuer/issuer.module.js';
import { HolderModule } from './modules/holder/holder.module.js';
import { CredentialModule } from './modules/credential/credential.module.js';
import { VerificationModule } from './modules/verification/verification.module.js';
import { AnchoringModule } from './modules/anchoring/anchoring.module.js';
import { IdentityModule } from './modules/identity/identity.module.js';
import { HealthModule } from './modules/health/health.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: config.getOrThrow<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    HealthModule,
    IssuerModule,
    HolderModule,
    CredentialModule,
    VerificationModule,
    AnchoringModule,
    IdentityModule,
  ],
})
export class AppModule {}
