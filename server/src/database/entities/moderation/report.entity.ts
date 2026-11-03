import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

import {
  ReportReason,
  ReportStatus,
  ReportTargetType,
} from '../../enums/domain.enums';
import { AuditedEntity } from '../base/audited.entity';
import { User } from '../identity/user.entity';
import { Room } from '../listings/room.entity';
import { RoommatePost } from '../social/roommate-post.entity';
import { Review } from './review.entity';

@Entity({ name: 'reports' })
@Index('reports_reporter_id_created_at_idx', ['reporterId', 'createdAt'])
@Index('reports_target_user_id_idx', ['targetUserId'])
@Index('reports_room_id_idx', ['roomId'])
@Index('reports_roommate_post_id_idx', ['roommatePostId'])
@Index('reports_review_id_idx', ['reviewId'])
@Index('reports_reviewed_by_id_idx', ['reviewedById'])
@Index('reports_target_type_idx', ['targetType'])
@Index('reports_status_created_at_idx', ['status', 'createdAt'])
export class Report extends AuditedEntity {
  @Column({ name: 'reporter_id', type: 'int' })
  reporterId!: number;

  @Column({ name: 'target_type', type: 'enum', enum: ReportTargetType })
  targetType!: ReportTargetType;

  @Column({ name: 'target_user_id', type: 'int', nullable: true })
  targetUserId!: number | null;

  @Column({ name: 'room_id', type: 'int', nullable: true })
  roomId!: number | null;

  @Column({ name: 'roommate_post_id', type: 'int', nullable: true })
  roommatePostId!: number | null;

  @Column({ name: 'review_id', type: 'int', nullable: true })
  reviewId!: number | null;

  @Column({ type: 'enum', enum: ReportReason })
  reason!: ReportReason;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'evidence_url', type: 'varchar', length: 500, nullable: true })
  evidenceUrl!: string | null;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.PENDING,
  })
  status!: ReportStatus;

  @Column({ name: 'reviewed_by_id', type: 'int', nullable: true })
  reviewedById!: number | null;

  @Column({ name: 'admin_note', type: 'text', nullable: true })
  adminNote!: string | null;

  @Column({ name: 'resolved_at', type: 'datetime', precision: 3, nullable: true })
  resolvedAt!: Date | null;

  @ManyToOne(() => User, (user) => user.reportsFiled, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'reporter_id',
    foreignKeyConstraintName: 'reports_reporter_id_fkey',
  })
  reporter!: User;

  @ManyToOne(() => User, (user) => user.reportsAgainst, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'target_user_id',
    foreignKeyConstraintName: 'reports_target_user_id_fkey',
  })
  targetUser!: User | null;

  @ManyToOne(() => Room, (room) => room.reports, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'room_id',
    foreignKeyConstraintName: 'reports_room_id_fkey',
  })
  room!: Room | null;

  @ManyToOne(() => RoommatePost, (post) => post.reports, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'roommate_post_id',
    foreignKeyConstraintName: 'reports_roommate_post_id_fkey',
  })
  roommatePost!: RoommatePost | null;

  @ManyToOne(() => Review, (review) => review.reports, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'review_id',
    foreignKeyConstraintName: 'reports_review_id_fkey',
  })
  review!: Review | null;

  @ManyToOne(() => User, (user) => user.reportsReviewed, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'reviewed_by_id',
    foreignKeyConstraintName: 'reports_reviewed_by_id_fkey',
  })
  reviewedBy!: User | null;
}
