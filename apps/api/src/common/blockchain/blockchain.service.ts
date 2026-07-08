import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);

  /**
   * TODO(anchoring-module): call CredentialAnchor.registerIssuer(did, publicKeyMultibase)
   * once CREDENTIAL_ANCHOR_ADDRESS is deployed (see contracts/scripts/deploy.ts). Requires an
   * ethers.Contract bound to CREDENTIAL_ANCHOR_ADDRESS, a signer wallet holding
   * ISSUER_MANAGER_ROLE, and updating IssuerEntity.onChainRegistered/registrationTxHash once
   * the transaction is mined.
   */
  async registerIssuerOnChain(_did: string, _publicKeyMultibase: string): Promise<void> {
    this.logger.warn('registerIssuerOnChain() not implemented — CredentialAnchor is not deployed yet.');
    await Promise.resolve();
  }
}
