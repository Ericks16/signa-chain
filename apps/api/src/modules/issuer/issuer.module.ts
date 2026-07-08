import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtModuleOptions, JwtSignOptions } from '@nestjs/jwt';
import { KmsModule } from '../../common/kms/index.js';
import { IssuerEntity } from './entities/issuer.entity.js';
import { IssuerService } from './issuer.service.js';
import { IssuerController } from './issuer.controller.js';
import { AuthService } from './auth/auth.service.js';
import { AuthController } from './auth/auth.controller.js';
import { JwtStrategy } from './auth/jwt.strategy.js';
import { JwtAuthGuard } from './auth/jwt-auth.guard.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([IssuerEntity]),
    KmsModule,
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
  controllers: [IssuerController, AuthController],
  providers: [IssuerService, AuthService, JwtStrategy, JwtAuthGuard],
  exports: [IssuerService],
})
export class IssuerModule {}
