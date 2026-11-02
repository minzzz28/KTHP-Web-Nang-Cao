import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';

import { InvoiceStatus } from '../../enums/domain.enums';
import { AuditedEntity } from '../base/audited.entity';
import { Contract } from './contract.entity';
import { InvoiceItem } from './invoice-item.entity';

@Entity({ name: 'invoices' })
@Index('invoices_invoice_number_key', ['invoiceNumber'], { unique: true })
@Unique('invoices_contract_id_period_start_period_end_key', [
  'contractId',
  'periodStart',
  'periodEnd',
])
@Index('invoices_contract_id_status_due_date_idx', ['contractId', 'status', 'dueDate'])
@Index('invoices_status_due_date_idx', ['status', 'dueDate'])
export class Invoice extends AuditedEntity {
  @Column({ name: 'invoice_number', type: 'varchar', length: 80 })
  invoiceNumber!: string;

  @Column({ name: 'contract_id', type: 'int' })
  contractId!: number;

  @Column({ name: 'period_start', type: 'date' })
  periodStart!: Date;

  @Column({ name: 'period_end', type: 'date' })
  periodEnd!: Date;

  @Column({ name: 'due_date', type: 'date' })
  dueDate!: Date;

  @Column({
    name: 'electricity_start',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  electricityStart!: string;

  @Column({
    name: 'electricity_end',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  electricityEnd!: string;

  @Column({
    name: 'electricity_usage',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  electricityUsage!: string;

  @Column({
    name: 'electricity_unit_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  electricityUnitPrice!: string;

  @Column({
    name: 'electricity_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  electricityAmount!: string;

  @Column({
    name: 'water_start',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  waterStart!: string;

  @Column({
    name: 'water_end',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  waterEnd!: string;

  @Column({
    name: 'water_usage',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  waterUsage!: string;

  @Column({
    name: 'water_unit_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  waterUnitPrice!: string;

  @Column({
    name: 'water_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  waterAmount!: string;

  @Column({
    name: 'rent_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  rentAmount!: string;

  @Column({
    name: 'internet_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  internetAmount!: string;

  @Column({
    name: 'parking_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  parkingAmount!: string;

  @Column({
    name: 'service_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  serviceAmount!: string;

  @Column({
    name: 'other_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  otherAmount!: string;

  @Column({ name: 'total_amount', type: 'decimal', precision: 12, scale: 2 })
  totalAmount!: string;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.UNPAID,
  })
  status!: InvoiceStatus;

  @CreateDateColumn({
    name: 'issued_at',
    type: 'datetime',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP(3)',
  })
  issuedAt!: Date;

  @Column({ name: 'paid_at', type: 'datetime', precision: 3, nullable: true })
  paidAt!: Date | null;

  @ManyToOne(() => Contract, (contract) => contract.invoices, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'contract_id',
    foreignKeyConstraintName: 'invoices_contract_id_fkey',
  })
  contract!: Contract;

  @OneToMany(() => InvoiceItem, (item) => item.invoice)
  items!: InvoiceItem[];
}
