import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module.js';
import { IssuerService } from '../../modules/issuer/issuer.service.js';
import { BlockchainService } from '../../common/blockchain/blockchain.service.js';

/**
 * One-off script for issuers that were seeded before CredentialAnchor was deployed
 * (seed-issuer.ts is idempotent and skips entirely once an issuer exists, so it never
 * retries on-chain registration for them). Run once per already-seeded issuer.
 */
async function registerExistingIssuerOnChain(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['warn', 'error'],
  });

  try {
    const issuerService = app.get(IssuerService);
    const blockchain = app.get(BlockchainService);

    const email = process.env['SEED_ISSUER_EMAIL'];
    if (!email) {
      throw new Error('SEED_ISSUER_EMAIL must be set to identify the issuer to register');
    }

    const issuer = await issuerService.findByEmail(email);
    if (!issuer) {
      throw new Error(`No issuer found with email ${email}`);
    }

    if (issuer.onChainRegistered) {
      console.warn(`Issuer ${issuer.did} is already registered on-chain (tx ${issuer.registrationTxHash}).`);
      return;
    }

    const txHash = await blockchain.registerIssuerOnChain(issuer.did, issuer.publicKeyMultibase);
    if (!txHash) {
      throw new Error('CredentialAnchor is not configured (CREDENTIAL_ANCHOR_ADDRESS / CREDENTIAL_ANCHOR_SIGNER_KEY)');
    }

    await issuerService.markOnChainRegistered(issuer.id, txHash);
    console.warn(`Registered issuer ${issuer.did} on-chain — tx ${txHash}`);
  } finally {
    await app.close();
  }
}

registerExistingIssuerOnChain().catch((err: unknown) => {
  console.error('On-chain registration failed:', err);
  process.exit(1);
});
