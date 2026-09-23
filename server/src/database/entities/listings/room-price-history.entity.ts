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

@Entity({ name: 'room_price_histories' })
@Index('room_price_histories_room_id_changed_at_idx', ['roomId', 'changedAt'])
@Index('room_price_histories_changed_by_id_idx', ['changedById'])
export class RoomPriceHistory extends AbstractIdEntity {
  @Column({ name: 'room_id', type: 'int' })
  roomId!: number;

  @Column({
    name: 'old_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  oldPrice!: string | null;

  @Column({ name: 'new_price', type: 'decimal', precision: 12, scale: 2 })
  newPrice!: string;

  @Column({ name: 'changed_by_id', type: 'int', nullable: true })
  changedById!: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason!: string | null;

  @CreateDateColumn({ name: 'changed_at', type: 'datetime', precision: 3 })
  changedAt!: Date;

  @ManyToOne(() => Room, (room) => room.priceHistories, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'room_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'room_price_histories_room_id_fkey',
  })
  room!: Room;

  @ManyToOne(() => User, (user) => user.roomPriceChanges, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'changed_by_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'room_price_histories_changed_by_id_fkey',
  })
  changedBy!: User | null;
}
