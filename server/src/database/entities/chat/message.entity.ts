import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

import { MessageType } from '../../enums/domain.enums';
import { AbstractIdEntity } from '../base/audited.entity';
import { User } from '../identity/user.entity';
import { Conversation } from './conversation.entity';

@Entity({ name: 'messages' })
@Index('messages_conversation_id_sent_at_idx', ['conversationId', 'sentAt'])
@Index('messages_sender_id_sent_at_idx', ['senderId', 'sentAt'])
export class Message extends AbstractIdEntity {
  @Column({ name: 'conversation_id', type: 'int' })
  conversationId!: number;

  @Column({ name: 'sender_id', type: 'int' })
  senderId!: number;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'enum', enum: MessageType, default: MessageType.TEXT })
  type!: MessageType;

  @CreateDateColumn({
    name: 'sent_at',
    type: 'datetime',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP(3)',
  })
  sentAt!: Date;

  @Column({ name: 'edited_at', type: 'datetime', precision: 3, nullable: true })
  editedAt!: Date | null;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted!: boolean;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'conversation_id',
    foreignKeyConstraintName: 'messages_conversation_id_fkey',
  })
  conversation!: Conversation;

  @ManyToOne(() => User, (user) => user.sentMessages, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'sender_id',
    foreignKeyConstraintName: 'messages_sender_id_fkey',
  })
  sender!: User;
}
