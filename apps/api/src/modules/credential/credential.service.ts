import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { issueCredential } from '@signa-chain/vc-sdk';
import type { VerifiableCredential, AcademicCredentialSubject } from '@signa-chain/types';
import { KMS_PROVIDER_TOKEN, type KmsProvider } from '../../common/kms/index.js';
import { IssuerService } from '../issuer/issuer.service.js';
import { CredentialEntity } from './entities/credential.entity.js';
import type { IssueCredentialDto } from './dto/issue-credential.dto.js';

@Injectable()
export class CredentialService {
  constructor(
    @InjectRepository(CredentialEntity)
    private readonly repo: Repository<CredentialEntity>,
    private readonly issuerService: IssuerService,
    @Inject(KMS_PROVIDER_TOKEN)
    private readonly kmsProvider: KmsProvider,
  ) {}

  async issue(issuerId: string, dto: IssueCredentialDto): Promise<VerifiableCredential> {
    const issuer = await this.issuerService.findById(issuerId);
    if (!issuer) {
      throw new NotFoundException('Issuer not found');
    }

    const credentialSubject: Omit<AcademicCredentialSubject, 'id'> = {
      givenName: dto.givenName,
      familyName: dto.familyName,
      degreeType: dto.degreeType,
      degreeName: dto.degreeName,
      institution: dto.institution,
      graduationDate: dto.graduationDate,
      ...(dto.honors !== undefined ? { honors: dto.honors } : {}),
    };

    const vc = await issueCredential({
      issuerDid: issuer.did,
      sign: (message) => this.kmsProvider.sign(issuer.keyId, message),
      subjectDid: dto.subjectDid,
      credentialSubject,
      additionalTypes: ['AcademicDegreeCredential'],
      ...(dto.expirationDate !== undefined ? { expirationDate: new Date(dto.expirationDate) } : {}),
    });

    const entity = this.repo.create({
      issuerId: issuer.id,
      credentialId: vc.id,
      subjectDid: dto.subjectDid,
      vc,
      status: 'issued',
      revokedAt: null,
    });
    await this.repo.save(entity);

    return vc;
  }

  async findByIssuer(issuerId: string): Promise<CredentialEntity[]> {
    return this.repo.find({ where: { issuerId }, order: { createdAt: 'DESC' } });
  }

  async findOne(issuerId: string, credentialId: string): Promise<CredentialEntity> {
    const entity = await this.repo.findOne({ where: { issuerId, credentialId } });
    if (!entity) {
      throw new NotFoundException('Credential not found');
    }
    return entity;
  }

  findByCredentialId(credentialId: string): Promise<CredentialEntity | null> {
    return this.repo.findOne({ where: { credentialId } });
  }

  findBySubjectDid(subjectDid: string): Promise<CredentialEntity[]> {
    return this.repo.find({ where: { subjectDid }, order: { createdAt: 'DESC' } });
  }

  async revoke(issuerId: string, credentialId: string): Promise<CredentialEntity> {
    const entity = await this.findOne(issuerId, credentialId);
    if (entity.status === 'revoked') {
      return entity;
    }

    entity.status = 'revoked';
    entity.revokedAt = new Date();
    return this.repo.save(entity);
  }
}
