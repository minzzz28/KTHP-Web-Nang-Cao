import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

import {
  VerificationStatus,
  VerificationType,
} from '../../enums/domain.enums';
import { AuditedEntity } from '../base/audited.entity';
import { User } from './user.entity';

@Entity({ name: 'verification_requests' })
@Index('verification_requests_user_id_status_created_at_idx', [
  'userId',
  'status',
  'createdAt',
])
@Index('verification_requests_reviewed_by_id_idx', ['reviewedById'])
@Index('verification_requests_status_created_at_idx', ['status', 'createdAt'])
export class VerificationRequest extends AuditedEntity {
  @Column({ name: 'user_id', type: 'int' })
  userId!: number;

  @Column({ name: 'reviewed_by_id', type: 'int', nullable: true })
  reviewedById!: number | null;

  @Column({ type: 'enum', enum: VerificationType })
  type!: VerificationType;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  status!: VerificationStatus;

  @Column({ name: 'student_code', type: 'varchar', length: 50, nullable: true })
  studentCode!: string | null;

  @Column({ name: 'school_email', type: 'varchar', length: 191, nullable: true })
  schoolEmail!: string | null;

  @Column({ name: 'document_url', type: 'varchar', length: 500, nullable: true })
  documentUrl!: string | null;

  @Column({ type: 'text', nullable: true })
  note!: string | null;

  @Column({ name: 'reviewer_note', type: 'text', nullable: true })
  reviewerNote!: string | null;

  @Column({ name: 'reviewed_at', type: 'datetime', precision: 3, nullable: true })
  reviewedAt!: Date | null;

  @ManyToOne(() => User, (user) => user.verificationRequests, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'verification_requests_user_id_fkey',
  })
  user!: User;

  @ManyToOne(() => User, (user) => user.reviewedVerificationRequests, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'reviewed_by_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'verification_requests_reviewed_by_id_fkey',
  })
  reviewedBy!: User | null;
}
