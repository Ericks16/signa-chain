import { randomUUID } from 'node:crypto';
import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { deriveDidKeyDocument } from '@signa-chain/vc-sdk';
import { KMS_PROVIDER_TOKEN, type KmsProvider } from '../../common/kms/index.js';
import { HolderEntity } from './entities/holder.entity.js';
import type { RegisterHolderDto } from './dto/register-holder.dto.js';

@Injectable()
export class HolderService {
  constructor(
    @InjectRepository(HolderEntity)
    private readonly repo: Repository<HolderEntity>,
    @Inject(KMS_PROVIDER_TOKEN)
    private readonly kms: KmsProvider,
  ) {}

  findByEmail(email: string): Promise<HolderEntity | null> {
    return this.repo.findOne({ where: { email } });
  }

  findById(id: string): Promise<HolderEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  async register(dto: RegisterHolderDto): Promise<HolderEntity> {
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const keyId = `holder-${randomUUID()}`;
    const { publicKey } = await this.kms.generateKeyPair(keyId);
    const { did, publicKeyMultibase } = deriveDidKeyDocument(publicKey);
    const passwordHash = await bcrypt.hash(dto.password, 12);

    const entity = this.repo.create({
      email: dto.email,
      passwordHash,
      did,
      name: dto.name,
      publicKeyMultibase,
      keyId,
    });

    return this.repo.save(entity);
  }
}
