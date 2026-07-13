import { Module } from '@nestjs/common';
import { BlockchainModule } from '../../common/blockchain/blockchain.module.js';
import { CredentialModule } from '../credential/credential.module.js';
import { AnchoringController } from './anchoring.controller.js';

@Module({
  imports: [BlockchainModule, CredentialModule],
  controllers: [AnchoringController],
  exports: [BlockchainModule],
})
export class AnchoringModule {}
