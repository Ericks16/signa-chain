import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import { deriveDidKeyDocument } from '@signa-chain/vc-sdk';
import { AppModule } from '../../app.module.js';
import { IssuerService } from '../../modules/issuer/issuer.service.js';
import { KMS_PROVIDER_TOKEN, type KmsProvider } from '../../common/kms/index.js';
import { BlockchainService } from '../../common/blockchain/blockchain.service.js';

async function seed(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['warn', 'error'],
  });

  try {
    const issuerService = app.get(IssuerService);
    const kms = app.get<KmsProvider>(KMS_PROVIDER_TOKEN);
    const blockchain = app.get(BlockchainService);

    if (await issuerService.existsAny()) {
      console.warn('Issuer already exists — seed skipped (idempotent).');
      return;
    }

    const email = process.env['SEED_ISSUER_EMAIL'];
    const password = process.env['SEED_ISSUER_PASSWORD'];
    if (!email || !password) {
      throw new Error('SEED_ISSUER_EMAIL and SEED_ISSUER_PASSWORD must be set');
    }

    const name = process.env['SEED_ISSUER_NAME'] ?? 'Escuela Politécnica Nacional';
    const legalName = process.env['SEED_ISSUER_LEGAL_NAME'] ?? 'Escuela Politécnica Nacional';
    const country = process.env['SEED_ISSUER_COUNTRY'] ?? 'EC';
    const website = process.env['SEED_ISSUER_WEBSITE'];

    const keyId = 'epn-issuer-key-1';
    const { publicKey } = await kms.generateKeyPair(keyId);
    const { did, publicKeyMultibase } = deriveDidKeyDocument(publicKey);
    const passwordHash = await bcrypt.hash(password, 12);

    const entity = await issuerService.createForSeed({
      email,
      passwordHash,
      did,
      name,
      legalName,
      country,
      ...(website ? { website } : {}),
      publicKeyMultibase,
      keyId,
    });

    console.warn(`Seeded issuer ${entity.email} with DID ${entity.did}`);

    const txHash = await blockchain.registerIssuerOnChain(did, publicKeyMultibase);
    if (txHash) {
      await issuerService.markOnChainRegistered(entity.id, txHash);
      console.warn(`Registered issuer on-chain — tx ${txHash}`);
    } else {
      console.warn('On-chain registration skipped — CredentialAnchor not configured.');
    }
  } finally {
    await app.close();
  }
}

seed().catch((err: unknown) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
