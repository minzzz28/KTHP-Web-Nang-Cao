import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';

import { Gender, RoommatePostStatus } from '../../enums/domain.enums';
import { Report } from '../moderation/report.entity';
import { AuditedEntity } from '../base/audited.entity';
import { User } from '../identity/user.entity';
import { Room } from '../listings/room.entity';
import { RoommateRequest } from './roommate-request.entity';

@Entity({ name: 'roommate_posts' })
@Index('roommate_posts_student_id_status_idx', ['studentId', 'status'])
@Index('roommate_posts_room_id_idx', ['roomId'])
@Index('roommate_posts_status_created_at_idx', ['status', 'createdAt'])
export class RoommatePost extends AuditedEntity {
  @Column({ name: 'student_id', type: 'int' })
  studentId!: number;

  @Column({ name: 'room_id', type: 'int', nullable: true })
  roomId!: number | null;

  @Column({ type: 'varchar', length: 191 })
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  area!: string | null;

  @Column({ name: 'budget_per_person', type: 'decimal', precision: 12, scale: 2 })
  budgetPerPerson!: string;

  @Column({ name: 'needed_people', type: 'int' })
  neededPeople!: number;

  @Column({
    name: 'preferred_gender',
    type: 'enum',
    enum: Gender,
    nullable: true,
  })
  preferredGender!: Gender | null;

  @Column({ name: 'move_in_date', type: 'date', nullable: true })
  moveInDate!: Date | null;

  @Column({ type: 'text', nullable: true })
  requirements!: string | null;

  @Column({
    type: 'enum',
    enum: RoommatePostStatus,
    default: RoommatePostStatus.OPEN,
  })
  status!: RoommatePostStatus;

  @ManyToOne(() => User, (user) => user.roommatePosts, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'student_id',
    foreignKeyConstraintName: 'roommate_posts_student_id_fkey',
  })
  student!: User;

  @ManyToOne(() => Room, (room) => room.roommatePosts, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'room_id',
    foreignKeyConstraintName: 'roommate_posts_room_id_fkey',
  })
  room!: Room | null;

  @OneToMany(() => RoommateRequest, (request) => request.post)
  requests!: RoommateRequest[];

  @OneToMany(() => Report, (report) => report.roommatePost)
  reports!: Report[];
}
