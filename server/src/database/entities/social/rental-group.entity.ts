import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';

import { RentalGroupStatus } from '../../enums/domain.enums';
import { Conversation } from '../chat/conversation.entity';
import { AuditedEntity } from '../base/audited.entity';
import { User } from '../identity/user.entity';
import { Room } from '../listings/room.entity';
import { GroupMember } from './group-member.entity';

@Entity({ name: 'rental_groups' })
@Index('rental_groups_creator_id_idx', ['creatorId'])
@Index('rental_groups_room_id_idx', ['roomId'])
@Index('rental_groups_status_move_in_date_idx', ['status', 'moveInDate'])
export class RentalGroup extends AuditedEntity {
  @Column({ name: 'creator_id', type: 'int' })
  creatorId!: number;

  @Column({ name: 'room_id', type: 'int', nullable: true })
  roomId!: number | null;

  @Column({ type: 'varchar', length: 191 })
  name!: string;

  @Column({ name: 'max_members', type: 'int' })
  maxMembers!: number;

  @Column({ name: 'budget_per_person', type: 'decimal', precision: 12, scale: 2 })
  budgetPerPerson!: string;

  @Column({ name: 'move_in_date', type: 'date', nullable: true })
  moveInDate!: Date | null;

  @Column({ type: 'text', nullable: true })
  rules!: string | null;

  @Column({ name: 'zalo_group_url', type: 'varchar', length: 500, nullable: true })
  zaloGroupUrl!: string | null;

  @Column({
    name: 'telegram_group_url',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  telegramGroupUrl!: string | null;

  @Column({
    type: 'enum',
    enum: RentalGroupStatus,
    default: RentalGroupStatus.OPEN,
  })
  status!: RentalGroupStatus;

  @ManyToOne(() => User, (user) => user.createdRentalGroups, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'creator_id',
    foreignKeyConstraintName: 'rental_groups_creator_id_fkey',
  })
  creator!: User;

  @ManyToOne(() => Room, (room) => room.rentalGroups, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'room_id',
    foreignKeyConstraintName: 'rental_groups_room_id_fkey',
  })
  room!: Room | null;

  @OneToMany(() => GroupMember, (member) => member.group)
  members!: GroupMember[];

  @OneToOne(() => Conversation, (conversation) => conversation.rentalGroup)
  conversation!: Conversation | null;
}
