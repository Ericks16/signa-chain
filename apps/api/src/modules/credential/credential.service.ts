import { randomUUID } from 'node:crypto';
import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
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
  private readonly logger = new Logger(CredentialService.name);

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
    const [entity, issuer] = await Promise.all([
      this.findOne(issuerId, credentialId),
      this.issuerService.findById(issuerId),
    ]);
    if (entity.status === 'revoked') {
      return entity;
    }

    entity.status = 'revoked';
    entity.revokedAt = new Date();

    if (issuer?.onChainRegistered) {
      const credentialHash = keccak256(toUtf8Bytes(entity.credentialId));
      try {
        entity.revocationTxHash = await this.blockchainService.revokeCredentialOnChain(
          credentialHash,
          issuer.did,
        );
      } catch (err) {
        // On-chain revocation is a defense-in-depth signal, not the source of truth —
        // the DB status column below is what verification actually checks. A transient
        // chain failure (gas, RPC timeout, revert) must not block the off-chain revocation.
        this.logger.warn(
          `On-chain revocation failed for ${entity.credentialId}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
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
    if (!issuer.onChainRegistered) {
      throw new ServiceUnavailableException(
        'This issuer is not yet registered on CredentialAnchor — cannot anchor on-chain',
      );
    }

    // Two concurrent batch requests for the same issuer would otherwise both read the
    // same unanchored rows, submit two separate on-chain anchors, and race to overwrite
    // each other's merkleProof/merkleRoot on save. pg_advisory_xact_lock serializes
    // anchorPendingBatch() calls for this issuer and auto-releases at the end of the
    // transaction — unlike pg_advisory_lock, it can't be stranded by connection pooling
    // (session-level locks must be released on the exact connection that took them,
    // which a pool doesn't guarantee).
    return this.repo.manager.transaction(async (manager) => {
      await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [issuerId]);

      const unanchored = await manager.find(CredentialEntity, {
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
      await manager.save(unanchored);

      return {
        batchId,
        merkleRoot: batch.root,
        anchorTxHash: result.txHash,
        anchorBlockNumber: result.blockNumber,
        credentialCount: unanchored.length,
      };
    });
  }
}
