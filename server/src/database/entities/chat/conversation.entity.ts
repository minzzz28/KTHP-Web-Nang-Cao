import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';

import { ConversationType } from '../../enums/domain.enums';
import { AuditedEntity } from '../base/audited.entity';
import { RentalGroup } from '../social/rental-group.entity';
import { ConversationMember } from './conversation-member.entity';
import { Message } from './message.entity';

@Entity({ name: 'conversations' })
@Index('conversations_direct_pair_key_key', ['directPairKey'], { unique: true })
@Index('conversations_rental_group_id_key', ['rentalGroupId'], {
  unique: true,
})
@Index('conversations_type_last_message_at_idx', ['type', 'lastMessageAt'])
export class Conversation extends AuditedEntity {
  @Column({ type: 'enum', enum: ConversationType })
  type!: ConversationType;

  @Column({ type: 'varchar', length: 191, nullable: true })
  title!: string | null;

  @Column({
    name: 'direct_pair_key',
    type: 'varchar',
    length: 191,
    nullable: true,
  })
  directPairKey!: string | null;

  @Column({ name: 'rental_group_id', type: 'int', nullable: true })
  rentalGroupId!: number | null;

  @Column({
    name: 'last_message_at',
    type: 'datetime',
    precision: 3,
    nullable: true,
  })
  lastMessageAt!: Date | null;

  // The owning OneToOne join column is unique, matching `rentalGroupId @unique`.
  @OneToOne(() => RentalGroup, (group) => group.conversation, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'rental_group_id',
    foreignKeyConstraintName: 'conversations_rental_group_id_fkey',
  })
  rentalGroup!: RentalGroup | null;

  @OneToMany(() => ConversationMember, (member) => member.conversation)
  members!: ConversationMember[];

  @OneToMany(() => Message, (message) => message.conversation)
  messages!: Message[];
}
