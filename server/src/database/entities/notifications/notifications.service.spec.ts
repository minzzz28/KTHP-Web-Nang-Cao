import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Notification } from '../../database/entities/moderation/notification.entity';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  const notifications = {
    findAndCount: jest.fn(),
    count: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  let service: NotificationsService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new NotificationsService(
      notifications as unknown as Repository<Notification>,
    );
  });

  it('lists only the current user notifications and preserves unreadCount', async () => {
    const item = { id: 1, userId: 7, isRead: false } as Notification;
    notifications.findAndCount.mockResolvedValue([[item], 11]);
    notifications.count.mockResolvedValue(4);

    await expect(
      service.list(7, { isRead: 'false', page: 2, limit: 5 }),
    ).resolves.toEqual({
      data: { items: [item], unreadCount: 4 },
      meta: { page: 2, limit: 5, total: 11, totalPages: 3 },
    });

    expect(notifications.findAndCount).toHaveBeenCalledWith({
      where: { userId: 7, isRead: false },
      order: { createdAt: 'DESC' },
      skip: 5,
      take: 5,
    });
    expect(notifications.count).toHaveBeenCalledWith({
      where: { userId: 7, isRead: false },
    });
  });

  it('does not mark another user notification as read', async () => {
    notifications.findOneBy.mockResolvedValue(null);

    await expect(service.markRead(7, 99)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(notifications.findOneBy).toHaveBeenCalledWith({ id: 99, userId: 7 });
    expect(notifications.save).not.toHaveBeenCalled();
  });

  it('deletes through a user-and-ID condition to prevent IDOR', async () => {
    notifications.delete.mockResolvedValue({ affected: 1 });

    await expect(service.remove(7, 99)).resolves.toBeUndefined();

    expect(notifications.delete).toHaveBeenCalledWith({ id: 99, userId: 7 });
  });
});
