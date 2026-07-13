import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { VerifiableCredential, MerkleProof } from '@signa-chain/types';

export type CredentialStatus = 'issued' | 'revoked';

@Entity({ name: 'credentials' })
export class CredentialEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'issuer_id' })
  issuerId!: string;

  @Column({ name: 'credential_id', unique: true })
  credentialId!: string;

  @Column({ name: 'subject_did' })
  subjectDid!: string;

  @Column({ type: 'jsonb' })
  vc!: VerifiableCredential;

  @Column({ type: 'varchar', default: 'issued' })
  status!: CredentialStatus;

  @Column({ name: 'revoked_at', nullable: true, type: 'timestamptz' })
  revokedAt!: Date | null;

  @Column({ name: 'revocation_tx_hash', nullable: true, type: 'varchar' })
  revocationTxHash!: string | null;

  @Column({ name: 'merkle_proof', nullable: true, type: 'jsonb' })
  merkleProof!: MerkleProof | null;

  @Column({ name: 'merkle_root', nullable: true, type: 'varchar' })
  merkleRoot!: string | null;

  @Column({ name: 'anchor_tx_hash', nullable: true, type: 'varchar' })
  anchorTxHash!: string | null;

  @Column({ name: 'anchor_block_number', nullable: true, type: 'integer' })
  anchorBlockNumber!: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
