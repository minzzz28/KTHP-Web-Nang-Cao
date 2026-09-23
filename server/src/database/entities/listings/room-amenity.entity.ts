import {
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

import { Amenity } from './amenity.entity';
import { Room } from './room.entity';

@Entity({ name: 'room_amenities' })
@Index('room_amenities_amenity_id_idx', ['amenityId'])
export class RoomAmenity {
  @PrimaryColumn({ name: 'room_id', type: 'int' })
  roomId!: number;

  @PrimaryColumn({ name: 'amenity_id', type: 'int' })
  amenityId!: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt!: Date;

  @ManyToOne(() => Room, (room) => room.amenities, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'room_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'room_amenities_room_id_fkey',
  })
  room!: Room;

  @ManyToOne(() => Amenity, (amenity) => amenity.rooms, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'amenity_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'room_amenities_amenity_id_fkey',
  })
  amenity!: Amenity;
}
