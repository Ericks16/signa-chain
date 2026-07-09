import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KmsModule } from '../../common/kms/index.js';
import { IssuerModule } from '../issuer/issuer.module.js';
import { CredentialEntity } from './entities/credential.entity.js';
import { CredentialService } from './credential.service.js';
import { CredentialController } from './credential.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([CredentialEntity]), IssuerModule, KmsModule],
  controllers: [CredentialController],
  providers: [CredentialService],
  exports: [CredentialService],
})
export class CredentialModule {}
