import 'reflect-metadata';
import { config as loadEnvironment } from 'dotenv';
import { resolve } from 'node:path';
import { DataSource } from 'typeorm';
import { entities } from './entities';

loadEnvironment({ path: resolve(process.cwd(), '../.env') });
loadEnvironment({ path: resolve(process.cwd(), '.env') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL must be configured to run TypeORM migrations.');
}

/**
 * TypeORM CLI data source. Do not enable `synchronize` against the shared
 * database; generate and review a migration for every schema change instead.
 */
export default new DataSource({
  type: 'mysql',
  url: databaseUrl,
  entities,
  migrations: [resolve(__dirname, 'migrations/*{.ts,.js}')],
  synchronize: false,
  migrationsRun: false,
});
