import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { NotificationType } from '../../enums/domain.enums';
import { CreatedEntity } from '../base/audited.entity';
import { User } from '../identity/user.entity';

@Entity({ name: 'notifications' })
@Index('notifications_user_id_is_read_created_at_idx', ['userId', 'isRead', 'createdAt'])
export class Notification extends CreatedEntity {
  @Column({ name: 'user_id', type: 'int' })
  userId!: number;

  @Column({ type: 'enum', enum: NotificationType })
  type!: NotificationType;

  @Column({ type: 'varchar', length: 191 })
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ name: 'link_url', type: 'varchar', length: 500, nullable: true })
  linkUrl!: string | null;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead!: boolean;

  @Column({ name: 'read_at', type: 'datetime', precision: 3, nullable: true })
  readAt!: Date | null;

  @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'notifications_user_id_fkey',
  })
  user!: User;
}
