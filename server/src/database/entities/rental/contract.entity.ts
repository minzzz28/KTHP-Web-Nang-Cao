import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';

import { ContractStatus } from '../../enums/domain.enums';
import { AuditedEntity } from '../base/audited.entity';
import { User } from '../identity/user.entity';
import { Room } from '../listings/room.entity';
import { Review } from '../moderation/review.entity';
import { ContractTenant } from './contract-tenant.entity';
import { Invoice } from './invoice.entity';

@Entity({ name: 'contracts' })
@Index('contracts_contract_number_key', ['contractNumber'], { unique: true })
@Index('contracts_room_id_status_idx', ['roomId', 'status'])
@Index('contracts_landlord_id_status_idx', ['landlordId', 'status'])
@Index('contracts_status_end_date_idx', ['status', 'endDate'])
export class Contract extends AuditedEntity {
  @Column({ name: 'contract_number', type: 'varchar', length: 80 })
  contractNumber!: string;

  @Column({ name: 'room_id', type: 'int' })
  roomId!: number;

  @Column({ name: 'landlord_id', type: 'int' })
  landlordId!: number;

  @Column({ name: 'start_date', type: 'date' })
  startDate!: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate!: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  rent!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  deposit!: string;

  @Column({ type: 'text' })
  terms!: string;

  @Column({
    type: 'enum',
    enum: ContractStatus,
    default: ContractStatus.DRAFT,
  })
  status!: ContractStatus;

  @Column({ name: 'signed_at', type: 'datetime', precision: 3, nullable: true })
  signedAt!: Date | null;

  @Column({ name: 'terminated_at', type: 'datetime', precision: 3, nullable: true })
  terminatedAt!: Date | null;

  @ManyToOne(() => Room, (room) => room.contracts, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'room_id',
    foreignKeyConstraintName: 'contracts_room_id_fkey',
  })
  room!: Room;

  @ManyToOne(() => User, (user) => user.landlordContracts, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'landlord_id',
    foreignKeyConstraintName: 'contracts_landlord_id_fkey',
  })
  landlord!: User;

  @OneToMany(() => ContractTenant, (tenant) => tenant.contract)
  tenants!: ContractTenant[];

  @OneToMany(() => Invoice, (invoice) => invoice.contract)
  invoices!: Invoice[];

  @OneToMany(() => Review, (review) => review.contract)
  reviews!: Review[];
}
