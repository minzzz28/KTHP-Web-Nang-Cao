import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

import { GroupMemberRole } from '../../enums/domain.enums';
import { AuditedEntity } from '../base/audited.entity';
import { User } from '../identity/user.entity';
import { RentalGroup } from './rental-group.entity';

@Entity({ name: 'group_members' })
@Index('group_members_group_id_student_id_key', ['groupId', 'studentId'], {
  unique: true,
})
@Index('group_members_student_id_idx', ['studentId'])
export class GroupMember extends AuditedEntity {
  @Column({ name: 'group_id', type: 'int' })
  groupId!: number;

  @Column({ name: 'student_id', type: 'int' })
  studentId!: number;

  @Column({
    type: 'enum',
    enum: GroupMemberRole,
    default: GroupMemberRole.MEMBER,
  })
  role!: GroupMemberRole;

  @Column({
    name: 'joined_at',
    type: 'datetime',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP(3)',
  })
  joinedAt!: Date;

  @Column({ name: 'left_at', type: 'datetime', precision: 3, nullable: true })
  leftAt!: Date | null;

  @ManyToOne(() => RentalGroup, (group) => group.members, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'group_id',
    foreignKeyConstraintName: 'group_members_group_id_fkey',
  })
  group!: RentalGroup;

  @ManyToOne(() => User, (user) => user.groupMemberships, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'student_id',
    foreignKeyConstraintName: 'group_members_student_id_fkey',
  })
  student!: User;
}
