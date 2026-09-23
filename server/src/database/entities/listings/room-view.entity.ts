import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

import { AbstractIdEntity } from '../base/audited.entity';
import { User } from '../identity/user.entity';
import { Room } from './room.entity';

@Entity({ name: 'room_views' })
@Index('room_views_room_id_viewed_at_idx', ['roomId', 'viewedAt'])
@Index('room_views_viewer_id_viewed_at_idx', ['viewerId', 'viewedAt'])
export class RoomView extends AbstractIdEntity {
  @Column({ name: 'room_id', type: 'int' })
  roomId!: number;

  @Column({ name: 'viewer_id', type: 'int', nullable: true })
  viewerId!: number | null;

  @Column({ name: 'session_id', type: 'varchar', length: 191, nullable: true })
  sessionId!: string | null;

  @CreateDateColumn({ name: 'viewed_at', type: 'datetime', precision: 3 })
  viewedAt!: Date;

  @ManyToOne(() => Room, (room) => room.views, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'room_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'room_views_room_id_fkey',
  })
  room!: Room;

  @ManyToOne(() => User, (user) => user.roomViews, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'viewer_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'room_views_viewer_id_fkey',
  })
  viewer!: User | null;
}
