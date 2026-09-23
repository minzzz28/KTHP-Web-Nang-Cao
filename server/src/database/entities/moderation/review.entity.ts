import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';

import { ReviewStatus } from '../../enums/domain.enums';
import { AuditedEntity } from '../base/audited.entity';
import { User } from '../identity/user.entity';
import { Room } from '../listings/room.entity';
import { Contract } from '../rental/contract.entity';
import { Report } from './report.entity';

@Entity({ name: 'reviews' })
@Unique('reviews_contract_id_student_id_key', ['contractId', 'studentId'])
@Index('reviews_student_id_created_at_idx', ['studentId', 'createdAt'])
@Index('reviews_room_id_status_created_at_idx', ['roomId', 'status', 'createdAt'])
@Index('reviews_landlord_id_status_idx', ['landlordId', 'status'])
export class Review extends AuditedEntity {
  @Column({ name: 'contract_id', type: 'int' })
  contractId!: number;

  @Column({ name: 'student_id', type: 'int' })
  studentId!: number;

  @Column({ name: 'room_id', type: 'int' })
  roomId!: number;

  @Column({ name: 'landlord_id', type: 'int' })
  landlordId!: number;

  @Column({ type: 'int' })
  rating!: number;

  @Column({ name: 'room_quality', type: 'int' })
  roomQuality!: number;

  @Column({ type: 'int' })
  security!: number;

  @Column({ type: 'int' })
  cleanliness!: number;

  @Column({ name: 'wifi_quality', type: 'int' })
  wifiQuality!: number;

  @Column({ name: 'utility_price', type: 'int' })
  utilityPrice!: number;

  @Column({ name: 'listing_accuracy', type: 'int' })
  listingAccuracy!: number;

  @Column({ name: 'landlord_attitude', type: 'int' })
  landlordAttitude!: number;

  @Column({ type: 'text', nullable: true })
  comment!: string | null;

  @Column({
    type: 'enum',
    enum: ReviewStatus,
    default: ReviewStatus.PUBLISHED,
  })
  status!: ReviewStatus;

  @Column({ name: 'moderated_by_id', type: 'int', nullable: true })
  moderatedById!: number | null;

  @Column({ name: 'moderation_note', type: 'text', nullable: true })
  moderationNote!: string | null;

  @Column({ name: 'moderated_at', type: 'datetime', precision: 3, nullable: true })
  moderatedAt!: Date | null;

  @ManyToOne(() => Contract, (contract) => contract.reviews, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'contract_id',
    foreignKeyConstraintName: 'reviews_contract_id_fkey',
  })
  contract!: Contract;

  @ManyToOne(() => User, (user) => user.authoredReviews, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'student_id',
    foreignKeyConstraintName: 'reviews_student_id_fkey',
  })
  student!: User;

  @ManyToOne(() => Room, (room) => room.reviews, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'room_id',
    foreignKeyConstraintName: 'reviews_room_id_fkey',
  })
  room!: Room;

  @ManyToOne(() => User, (user) => user.landlordReviews, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'landlord_id',
    foreignKeyConstraintName: 'reviews_landlord_id_fkey',
  })
  landlord!: User;

  @ManyToOne(() => User, (user) => user.moderatedReviews, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'moderated_by_id',
    foreignKeyConstraintName: 'reviews_moderated_by_id_fkey',
  })
  moderatedBy!: User | null;

  @OneToMany(() => Report, (report) => report.review)
  reports!: Report[];
}
