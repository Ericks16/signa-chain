import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IssuerEntity } from './entities/issuer.entity.js';

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
  constructor(
    @InjectRepository(IssuerEntity)
    private readonly repo: Repository<IssuerEntity>,
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
}
