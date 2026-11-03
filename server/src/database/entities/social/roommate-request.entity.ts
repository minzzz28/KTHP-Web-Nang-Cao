import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

import { RoommateRequestStatus } from '../../enums/domain.enums';
import { AuditedEntity } from '../base/audited.entity';
import { User } from '../identity/user.entity';
import { Room } from '../listings/room.entity';
import { RoommatePost } from './roommate-post.entity';

@Entity({ name: 'roommate_requests' })
@Index('roommate_requests_active_pair_key_key', ['activePairKey'], {
  unique: true,
})
@Index('roommate_requests_recipient_id_status_idx', ['recipientId', 'status'])
@Index('roommate_requests_sender_id_status_idx', ['senderId', 'status'])
@Index('roommate_requests_post_id_idx', ['postId'])
@Index('roommate_requests_room_id_idx', ['roomId'])
export class RoommateRequest extends AuditedEntity {
  @Column({ name: 'sender_id', type: 'int' })
  senderId!: number;

  @Column({ name: 'recipient_id', type: 'int' })
  recipientId!: number;

  @Column({ name: 'post_id', type: 'int', nullable: true })
  postId!: number | null;

  @Column({ name: 'room_id', type: 'int', nullable: true })
  roomId!: number | null;

  @Column({ type: 'text', nullable: true })
  message!: string | null;

  @Column({
    type: 'enum',
    enum: RoommateRequestStatus,
    default: RoommateRequestStatus.PENDING,
  })
  status!: RoommateRequestStatus;

  @Column({
    name: 'active_pair_key',
    type: 'varchar',
    length: 191,
    nullable: true,
  })
  activePairKey!: string | null;

  @Column({ name: 'responded_at', type: 'datetime', precision: 3, nullable: true })
  respondedAt!: Date | null;

  @ManyToOne(() => User, (user) => user.sentRoommateRequests, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'sender_id',
    foreignKeyConstraintName: 'roommate_requests_sender_id_fkey',
  })
  sender!: User;

  @ManyToOne(() => User, (user) => user.receivedRoommateRequests, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'recipient_id',
    foreignKeyConstraintName: 'roommate_requests_recipient_id_fkey',
  })
  recipient!: User;

  @ManyToOne(() => RoommatePost, (post) => post.requests, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'post_id',
    foreignKeyConstraintName: 'roommate_requests_post_id_fkey',
  })
  post!: RoommatePost | null;

  @ManyToOne(() => Room, (room) => room.roommateRequests, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'room_id',
    foreignKeyConstraintName: 'roommate_requests_room_id_fkey',
  })
  room!: Room | null;
}
