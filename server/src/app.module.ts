import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { resolve } from 'node:path';
import { HealthController } from './health.controller';
import { DatabaseModule } from './database/database.module';
import { createTypeOrmOptions } from './database/typeorm.config';
import { StudentProfileModule } from './modules/student-profile/student-profile.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // The existing project stores .env at the workspace root, while Nest
      // commands may run from either that root or the server workspace.
      envFilePath: [
        resolve(process.cwd(), '../.env'),
        resolve(process.cwd(), '.env'),
      ],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: createTypeOrmOptions,
    }),
    DatabaseModule,
    StudentProfileModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
