import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateIssuersTable1783473004980 implements MigrationInterface {
    name = 'CreateIssuersTable1783473004980'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "issuers" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "email" character varying NOT NULL, "password_hash" character varying NOT NULL, "did" character varying NOT NULL, "name" character varying NOT NULL, "legal_name" character varying NOT NULL, "country" character varying NOT NULL, "website" character varying, "public_key_multibase" character varying NOT NULL, "key_id" character varying NOT NULL, "on_chain_registered" boolean NOT NULL DEFAULT false, "registration_tx_hash" character varying, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_4858810e283bd0770416fce773c" UNIQUE ("email"), CONSTRAINT "UQ_5929a2190c750f65c4313a9b26e" UNIQUE ("did"), CONSTRAINT "PK_36d87e2e6d1edfcbdc561deeaf9" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "issuers"`);
    }

}
