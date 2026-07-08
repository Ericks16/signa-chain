import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'issuers' })
export class IssuerEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Column({ unique: true })
  did!: string;

  @Column()
  name!: string;

  @Column({ name: 'legal_name' })
  legalName!: string;

  @Column()
  country!: string;

  @Column({ nullable: true, type: 'varchar' })
  website!: string | null;

  @Column({ name: 'public_key_multibase' })
  publicKeyMultibase!: string;

  @Column({ name: 'key_id' })
  keyId!: string;

  @Column({ name: 'on_chain_registered', default: false })
  onChainRegistered!: boolean;

  @Column({ name: 'registration_tx_hash', nullable: true, type: 'varchar' })
  registrationTxHash!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
