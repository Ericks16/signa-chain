import { randomUUID } from 'node:crypto';
import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { deriveDidKeyDocument } from '@signa-chain/vc-sdk';
import { KMS_PROVIDER_TOKEN, type KmsProvider } from '../../common/kms/index.js';
import { BlockchainService } from '../../common/blockchain/blockchain.service.js';
import { IssuerEntity } from './entities/issuer.entity.js';
import type { RegisterIssuerDto } from './dto/register-issuer.dto.js';

export interface CreateIssuerForSeedInput {
  email: string;
  passwordHash: string;
  did: string;
  name: string;
  legalName: string;
  country: string;
  website?: string;
  publicKeyMultibase: string;
  keyId: string;
}

@Injectable()
export class IssuerService {
  private readonly logger = new Logger(IssuerService.name);

  constructor(
    @InjectRepository(IssuerEntity)
    private readonly repo: Repository<IssuerEntity>,
    @Inject(KMS_PROVIDER_TOKEN)
    private readonly kms: KmsProvider,
    private readonly blockchain: BlockchainService,
  ) {}

  findByEmail(email: string): Promise<IssuerEntity | null> {
    return this.repo.findOne({ where: { email } });
  }

  findById(id: string): Promise<IssuerEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  async existsAny(): Promise<boolean> {
    const count = await this.repo.count();
    return count > 0;
  }

  createForSeed(input: CreateIssuerForSeedInput): Promise<IssuerEntity> {
    const entity = this.repo.create({
      email: input.email,
      passwordHash: input.passwordHash,
      did: input.did,
      name: input.name,
      legalName: input.legalName,
      country: input.country,
      website: input.website ?? null,
      publicKeyMultibase: input.publicKeyMultibase,
      keyId: input.keyId,
      onChainRegistered: false,
      registrationTxHash: null,
    });

    return this.repo.save(entity);
  }

  async markOnChainRegistered(id: string, txHash: string): Promise<void> {
    await this.repo.update({ id }, { onChainRegistered: true, registrationTxHash: txHash });
  }

  async register(dto: RegisterIssuerDto): Promise<IssuerEntity> {
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const keyId = `issuer-${randomUUID()}`;
    const { publicKey } = await this.kms.generateKeyPair(keyId);
    const { did, publicKeyMultibase } = deriveDidKeyDocument(publicKey);
    const passwordHash = await bcrypt.hash(dto.password, 12);

    const entity = this.repo.create({
      email: dto.email,
      passwordHash,
      did,
      name: dto.name,
      legalName: dto.legalName,
      country: dto.country,
      website: dto.website ?? null,
      publicKeyMultibase,
      keyId,
      onChainRegistered: false,
      registrationTxHash: null,
    });

    const saved = await this.repo.save(entity);

    // Best-effort, same as the seed script: an unconfigured/failing chain must never
    // block issuer creation — off-chain is the source of truth (see BlockchainService).
    try {
      const txHash = await this.blockchain.registerIssuerOnChain(did, publicKeyMultibase);
      if (txHash) {
        await this.markOnChainRegistered(saved.id, txHash);
        saved.onChainRegistered = true;
        saved.registrationTxHash = txHash;
      }
    } catch (error) {
      this.logger.warn(
        `On-chain registration failed for issuer ${saved.id} (${did}) — continuing off-chain-only: ${(error as Error).message}`,
      );
    }

    return saved;
  }
}
