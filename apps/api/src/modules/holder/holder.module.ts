import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtModuleOptions, JwtSignOptions } from '@nestjs/jwt';
import { KmsModule } from '../../common/kms/index.js';
import { CredentialModule } from '../credential/credential.module.js';
import { HolderEntity } from './entities/holder.entity.js';
import { HolderService } from './holder.service.js';
import { HolderController } from './holder.controller.js';
import { HolderAuthService } from './auth/auth.service.js';
import { HolderAuthController } from './auth/auth.controller.js';
import { HolderJwtStrategy } from './auth/jwt.strategy.js';
import { HolderJwtAuthGuard } from './auth/jwt-auth.guard.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([HolderEntity]),
    KmsModule,
    CredentialModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.getOrThrow<string>('JWT_EXPIRY') as NonNullable<JwtSignOptions['expiresIn']>,
        },
      }),
    }),
  ],
  controllers: [HolderController, HolderAuthController],
  providers: [HolderService, HolderAuthService, HolderJwtStrategy, HolderJwtAuthGuard],
  exports: [HolderService],
})
export class HolderModule {}
