import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { entities } from './entities';

/**
 * Connects NestJS to the existing MySQL schema.
 *
 * Schema synchronization deliberately stays disabled: Prisma has already
 * created production-like tables, and future schema changes must be reviewed
 * as TypeORM migrations rather than inferred at application startup.
 */
export function createTypeOrmOptions(
  configService: ConfigService,
): TypeOrmModuleOptions {
  const databaseUrl = configService.get<string>('DATABASE_URL');

  if (!databaseUrl) {
    throw new Error('DATABASE_URL must be configured before starting the API.');
  }

  return {
    type: 'mysql',
    url: databaseUrl,
    entities,
    synchronize: false,
    migrationsRun: false,
    logging:
      configService.get<string>('NODE_ENV') === 'development'
        ? ['error', 'warn']
        : ['error'],
  };
}
