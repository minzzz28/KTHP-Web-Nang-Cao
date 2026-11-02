import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Contract,
  ContractTenant,
  Notification,
  Room,
  User,
} from '../../database/entities';
import { AuthModule } from '../auth/auth.module';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      Contract,
      ContractTenant,
      Notification,
      Room,
      User,
    ]),
  ],
  controllers: [ContractsController],
  providers: [ContractsService],
})
export class ContractsModule {}
