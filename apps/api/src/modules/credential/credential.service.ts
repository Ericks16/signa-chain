import { randomUUID } from 'node:crypto';
import { Inject, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { keccak256, toUtf8Bytes } from 'ethers';
import { issueCredential, buildMerkleBatch } from '@signa-chain/vc-sdk';
import type { VerifiableCredential, AcademicCredentialSubject } from '@signa-chain/types';
import { KMS_PROVIDER_TOKEN, type KmsProvider } from '../../common/kms/index.js';
import { BlockchainService } from '../../common/blockchain/blockchain.service.js';
import { IssuerService } from '../issuer/issuer.service.js';
import { CredentialEntity } from './entities/credential.entity.js';
import type { IssueCredentialDto } from './dto/issue-credential.dto.js';

export interface AnchorBatchSummary {
  batchId: string;
  merkleRoot: string;
  anchorTxHash: string;
  anchorBlockNumber: number;
  credentialCount: number;
}

@Injectable()
export class CredentialService {
  constructor(
    @InjectRepository(CredentialEntity)
    private readonly repo: Repository<CredentialEntity>,
    private readonly issuerService: IssuerService,
    private readonly blockchainService: BlockchainService,
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

    const issuer = await this.issuerService.findById(issuerId);
    if (issuer) {
      const credentialHash = keccak256(toUtf8Bytes(entity.credentialId));
      const txHash = await this.blockchainService.revokeCredentialOnChain(
        credentialHash,
        issuer.did,
      );
      entity.revocationTxHash = txHash;
    }

    return this.repo.save(entity);
  }

  /**
   * Anchors every un-anchored 'issued' credential for this issuer as one Merkle
   * batch: builds the tree off-chain (vc-sdk), submits the root via
   * CredentialAnchor.anchorBatch(), then persists each credential's proof.
   * Throws when anchoring isn't configured — pretending success here would be
   * dishonest about what's actually anchored on-chain.
   */
  async anchorPendingBatch(issuerId: string): Promise<AnchorBatchSummary> {
    const issuer = await this.issuerService.findById(issuerId);
    if (!issuer) {
      throw new NotFoundException('Issuer not found');
    }

    const unanchored = await this.repo.find({
      where: { issuerId, status: 'issued', merkleRoot: IsNull() },
    });
    if (unanchored.length === 0) {
      throw new NotFoundException('No unanchored credentials to batch');
    }

    const batchId = randomUUID();
    const batch = buildMerkleBatch(unanchored.map((c) => c.vc));

    const result = await this.blockchainService.anchorBatch(
      batch.root,
      unanchored.length,
      batchId,
      issuer.did,
    );
    if (!result) {
      throw new ServiceUnavailableException(
        'CredentialAnchor is not configured — cannot anchor on-chain',
      );
    }

    const byCredentialId = new Map(batch.credentials.map((c) => [c.credential.id, c]));
    for (const entity of unanchored) {
      const anchored = byCredentialId.get(entity.credentialId);
      if (!anchored) continue;
      entity.merkleProof = anchored.merkleProof;
      entity.merkleRoot = batch.root;
      entity.anchorTxHash = result.txHash;
      entity.anchorBlockNumber = result.blockNumber;
    }
    await this.repo.save(unanchored);

    return {
      batchId,
      merkleRoot: batch.root,
      anchorTxHash: result.txHash,
      anchorBlockNumber: result.blockNumber,
      credentialCount: unanchored.length,
    };
  }
}
