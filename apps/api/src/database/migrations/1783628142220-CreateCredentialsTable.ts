import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCredentialsTable1783628142220 implements MigrationInterface {
    name = 'CreateCredentialsTable1783628142220'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "credentials" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "issuer_id" character varying NOT NULL, "credential_id" character varying NOT NULL, "subject_did" character varying NOT NULL, "vc" jsonb NOT NULL, "status" character varying NOT NULL DEFAULT 'issued', "revoked_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_deddc3fc8fa9227193e910b0c39" UNIQUE ("credential_id"), CONSTRAINT "PK_1e38bc43be6697cdda548ad27a6" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "credentials"`);
    }

}
