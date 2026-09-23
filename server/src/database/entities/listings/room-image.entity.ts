import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { CreatedEntity } from '../base/audited.entity';
import { Room } from './room.entity';

@Entity({ name: 'room_images' })
@Index('room_images_room_id_sort_order_key', ['roomId', 'sortOrder'], {
  unique: true,
})
@Index('room_images_room_id_is_cover_idx', ['roomId', 'isCover'])
export class RoomImage extends CreatedEntity {
  @Column({ name: 'room_id', type: 'int' })
  roomId!: number;

  @Column({ type: 'varchar', length: 500 })
  url!: string;

  @Column({ name: 'alt_text', type: 'varchar', length: 255, nullable: true })
  altText!: string | null;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @Column({ name: 'is_cover', type: 'boolean', default: false })
  isCover!: boolean;

  @ManyToOne(() => Room, (room) => room.images, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'room_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'room_images_room_id_fkey',
  })
  room!: Room;
}
