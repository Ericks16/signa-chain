import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAnchoringFieldsToCredentials1783920029864 implements MigrationInterface {
    name = 'AddAnchoringFieldsToCredentials1783920029864'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "credentials" ADD "revocation_tx_hash" character varying`);
        await queryRunner.query(`ALTER TABLE "credentials" ADD "merkle_proof" jsonb`);
        await queryRunner.query(`ALTER TABLE "credentials" ADD "merkle_root" character varying`);
        await queryRunner.query(`ALTER TABLE "credentials" ADD "anchor_tx_hash" character varying`);
        await queryRunner.query(`ALTER TABLE "credentials" ADD "anchor_block_number" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "credentials" DROP COLUMN "anchor_block_number"`);
        await queryRunner.query(`ALTER TABLE "credentials" DROP COLUMN "anchor_tx_hash"`);
        await queryRunner.query(`ALTER TABLE "credentials" DROP COLUMN "merkle_root"`);
        await queryRunner.query(`ALTER TABLE "credentials" DROP COLUMN "merkle_proof"`);
        await queryRunner.query(`ALTER TABLE "credentials" DROP COLUMN "revocation_tx_hash"`);
    }

}
