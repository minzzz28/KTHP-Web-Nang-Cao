import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

import { AuditedEntity } from '../base/audited.entity';
import { User } from '../identity/user.entity';
import { Conversation } from './conversation.entity';

@Entity({ name: 'conversation_members' })
@Index('conversation_members_conversation_id_user_id_key', [
  'conversationId',
  'userId',
], { unique: true })
@Index('conversation_members_user_id_last_read_at_idx', ['userId', 'lastReadAt'])
export class ConversationMember extends AuditedEntity {
  @Column({ name: 'conversation_id', type: 'int' })
  conversationId!: number;

  @Column({ name: 'user_id', type: 'int' })
  userId!: number;

  @Column({
    name: 'last_read_at',
    type: 'datetime',
    precision: 3,
    nullable: true,
  })
  lastReadAt!: Date | null;

  @Column({
    name: 'joined_at',
    type: 'datetime',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP(3)',
  })
  joinedAt!: Date;

  @Column({ name: 'left_at', type: 'datetime', precision: 3, nullable: true })
  leftAt!: Date | null;

  @ManyToOne(() => Conversation, (conversation) => conversation.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'conversation_id',
    foreignKeyConstraintName: 'conversation_members_conversation_id_fkey',
  })
  conversation!: Conversation;

  @ManyToOne(() => User, (user) => user.conversationMemberships, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'conversation_members_user_id_fkey',
  })
  user!: User;
}
