import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Unique,
} from 'typeorm';

import { AuditedEntity } from '../base/audited.entity';
import { User } from '../identity/user.entity';
import { Contract } from './contract.entity';

@Entity({ name: 'contract_tenants' })
@Unique('contract_tenants_contract_id_student_id_key', ['contractId', 'studentId'])
@Index('contract_tenants_student_id_idx', ['studentId'])
export class ContractTenant extends AuditedEntity {
  @Column({ name: 'contract_id', type: 'int' })
  contractId!: number;

  @Column({ name: 'student_id', type: 'int' })
  studentId!: number;

  @Column({ name: 'is_primary_tenant', type: 'boolean', default: false })
  isPrimaryTenant!: boolean;

  @Column({ name: 'move_in_date', type: 'date', nullable: true })
  moveInDate!: Date | null;

  @Column({ name: 'move_out_date', type: 'date', nullable: true })
  moveOutDate!: Date | null;

  @Column({ name: 'signed_at', type: 'datetime', precision: 3, nullable: true })
  signedAt!: Date | null;

  @ManyToOne(() => Contract, (contract) => contract.tenants, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'contract_id',
    foreignKeyConstraintName: 'contract_tenants_contract_id_fkey',
  })
  contract!: Contract;

  @ManyToOne(() => User, (user) => user.contractTenancies, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'student_id',
    foreignKeyConstraintName: 'contract_tenants_student_id_fkey',
  })
  student!: User;
}
