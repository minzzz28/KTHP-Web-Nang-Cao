import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Contract,
  ContractTenant,
  Invoice,
  InvoiceItem,
  Notification,
} from '../../database/entities';
import { AuthModule } from '../auth/auth.module';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      Contract,
      ContractTenant,
      Invoice,
      InvoiceItem,
      Notification,
    ]),
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService],
})
export class InvoicesModule {}
