import { Module } from '@nestjs/common';
import { BlockchainModule } from '../../common/blockchain/blockchain.module.js';

@Module({
  imports: [BlockchainModule],
  exports: [BlockchainModule],
})
export class AnchoringModule {}
