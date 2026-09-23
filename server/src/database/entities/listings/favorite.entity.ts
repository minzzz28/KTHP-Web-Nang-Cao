import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

import { CreatedEntity } from '../base/audited.entity';
import { User } from '../identity/user.entity';
import { Room } from './room.entity';

@Entity({ name: 'favorites' })
@Index('favorites_student_id_room_id_key', ['studentId', 'roomId'], {
  unique: true,
})
@Index('favorites_room_id_idx', ['roomId'])
export class Favorite extends CreatedEntity {
  @Column({ name: 'student_id', type: 'int' })
  studentId!: number;

  @Column({ name: 'room_id', type: 'int' })
  roomId!: number;

  @ManyToOne(() => User, (user) => user.favorites, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'student_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'favorites_student_id_fkey',
  })
  student!: User;

  @ManyToOne(() => Room, (room) => room.favorites, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'room_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'favorites_room_id_fkey',
  })
  room!: Room;
}
