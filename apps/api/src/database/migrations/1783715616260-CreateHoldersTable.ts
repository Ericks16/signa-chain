import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateHoldersTable1783715616260 implements MigrationInterface {
    name = 'CreateHoldersTable1783715616260'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "holders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password_hash" character varying NOT NULL, "did" character varying NOT NULL, "name" character varying NOT NULL, "public_key_multibase" character varying NOT NULL, "key_id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_3d8e6a0f26437156fe8ea7e0a3c" UNIQUE ("email"), CONSTRAINT "UQ_f2450068a6e1ff78d9d7930ebd4" UNIQUE ("did"), CONSTRAINT "PK_db78e78aa79aa06fd917151e37f" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "holders"`);
    }

}
