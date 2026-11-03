import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Notification } from '../../database/entities/moderation/notification.entity';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';

export interface NotificationListResult {
  data: {
    items: Notification[];
    unreadCount: number;
  };
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notifications: Repository<Notification>,
  ) {}

  async list(
    userId: number,
    query: ListNotificationsQueryDto,
  ): Promise<NotificationListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const where: FindOptionsWhere<Notification> = { userId };
    if (query.isRead !== undefined) where.isRead = query.isRead === 'true';

    const [listed, unreadCount] = await Promise.all([
      this.notifications.findAndCount({
        where,
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.notifications.count({ where: { userId, isRead: false } }),
    ]);
    const [items, total] = listed;

    return {
      data: { items, unreadCount },
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async unreadCount(userId: number): Promise<number> {
    return this.notifications.count({ where: { userId, isRead: false } });
  }

  async markRead(userId: number, notificationId: number): Promise<Notification> {
    // Filter by the owner in the lookup itself so another user's notification
    // is indistinguishable from an ID that does not exist.
    const notification = await this.notifications.findOneBy({
      id: notificationId,
      userId,
    });
    if (!notification) {
      throw new NotFoundException('Không tìm thấy thông báo');
    }

    notification.isRead = true;
    notification.readAt = new Date();
    return this.notifications.save(notification);
  }

  async markAllRead(userId: number): Promise<number> {
    const result = await this.notifications.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
    return result.affected ?? 0;
  }

  async remove(userId: number, notificationId: number): Promise<void> {
    // A composite condition is essential here: deleting by ID alone would be
    // an insecure direct-object reference.
    const result = await this.notifications.delete({ id: notificationId, userId });
    if (!result.affected) {
      throw new NotFoundException('Không tìm thấy thông báo');
    }
  }
}
