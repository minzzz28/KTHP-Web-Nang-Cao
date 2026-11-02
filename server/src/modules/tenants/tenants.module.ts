import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractTenant, User } from '../../database/entities';
import { AuthModule } from '../auth/auth.module';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([ContractTenant, User])],
  controllers: [TenantsController],
  providers: [TenantsService],
})
export class TenantsModule {}
