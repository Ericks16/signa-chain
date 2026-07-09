import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { VerifiableCredential } from '@signa-chain/types';

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

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
