import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

const databaseUrl = process.env['DATABASE_URL'];
if (!databaseUrl) {
  throw new Error('DATABASE_URL must be set');
}

// In production only the compiled dist/ tree ships (no src/), so this data
// source must target the compiled .js entities/migrations there. In dev it
// runs directly against .ts source via the TypeORM ts-node CLI.
const isCompiled = __filename.endsWith('.js');

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  entities: [isCompiled ? 'dist/**/*.entity.js' : 'src/**/*.entity.ts'],
  migrations: [
    isCompiled ? 'dist/database/migrations/*.js' : 'src/database/migrations/*.ts',
  ],
  synchronize: false,
});
